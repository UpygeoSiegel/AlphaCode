"use client";

import React from "react";
import TemplateEditor from "./TemplateEditor";
import PreviewPanel from "./PreviewPanel";

interface TemplateSandboxProps {
  code: string;
  onChange: (code: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function TemplateSandbox({ code, onChange, onSave, isSaving }: TemplateSandboxProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="sticky top-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
          Write Code
        </h2>
        <TemplateEditor
          code={code}
          onChange={onChange}
          onSave={onSave}
          isSaving={isSaving}
        />
      </div>
      <div className="min-h-[calc(100vh-200px)]">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
          Live Preview
        </h2>
        <PreviewPanel code={code} />
      </div>
    </div>
  );
}
