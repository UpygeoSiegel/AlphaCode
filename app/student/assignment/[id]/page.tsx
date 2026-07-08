"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAssignment } from "@/services/assignmentsService";
import { getProgress, initProgress, recordAnswer } from "@/services/progressService";
import { getQuestionBank } from "@/services/questionBankService";
import { getTemplatesByTopic } from "@/services/templatesService";
import { getTopics } from "@/services/topicsService";
import type { Assignment, Question, StudentProgress, Template, Topic } from "@/types";
import QuestionCard from "@/components/shared/QuestionCard";
import Link from "next/link";

export default function AssignmentSessionPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [allTopicProgress, setAllTopicProgress] = useState<Record<string, StudentProgress>>({});
  
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadAssignment() {
      if (!user) return;
      try {
        const asgnId = id as string;
        const asgn = await getAssignment(asgnId);
        if (!asgn) {
          setError("Assignment not found.");
          return;
        }
        setAssignment(asgn);

        // Load all topic data for this assignment
        const topicsData = await getTopics();
        const relevantTopics = topicsData.filter(t => asgn.topicIds.includes(t.id));
        setTopics(relevantTopics);

        // Load progress for ALL topics in this assignment to show in selection screen
        const progMap: Record<string, StudentProgress> = {};
        await Promise.all(asgn.topicIds.map(async (tId) => {
          const pathId = asgn.mixedMode ? "mixed" : tId;
          const p = await getProgress(user.uid, asgnId, pathId);
          if (p) progMap[tId] = p;
        }));
        setAllTopicProgress(progMap);

        if (asgn.mixedMode) {
          // If mixed, start immediately
          startTopicSession(asgn, "mixed");
        }
      } catch (err) {
        console.error("Error loading assignment:", err);
        setError("Failed to load assignment.");
      } finally {
        setLoading(false);
      }
    }
    loadAssignment();
  }, [id, user]);

  const startTopicSession = async (asgn: Assignment, topicId: string) => {
    if (!user) return;
    setSessionLoading(true);
    setSelectedTopicId(topicId);
    try {
      // 1. Initialize or get progress
      let prog = await getProgress(user.uid, asgn.id, topicId);
      if (!prog) {
        await initProgress(user.uid, asgn.id, topicId, asgn.penalty);
        prog = await getProgress(user.uid, asgn.id, topicId);
      }
      setProgress(prog);

      // 2. Load templates & banks
      const relevantTopicIds = topicId === "mixed" ? asgn.topicIds : [topicId];
      
      const allTmpls: Template[] = [];
      const allQuestions: Question[] = [];

      await Promise.all(relevantTopicIds.map(async (tId) => {
        const [tmpls, bank] = await Promise.all([
          getTemplatesByTopic(tId),
          getQuestionBank(tId)
        ]);
        allTmpls.push(...tmpls);
        allQuestions.push(...bank);
      }));

      setTemplates(allTmpls);

      // 3. Pick or generate first question
      if (allQuestions.length > 0) {
        setCurrentQuestion(allQuestions[Math.floor(Math.random() * allQuestions.length)]);
      } else if (allTmpls.length > 0) {
        generateNextQuestion(allTmpls, asgn);
      } else {
        setError("No questions available for this selection.");
      }
    } catch (err) {
      console.error("Session error:", err);
      setError("Failed to start session.");
    } finally {
      setSessionLoading(false);
    }
  };

  const generateNextQuestion = (availableTemplates: Template[], asgn: Assignment) => {
    try {
      let template: Template | undefined;
      
      // Select topic based on weights if mixed, otherwise just use available templates
      if (asgn.mixedMode && asgn.topicWeights) {
        const weightedTopicPool: string[] = [];
        asgn.topicIds.forEach(tId => {
          const weight = asgn.topicWeights?.[tId] || 1;
          for (let i = 0; i < weight; i++) weightedTopicPool.push(tId);
        });
        const selectedId = weightedTopicPool[Math.floor(Math.random() * weightedTopicPool.length)];
        const topicTmpls = availableTemplates.filter(t => t.topicId === selectedId);
        template = topicTmpls[Math.floor(Math.random() * topicTmpls.length)] || availableTemplates[0];
      } else {
        template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
      }

      if (!template) return;

      const transformedCode = template.code.replace(/export default/, 'const template =') + '; return template;';
      const templateObj = new Function(transformedCode)();
      const q = templateObj.generate();
      const exp = templateObj.explain(q);
      
      setCurrentQuestion({
        ...q,
        explanation: exp,
        index: Math.floor(Math.random() * 1000)
      });
    } catch (err) {
      console.error("Generation error:", err);
    }
  };

  const handleNext = async () => {
    if (!user || !assignment || !currentQuestion || !selectedTopicId) return;
    
    // Use local state instead of re-fetching to avoid race conditions with server updates
    if (progress?.completed) return;
    generateNextQuestion(templates, assignment);
  };

  const handleAnswerSubmit = async (selectedAnswer: string) => {
    if (!user || !assignment || !currentQuestion || !selectedTopicId) return;

    // Use robust comparison to handle potential type mismatches or hidden whitespace
    const isCorrect = String(selectedAnswer).trim() === String(currentQuestion.answer).trim();
    
    try {
      // 1. Update local state immediately for snappy UI
      if (progress) {
        const penalty = Number(assignment.penalty) || 0;
        const currentCorrect = Number(progress.correctCount) || 0;
        const nextCorrect = isCorrect 
          ? currentCorrect + 1 
          : Math.max(0, currentCorrect - penalty);
          
        setProgress({
          ...progress,
          correctCount: nextCorrect,
          completed: nextCorrect >= Number(assignment.requiredCorrect)
        });
      }

      // 2. Record in background
      await recordAnswer(
        user.uid, 
        assignment.id, 
        selectedTopicId, 
        {
          questionIndex: currentQuestion.index,
          selectedAnswer,
          correct: isCorrect,
        }, 
        assignment.requiredCorrect, 
        assignment.penalty
      );
    } catch (err) {
      console.error("Error recording answer:", err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-dm-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 gradient-brand rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 animate-pulse">α</div>
        <p className="text-gray-400 text-sm">Loading assignment...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-dm-bg flex flex-col items-center justify-center p-8">
      <div className="text-4xl mb-4">⚠️</div>
      <p className="text-dm-red font-semibold mb-4">{error}</p>
      <Link href="/student" className="gradient-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20">Back to Assignments</Link>
    </div>
  );

  // SELECTION SCREEN
  if (assignment && !assignment.mixedMode && !selectedTopicId) {
    return (
      <div className="min-h-screen bg-dm-bg">
        <header className="bg-white border-b border-dm-border px-8 py-4 shadow-sm">
          <div className="max-w-3xl mx-auto">
            <Link href="/student" className="text-sm font-semibold text-dm-blue hover:underline flex items-center gap-1 w-fit">← Back to Assignments</Link>
            <h1 className="text-xl font-bold text-dm-navy mt-1">{assignment.name}</h1>
          </div>
        </header>
        <main className="max-w-3xl mx-auto p-8">
          <p className="text-sm text-gray-500 mb-4">Select a skill below. You must complete each skill to finish this assignment.</p>
          <div className="bg-white border border-dm-border rounded-2xl shadow-card divide-y divide-gray-100 overflow-hidden">
            {topics.map(topic => {
              const prog = allTopicProgress[topic.id];
              const isCompleted = prog?.completed;
              const percent = prog ? Math.min(100, Math.round((prog.correctCount / (assignment.requiredCorrect || 1)) * 100)) : 0;

              return (
                <button
                  key={topic.id}
                  onClick={() => startTopicSession(assignment, topic.id)}
                  className="w-full flex items-center justify-between gap-6 px-5 py-4 text-left hover:bg-dm-blue-light transition-all group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-dm-blue font-bold group-hover:underline">{topic.name}</div>
                    <p className="text-xs text-gray-400 truncate">{topic.description}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-40 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${isCompleted ? 'bg-dm-green' : 'bg-dm-blue'}`} style={{ width: `${percent}%` }} />
                    </div>
                    <span className={`text-sm font-bold w-12 text-right ${isCompleted ? 'text-dm-green' : 'text-gray-700'}`}>
                      {isCompleted ? '100%' : `${percent}%`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  if (sessionLoading) return (
    <div className="min-h-screen bg-dm-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 gradient-brand rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 animate-pulse">α</div>
        <p className="text-gray-400 text-sm">Starting session...</p>
      </div>
    </div>
  );

  const required = assignment?.requiredCorrect || 1;
  const correctCount = Number(progress?.correctCount) || 0;
  const percent = progress ? Math.min(100, Math.round((correctCount / required) * 100)) : 0;

  return (
    <div className="min-h-screen bg-dm-bg">
      {/* Top bar */}
      <header className="bg-white border-b border-dm-border px-4 md:px-8 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="min-w-0">
            <button 
              onClick={() => {
                if (assignment?.mixedMode) router.push("/student");
                else setSelectedTopicId(null);
              }} 
              className="text-xs font-semibold text-dm-blue hover:underline flex items-center gap-1"
            >
              ← {assignment?.mixedMode ? "Back to Assignments" : "Back to Skills"}
            </button>
            <h1 className="text-lg font-semibold text-gray-800 truncate">
              {assignment?.mixedMode ? assignment.name : topics.find(t => t.id === selectedTopicId)?.name}
            </h1>
          </div>
          <div className="text-right shrink-0">
            <div className="text-right">
              <div className="text-xl font-extrabold gradient-brand-text leading-none">{correctCount} / {required}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{percent}% complete</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-8 flex flex-col items-center">
        {/* Segmented progress bar */}
        <div className="w-full mb-6">
          <div className="flex gap-1">
            {Array.from({ length: required }).map((_, i) => (
              <div
                key={i}
                className={`h-3.5 flex-1 rounded-full transition-all ${
                  i < correctCount
                    ? "bg-dm-green shadow-sm shadow-green-500/30"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-400">{correctCount} correct</span>
            <span className="text-[10px] text-gray-400">{required} needed</span>
          </div>
        </div>

        {progress?.completed ? (
          <div className="w-full bg-white border border-dm-border rounded shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <div className="w-16 h-16 bg-dm-green-light rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">✓</div>
            <h2 className="text-2xl font-extrabold text-dm-navy mb-2">
              {assignment?.mixedMode ? "Assignment Complete!" : "Skill Mastered!"}
            </h2>
            <p className="text-gray-500 mb-6">You answered {required} problems correctly. Outstanding work!</p>
            <button 
              onClick={() => {
                if (assignment?.mixedMode) router.push("/student");
                else {
                  setSelectedTopicId(null);
                  window.location.reload(); 
                }
              }}
              className="gradient-brand text-white px-8 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 shadow-lg shadow-indigo-500/30"
            >
              {assignment?.mixedMode ? "Back to Assignments" : "Choose Another Skill"}
            </button>
          </div>
        ) : currentQuestion && (
          <QuestionCard 
            key={`${currentQuestion.prompt.substring(0, 20)}-${currentQuestion.index}`}
            question={currentQuestion} 
            onNext={handleNext}
            onAnswer={handleAnswerSubmit}
          />
        )}
        
        {!progress?.completed && assignment && assignment.penalty > 0 && (
          <div className="mt-6 px-4 py-3 bg-dm-red-light border border-dm-red/30 rounded-xl">
            <p className="text-sm text-red-700 font-medium">
              ⚠️ Penalty: {assignment.penalty} problem{assignment.penalty > 1 ? "s" : ""} deducted per wrong answer.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
