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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 font-bold italic">Loading assignment...</div>;
  
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <p className="text-red-500 font-bold mb-4">{error}</p>
      <Link href="/student" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Back to Dashboard</Link>
    </div>
  );

  // SELECTION SCREEN
  if (assignment && !assignment.mixedMode && !selectedTopicId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12">
            <Link href="/student" className="text-sm font-bold text-indigo-600 hover:underline">&larr; Back to Dashboard</Link>
            <h1 className="text-4xl font-black text-gray-900 mt-2 uppercase tracking-tighter italic">{assignment.name}</h1>
            <p className="text-gray-500 font-medium">Select a topic to begin practicing. You must master each one individually.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topics.map(topic => {
              const prog = allTopicProgress[topic.id];
              const isCompleted = prog?.completed;
              const percent = prog ? Math.min(100, Math.round((prog.correctCount / (assignment.requiredCorrect || 1)) * 100)) : 0;

              return (
                <button
                  key={topic.id}
                  onClick={() => startTopicSession(assignment, topic.id)}
                  className="bg-white border-2 border-gray-100 rounded-3xl p-8 text-left hover:border-indigo-600 transition-all group shadow-sm hover:shadow-xl"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isCompleted ? 'Mastered ✓' : 'In Progress'}
                    </div>
                    <div className="text-2xl font-black text-gray-900">{percent}%</div>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{topic.name}</h3>
                  <p className="text-sm text-gray-400 mb-8 line-clamp-2">{topic.description}</p>
                  
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-indigo-600'}`} style={{ width: `${percent}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (sessionLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400 font-bold italic animate-pulse">Starting session...</div>;

  const percent = progress ? Math.min(100, Math.round((progress.correctCount / (assignment?.requiredCorrect || 1)) * 100)) : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8">
      {/* Session Header */}
      <div className="w-full max-w-2xl flex justify-between items-end mb-8">
        <div>
          <button 
            onClick={() => {
              if (assignment?.mixedMode) router.push("/student");
              else setSelectedTopicId(null);
            }} 
            className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
          >
            &larr; {assignment?.mixedMode ? "Quit Session" : "Back to Topics"}
          </button>
          <h1 className="text-2xl font-black text-gray-900 mt-1 uppercase tracking-tighter italic">
            {assignment?.mixedMode ? assignment.name : topics.find(t => t.id === selectedTopicId)?.name}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-indigo-700 leading-none">{percent}%</div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mastery</div>
        </div>
      </div>

      {/* Mastery Progress Bar */}
      <div className="w-full max-w-2xl h-4 bg-white border rounded-full mb-12 relative overflow-hidden shadow-inner">
        <div 
          className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${percent}%` }}
        />
        {Array.from({ length: (assignment?.requiredCorrect || 1) - 1 }).map((_, i) => (
          <div key={i} className="absolute top-0 bottom-0 w-px bg-gray-100" style={{ left: `${((i + 1) / (assignment?.requiredCorrect || 1)) * 100}%` }} />
        ))}
      </div>

      {progress?.completed ? (
        <div className="w-full max-w-2xl bg-white border rounded-3xl p-12 text-center shadow-xl animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
          <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Topic Mastered!</h2>
          <p className="text-gray-500 mb-8 font-medium text-lg">You have successfully achieved mastery in this section.</p>
          <button 
            onClick={() => {
              if (assignment?.mixedMode) router.push("/student");
              else {
                setSelectedTopicId(null);
                // Refresh list progress
                window.location.reload(); 
              }
            }}
            className="inline-block bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
          >
            {assignment?.mixedMode ? "Return to Dashboard" : "Choose Another Topic"}
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
        <p className="mt-8 text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
          <span className="w-4 h-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-[8px]">!</span>
          Warning: -{assignment.penalty} points for incorrect answers
        </p>
      )}
    </div>
  );
}
