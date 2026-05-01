"use client";

import React, { useEffect, useState, useRef } from "react";
import type { Question } from "@/types";
import CodeRenderer from "../shared/CodeRenderer";

interface ValidationFailure {
  index: number;
  issues: string[];
}

interface ValidationResult {
  total: number;
  passed: number;
  failures: ValidationFailure[];
}

const VALIDATION_RUNS = 50;

const WORKER_SRC = `
  function validateQuestion(q, index) {
    const issues = [];

    if (!q || typeof q !== "object") {
      return [{ index, issues: ["generate() did not return an object"] }];
    }

    // Prompt
    if (!q.prompt || typeof q.prompt !== "string" || q.prompt.trim() === "") {
      issues.push("prompt is empty or missing");
    }

    // Answer
    if (q.answer === undefined || q.answer === null) {
      issues.push("answer is null or undefined");
    } else if (typeof q.answer !== "string") {
      issues.push("answer is not a string (got " + typeof q.answer + ")");
    } else if (q.answer.trim() === "") {
      issues.push("answer is an empty string");
    } else if (q.answer === "NaN" || q.answer === "Infinity" || q.answer === "-Infinity") {
      issues.push('answer is an invalid value: "' + q.answer + '"');
    }

    // Distractors
    if (!Array.isArray(q.distractors)) {
      issues.push("distractors is not an array");
    } else {
      if (q.distractors.length !== 3) {
        issues.push("expected 3 distractors, got " + q.distractors.length);
      }

      q.distractors.forEach(function(d, i) {
        if (typeof d !== "string") {
          issues.push("distractor " + (i + 1) + " is not a string");
        } else if (d.trim() === "") {
          issues.push("distractor " + (i + 1) + " is an empty string");
        } else if (d === "NaN" || d === "Infinity" || d === "-Infinity") {
          issues.push('distractor ' + (i + 1) + ' is an invalid value: "' + d + '"');
        }
      });

      var distSet = new Set(q.distractors);
      if (distSet.size !== q.distractors.length) {
        issues.push("distractors contain duplicates: [" + q.distractors.join(", ") + "]");
      }

      if (q.answer !== undefined && q.distractors.includes(q.answer)) {
        issues.push('correct answer "' + q.answer + '" also appears in distractors');
      }
    }

    return issues;
  }

  self.onmessage = function(e) {
    try {
      var userCode = e.data;
      var transformedCode = userCode.replace(/export default/, 'var template =') + '; return template;';
      var template = new Function(transformedCode)();

      // 5 sample questions for display
      var samples = [];
      for (var i = 0; i < 5; i++) {
        var q = template.generate();
        var exp = template.explain(q);
        samples.push(Object.assign({}, q, { explanation: exp, index: i }));
      }

      // Validation runs
      var total = ${VALIDATION_RUNS};
      var failures = [];
      for (var j = 0; j < total; j++) {
        var vq;
        try {
          vq = template.generate();
        } catch(err) {
          failures.push({ index: j, issues: ["generate() threw: " + err.message] });
          continue;
        }
        try {
          template.explain(vq);
        } catch(err) {
          failures.push({ index: j, issues: ["explain() threw: " + err.message] });
          continue;
        }
        var issues = validateQuestion(vq, j);
        if (issues.length > 0) {
          failures.push({ index: j, issues: issues });
        }
      }

      self.postMessage({
        type: "SUCCESS",
        questions: samples,
        validation: { total: total, passed: total - failures.length, failures: failures }
      });
    } catch (err) {
      self.postMessage({ type: "ERROR", message: err.message });
    }
  };
`;

export default function PreviewPanel({ code }: { code: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const blob = new Blob([WORKER_SRC], { type: "application/javascript" });
    workerRef.current = new Worker(URL.createObjectURL(blob));

    workerRef.current.onmessage = (e) => {
      if (e.data.type === "SUCCESS") {
        setQuestions(e.data.questions);
        setValidation(e.data.validation);
        setError(null);
      } else {
        setError(e.data.message);
        setValidation(null);
      }
      setLoading(false);
    };

    return () => workerRef.current?.terminate();
  }, []);

  const runPreview = () => {
    setLoading(true);
    workerRef.current?.postMessage(code);
  };

  useEffect(() => {
    const timer = setTimeout(runPreview, 500);
    return () => clearTimeout(timer);
  }, [code]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">Live Preview</h2>
        <button
          onClick={runPreview}
          disabled={loading}
          className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-100 transition-colors disabled:opacity-50"
        >
          {loading ? "Running…" : "Regenerate"}
        </button>
      </div>

      {/* Validation badge */}
      {validation && !error && (
        <ValidationBadge validation={validation} />
      )}

      <div className="flex-grow overflow-y-auto pr-2 flex flex-col gap-6 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm font-mono">
            <strong>Error:</strong> {error}
          </div>
        )}

        {questions.length === 0 && !error && !loading && (
          <div className="bg-white border rounded-lg p-12 text-center text-gray-400">
            Click &quot;Regenerate&quot; to test your code.
          </div>
        )}

        {questions.map((q, i) => (
          <div key={i} className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Example {i + 1}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                {q.type}
              </span>
            </div>
            <div className="p-6">
              <div className="text-lg font-medium mb-6">
                <CodeRenderer html={q.prompt} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {[q.answer, ...q.distractors].sort().map((choice, ci) => (
                  <div
                    key={ci}
                    className={`p-3 border rounded-lg text-sm ${choice === q.answer ? "border-green-200 bg-green-50 text-green-800 font-medium" : "border-gray-200 text-gray-600"}`}
                  >
                    {choice} {choice === q.answer && "✓"}
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Explanation:</h4>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1 mb-3">
                  {q.explanation.steps.map((step, si) => (
                    <li key={si}>{step}</li>
                  ))}
                </ol>
                <p className="text-sm font-medium text-indigo-700 border-t pt-2 mt-2 italic">
                  {q.explanation.summary}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ValidationBadge({ validation }: { validation: ValidationResult }) {
  const [expanded, setExpanded] = useState(false);
  const { total, passed, failures } = validation;
  const allPassed = failures.length === 0;
  const pct = Math.round((passed / total) * 100);

  return (
    <div className={`rounded-xl border text-sm overflow-hidden ${allPassed ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className={`text-lg ${allPassed ? "text-green-600" : "text-amber-500"}`}>
            {allPassed ? "✓" : "⚠"}
          </span>
          <span className={`font-bold ${allPassed ? "text-green-800" : "text-amber-800"}`}>
            {allPassed
              ? `All ${total} validation runs passed`
              : `${passed}/${total} passed (${pct}%) — ${failures.length} issue${failures.length !== 1 ? "s" : ""} found`}
          </span>
        </div>
        {!allPassed && (
          <span className={`text-xs font-bold ${allPassed ? "text-green-600" : "text-amber-600"}`}>
            {expanded ? "Hide" : "Show"} details
          </span>
        )}
      </button>

      {!allPassed && expanded && (
        <div className="border-t border-amber-200 px-4 py-3 flex flex-col gap-2 max-h-48 overflow-y-auto">
          {failures.map((f, i) => (
            <div key={i} className="text-xs text-amber-900">
              <span className="font-bold">Run #{f.index + 1}:</span>{" "}
              {f.issues.join(" · ")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
