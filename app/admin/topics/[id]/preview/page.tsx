"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { getTopic } from "@/services/topicsService";
import { getTemplatesByTopic } from "@/services/templatesService";
import type { Topic, Template, Question } from "@/types";
import QuestionCard from "@/components/shared/QuestionCard";
import Link from "next/link";

const VALIDATION_RUNS = 100;

interface ValidationFailure {
  index: number;
  issues: string[];
}

interface ValidationResult {
  total: number;
  passed: number;
  failures: ValidationFailure[];
}

// Runs inside the main thread (admin-only page — acceptable use of new Function)
function loadTemplate(code: string) {
  const transformed = code.replace(/export default/, "const template =") + "; return template;";
  return new Function(transformed)();
}

function validateQuestion(q: Record<string, unknown>, index: number): ValidationFailure | null {
  const issues: string[] = [];

  if (!q || typeof q !== "object") {
    return { index, issues: ["generate() did not return an object"] };
  }

  // Prompt
  if (!q.prompt || typeof q.prompt !== "string" || (q.prompt as string).trim() === "") {
    issues.push("prompt is empty or missing");
  }

  // Answer
  if (q.answer === undefined || q.answer === null) {
    issues.push("answer is null or undefined");
  } else if (typeof q.answer !== "string") {
    issues.push(`answer is not a string (got ${typeof q.answer})`);
  } else if ((q.answer as string).trim() === "") {
    issues.push("answer is an empty string");
  } else if (q.answer === "NaN" || q.answer === "Infinity" || q.answer === "-Infinity") {
    issues.push(`answer is an invalid value: "${q.answer}"`);
  }

  // Distractors
  if (!Array.isArray(q.distractors)) {
    issues.push("distractors is not an array");
  } else {
    const distractors = q.distractors as unknown[];

    if (distractors.length !== 3) {
      issues.push(`expected 3 distractors, got ${distractors.length}`);
    }

    distractors.forEach((d, i) => {
      if (typeof d !== "string") {
        issues.push(`distractor ${i + 1} is not a string`);
      } else if ((d as string).trim() === "") {
        issues.push(`distractor ${i + 1} is an empty string`);
      } else if (d === "NaN" || d === "Infinity" || d === "-Infinity") {
        issues.push(`distractor ${i + 1} is an invalid value: "${d}"`);
      }
    });

    if (new Set(distractors).size !== distractors.length) {
      issues.push(`distractors contain duplicates: [${distractors.join(", ")}]`);
    }

    if (typeof q.answer === "string" && (distractors as string[]).includes(q.answer)) {
      issues.push(`correct answer "${q.answer}" also appears in distractors`);
    }
  }

  return issues.length > 0 ? { index, issues } : null;
}

function runValidation(code: string): ValidationResult {
  const failures: ValidationFailure[] = [];
  let templateObj: ReturnType<typeof loadTemplate>;

  try {
    templateObj = loadTemplate(code);
  } catch (err) {
    return {
      total: VALIDATION_RUNS,
      passed: 0,
      failures: Array.from({ length: VALIDATION_RUNS }, (_, i) => ({
        index: i,
        issues: [`Template failed to load: ${(err as Error).message}`],
      })),
    };
  }

  for (let i = 0; i < VALIDATION_RUNS; i++) {
    let q: Record<string, unknown>;
    try {
      q = templateObj.generate();
    } catch (err) {
      failures.push({ index: i, issues: [`generate() threw: ${(err as Error).message}`] });
      continue;
    }
    try {
      templateObj.explain(q);
    } catch (err) {
      failures.push({ index: i, issues: [`explain() threw: ${(err as Error).message}`] });
      continue;
    }
    const failure = validateQuestion(q, i);
    if (failure) failures.push(failure);
  }

  return { total: VALIDATION_RUNS, passed: VALIDATION_RUNS - failures.length, failures };
}

