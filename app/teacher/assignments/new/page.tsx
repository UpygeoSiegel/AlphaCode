"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getTeacherClasses } from "@/services/classesService";
import { createAssignment } from "@/services/assignmentsService";
import { getPublishedTopics } from "@/services/topicsService";
import type { ClassDoc, Topic } from "@/types";
import AccordionTopicList from "@/components/shared/AccordionTopicList";
import AppShell from "@/components/shared/AppShell";
import { Timestamp } from "firebase/firestore";

function NewAssignmentContent() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get("classId") || "";
  const initialTopicId = searchParams.get("topicId");

  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
    initialTopicId ? [initialTopicId] : []
  );
  const [topicWeights, setTopicWeights] = useState<Record<string, number>>(
    initialTopicId ? { [initialTopicId]: 1 } : {}
  );
  const [mixedMode, setMixedMode] = useState(true);
  const [requiredCorrect, setRequiredCorrect] = useState(5);
  const [penalty, setPenalty] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [assignmentName, setAssignmentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && role && role !== "teacher") router.push(`/${role}`);
  }, [user, role, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [classesData, topicsData] = await Promise.all([
          getTeacherClasses(user.uid),
          getPublishedTopics(),
        ]);
        const activeClasses = classesData.filter((c) => !(c as typeof c & { archived?: boolean }).archived);
        setClasses(activeClasses);
        setTopics(topicsData);
        if (!selectedClassId && activeClasses.length > 0) {
          setSelectedClassId(activeClasses[0].id);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const filteredTopics = useMemo(() => {
    const q = skillSearch.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
    );
  }, [topics, skillSearch]);

  const handleToggleTopic = (topicId: string) => {
    setSelectedTopicIds((prev) => {
      const isSelected = prev.includes(topicId);
      const next = isSelected
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId];
      const nextWeights = { ...topicWeights };
      if (isSelected) delete nextWeights[topicId];
      else nextWeights[topicId] = 1;
      setTopicWeights(nextWeights);
      return next;
    });
  };

  const handleWeightChange = (topicId: string, value: number) => {
    setTopicWeights((prev) => ({ ...prev, [topicId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedClassId) { alert("Please select a class."); return; }
    if (selectedTopicIds.length === 0) { alert("Please add at least one skill."); return; }
    if (!dueDate) { alert("Please select a due date."); return; }

    setIsSubmitting(true);
    try {
      const finalName =
        assignmentName ||
        classes.find((c) => c.id === selectedClassId)?.name + " - Assignment";

      await createAssignment({
        name: finalName,
        classId: selectedClassId,
        teacherId: user.uid,
        topicIds: selectedTopicIds,
        topicWeights: mixedMode ? topicWeights : null,
        mixedMode,
        requiredCorrect: Number(requiredCorrect),
        penalty: Number(penalty),
        dueDate: Timestamp.fromDate(new Date(dueDate)),
        posted: true,
      });
      router.push("/teacher");
    } catch (err) {
      console.error("Error creating assignment:", err);
      alert("Failed to create assignment: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-center text-gray-400">Loading...</div>;
  }

  if (classes.length === 0) {
    return (
      <AppShell role="teacher" userEmail={user?.email} title="Create New Assignment">
        <div className="max-w-md mx-auto mt-16 text-center">
          <div className="text-5xl mb-4">🏫</div>
          <h2 className="text-xl font-bold text-dm-navy mb-2">No classes yet</h2>
          <p className="text-gray-500 text-sm mb-6">
            You need to create a class before you can make an assignment.
          </p>
          <a
            href="/teacher/classes"
            className="gradient-brand text-white px-6 py-3 rounded-xl font-bold text-sm inline-block hover:opacity-90 shadow-md shadow-indigo-500/20"
          >
            Create a Class →
          </a>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="teacher" userEmail={user?.email} title="Create New Assignment">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="bg-white border border-dm-border rounded shadow-sm">
          {/* Basics */}
          <div className="px-6 py-5 border-b border-dm-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Assignment Name
                </label>
                <input
                  type="text"
                  value={assignmentName}
                  onChange={(e) => setAssignmentName(e.target.value)}
                  placeholder="e.g. Unit 3 Practice"
                  className="w-full border border-dm-border rounded px-3 py-2 text-sm focus:border-dm-blue focus:ring-1 focus:ring-dm-blue outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full border border-dm-border rounded px-3 py-2 text-sm bg-white focus:border-dm-blue focus:ring-1 focus:ring-dm-blue outline-none"
                  required
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="px-6 py-5 border-b border-dm-border">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">Skills</label>
              <button
                type="button"
                onClick={() => setShowSkillModal(true)}
                className="bg-dm-blue hover:bg-dm-blue-dark text-white text-sm font-semibold px-4 py-1.5 rounded transition-colors"
              >
                + Add Skill
              </button>
            </div>

            {selectedTopicIds.length === 0 ? (
              <div className="border border-dashed border-dm-border rounded p-6 text-center text-sm text-gray-400">
                No skills added yet. Click &ldquo;+ Add Skill&rdquo; to search the skill library.
              </div>
            ) : (
              <table className="w-full text-sm border border-dm-border rounded overflow-hidden">
                <thead>
                  <tr className="bg-gray-50 border-b border-dm-border">
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Skill</th>
                    {mixedMode && selectedTopicIds.length > 1 && (
                      <th className="px-3 py-2 text-center font-semibold text-gray-600 w-24">
                        Weight
                      </th>
                    )}
                    <th className="px-3 py-2 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {selectedTopicIds.map((topicId) => {
                    const topic = topics.find((t) => t.id === topicId);
                    return (
                      <tr key={topicId} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-2 text-gray-800">{topic?.name || topicId}</td>
                        {mixedMode && selectedTopicIds.length > 1 && (
                          <td className="px-3 py-2 text-center">
                            <select
                              value={topicWeights[topicId] || 1}
                              onChange={(e) =>
                                handleWeightChange(topicId, parseInt(e.target.value) || 1)
                              }
                              className="border border-dm-border rounded px-2 py-1 text-sm bg-white outline-none focus:border-dm-blue"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </td>
                        )}
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleTopic(topicId)}
                            className="text-dm-red hover:text-red-700 font-bold text-base leading-none"
                            title="Remove skill"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {selectedTopicIds.length > 1 && (
              <div className="mt-4 flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={mixedMode}
                    onChange={() => setMixedMode(true)}
                    className="accent-dm-blue"
                  />
                  Mix all skills into one problem set
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={!mixedMode}
                    onChange={() => setMixedMode(false)}
                    className="accent-dm-blue"
                  />
                  Require completion of each skill separately
                </label>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="px-6 py-5 border-b border-dm-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {mixedMode ? "Problems Required" : "Required Per Skill"}
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={requiredCorrect}
                  onChange={(e) => setRequiredCorrect(parseInt(e.target.value) || 0)}
                  className="w-full border border-dm-border rounded px-3 py-2 text-sm focus:border-dm-blue focus:ring-1 focus:ring-dm-blue outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Number of correct answers to reach 100%.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Penalty for Incorrect
                </label>
                <select
                  value={penalty}
                  onChange={(e) => setPenalty(parseInt(e.target.value))}
                  className="w-full border border-dm-border rounded px-3 py-2 text-sm bg-white focus:border-dm-blue focus:ring-1 focus:ring-dm-blue outline-none"
                >
                  {[0, 1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? "No penalty" : `${n} problem${n > 1 ? "s" : ""}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Progress deducted per wrong answer.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-dm-border rounded px-3 py-2 text-sm focus:border-dm-blue focus:ring-1 focus:ring-dm-blue outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 rounded-b">
            <button
              type="button"
              onClick={() => router.push("/teacher")}
              className="px-4 py-2 text-sm font-semibold text-gray-600 border border-dm-border rounded bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedTopicIds.length === 0 || !dueDate}
              className="bg-dm-blue hover:bg-dm-blue-dark text-white px-6 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Assignment"}
            </button>
          </div>
        </div>
      </form>

      {/* Skill picker modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 pt-16 z-50">
          <div className="bg-white rounded shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-dm-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Add Skills</h3>
              <button
                type="button"
                onClick={() => setShowSkillModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-3 border-b border-dm-border">
              <input
                autoFocus
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search skills..."
                className="w-full border border-dm-border rounded px-3 py-2 text-sm focus:border-dm-blue focus:ring-1 focus:ring-dm-blue outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {filteredTopics.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">
                  No skills match your search.
                </p>
              ) : (
                <AccordionTopicList
                  topics={filteredTopics}
                  mode="teacher"
                  selectedTopicIds={selectedTopicIds}
                  onToggle={handleToggleTopic}
                  forceOpen={skillSearch.trim().length > 0}
                />
              )}
            </div>
            <div className="px-5 py-3 border-t border-dm-border flex items-center justify-between bg-gray-50 rounded-b">
              <span className="text-sm text-gray-500">
                {selectedTopicIds.length} skill{selectedTopicIds.length !== 1 ? "s" : ""} selected
              </span>
              <button
                type="button"
                onClick={() => setShowSkillModal(false)}
                className="bg-dm-blue hover:bg-dm-blue-dark text-white px-5 py-2 rounded text-sm font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function NewAssignmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
      <NewAssignmentContent />
    </Suspense>
  );
}
