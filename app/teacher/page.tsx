"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getTeacherClasses, createClass } from "@/services/classesService";
import { getAssignmentsByClass } from "@/services/assignmentsService";
import type { ClassDoc, Assignment } from "@/types";
import Link from "next/link";

export default function TeacherDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [assignmentsByClass, setAssignmentsByClass] = useState<Record<string, Assignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && role && role !== "teacher") router.push(`/${role}`);
  }, [user, role, authLoading, router]);

  async function loadClasses() {
    if (!user) return;
    try {
      const data = await getTeacherClasses(user.uid);
      setClasses(data);

      const assignmentsMap: Record<string, Assignment[]> = {};
      await Promise.all(data.map(async (cls) => {
        const asgns = await getAssignmentsByClass(cls.id);
        assignmentsMap[cls.id] = asgns;
      }));
      setAssignmentsByClass(assignmentsMap);
    } catch (err) {
      console.error("Error loading classes:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses();
  }, [user]);

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newClassName.trim()) return;
    try {
      await createClass(user.uid, newClassName);
      setNewClassName("");
      setShowCreateModal(false);
      loadClasses();
    } catch (err) {
      console.error("Error creating class:", err);
      alert("Failed to create class.");
    }
  }

  if (authLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold text-indigo-700 uppercase tracking-tight">Teacher Dashboard</h1>
          <nav className="flex gap-4">
            <Link href="/teacher" className="text-sm font-bold text-gray-900 border-b-2 border-indigo-600 pb-1">Classes</Link>
            <Link href="/teacher/assignments" className="text-sm font-bold text-gray-500 hover:text-gray-900 pb-1">Assignments</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-gray-500">{user?.email}</span>
          <button
            onClick={() => signOut(auth)}
            className="text-xs font-bold text-gray-400 hover:text-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Your Classes</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            + Create Class
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 font-medium">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="bg-white border-2 border-dashed rounded-2xl p-12 text-center">
            <p className="text-gray-500 mb-4 font-medium">No classes created yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-indigo-600 font-bold hover:underline"
            >
              Create your first class to get started &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div key={cls.id} className="bg-white border rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                <div className="bg-indigo-50 p-6 border-b">
                  <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Join Code:</span>
                    <span className="text-sm font-mono font-black text-indigo-700 bg-white px-2 py-0.5 rounded border">{cls.joinCode}</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col gap-3">
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                    <span>Students</span>
                    <span className="text-gray-600">{cls.studentIds.length}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                    <span>Active Assignments</span>
                    <span className="text-gray-600">{assignmentsByClass[cls.id]?.length || 0}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link
                      href={`/teacher/classes/${cls.id}`}
                      className="text-center bg-gray-50 text-gray-700 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors border"
                    >
                      View Students
                    </Link>
                    <Link
                      href={`/teacher/assignments/new?classId=${cls.id}`}
                      className="text-center bg-indigo-50 text-indigo-700 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-100"
                    >
                      New Assignment
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Class</h3>
            <form onSubmit={handleCreateClass} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">Class Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. 1st Period Computer Science"
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newClassName.trim()}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg active:scale-95 disabled:opacity-50"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
