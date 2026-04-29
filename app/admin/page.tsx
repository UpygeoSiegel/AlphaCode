"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { getTopics, updateTopic, deleteTopic } from "@/services/topicsService";
import { deleteTemplate } from "@/services/templatesService";
import { deleteQuestionBank } from "@/services/questionBankService";
import type { Topic } from "@/types";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && role && role !== "admin") router.push(`/${role}`);
  }, [user, role, authLoading, router]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!user) return;
      try {
        const data = await getTopics();
        if (isMounted) setTopics(data);
      } catch (err) {
        console.error("Error loading topics:", err);
      } finally {
        if (isMounted) setTopicsLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [user]);

  async function handleSignOut() {
    await signOut(auth);
    router.push("/auth/login");
  }

  async function handleTogglePublish(topicId: string, current: boolean) {
    try {
      await updateTopic(topicId, { published: !current });
      setTopics(topics.map(t => t.id === topicId ? { ...t, published: !current } : t));
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  }

  async function handleDelete(topicId: string, templateId: string, name: string) {
    if (!confirm(`Delete "${name}"? This will remove all associated questions.`)) return;
    try {
      await deleteQuestionBank(topicId);
      if (templateId) await deleteTemplate(templateId);
      await deleteTopic(topicId);
      setTopics(topics.filter(t => t.id !== topicId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete topic.");
    }
  }

  const approvedTopics = topics.filter(t => t.published);
  const draftTopics = topics.filter(t => !t.published);

  const TopicCard = ({ topic }: { topic: Topic }) => (
    <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${topic.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {topic.published ? "Approved" : "Draft"}
        </span>
        <button
          onClick={() => handleTogglePublish(topic.id, topic.published)}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${topic.published ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
        >
          {topic.published ? "Move to Draft" : "Approve"}
        </button>
      </div>

      <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{topic.name}</h3>
      <p className="text-xs text-gray-400 mb-6">{topic.description || "No description."}</p>

      <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
        <div className="flex gap-4">
          <Link
            href={`/admin/topics/${topic.id}/edit`}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            Edit Code
          </Link>
          <Link
            href={`/admin/topics/${topic.id}/preview`}
            className="text-xs font-bold text-gray-400 hover:text-indigo-600"
          >
            Preview
          </Link>
        </div>
        <button
          onClick={() => handleDelete(topic.id, topic.templateId, topic.name)}
          className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-indigo-700 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Logged in as <span className="font-semibold">{user?.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/topics/new"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            + Create New Topic
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      {topicsLoading ? (
        <div className="p-12 text-center bg-white border rounded-2xl text-gray-400 font-bold animate-pulse">
          Loading…
        </div>
      ) : topics.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-dashed rounded-2xl text-gray-400">
          No topics yet.{" "}
          <Link href="/admin/topics/new" className="text-indigo-600 font-bold hover:underline">
            Create your first topic &rarr;
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {approvedTopics.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Approved</h2>
                <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {approvedTopics.length} Live
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {approvedTopics.map(t => <TopicCard key={t.id} topic={t} />)}
              </div>
            </section>
          )}
          {draftTopics.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Drafts</h2>
                <span className="bg-gray-200 text-gray-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {draftTopics.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {draftTopics.map(t => <TopicCard key={t.id} topic={t} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
