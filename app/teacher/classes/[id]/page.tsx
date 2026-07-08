"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getClass } from "@/services/classesService";
import { getAssignmentsByClass } from "@/services/assignmentsService";
import { getUsers } from "@/services/usersService";
import { getProgressForAssignment } from "@/services/progressService";
import type { ClassDoc, Assignment, UserDoc, StudentProgress } from "@/types";
import AppShell from "@/components/shared/AppShell";
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
          getAssignmentsByClass(classId),
        ]);

        setStudents(studentsData);
        setAssignments(assignmentsData);

        const progMap: Record<string, StudentProgress[]> = {};
        await Promise.all(
          assignmentsData.map(async (asgn) => {
            const prog = await getProgressForAssignment(asgn.id);
            progMap[asgn.id] = prog;
          })
        );
        setProgressData(progMap);
      } catch (err) {
        console.error("Error loading class details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadClassData();
  }, [id, user]);

  if (authLoading || loading) {
    return <div className="p-8 text-gray-500">Loading class details...</div>;
  }
  if (!cls) return <div className="p-8 text-gray-500">Class not found.</div>;

  return (
    <AppShell
      role="teacher"
      userEmail={user?.email}
      title={
        <span>
          {cls.name}{" "}
          <span className="text-sm font-normal text-gray-400">
            — Class Code:{" "}
            <span className="font-mono font-bold text-gray-600">{cls.joinCode}</span>
          </span>
        </span>
      }
      headerActions={
        <Link
          href={`/teacher/assignments/new?classId=${cls.id}`}
          className="bg-dm-blue hover:bg-dm-blue-dark text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          + Create New Assignment
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roster */}
        <section className="lg:col-span-1">
          <div className="bg-white border border-dm-border rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b-2 border-dm-border bg-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Students</h2>
              <span className="text-xs text-gray-400 font-semibold">
                {students.length} total
              </span>
            </div>
            {students.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No students have joined yet. Share class code{" "}
                <span className="font-mono font-bold text-gray-600">{cls.joinCode}</span>.
              </div>
            ) : (
              <div>
                {students.map((s, i) => (
                  <div
                    key={s.uid}
                    className={`px-4 py-2.5 border-b border-gray-100 last:border-0 ${
                      i % 2 === 1 ? "bg-gray-50/50" : ""
                    }`}
                  >
                    <div className="font-semibold text-sm text-gray-800">
                      {s.displayName}
                    </div>
                    <div className="text-xs text-gray-400">{s.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Assignments */}
        <section className="lg:col-span-2">
          <div className="bg-white border border-dm-border rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b-2 border-dm-border bg-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Assignments</h2>
              <span className="text-xs text-gray-400 font-semibold">
                {assignments.length} total
              </span>
            </div>
            {assignments.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No assignments for this class yet.{" "}
                <Link
                  href={`/teacher/assignments/new?classId=${cls.id}`}
                  className="text-dm-blue font-semibold hover:underline"
                >
                  Create one now &raquo;
                </Link>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-dm-border bg-gray-50/50">
                    <th className="px-4 py-2 font-semibold text-gray-600">Name</th>
                    <th className="px-4 py-2 font-semibold text-gray-600 text-center">Due Date</th>
                    <th className="px-4 py-2 font-semibold text-gray-600 text-center">Class Avg</th>
                    <th className="px-4 py-2 font-semibold text-gray-600 text-center">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((asgn, i) => {
                    const results = progressData[asgn.id] || [];
                    const denom =
                      asgn.requiredCorrect *
                      (asgn.mixedMode ? 1 : Math.max(1, asgn.topicIds.length));
                    const byStudent: Record<string, number> = {};
                    results.forEach((r) => {
                      byStudent[r.userId] =
                        (byStudent[r.userId] || 0) + (Number(r.correctCount) || 0);
                    });
                    const grades = Object.values(byStudent).map((c) =>
                      Math.min(100, Math.round((c / denom) * 100))
                    );
                    const avg =
                      grades.length > 0
                        ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length)
                        : 0;
                    const completedCount = grades.filter((g) => g >= 100).length;

                    return (
                      <tr
                        key={asgn.id}
                        onClick={() => router.push(`/teacher/assignments/${asgn.id}`)}
                        className={`cursor-pointer border-b border-gray-100 hover:bg-dm-blue-light transition-colors ${
                          i % 2 === 1 ? "bg-gray-50/50" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="text-dm-blue font-semibold hover:underline">
                            {asgn.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {asgn.dueDate.toDate().toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-700">
                          {grades.length > 0 ? `${avg}%` : "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {completedCount} / {students.length}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
