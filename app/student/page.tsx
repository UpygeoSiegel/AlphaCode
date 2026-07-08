"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  getClassesForStudent,
  getPostedAssignmentsForStudent,
} from "@/services/assignmentsService";
import { getClassByJoinCode, addStudentToClass } from "@/services/classesService";
import { getProgressForStudentInAssignment } from "@/services/progressService";
import { getTopics } from "@/services/topicsService";
import type { Assignment, ClassDoc, StudentProgress, Topic } from "@/types";
import AppShell from "@/components/shared/AppShell";
import Link from "next/link";

type Tab = "upcoming" | "pastdue" | "completed";

export default function StudentDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<Record<string, StudentProgress[]>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && role && role !== "student") router.push(`/${role}`);
  }, [user, role, authLoading, router]);

  async function loadData() {
    if (!user) return;
    try {
      setLoading(true);
      const [classesData, topicsData] = await Promise.all([
        getClassesForStudent(user.uid),
        getTopics(),
      ]);
      setClasses(classesData);
      setTopics(topicsData);

      if (classesData.length > 0) {
        const classIds = classesData.map((c) => c.id);
        const assignmentsData = await getPostedAssignmentsForStudent(classIds);
        setAssignments(assignmentsData);

        const progressMap: Record<string, StudentProgress[]> = {};
        await Promise.all(
          assignmentsData.map(async (asgn) => {
            const progs = await getProgressForStudentInAssignment(user.uid, asgn.id);
            progressMap[asgn.id] = progs;
          })
        );
        setProgress(progressMap);
      }
    } catch (err) {
      console.error("Error loading student data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  async function handleJoinClass(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;

    setIsJoining(true);
    setJoinError(null);
    try {
      const cls = await getClassByJoinCode(joinCode);
      if (!cls) {
        setJoinError("Invalid class code.");
        return;
      }
      await addStudentToClass(cls.id, user.uid);
      setJoinCode("");
      setShowJoinModal(false);
      await loadData();
    } catch (err) {
      console.error("Join error:", err);
      setJoinError("Failed to join class.");
    } finally {
      setIsJoining(false);
    }
  }

  function assignmentStats(asgn: Assignment) {
    const progs = progress[asgn.id] || [];
    const denom =
      asgn.requiredCorrect * (asgn.mixedMode ? 1 : Math.max(1, asgn.topicIds.length));
    const correct = progs.reduce((acc, p) => acc + (Number(p.correctCount) || 0), 0);
    const percent = Math.min(100, Math.round((correct / denom) * 100));
    const completed =
      progs.length > 0 &&
      progs.every((p) => p.completed) &&
      (asgn.mixedMode || progs.length >= asgn.topicIds.length);
    return { percent, completed: completed || percent >= 100 };
  }

  const categorized = useMemo(() => {
    const now = Date.now();
    const upcoming: Assignment[] = [];
    const pastdue: Assignment[] = [];
    const completed: Assignment[] = [];
    assignments.forEach((asgn) => {
      const { completed: done } = assignmentStats(asgn);
      if (done) completed.push(asgn);
      else if (asgn.dueDate.toMillis() < now) pastdue.push(asgn);
      else upcoming.push(asgn);
    });
    return { upcoming, pastdue, completed };
  }, [assignments, progress]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "upcoming", label: "Upcoming", count: categorized.upcoming.length },
    { key: "pastdue", label: "Past Due", count: categorized.pastdue.length },
    { key: "completed", label: "Completed", count: categorized.completed.length },
  ];

  const visible = categorized[tab === "pastdue" ? "pastdue" : tab];

  if (authLoading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <AppShell
      role="student"
      userEmail={user?.email}
      title="Assignments"
      headerActions={
        <button
          onClick={() => setShowJoinModal(true)}
          className="bg-dm-blue hover:bg-dm-blue-dark text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          + Join Class
        </button>
      }
    >
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-dm-border mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 transition-colors ${
              tab === t.key
                ? "border-dm-blue text-dm-blue bg-white rounded-t"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-dm-blue text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading your assignments...</div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-dm-border rounded p-12 text-center">
          <p className="text-gray-500">
            {assignments.length === 0
              ? "No assignments yet. Join a class with a class code to get started."
              : `No ${tabs.find((t) => t.key === tab)?.label.toLowerCase()} assignments.`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-dm-border rounded shadow-sm divide-y divide-gray-100">
          {visible.map((asgn) => {
            const { percent, completed } = assignmentStats(asgn);
            const progs = progress[asgn.id] || [];
            const expanded = expandedId === asgn.id;
            const cls = classes.find((c) => c.id === asgn.classId);

            return (
              <div key={asgn.id}>
                <div
                  onClick={() => setExpandedId(expanded ? null : asgn.id)}
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <svg
                      className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${
                        expanded ? "rotate-90" : ""
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="min-w-0">
                      <div className="text-dm-blue font-semibold truncate">{asgn.name}</div>
                      <div className="text-xs text-gray-400">
                        {cls?.name} &middot; Due{" "}
                        {asgn.dueDate.toDate().toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        at{" "}
                        {asgn.dueDate.toDate().toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          completed ? "text-dm-green" : "text-gray-800"
                        }`}
                      >
                        {percent}%
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                        Grade so far
                      </div>
                    </div>
                    <Link
                      href={`/student/assignment/${asgn.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-sm font-semibold px-4 py-1.5 rounded transition-colors ${
                        completed
                          ? "border border-dm-border text-gray-600 bg-white hover:bg-gray-50"
                          : "bg-dm-blue hover:bg-dm-blue-dark text-white"
                      }`}
                    >
                      {completed ? "Review" : percent > 0 ? "Continue" : "Start"}
                    </Link>
                  </div>
                </div>

                {expanded && (
                  <div className="px-12 pb-4 bg-gray-50/50">
                    {asgn.mixedMode ? (
                      <SkillProgressRow
                        label={`${asgn.topicIds.length} skill${
                          asgn.topicIds.length !== 1 ? "s" : ""
                        } (mixed)`}
                        correct={progs.reduce(
                          (acc, p) => acc + (Number(p.correctCount) || 0),
                          0
                        )}
                        required={asgn.requiredCorrect}
                      />
                    ) : (
                      asgn.topicIds.map((tId) => {
                        const topic = topics.find((t) => t.id === tId);
                        const p = progs.find((pr) => pr.topicId === tId);
                        return (
                          <SkillProgressRow
                            key={tId}
                            label={topic?.name || tId}
                            correct={Number(p?.correctCount) || 0}
                            required={asgn.requiredCorrect}
                          />
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-2xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-dm-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Join a Class</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleJoinClass}>
              <div className="px-5 py-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Class Code
                </label>
                <input
                  autoFocus
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABCDEF"
                  maxLength={6}
                  className="w-full border border-dm-border rounded px-3 py-2 text-lg font-mono font-bold tracking-widest text-center uppercase focus:border-dm-blue focus:ring-1 focus:ring-dm-blue outline-none"
                  required
                />
                {joinError && (
                  <p className="text-sm text-dm-red mt-2">{joinError}</p>
                )}
              </div>
              <div className="px-5 py-3 border-t border-dm-border bg-gray-50 flex justify-end gap-3 rounded-b">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-dm-border rounded bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining || joinCode.length < 6}
                  className="bg-dm-blue hover:bg-dm-blue-dark text-white px-5 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isJoining ? "Joining..." : "Join Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SkillProgressRow({
  label,
  correct,
  required,
}: {
  label: string;
  correct: number;
  required: number;
}) {
  const percent = Math.min(100, Math.round((correct / Math.max(1, required)) * 100));
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="text-sm text-gray-700 flex-1 truncate">{label}</span>
      <div className="w-48 h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percent >= 100 ? "bg-dm-green" : "bg-dm-blue"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-500 w-12 text-right">
        {correct} / {required}
      </span>
    </div>
  );
}
