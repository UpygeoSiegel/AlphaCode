"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function StudentDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
    if (!loading && role && role !== "student") router.push(`/${role}`);
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  async function handleSignOut() {
    await signOut(auth);
    router.push("/auth/login");
  }

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-700">Student Dashboard</h1>
          <p className="text-sm text-gray-500">
            {user?.email} &mdash; Role: <span className="font-medium">student</span>
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Sign Out
        </button>
      </header>
      <div className="rounded-xl border bg-white p-6 text-gray-400">
        Assignments will appear here.
      </div>
    </div>
  );
}
