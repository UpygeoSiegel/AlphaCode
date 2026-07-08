"use client";

import React, { useEffect, useState } from "react";
import Editor, { loader } from "@monaco-editor/react";

// Ensure we use a specific, stable version of Monaco from a reliable CDN
loader.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs"
  }
});

interface TemplateEditorProps {
  code: string;
  onChange: (value: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export default function TemplateEditor({ code, onChange, onSave, isSaving }: TemplateEditorProps) {
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // If it hasn't loaded in 10 seconds, show an error/retry message
    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && !(window as unknown as { monaco?: unknown }).monaco) {
        setLoadError(true);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-[500px] lg:h-[calc(100vh-300px)] border rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-50 border-b px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-2 text-xs font-bold text-gray-400 uppercase tracking-widest">template.js</span>
        </div>
        <button 
          className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-sm active:scale-95"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Template"}
        </button>
      </div>
      <div className="flex-grow relative">
        {loadError ? (
          <div className="h-full w-full flex flex-col items-center justify-center bg-red-50 p-8 text-center">
            <p className="text-red-600 font-bold mb-2">Editor failed to load.</p>
            <p className="text-sm text-red-500 mb-4">This usually happens if the CDN is blocked or your connection is slow.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : (
          <Editor
            height="100%"
            width="100%"
            defaultLanguage="javascript"
            theme="vs-light"
            value={code}
            onChange={(value) => onChange(value || "")}
            loading={
              <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-3">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Loading Developer Tools...</span>
              </div>
            }
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
              lineNumbersMinChars: 3,
              glyphMargin: false,
              folding: true,
              lineDecorationsWidth: 10,
            }}
          />
        )}
      </div>
    </div>
  );
}

