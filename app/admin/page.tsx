"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { getTopics, updateTopic } from "@/services/topicsService";
import { getTemplatesByTopic, deleteTemplate } from "@/services/templatesService";
import type { Topic, Template } from "@/types";

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [templates, setTemplates] = useState<Record<string, Template[]>>({});
  const [topicsLoading, setTopicsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && role && role !== "admin") router.push(`/${role}`);
  }, [user, role, authLoading, router]);

  useEffect(() => {
    let isMounted = true;

    async function loadTopicsAndTemplates() {
      // We only need the user to be authenticated to START loading.
      // We'll verify the role for the actual UI render.
      if (!user) return;
      
      try {
        setTopicsLoading(true);
        const topicsData = await getTopics();
        if (!isMounted) return;
        setTopics(topicsData);

        // Fetch templates for all topics
        const templatesMap: Record<string, Template[]> = {};
        await Promise.all(topicsData.map(async (topic) => {
          const topicTemplates = await getTemplatesByTopic(topic.id);
          if (isMounted) {
            templatesMap[topic.id] = topicTemplates;
          }
        }));
        
        if (isMounted) {
          setTemplates(templatesMap);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Error loading curriculum:", error);
      } finally {
        if (isMounted) {
          setTopicsLoading(false);
        }
      }
    }

    loadTopicsAndTemplates();

    return () => {
      isMounted = false;
    };
  }, [user]); // Removed role from dependency to start loading faster

  async function handleSignOut() {
    await signOut(auth);
    router.push("/auth/login");
  }

  async function handleTogglePublish(topicId: string, currentStatus: boolean) {
    try {
      await updateTopic(topicId, { published: !currentStatus });
      setTopics(topics.map(t => t.id === topicId ? { ...t, published: !currentStatus } : t));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  }

  const handleDeleteTemplate = async (templateId: string, topicId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the template "${name}"?`)) return;
    try {
      await deleteTemplate(templateId);
      setTemplates({
        ...templates,
        [topicId]: templates[topicId].filter(t => t.id !== templateId)
      });
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete template.");
    }
  };

  const approvedTopics = topics.filter(t => t.published);
  const draftTopics = topics.filter(t => !t.published);

  const TopicCard = ({ topic }: { topic: Topic }) => {
    const topicTemplates = templates[topic.id] || [];

    return (
      <div key={topic.id} className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
        <div className="mb-4">
          <div className="flex justify-between items-start mb-3">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${topic.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {topic.published ? 'Approved' : 'Draft'}
            </span>
            <button 
              onClick={() => handleTogglePublish(topic.id, topic.published)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${topic.published ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
            >
              {topic.published ? 'Move to Draft' : 'Approve'}
            </button>
          </div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{topic.name}</h3>
          <p className="text-xs text-gray-400 mb-4">{topic.description || "No description."}</p>
          
          <div className="space-y-2 mb-6">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Saved Skills ({topicTemplates.length})</h4>
            {topicTemplates.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No templates yet.</p>
            ) : (
              topicTemplates.map(tmpl => (
                <div key={tmpl.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                  <span className="text-sm font-medium text-gray-700">{tmpl.name}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link 
                      href={`/admin/templates/${tmpl.id}`}
                      className="text-[10px] font-bold text-indigo-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDeleteTemplate(tmpl.id, topic.id, tmpl.name)}
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                    <div className="flex gap-4">
                      <Link 
                        href={`/admin/topics/${topic.id}/preview`}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        Preview &rarr;
                      </Link>
                      <Link 
                        href={`/admin/topics/${topic.id}/weights`}
                        className="text-xs font-bold text-gray-400 hover:text-indigo-600 flex items-center gap-1"
                      >
                        Weights
                      </Link>
                    </div>
                    <span className="text-[10px] font-bold text-gray-300">Bank: {topic.bankSize}</span>
                  </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-indigo-700 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Logged in as <span className="font-semibold">{user?.email}</span> &bull; <span className="capitalize">{role}</span>
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
        >
          Sign Out
        </button>
      </header>

      <div className="flex flex-col gap-12">
        {/* Actions Section */}
        <section>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Quick Actions</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/admin/templates/new"
                className="flex-1 text-center px-4 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-bold text-sm shadow-md active:scale-95"
              >
                + New Template
              </Link>
              <Link 
                href="/admin/topics"
                className="flex-1 text-center px-4 py-3 rounded-xl border-2 border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all font-bold text-sm active:scale-95"
              >
                Create Topic
              </Link>
            </div>
          </div>
        </section>

        {topicsLoading ? (
          <div className="p-12 text-center bg-white border rounded-2xl animate-pulse text-gray-400 font-bold">Loading curriculum...</div>
        ) : topics.length === 0 ? (
          <div className="p-12 text-center bg-white border-2 border-dashed rounded-2xl text-gray-400">
            No topics found. Start by creating your first curriculum category.
          </div>
        ) : (
          <>
            {/* Approved Section */}
            <section>
              <div className="flex items-center gap-3 mb-6 px-1">
                <h2 className="text-xl font-bold text-gray-900">Approved Curriculum</h2>
                <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {approvedTopics.length} Live
                </span>
              </div>
              {approvedTopics.length === 0 ? (
                <div className="bg-gray-100/50 border border-dashed rounded-2xl p-8 text-center text-gray-400 text-sm font-medium">
                  No approved topics yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {approvedTopics.map(topic => <TopicCard key={topic.id} topic={topic} />)}
                </div>
              )}
            </section>

            {/* Draft Section */}
            <section>
              <div className="flex items-center gap-3 mb-6 px-1">
                <h2 className="text-xl font-bold text-gray-900">Draft Topics</h2>
                <span className="bg-gray-200 text-gray-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {draftTopics.length} in progress
                </span>
              </div>
              {draftTopics.length === 0 ? (
                <div className="bg-gray-100/50 border border-dashed rounded-2xl p-8 text-center text-gray-400 text-sm font-medium">
                  All topics are currently approved.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {draftTopics.map(topic => <TopicCard key={topic.id} topic={topic} />)}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
