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
import AccordionTopicList from "@/components/shared/AccordionTopicList";
import type { Topic } from "@/types";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

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

  const visibleTopics =
    filter === "published"
      ? topics.filter(t => t.published)
      : filter === "draft"
      ? topics.filter(t => !t.published)
      : topics;

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

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "published", "draft"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${
              filter === f
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-500 border hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {f === "all"
              ? `All (${topics.length})`
              : f === "published"
              ? `Live (${topics.filter(t => t.published).length})`
              : `Drafts (${topics.filter(t => !t.published).length})`}
          </button>
        ))}
      </div>

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
        <AccordionTopicList
          topics={visibleTopics}
          mode="admin"
          adminActions={{
            onTogglePublish: handleTogglePublish,
            onDelete: handleDelete,
          }}
        />
      )}
    </div>
  );
}
