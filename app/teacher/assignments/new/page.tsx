"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getTeacherClasses } from "@/services/classesService";
import { createAssignment } from "@/services/assignmentsService";
import { getPublishedTopics } from "@/services/topicsService";
import type { ClassDoc, Topic } from "@/types";
import TopicBrowser from "@/components/teacher/TopicBrowser";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";

// Component for creating new assignments
function NewAssignmentContent() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get("classId") || "";
  const initialTopicId = searchParams.get("topicId");

  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(initialTopicId ? [initialTopicId] : []);
  const [topicWeights, setTopicWeights] = useState<Record<string, number>>({});
  const [mixedMode, setMixedMode] = useState(true);
  const [requiredCorrect, setRequiredCorrect] = useState(5);
  const [penalty, setPenalty] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [assignmentName, setAssignmentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);

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
          getPublishedTopics()
        ]);
        setClasses(classesData);
        setTopics(topicsData);
        
        if (!selectedClassId && classesData.length > 0) {
          setSelectedClassId(classesData[0].id);
        }

        // Initialize weights for initial topics if not already set
        if (initialTopicId && Object.keys(topicWeights).length === 0) {
          setTopicWeights({ [initialTopicId]: 1 });
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]); // Removed unnecessary dependencies to prevent loops

  const handleToggleTopic = (topicId: string) => {
    setSelectedTopicIds(prev => {
      const isSelected = prev.includes(topicId);
      const next = isSelected 
        ? prev.filter(id => id !== topicId) 
        : [...prev, topicId];
      
      // Update weights
      const nextWeights = { ...topicWeights };
      if (isSelected) {
        delete nextWeights[topicId];
      } else {
        nextWeights[topicId] = 1;
      }
      setTopicWeights(nextWeights);
      
      return next;
    });
  };

  const handleWeightChange = (topicId: string, value: number) => {
    setTopicWeights(prev => ({
      ...prev,
      [topicId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert("You must be logged in."); return; }
    if (!selectedClassId) { alert("Please select a class."); return; }
    if (selectedTopicIds.length === 0) { alert("Please select at least one topic."); return; }
    if (!dueDate) { alert("Please select a due date."); return; }

    setIsSubmitting(true);
    try {
      const finalName = assignmentName || (classes.find(c => c.id === selectedClassId)?.name + " - Assignment");
      
      console.log("Creating assignment with data:", {
        name: finalName,
        classId: selectedClassId,
        topicIds: selectedTopicIds,
        mixedMode,
        requiredCorrect,
        penalty
      });

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

  if (authLoading || loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Link href="/teacher" className="text-indigo-600 hover:underline text-sm font-bold tracking-tight">
            &larr; Back to Classes
          </Link>
          <h1 className="text-3xl font-black text-gray-900 mt-2 uppercase tracking-tighter">Create New Assignment</h1>
          <p className="text-gray-500">Pick one or more topics and configure mastery goals.</p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Step 0: Basic Info */}
          <section className="bg-white border rounded-2xl p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              Assignment Basics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-[10px]">Assignment Name (Optional)</label>
                <input
                  type="text"
                  value={assignmentName}
                  onChange={(e) => setAssignmentName(e.target.value)}
                  placeholder="e.g. Weekly Practice #4"
                  className="w-full border rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-[10px]">Assign to Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                  required
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Step 1: Select Topics */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
              Select Topics ({selectedTopicIds.length})
            </h2>
            <TopicBrowser 
              selectedTopicIds={selectedTopicIds} 
              onToggle={handleToggleTopic} 
            />
          </section>

          {/* Step 2: Configure Mode & Settings */}
          {selectedTopicIds.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white border rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                  Assignment Mode
                </h2>
                
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setMixedMode(true)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      mixedMode ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600" : "border-gray-100 bg-white"
                    }`}
                  >
                    <div className="font-bold text-gray-900">Mix Topics Together</div>
                    <p className="text-[10px] text-gray-500 mt-1">Students get questions from all selected topics in a single pool based on your ratios.</p>
                  </button>

                  {/* Topic Distribution / Ratios */}
                  {mixedMode && selectedTopicIds.length > 1 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in duration-300">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Topic Distribution (Ratio)</label>
                      <div className="space-y-3">
                        {selectedTopicIds.map(topicId => {
                          const topic = topics.find(t => t.id === topicId);
                          return (
                            <div key={topicId} className="flex items-center gap-4">
                              <span className="flex-1 text-xs font-bold text-gray-700 truncate">{topic?.name}</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={topicWeights[topicId] || 1}
                                  onChange={(e) => handleWeightChange(topicId, parseInt(e.target.value) || 1)}
                                  className="w-12 border rounded-lg px-2 py-1 text-xs font-black text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[9px] text-gray-400 mt-3 italic text-center">e.g. 2:1 ratio means twice as many questions from that topic.</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setMixedMode(false)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      !mixedMode ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600" : "border-gray-100 bg-white"
                    }`}
                  >
                    <div className="font-bold text-gray-900">Separate per Topic</div>
                    <p className="text-[10px] text-gray-500 mt-1">Students must reach the target correct for each individual topic separately.</p>
                  </button>

                  <div className="pt-4">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-[10px]">Due Date</label>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-2xl p-8 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                  Mastery Settings
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-[10px]">
                      {mixedMode ? "Total Required Correct" : "Required Correct PER TOPIC"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={requiredCorrect}
                      onChange={(e) => setRequiredCorrect(parseInt(e.target.value) || 0)}
                      className="w-full border rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                    />
                    <p className="text-[10px] text-gray-400 mt-2 italic">Standard is 5. Maximum is 100.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-[10px]">Penalty per Wrong Answer</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={penalty}
                      onChange={(e) => setPenalty(parseInt(e.target.value) || 0)}
                      className="w-full border rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                    />
                    <p className="text-[10px] text-gray-400 mt-2 italic">Standard is 1. Penalty is deducted from current progress.</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting || selectedTopicIds.length === 0 || !dueDate}
              className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 disabled:opacity-50 shadow-xl transition-all active:scale-95"
            >
              {isSubmitting ? "Posting..." : "Post Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewAssignmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
      <NewAssignmentContent />
    </Suspense>
  );
}
