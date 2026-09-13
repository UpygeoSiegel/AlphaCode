"use client";

import React, { useEffect, useState, useRef } from "react";
import type { Question } from "@/types";
import CodeRenderer from "../shared/CodeRenderer";

interface PreviewPanelProps {
  code: string;
}

export default function PreviewPanel({ code }: PreviewPanelProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Create a new worker for each significant code change
    const workerCode = `
      self.onmessage = function(e) {
        try {
          const userCode = e.data;
          // Transform ESM export to something we can use
          const transformedCode = userCode.replace(/export default/, 'const template =') + '; return template;';
          const template = new Function(transformedCode)();
          
          const results = [];
          for (let i = 0; i < 5; i++) {
            const q = template.generate();
            const exp = template.explain(q);
            results.push({ ...q, explanation: exp, index: i });
          }
          self.postMessage({ type: 'SUCCESS', questions: results });
        } catch (err) {
          self.postMessage({ type: 'ERROR', message: err.message });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    workerRef.current = new Worker(URL.createObjectURL(blob));

    workerRef.current.onmessage = (e) => {
      if (e.data.type === "SUCCESS") {
        setQuestions(e.data.questions);
        setError(null);
      } else {
        setError(e.data.message);
      }
      setLoading(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const runPreview = () => {
    setLoading(true);
    workerRef.current?.postMessage(code);
  };

  // Run preview on initial mount and when requested
  useEffect(() => {
    const timer = setTimeout(runPreview, 500); // Debounce
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
          {loading ? "Generating..." : "Regenerate Preview"}
        </button>
      </div>

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
                    className={`p-3 border rounded-lg text-sm ${choice === q.answer ? 'border-green-200 bg-green-50 text-green-800 font-medium' : 'border-gray-200 text-gray-600'}`}
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
