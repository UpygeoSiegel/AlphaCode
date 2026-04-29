"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getTeacherClasses } from "@/services/classesService";
import { createAssignment } from "@/services/assignmentsService";
import type { ClassDoc } from "@/types";
import TopicBrowser from "@/components/teacher/TopicBrowser";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";

function NewAssignmentContent() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get("classId") || "";

  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [requiredCorrect, setRequiredCorrect] = useState(5);
  const [penalty, setPenalty] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        if (!selectedClassId && classesData.length > 0) {
          setSelectedClassId(classesData[0].id);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, selectedClassId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClassId || !selectedTopicId || !dueDate) return;

    setIsSubmitting(true);
    try {
      await createAssignment({
        name: classes.find(c => c.id === selectedClassId)?.name + " - Assignment",
        classId: selectedClassId,
        teacherId: user.uid,
        topicId: selectedTopicId,
        requiredCorrect,
        penalty,
        dueDate: Timestamp.fromDate(new Date(dueDate)),
        posted: true,
      });
      router.push("/teacher");
    } catch (err) {
      console.error("Error creating assignment:", err);
      alert("Failed to create assignment.");
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
          <p className="text-gray-500">Pick a topic and configure mastery goals for your students.</p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Step 1: Select Topic */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              Select Topic
            </h2>
            <TopicBrowser 
              selectedTopicId={selectedTopicId} 
              onSelect={setSelectedTopicId} 
            />
          </section>

          {/* Step 2: Configure */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border rounded-2xl p-8 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                Class & Schedule
              </h2>
              
              <div className="space-y-6">
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

                <div>
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
                <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                Mastery Settings
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-[10px]">Required Correct</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={requiredCorrect}
                      onChange={(e) => setRequiredCorrect(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="w-12 text-center font-black text-indigo-700 bg-indigo-50 py-1 rounded border border-indigo-100">{requiredCorrect}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic">Number of correct answers needed for 100%.</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-[10px]">Penalty per Wrong Answer</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={penalty}
                      onChange={(e) => setPenalty(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                    <span className="w-12 text-center font-black text-red-700 bg-red-50 py-1 rounded border border-red-100">{penalty}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic">Points deducted from progress for each mistake.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !selectedTopicId || !dueDate}
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
