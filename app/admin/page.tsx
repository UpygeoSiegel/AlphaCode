"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { getTopics, updateTopic } from "@/services/topicsService";
import { getAllTemplates, deleteTemplate } from "@/services/templatesService";
import CurriculumTree from "@/components/admin/CurriculumTree";
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

        // One query for every template, grouped by topic
        const allTemplates = await getAllTemplates();
        if (!isMounted) return;
        const templatesMap: Record<string, Template[]> = {};
        for (const tmpl of allTemplates) {
          (templatesMap[tmpl.topicId] ??= []).push(tmpl);
        }
        setTemplates(templatesMap);
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
        [topicId]: (templates[topicId] ?? []).filter(t => t.id !== templateId)
      });
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete template.");
    }
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
          <CurriculumTree
            topics={topics}
            templatesByTopic={templates}
            onTogglePublish={handleTogglePublish}
            onDeleteTemplate={handleDeleteTemplate}
          />
        )}
      </div>
    </div>
  );
}
