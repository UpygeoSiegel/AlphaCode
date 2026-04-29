"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getClass } from "@/services/classesService";
import { getAssignmentsByClass } from "@/services/assignmentsService";
import { getUsers } from "@/services/usersService";
import { getProgressForAssignment } from "@/services/progressService";
import type { ClassDoc, Assignment, UserDoc, StudentProgress } from "@/types";
import Link from "next/link";

export default function ClassDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  const [cls, setClass] = useState<ClassDoc | null>(null);
  const [students, setStudents] = useState<UserDoc[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progressData, setProgressData] = useState<Record<string, StudentProgress[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && role && role !== "teacher") router.push(`/${role}`);
  }, [user, role, authLoading, router]);

  useEffect(() => {
    async function loadClassData() {
      if (!user) return;
      try {
        const classId = id as string;
        const classDoc = await getClass(classId);
        if (!classDoc) return;
        setClass(classDoc);

        const [studentsData, assignmentsData] = await Promise.all([
          getUsers(classDoc.studentIds),
          getAssignmentsByClass(classId)
        ]);

        setStudents(studentsData);
        setAssignments(assignmentsData);

        // Fetch progress for each assignment
        const progMap: Record<string, StudentProgress[]> = {};
        await Promise.all(assignmentsData.map(async (asgn) => {
          const prog = await getProgressForAssignment(asgn.id);
          progMap[asgn.id] = prog;
        }));
        setProgressData(progMap);

      } catch (err) {
        console.error("Error loading class details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadClassData();
  }, [id, user]);

  if (authLoading || loading) return <div className="p-8">Loading class details...</div>;
  if (!cls) return <div className="p-8">Class not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/teacher" className="text-indigo-600 font-bold text-sm">&larr; Dashboard</Link>
            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">{cls.name}</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Join Code:</span>
              <span className="text-xs font-mono font-black text-indigo-700">{cls.joinCode}</span>
            </div>
          </div>
          <Link
            href={`/teacher/assignments/new?classId=${cls.id}`}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-indigo-700 shadow-md transition-all active:scale-95"
          >
            + Create Assignment
          </Link>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Roster */}
        <section className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Student Roster</h2>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{students.length} Total</span>
          </div>
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            {students.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm font-medium italic">No students joined yet.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {students.map(s => (
                  <div key={s.uid} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-bold text-gray-900">{s.displayName}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{s.email}</div>
                    </div>
                    <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">STUDENT</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Assignments & Grades */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Assignment Analytics</h2>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{assignments.length} Active</span>
          </div>

          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="bg-white border-2 border-dashed rounded-2xl p-12 text-center">
                <p className="text-gray-400 font-bold mb-2">No assignments for this class.</p>
                <Link href={`/teacher/assignments/new?classId=${cls.id}`} className="text-indigo-600 font-bold hover:underline text-sm">Create one now &rarr;</Link>
              </div>
            ) : (
              assignments.map(asgn => {
                const results = progressData[asgn.id] || [];
                const completedCount = results.filter(r => r.completed).length;
                const avgPercent = results.length > 0 
                  ? Math.round(results.reduce((acc, r) => acc + (r.correctCount / asgn.requiredCorrect), 0) / results.length * 100)
                  : 0;

                return (
                  <div key={asgn.id} className="bg-white border rounded-2xl p-6 shadow-sm hover:border-indigo-200 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-black text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">{asgn.name}</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                          Due: {asgn.dueDate.toDate().toLocaleDateString()}
                          <span className="text-gray-200">•</span>
                          {asgn.requiredCorrect} Correct Required
                        </p>
                      </div>
                      <Link
                        href={`/teacher/assignments/${asgn.id}`}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase hover:bg-indigo-600 transition-all shadow-md active:scale-95"
                      >
                        Detailed Grades
                      </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-xl font-black text-gray-900">{avgPercent}%</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Class Avg</div>
                      </div>
                      <div className="text-center p-4 bg-indigo-50 rounded-xl">
                        <div className="text-xl font-black text-indigo-700">{completedCount} / {students.length}</div>
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Completed</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-xl">
                        <div className="text-xl font-black text-green-700">{asgn.penalty}</div>
                        <div className="text-[10px] font-black text-green-400 uppercase tracking-widest">Penalty</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
