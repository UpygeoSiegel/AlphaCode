"use client";

import React, { useState, useMemo } from "react";
import type { Question } from "@/types";
import CodeRenderer from "./CodeRenderer";

interface QuestionCardProps {
  question: Question;
  onNext: () => void;
  onAnswer?: (answer: string) => void;
  isLast?: boolean;
}

export default function QuestionCard({ question, onNext, onAnswer, isLast }: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Combine and shuffle answers - memoized so it only reshuffles when the question identity changes
  const allChoices = useMemo(() => {
    if (question.type !== "multiple-choice") return [];
    const distractors = Array.isArray(question.distractors) ? question.distractors : [];
    const uniqueDistractors = Array.from(new Set(distractors.filter(d => d !== question.answer)));
    return [question.answer, ...uniqueDistractors].sort(() => Math.random() - 0.5);
  }, [question.prompt, question.answer, question.distractors, question.type]);

  const isCorrect = String(selectedAnswer || "").trim().toLowerCase() === String(question.answer).trim().toLowerCase();

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (selectedAnswer !== null && selectedAnswer.trim() !== "") {
      setIsSubmitted(true);
      if (onAnswer) onAnswer(selectedAnswer);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setShowExplanation(false);
    onNext();
  };

  return (
    <div className="w-full max-w-2xl bg-white border rounded-2xl shadow-sm overflow-hidden transition-all">
      {/* Question Header */}
      <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
        <span className="text-sm font-bold uppercase tracking-widest">Question</span>
        <span className="text-xs bg-indigo-500 px-2 py-1 rounded-full uppercase font-black">{question.type}</span>
      </div>

      <div className="p-8">
        {/* Prompt */}
        <div className="text-xl font-medium mb-8">
          <CodeRenderer html={question.prompt} />
        </div>

        {/* Answer Area */}
        <div className="mb-8">
          {question.type === "multiple-choice" ? (
            <div className="space-y-3">
              {allChoices.map((choice, i) => {
                let stateClasses = "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50";
                if (isSubmitted) {
                  if (choice === question.answer) {
                    stateClasses = "border-green-500 bg-green-50 text-green-800 ring-1 ring-green-500";
                  } else if (choice === selectedAnswer) {
                    stateClasses = "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500";
                  } else {
                    stateClasses = "border-gray-100 opacity-50";
                  }
                } else if (choice === selectedAnswer) {
                  stateClasses = "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600";
                }

                return (
                  <button
                    key={i}
                    disabled={isSubmitted}
                    onClick={() => setSelectedAnswer(choice)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${stateClasses}`}
                  >
                    <span className="font-medium">{choice}</span>
                    {isSubmitted && choice === question.answer && (
                      <span className="text-green-600 font-bold">✓</span>
                    )}
                    {isSubmitted && choice === selectedAnswer && choice !== question.answer && (
                      <span className="text-red-600 font-bold">✕</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Your Answer</label>
                <input
                  type="text"
                  autoFocus
                  disabled={isSubmitted}
                  value={selectedAnswer || ""}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className={`w-full p-4 rounded-xl border-2 outline-none transition-all font-bold text-lg ${
                    isSubmitted 
                      ? isCorrect 
                        ? "border-green-500 bg-green-50 text-green-800" 
                        : "border-red-500 bg-red-50 text-red-800"
                      : "border-gray-100 focus:border-indigo-600 bg-gray-50"
                  }`}
                />
              </div>
              {isSubmitted && !isCorrect && (
                <div className="text-sm font-bold text-gray-500">
                  Correct Answer: <span className="text-green-600">{question.answer}</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Action Button */}
        {!isSubmitted ? (
          <button
            onClick={() => handleSubmit()}
            disabled={!selectedAnswer || selectedAnswer.trim() === ""}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md active:scale-95"
          >
            Submit Answer
          </button>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl font-bold text-center animate-in zoom-in-95 duration-200 ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
              </button>
              {!isLast && (
                <button
                  onClick={handleNext}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                >
                  Next Question &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* Explanation Section */}
        {isSubmitted && showExplanation && (
          <div className="mt-8 pt-8 border-t animate-in fade-in slide-in-from-top-4 duration-300">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Step-by-Step Explanation</h4>
            <div className="space-y-4">
              {question.explanation.steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <p className="text-gray-600 pt-1 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-indigo-50 rounded-xl italic text-indigo-800 font-medium">
              {question.explanation.summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
