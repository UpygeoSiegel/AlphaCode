"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAssignment } from "@/services/assignmentsService";
import { getClass } from "@/services/classesService";
import { getUsers } from "@/services/usersService";
import { getProgressForAssignment } from "@/services/progressService";
import type { Assignment, ClassDoc, UserDoc, StudentProgress } from "@/types";
import Link from "next/link";

export default function AssignmentGradesPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [cls, setClass] = useState<ClassDoc | null>(null);
  const [students, setStudents] = useState<UserDoc[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && role && role !== "teacher") router.push(`/${role}`);
  }, [user, role, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const asgnId = id as string;
        const asgn = await getAssignment(asgnId);
        if (!asgn) return;
        setAssignment(asgn);

        const classDoc = await getClass(asgn.classId);
        if (!classDoc) return;
        setClass(classDoc);

        const [studentsData, progressData] = await Promise.all([
          getUsers(classDoc.studentIds),
          getProgressForAssignment(asgnId)
        ]);

        setStudents(studentsData);
        setProgress(progressData);
      } catch (err) {
        console.error("Error loading grades:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, user]);

  if (authLoading || loading) return <div className="p-8">Loading grades...</div>;
  if (!assignment || !cls) return <div className="p-8">Assignment not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href={`/teacher/classes/${cls.id}`} className="text-indigo-600 font-bold text-sm">&larr; Class View</Link>
            <div>
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">{assignment.name}</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mastery Goal: {assignment.requiredCorrect} Correct</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        <div className="bg-white border rounded-3xl shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Student Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Correct</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Incorrect</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Completion %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No students enrolled in this class.</td>
                </tr>
              ) : (
                students.map(student => {
                  const studentProg = progress.find(p => p.userId === student.uid);
                  const percent = studentProg 
                    ? Math.min(100, Math.round((studentProg.correctCount / assignment.requiredCorrect) * 100))
                    : 0;

                  return (
                    <tr key={student.uid} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{student.displayName}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-black text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                          {studentProg?.correctCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-black text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                          {studentProg?.incorrectCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {studentProg?.completed ? (
                          <span className="text-[10px] font-black bg-green-600 text-white px-2 py-1 rounded uppercase">Complete</span>
                        ) : percent > 0 ? (
                          <span className="text-[10px] font-black bg-yellow-500 text-white px-2 py-1 rounded uppercase">In Progress</span>
                        ) : (
                          <span className="text-[10px] font-black bg-gray-200 text-gray-500 px-2 py-1 rounded uppercase">Not Started</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden border">
                            <div 
                              className={`h-full transition-all duration-1000 ${percent === 100 ? 'bg-green-500' : 'bg-indigo-600'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-sm font-black text-gray-900 w-8">{percent}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
