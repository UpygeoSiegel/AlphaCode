"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getClassesByTeacher, getAssignmentsByClass } from "@/services/assignmentsService";
import type { Assignment, ClassDoc } from "@/types";
import Link from "next/link";

export default function TeacherAssignmentsPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && role && role !== "teacher") router.push(`/${role}`);
  }, [user, role, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        // 1. Get all classes for this teacher
        const classesData = await getClassesByTeacher(user.uid);
        setClasses(classesData);

        // 2. Get assignments for each class
        const assignmentsPromises = classesData.map(cls => getAssignmentsByClass(cls.id));
        const assignmentsResults = await Promise.all(assignmentsPromises);
        
        // Flatten into a single list
        const flattened = assignmentsResults.flat().sort((a, b) => 
          b.createdAt.toMillis() - a.createdAt.toDate().getTime()
        );
        
        setAllAssignments(flattened);
      } catch (err) {
        console.error("Error loading assignments:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (authLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold text-indigo-700 uppercase tracking-tight">Teacher Dashboard</h1>
          <nav className="flex gap-4">
            <Link href="/teacher" className="text-sm font-bold text-gray-500 hover:text-gray-900 pb-1">Classes</Link>
            <Link href="/teacher/assignments" className="text-sm font-bold text-gray-900 border-b-2 border-indigo-600 pb-1">Assignments</Link>
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
          <h2 className="text-2xl font-bold text-gray-800">All Assignments</h2>
          <Link
            href="/teacher/assignments/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 shadow-md transition-all active:scale-95"
          >
            + New Assignment
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 font-medium italic">Loading assignments...</div>
        ) : allAssignments.length === 0 ? (
          <div className="bg-white border-2 border-dashed rounded-3xl p-12 text-center">
            <p className="text-gray-400 font-bold mb-2">No assignments posted yet.</p>
            <Link href="/teacher/assignments/new" className="text-indigo-600 font-bold hover:underline text-sm">Create your first assignment &rarr;</Link>
          </div>
        ) : (
          <div className="bg-white border rounded-3xl shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Assignment Name</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Class</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Required</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Due Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allAssignments.map((asgn) => (
                  <tr key={asgn.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{asgn.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-500">
                        {classes.find(c => c.id === asgn.classId)?.name || "Unknown Class"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        {asgn.requiredCorrect}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-gray-600">
                        {asgn.dueDate.toDate().toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/teacher/assignments/${asgn.id}`}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-black text-[10px] uppercase hover:bg-gray-900 hover:text-white transition-all"
                      >
                        View Grades
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