export default function TopicPreviewPage() {
  const { id } = useParams();
  const topicId = Array.isArray(id) ? id[0] : id;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationExpanded, setValidationExpanded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [topicData, templatesData] = await Promise.all([
          getTopic(topicId),
          getTemplatesByTopic(topicId),
        ]);
        if (!topicData) { setError("Topic not found."); return; }
        setTopic(topicData);
        setTemplates(templatesData);
        if (templatesData.length > 0) {
          generateQuestion(templatesData);
        } else {
          setError("This topic has no templates yet.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load preview.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [topicId]);

  const generateQuestion = (availableTemplates: Template[]) => {
    try {
      const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
      const templateObj = loadTemplate(template.code);
      const q = templateObj.generate();
      const exp = templateObj.explain(q);
      setCurrentQuestion({ ...q, explanation: exp, index: Math.floor(Math.random() * 100) });
    } catch (err) {
      console.error("Generation error:", err);
      setError("Error generating question from template.");
    }
  };

  const handleRunValidation = useCallback(() => {
    if (templates.length === 0) return;
    setValidating(true);
    setValidation(null);
    // Defer to next tick so the UI updates first
    setTimeout(() => {
      const result = runValidation(templates[0].code);
      setValidation(result);
      setValidating(false);
      setValidationExpanded(true);
    }, 0);
  }, [templates]);

  // Auto-run validation on page load once templates are ready
  useEffect(() => {
    if (templates.length > 0 && !validation && !validating) {
      handleRunValidation();
    }
  }, [templates]);

  const handleNext = () => {
    if (templates.length > 0) generateQuestion(templates);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading preview...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl border shadow-sm text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Wait a moment</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link href="/admin" className="text-indigo-600 font-medium hover:underline">Back to Admin</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{topic?.name}</h1>
          <p className="text-sm text-gray-500">Previewing Live Generation</p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-indigo-600">
          Exit Preview
        </Link>
      </div>

      {/* Validation panel */}
      <div className="w-full max-w-2xl mb-6">
        <ValidationPanel
          validation={validation}
          validating={validating}
          expanded={validationExpanded}
          onToggleExpand={() => setValidationExpanded(!validationExpanded)}
          onRerun={handleRunValidation}
          runCount={VALIDATION_RUNS}
        />
      </div>

      {/* Sample question */}
      {currentQuestion && (
        <QuestionCard
          key={`${currentQuestion.prompt.substring(0, 20)}-${currentQuestion.index}`}
          question={currentQuestion}
          onNext={handleNext}
        />
      )}

      <p className="mt-8 text-xs text-gray-400 text-center max-w-sm">
        Live preview of question generation. Actual question banks are pre-generated for students.
      </p>
    </div>
  );
}

function ValidationPanel({
  validation,
  validating,
  expanded,
  onToggleExpand,
  onRerun,
  runCount,
}: {
  validation: ValidationResult | null;
  validating: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onRerun: () => void;
  runCount: number;
}) {
  if (validating) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 flex items-center gap-3">
        <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        <span className="text-sm font-medium text-gray-500">
          Running {runCount} validation tests…
        </span>
      </div>
    );
  }

  if (!validation) return null;

  const { total, passed, failures } = validation;
  const allPassed = failures.length === 0;
  const pct = Math.round((passed / total) * 100);

  // Group failures by issue type for summary
  const issueCounts: Record<string, number> = {};
  failures.forEach((f) => {
    f.issues.forEach((issue) => {
      const key = issue.replace(/"[^"]*"/g, '"…"').replace(/#\d+/g, "#N").replace(/Run #\d+/g, "");
      issueCounts[key] = (issueCounts[key] ?? 0) + 1;
    });
  });

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden ${
        allPassed ? "border-green-200" : failures.length > total * 0.2 ? "border-red-200" : "border-amber-200"
      }`}
    >
      {/* Header row */}
      <div
        className={`flex items-center justify-between px-5 py-4 ${
          allPassed ? "bg-green-50" : failures.length > total * 0.2 ? "bg-red-50" : "bg-amber-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`text-xl ${allPassed ? "text-green-500" : failures.length > total * 0.2 ? "text-red-500" : "text-amber-500"}`}>
            {allPassed ? "✓" : "⚠"}
          </span>
          <div>
            <p className={`font-black text-sm ${allPassed ? "text-green-800" : failures.length > total * 0.2 ? "text-red-800" : "text-amber-800"}`}>
              {allPassed
                ? `All ${total} tests passed`
                : `${passed}/${total} passed (${pct}%)`}
            </p>
            {!allPassed && (
              <p className="text-xs text-gray-500 mt-0.5">
                {failures.length} run{failures.length !== 1 ? "s" : ""} had issues
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRerun}
            className="text-xs font-bold text-gray-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
          >
            Re-run
          </button>
          {!allPassed && (
            <button
              type="button"
              onClick={onToggleExpand}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                allPassed ? "text-green-700 hover:bg-green-100" : "text-amber-700 hover:bg-amber-100"
              }`}
            >
              {expanded ? "Hide Details" : "Show Details"}
            </button>
          )}
        </div>
      </div>

      {/* Issue summary */}
      {!allPassed && Object.keys(issueCounts).length > 0 && (
        <div className="bg-white border-t border-gray-100 px-5 py-3 flex flex-wrap gap-2">
          {Object.entries(issueCounts).map(([issue, count]) => (
            <span key={issue} className="text-[11px] font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              {count}× {issue.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Expanded failure list */}
      {!allPassed && expanded && (
        <div className="border-t border-gray-100 bg-white divide-y divide-gray-50 max-h-56 overflow-y-auto">
          {failures.map((f, i) => (
            <div key={i} className="px-5 py-2.5 flex gap-3 text-xs">
              <span className="text-gray-400 font-mono shrink-0">#{f.index + 1}</span>
              <span className="text-gray-700">{f.issues.join(" · ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
