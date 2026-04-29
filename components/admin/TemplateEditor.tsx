"use client";

import React from "react";
import Editor from "@monaco-editor/react";

interface TemplateEditorProps {
  code: string;
  onChange: (value: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export default function TemplateEditor({ code, onChange, onSave, isSaving }: TemplateEditorProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-280px)] border rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-50 border-b px-4 py-2 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600">template.js</span>
        <button 
          className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Template"}
        </button>
      </div>
      <div className="flex-grow">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-light"
          value={code}
          onChange={(value) => onChange(value || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
