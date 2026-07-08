"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { getTeacherClasses } from "@/services/classesService";
import { getAssignmentsByClass } from "@/services/assignmentsService";
import type { Assignment, ClassDoc } from "@/types";
import AppShell from "@/components/shared/AppShell";
import Link from "next/link";

export default function TeacherAssignmentsView() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && role && role !== "teacher") router.push(`/${role}`);
  }, [user, role, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const classesData = await getTeacherClasses(user.uid);
        setClasses(classesData);
        const results = await Promise.all(
          classesData.map((cls) => getAssignmentsByClass(cls.id))
        );
        const flattened = results
          .flat()
          .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setAssignments(flattened);
      } catch (err) {
        console.error("Error loading assignments:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const visible =
    selectedClassId === "all"
      ? assignments
      : assignments.filter((a) => a.classId === selectedClassId);

  if (authLoading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  return (
    <AppShell
      role="teacher"
      userEmail={user?.email}
      title="Assignments"
      headerActions={
        <Link
          href="/teacher/assignments/new"
          className="bg-dm-blue hover:bg-dm-blue-dark text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          + Create New Assignment
        </Link>
      }
    >
      {/* Class filter tabs */}
      <div className="flex items-center gap-1 border-b border-dm-border mb-6 overflow-x-auto">
        <button
          onClick={() => setSelectedClassId("all")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
            selectedClassId === "all"
              ? "border-dm-blue text-dm-blue bg-white rounded-t"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          All Classes
        </button>
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => setSelectedClassId(cls.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
              selectedClassId === cls.id
                ? "border-dm-blue text-dm-blue bg-white rounded-t"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {cls.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading assignments...</div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-dm-border rounded p-12 text-center">
          <p className="text-gray-500 mb-2">No assignments yet.</p>
          <Link
            href="/teacher/assignments/new"
            className="text-dm-blue font-semibold hover:underline text-sm"
          >
            Create your first assignment &raquo;
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-dm-border rounded shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-dm-border bg-gray-50">
                <th className="px-4 py-3 font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Class</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center">Skills</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center">Type</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center">Posted</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((asgn, i) => (
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
                  <td className="px-4 py-3 text-gray-600">
                    {classes.find((c) => c.id === asgn.classId)?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {asgn.topicIds.length}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">Standard</td>
                  <td className="px-4 py-3 text-center">
                    {asgn.posted ? (
                      <span className="text-dm-green font-bold">✓</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {asgn.dueDate.toDate().toLocaleDateString(undefined, {
                      month: "numeric",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    {asgn.dueDate.toDate().toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
