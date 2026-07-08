"use client";

import React, { useEffect, useState, useRef } from "react";
import type { Question } from "@/types";
import CodeRenderer from "../shared/CodeRenderer";

interface ValidationFailure {
  index: number;
  issues: string[];
  failedData?: Question & { explanation: unknown };
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

    // Type
    if (q.type !== "multiple-choice" && q.type !== "free-response") {
      issues.push("invalid type: " + q.type + ' (expected "multiple-choice" or "free-response")');
    }

    // Distractors
    if (q.type === "multiple-choice") {
      if (!Array.isArray(q.distractors)) {
        issues.push("distractors is not an array");
      } else {
        if (q.distractors.length !== 3) {
          issues.push("expected 3 distractors for multiple-choice, got " + q.distractors.length);
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
    } else if (q.type === "free-response") {
      if (q.distractors && Array.isArray(q.distractors) && q.distractors.length > 0) {
        issues.push("free-response questions should not have distractors");
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
      var seenPrompts = new Map();

      for (var j = 0; j < total; j++) {
        var vq;
        var vexp;
        try {
          vq = template.generate();
        } catch(err) {
          failures.push({ index: j, issues: ["generate() threw: " + err.message] });
          continue;
        }

        var issues = validateQuestion(vq, j);

        // Check for duplicate prompts across all runs
        if (vq.prompt && seenPrompts.has(vq.prompt)) {
          issues.push("Duplicate question detected: this exact prompt was already generated in run #" + (seenPrompts.get(vq.prompt) + 1));
        } else {
          seenPrompts.set(vq.prompt, j);
        }

        try {
          vexp = template.explain(vq);
        } catch(err) {
          failures.push({ index: j, issues: issues.concat(["explain() threw: " + err.message]), failedData: Object.assign({}, vq, { index: j }) });
          continue;
        }
        
        if (issues.length > 0) {
          failures.push({ 
            index: j, 
            issues: issues, 
            failedData: Object.assign({}, vq, { explanation: vexp, index: j }) 
          });
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
  const [_validation, setValidation] = useState<ValidationResult | null>(null);
  const [selectedFailure, setSelectedFailure] = useState<ValidationFailure | null>(null);
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
        setSelectedFailure(null);
        setError(null);
      } else {
        setError(e.data.message);
        setValidation(null);
        setSelectedFailure(null);
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

  const displayQuestions = selectedFailure?.failedData 
    ? [selectedFailure.failedData as Question] 
    : questions;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">
          {selectedFailure ? "Debug View (Failed Question)" : "Live Preview"}
        </h2>
        <div className="flex gap-2">
          {selectedFailure && (
            <button
              onClick={() => setSelectedFailure(null)}
              className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
            >
              Back to Examples
            </button>
          )}
          <button
            onClick={runPreview}
            disabled={loading}
            className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {loading ? "Running…" : "Regenerate"}
          </button>
        </div>
      </div>


      <div className="flex-grow overflow-y-auto pr-2 flex flex-col gap-6 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm font-mono">
            <strong>Error:</strong> {error}
          </div>
        )}

        {displayQuestions.length === 0 && !error && !loading && (
          <div className="bg-white border rounded-lg p-12 text-center text-gray-400">
            Click &quot;Regenerate&quot; to test your code.
          </div>
        )}

        {displayQuestions.map((q, i) => {
          const isFailure = !!selectedFailure;
          const issues = selectedFailure?.issues || [];

          return (
            <div key={i} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${isFailure ? 'ring-2 ring-red-500' : ''}`}>
              <div className={`${isFailure ? 'bg-red-50' : 'bg-gray-50'} px-4 py-2 border-b flex justify-between items-center`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${isFailure ? 'text-red-600' : 'text-gray-400'}`}>
                  {isFailure ? `FAILURE RUN #${selectedFailure.index + 1}` : `Example ${i + 1}`}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                  {q.type}
                </span>
              </div>
              
              {isFailure && (
                <div className="bg-red-100 p-4 border-b border-red-200">
                  <h4 className="text-xs font-black text-red-800 uppercase tracking-widest mb-2">Detected Issues:</h4>
                  <ul className="list-disc list-inside text-sm text-red-700 font-medium">
                    {issues.map((issue, idx) => <li key={idx}>{issue}</li>)}
                  </ul>
                </div>
              )}

              <div className="p-6">
                <div className={`text-lg font-medium mb-6 ${issues.some(iss => iss.includes('prompt')) ? 'text-red-600 underline decoration-wavy' : ''}`}>
                  <CodeRenderer html={q.prompt} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {[q.answer, ...(Array.isArray(q.distractors) ? q.distractors : [])].sort().map((choice, ci) => {
                    const isAnswer = choice === q.answer;
                    const hasIssue = issues.some(iss => 
                      (isAnswer && iss.toLowerCase().includes('answer')) || 
                      (!isAnswer && iss.toLowerCase().includes('distractor')) ||
                      (iss.includes('appears in distractors'))
                    );

                    return (
                      <div
                        key={ci}
                        className={`p-3 border rounded-lg text-sm transition-colors ${
                          isAnswer 
                            ? "border-green-200 bg-green-50 text-green-800 font-medium" 
                            : "border-gray-200 text-gray-600"
                        } ${hasIssue ? 'ring-2 ring-red-400 border-red-400 bg-red-50' : ''}`}
                      >
                        {choice} {isAnswer && "✓"}
                      </div>
                    );
                  })}
                </div>

                <div className={`bg-gray-50 rounded-lg p-4 ${issues.some(iss => iss.includes('explain')) ? 'ring-2 ring-red-400 bg-red-50' : ''}`}>
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Explanation:</h4>
                  {q.explanation ? (
                    <>
                      <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1 mb-3">
                        {q.explanation.steps.map((step: string, si: number) => (
                          <li key={si}>{step}</li>
                        ))}
                      </ol>
                      <p className="text-sm font-medium text-indigo-700 border-t pt-2 mt-2 italic">
                        {q.explanation.summary}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-red-500 italic">No explanation data returned.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function _ValidationBadge({ 
  validation, 
  onSelectFailure, 
  selectedFailureIndex 
}: { 
  validation: ValidationResult; 
  onSelectFailure: (f: ValidationFailure | null) => void;
  selectedFailureIndex?: number;
}) {
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
        <div className="flex items-center gap-2 text-left">
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
        <div className="border-t border-amber-200 px-2 py-2 flex flex-col gap-1 max-h-48 overflow-y-auto bg-amber-50/50">
          {failures.map((f, i) => (
            <button 
              key={i} 
              onClick={() => onSelectFailure(f)}
              className={`text-left px-3 py-2 rounded-lg transition-all border ${
                selectedFailureIndex === f.index 
                  ? 'bg-red-100 border-red-300 shadow-sm' 
                  : 'bg-white border-transparent hover:border-amber-300 hover:bg-white'
              }`}
            >
              <div className="text-xs font-bold text-amber-900 mb-1 flex justify-between">
                <span>Run #{f.index + 1}</span>
                {selectedFailureIndex === f.index && <span className="text-[10px] text-red-600 uppercase tracking-widest font-black italic">Debugging...</span>}
              </div>
              <div className="text-[10px] text-amber-700 leading-relaxed">
                {f.issues.join(" · ")}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
