"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAssignment } from "@/services/assignmentsService";
import { getClass } from "@/services/classesService";
import { getUsers } from "@/services/usersService";
import { getProgressForAssignment } from "@/services/progressService";
import type { Assignment, ClassDoc, UserDoc, StudentProgress } from "@/types";
import AppShell from "@/components/shared/AppShell";
import Link from "next/link";

type SortKey = "first" | "last" | "grade" | "complete" | "problems" | "lastAction";

interface Row {
  uid: string;
  first: string;
  last: string;
  email: string;
  grade: number;
  complete: number;
  correct: number;
  required: number;
  problems: number;
  lastAction: number;
}

export default function AssignmentGradesPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [cls, setClass] = useState<ClassDoc | null>(null);
  const [students, setStudents] = useState<UserDoc[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("last");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

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
          getProgressForAssignment(asgnId),
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

  const rows: Row[] = useMemo(() => {
    if (!assignment) return [];
    const denom =
      assignment.requiredCorrect *
      (assignment.mixedMode ? 1 : Math.max(1, assignment.topicIds.length));

    return students.map((student) => {
      const progs = progress.filter((p) => p.userId === student.uid);
      const correct = progs.reduce((acc, p) => acc + (Number(p.correctCount) || 0), 0);
      const problems = progs.reduce(
        (acc, p) => acc + (Number(p.questionsAnswered) || 0),
        0
      );
      const allComplete =
        progs.length > 0 &&
        progs.every((p) => p.completed) &&
        (assignment.mixedMode || progs.length >= assignment.topicIds.length);
      const percent = Math.min(100, Math.round((correct / denom) * 100));
      const lastAction = progs.reduce(
        (acc, p) => Math.max(acc, p.lastActivityAt?.toMillis?.() || 0),
        0
      );

      const parts = (student.displayName || student.email || "").trim().split(/\s+/);
      const first = parts[0] || "";
      const last = parts.slice(1).join(" ") || "";

      return {
        uid: student.uid,
        first,
        last,
        email: student.email,
        grade: percent,
        complete: allComplete ? 100 : percent,
        correct,
        required: denom,
        problems,
        lastAction,
      };
    });
  }, [students, progress, assignment]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === "string" && typeof vb === "string") {
        return va.localeCompare(vb) * sortDir;
      }
      return ((va as number) - (vb as number)) * sortDir;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  function gradeCellClass(percent: number, started: boolean) {
    if (!started) return "bg-gray-50 text-gray-300";
    if (percent >= 90) return "bg-dm-green-light text-green-700 font-extrabold";
    if (percent >= 70) return "bg-dm-yellow-light text-yellow-700 font-bold";
    return "bg-dm-red-light text-red-700 font-bold";
  }

  const classAvg =
    rows.length > 0
      ? Math.round(rows.reduce((acc, r) => acc + r.grade, 0) / rows.length)
      : 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dm-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 gradient-brand rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 animate-pulse">α</div>
          <p className="text-gray-400 text-sm">Loading grades...</p>
        </div>
      </div>
    );
  }
  if (!assignment || !cls) {
    return <div className="p-8 text-gray-500">Assignment not found.</div>;
  }

  const header = (label: string, key: SortKey, align = "text-left") => (
    <th
      onClick={() => handleSort(key)}
      className={`px-4 py-3 font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-100 ${align}`}
    >
      {label}
      {sortKey === key && (
        <span className="ml-1 text-dm-blue">{sortDir === 1 ? "▲" : "▼"}</span>
      )}
    </th>
  );

  return (
    <AppShell
      role="teacher"
      userEmail={user?.email}
      title={
        <span>
          {assignment.name}{" "}
          <span className="text-sm font-normal text-gray-400">— {cls.name}</span>
        </span>
      }
      headerActions={
        <Link
          href={`/teacher/classes/${cls.id}`}
          className="text-sm font-semibold text-dm-blue hover:underline"
        >
          &laquo; Back to Class
        </Link>
      }
    >
      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Class Average", value: `${classAvg}%`, icon: "📊", color: "text-dm-blue" },
          { label: "Students", value: String(rows.length), icon: "👥", color: "text-dm-purple" },
          {
            label: "Completed",
            value: `${rows.filter((r) => r.complete === 100).length} / ${rows.length}`,
            icon: "✅",
            color: "text-dm-green",
          },
          {
            label: "Due Date",
            value: assignment.dueDate.toDate().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            icon: "📅",
            color: "text-dm-yellow",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-dm-border rounded-2xl px-5 py-4 shadow-card"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{stat.icon}</span>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{stat.label}</div>
            </div>
            <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-dm-border rounded-2xl shadow-card overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-dm-border bg-dm-bg">
              {header("First", "first")}
              {header("Last", "last")}
              {header("Grade %", "grade", "text-center")}
              {header("Complete %", "complete", "text-center")}
              {header("Problems", "problems", "text-center")}
              {header("Last Action", "lastAction", "text-center")}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  No students enrolled in this class.
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={row.uid}
                  className={`border-b border-gray-100 ${
                    i % 2 === 1 ? "bg-gray-50/50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-gray-800">{row.first}</td>
                  <td className="px-4 py-3 text-gray-700">{row.last}</td>
                  <td
                    className={`px-4 py-3 text-center font-bold ${gradeCellClass(
                      row.grade,
                      row.problems > 0
                    )}`}
                  >
                    {row.problems > 0 ? `${row.grade}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {row.problems > 0 ? `${row.complete}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {row.correct} / {row.required}
                    <span className="text-gray-400 text-xs ml-1">
                      ({row.problems} attempted)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {row.lastAction > 0
                      ? new Date(row.lastAction).toLocaleString(undefined, {
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
