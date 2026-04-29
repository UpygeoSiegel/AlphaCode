"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAssignment } from "@/services/assignmentsService";
import { getProgress, initProgress, recordAnswer } from "@/services/progressService";
import { getQuestionBank } from "@/services/questionBankService";
import { getTemplatesByTopic } from "@/services/templatesService";
import type { Assignment, Question, StudentProgress, Template } from "@/types";
import QuestionCard from "@/components/shared/QuestionCard";
import Link from "next/link";

export default function AssignmentSessionPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadSession() {
      if (!user) return;
      try {
        const asgnId = id as string;
        const asgn = await getAssignment(asgnId);
        if (!asgn) {
          setError("Assignment not found.");
          return;
        }
        setAssignment(asgn);

        // Load progress
        let prog = await getProgress(user.uid, asgnId);
        if (!prog) {
          await initProgress(user.uid, asgnId, asgn.topicId);
          prog = await getProgress(user.uid, asgnId);
        }
        setProgress(prog);

        // Load templates for live generation (fallback if bank empty)
        const tmpls = await getTemplatesByTopic(asgn.topicId);
        setTemplates(tmpls);

        // Try to load question bank
        const bank = await getQuestionBank(asgn.topicId);
        if (bank.length > 0) {
          // Pick a random one from bank
          setCurrentQuestion(bank[Math.floor(Math.random() * bank.length)]);
        } else if (tmpls.length > 0) {
          // Generate live
          generateNextQuestion(tmpls);
        } else {
          setError("No questions available for this topic.");
        }
      } catch (err) {
        console.error("Session error:", err);
        setError("Failed to load practice session.");
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [id, user]);

  const generateNextQuestion = (availableTemplates: Template[]) => {
    try {
      const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
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
    if (!user || !assignment || !currentQuestion) return;
    
    // Refresh progress from server
    const latestProg = await getProgress(user.uid, assignment.id);
    setProgress(latestProg);

    if (latestProg?.completed) {
      // Done!
      return;
    }

    // Load next question
    const bank = await getQuestionBank(assignment.topicId);
    if (bank.length > 0) {
      setCurrentQuestion(bank[Math.floor(Math.random() * bank.length)]);
    } else {
      generateNextQuestion(templates);
    }
  };

  const handleAnswerSubmit = async (selectedAnswer: string) => {
    if (!user || !assignment || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.answer;
    
    try {
      await recordAnswer(user.uid, assignment.id, {
        questionIndex: currentQuestion.index,
        selectedAnswer,
        correct: isCorrect,
      }, assignment.requiredCorrect);
      
      // Update local progress state to show UI updates immediately
      if (progress) {
        setProgress({
          ...progress,
          correctCount: progress.correctCount + (isCorrect ? 1 : 0),
          completed: (progress.correctCount + (isCorrect ? 1 : 0)) >= assignment.requiredCorrect
        });
      }
    } catch (err) {
      console.error("Error recording answer:", err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 font-bold italic">Initializing practice session...</div>;
  
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <p className="text-red-500 font-bold mb-4">{error}</p>
      <Link href="/student" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Back to Dashboard</Link>
    </div>
  );

  const percent = progress ? Math.min(100, Math.round((progress.correctCount / (assignment?.requiredCorrect || 1)) * 100)) : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8">
      {/* Session Header */}
      <div className="w-full max-w-2xl flex justify-between items-end mb-8">
        <div>
          <Link href="/student" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">&larr; Quit Session</Link>
          <h1 className="text-2xl font-black text-gray-900 mt-1 uppercase tracking-tighter italic">Practice Mode</h1>
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
        {/* Segment markers */}
        {Array.from({ length: (assignment?.requiredCorrect || 1) - 1 }).map((_, i) => (
          <div 
            key={i} 
            className="absolute top-0 bottom-0 w-px bg-gray-100" 
            style={{ left: `${((i + 1) / (assignment?.requiredCorrect || 1)) * 100}%` }}
          />
        ))}
      </div>

      {progress?.completed ? (
        <div className="w-full max-w-2xl bg-white border rounded-3xl p-12 text-center shadow-xl animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
          <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Mastery Achieved!</h2>
          <p className="text-gray-500 mb-8 font-medium text-lg">You have successfully completed this practice session.</p>
          <Link href="/student" className="inline-block bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
            Return to Dashboard
          </Link>
        </div>
      ) : currentQuestion && (
        <QuestionCard 
          key={`${currentQuestion.prompt.substring(0, 20)}-${currentQuestion.index}`}
          question={currentQuestion} 
          onNext={handleNext}
          onAnswer={handleAnswerSubmit}
        />
      )}
      
      {/* Penalty Warning */}
      {!progress?.completed && assignment && assignment.penalty > 0 && (
        <p className="mt-8 text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
          <span className="w-4 h-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-[8px]">!</span>
          Warning: -{assignment.penalty} points for incorrect answers
        </p>
      )}
    </div>
  );
}
