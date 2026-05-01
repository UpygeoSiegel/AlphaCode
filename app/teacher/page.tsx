"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getPublishedTopics } from "@/services/topicsService";
import AccordionTopicList from "@/components/shared/AccordionTopicList";
import type { Topic } from "@/types";
import Link from "next/link";

export default function TeacherDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && role && role !== "teacher") router.push(`/${role}`);
  }, [user, role, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    getPublishedTopics()
      .then(setTopics)
      .catch((err) => console.error("Error loading topics:", err))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-black text-indigo-700 uppercase tracking-tighter">Teacher Portal</h1>
          <nav className="flex gap-6">
            <Link href="/teacher" className="text-sm font-bold text-gray-900 border-b-2 border-indigo-600 pb-1">Dashboard</Link>
            <Link href="/teacher/classes" className="text-sm font-bold text-gray-500 hover:text-gray-900 pb-1">Classes</Link>
            <Link href="/teacher/assignments" className="text-sm font-bold text-gray-500 hover:text-gray-900 pb-1">All Assignments</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/teacher/assignments/new"
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Assignment
          </Link>
          <div className="h-8 w-[1px] bg-gray-200 mx-2" />
          <span className="text-xs font-medium text-gray-500">{user?.email}</span>
          <button
            onClick={() => signOut(auth)}
            className="text-xs font-bold text-gray-400 hover:text-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="p-8 max-w-5xl mx-auto space-y-12">
        <section>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Topics Library</h2>
              <p className="text-sm text-gray-500 font-medium">
                Browse available practice modules — click a topic to expand, then preview or assign.
              </p>
            </div>
            <Link
              href="/teacher/assignments/new"
              className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
            >
              Assign a Topic &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <AccordionTopicList topics={topics} mode="teacher" />
          )}
        </section>
      </main>
    </div>
  );
}
