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

  const choiceLabels = ["A", "B", "C", "D"];

  return (
    <div className="w-full max-w-3xl bg-white border border-dm-border rounded-2xl shadow-card overflow-hidden">
      <div className="p-6 md:p-8">
        {/* Prompt */}
        <div className="text-base md:text-lg text-gray-800 mb-7 leading-relaxed font-medium">
          <CodeRenderer html={question.prompt} />
        </div>

        {/* Answer Area */}
        <div className="mb-6">
          {question.type === "multiple-choice" ? (
            <div className="space-y-2.5">
              {allChoices.map((choice, i) => {
                let containerClass = "border-dm-border bg-white hover:border-dm-blue hover:bg-dm-blue-light";
                let labelClass = "bg-gray-100 text-gray-600";
                let icon = null;

                if (isSubmitted) {
                  if (choice === question.answer) {
                    containerClass = "border-dm-green bg-dm-green-light";
                    labelClass = "bg-dm-green text-white";
                    icon = <span className="text-dm-green font-bold text-lg">✓</span>;
                  } else if (choice === selectedAnswer) {
                    containerClass = "border-dm-red bg-dm-red-light";
                    labelClass = "bg-dm-red text-white";
                    icon = <span className="text-dm-red font-bold text-lg">✕</span>;
                  } else {
                    containerClass = "border-gray-100 bg-gray-50 opacity-50";
                    labelClass = "bg-gray-200 text-gray-400";
                  }
                } else if (choice === selectedAnswer) {
                  containerClass = "border-dm-blue bg-dm-blue-light shadow-sm shadow-indigo-200";
                  labelClass = "bg-dm-blue text-white";
                }

                return (
                  <button
                    key={i}
                    disabled={isSubmitted}
                    onClick={() => setSelectedAnswer(choice)}
                    className={`w-full text-left px-4 py-3.5 flex items-center gap-3.5 transition-all rounded-xl border-2 disabled:cursor-default ${containerClass}`}
                  >
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${labelClass}`}
                    >
                      {choiceLabels[i]}
                    </span>
                    <span className="text-sm text-gray-800 flex-1 font-medium">{choice}</span>
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Your Answer:
                </label>
                <input
                  type="text"
                  autoFocus
                  disabled={isSubmitted}
                  value={selectedAnswer || ""}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className={`w-full max-w-sm border-2 rounded-xl px-4 py-2.5 text-sm outline-none transition-all font-medium ${
                    isSubmitted
                      ? isCorrect
                        ? "border-dm-green bg-dm-green-light text-green-800"
                        : "border-dm-red bg-dm-red-light text-red-800"
                      : "border-dm-border focus:border-dm-blue focus:ring-2 focus:ring-dm-blue/20"
                  }`}
                />
              </div>
              {isSubmitted && !isCorrect && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-gray-400">Correct answer:</span>
                  <span className="font-bold text-dm-green bg-dm-green-light px-2 py-0.5 rounded-lg">{question.answer}</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Action Area */}
        {!isSubmitted ? (
          <button
            onClick={() => handleSubmit()}
            disabled={!selectedAnswer || selectedAnswer.trim() === ""}
            className="gradient-brand text-white px-7 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 shadow-md shadow-indigo-500/20"
          >
            Submit Answer
          </button>
        ) : (
          <div className="space-y-4">
            <div
              className={`px-4 py-3.5 rounded-xl border-2 text-sm font-bold flex items-center gap-2.5 ${
                isCorrect
                  ? "bg-dm-green-light border-dm-green text-green-800"
                  : "bg-dm-red-light border-dm-red text-red-800"
              }`}
            >
              <span className="text-xl">{isCorrect ? "🎉" : "😔"}</span>
              {isCorrect ? "Correct! Great job!" : "That's not right. Keep going!"}
            </div>

            <div className="flex items-center gap-4">
              {!isLast && (
                <button
                  onClick={handleNext}
                  className="gradient-brand text-white px-7 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 shadow-md shadow-indigo-500/20"
                >
                  Next Problem →
                </button>
              )}
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-sm font-semibold text-dm-blue hover:underline flex items-center gap-1.5"
              >
                <span>{showExplanation ? "▲" : "▼"}</span>
                {showExplanation ? "Hide Explanation" : "Show Explanation"}
              </button>
            </div>
          </div>
        )}

        {/* Explanation Section */}
        {isSubmitted && showExplanation && (
          <div className="mt-6 pt-6 border-t-2 border-dm-border">
            <h4 className="text-sm font-bold text-dm-navy mb-4 flex items-center gap-2">
              <span className="w-6 h-6 gradient-brand rounded-lg flex items-center justify-center text-white text-xs">💡</span>
              Step-by-Step Explanation
            </h4>
            <ol className="space-y-3">
              {question.explanation.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 gradient-brand text-white rounded-full flex items-center justify-center font-bold text-xs mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-gray-700 pt-0.5 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
            <div className="mt-4 px-4 py-3.5 bg-dm-blue-light border-2 border-dm-blue/20 rounded-xl text-sm text-dm-navy font-medium italic">
              💬 {question.explanation.summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
