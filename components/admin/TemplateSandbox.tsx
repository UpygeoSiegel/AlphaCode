"use client";

import React, { useState, useEffect } from "react";
import TemplateEditor from "./TemplateEditor";
import PreviewPanel from "./PreviewPanel";
import { getTopics } from "@/services/topicsService";
import { createTemplate, updateTemplate } from "@/services/templatesService";
import { useAuth } from "@/hooks/useAuth";
import type { Topic, Template } from "@/types";
import { useRouter } from "next/navigation";

const DEFAULT_CODE = `// New Question Template
export default {
  id: "new-template",
  name: "New Template",

  generate() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const answer = a + b;
    
    return {
      prompt: \`What is \${a} + \${b}?\`,
      promptType: "text",
      answer: String(answer),
      distractors: [
        String(answer + 1),
        String(answer - 1),
        String(answer + 2)
      ],
      type: "multiple-choice",
      meta: { a, b, answer }
    };
  },

  explain(question) {
    const { a, b, answer } = question.meta;
    return {
      steps: [
        \`Identify the two numbers: \${a} and \${b}\`,
        \`Add them together: \${a} + \${b} = \${answer}\`
      ],
      summary: \`The sum of \${a} and \${b} is \${answer}.\`
    };
  }
};`;

interface TemplateSandboxProps {
  initialTemplate?: Template;
}

export default function TemplateSandbox({ initialTemplate }: TemplateSandboxProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState(initialTemplate?.code || DEFAULT_CODE);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState(initialTemplate?.topicId || "");
  const [templateName, setTemplateName] = useState(initialTemplate?.name || "New Template");
  const [templateDesc, setTemplateDesc] = useState(initialTemplate?.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    async function loadTopics() {
      const data = await getTopics();
      setTopics(data);
      if (!initialTemplate && data.length > 0) setSelectedTopicId(data[0].id);
    }
    loadTopics();
  }, [initialTemplate]);

  const handleSave = async () => {
    if (!user) return;
    if (!selectedTopicId) {
      setMessage({ type: 'error', text: 'Please select or create a topic first.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      if (initialTemplate) {
        // Update existing
        await updateTemplate(initialTemplate.id, {
          name: templateName,
          description: templateDesc,
          topicId: selectedTopicId,
          code: code,
        });
        setMessage({ type: 'success', text: 'Template updated successfully!' });
      } else {
        // Create new
        await createTemplate({
          name: templateName,
          description: templateDesc,
          topicId: selectedTopicId,
          code: code,
          createdBy: user.uid,
          tier: "official",
        });
        setMessage({ type: 'success', text: 'Template created successfully!' });
      }
      
      setTimeout(() => router.push('/admin'), 1500);
    } catch (err) {
      console.error("Save error:", err);
      setMessage({ type: 'error', text: 'Failed to save template.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Metadata Bar */}
      <div className="bg-white border rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Template Name</label>
          <input 
            type="text" 
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="e.g. Binary to Decimal"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Topic</label>
          <select 
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            {topics.length === 0 && <option value="">No topics available</option>}
            {topics.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <input 
            type="text" 
            value={templateDesc}
            onChange={(e) => setTemplateDesc(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="What does this template test?"
          />
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Editor */}
        <div className="sticky top-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
            Write Code
          </h2>
          <TemplateEditor 
            code={code} 
            onChange={setCode} 
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>

        {/* Right: Preview Panel */}
        <div className="min-h-[calc(100vh-200px)]">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
            Live Preview
          </h2>
          <PreviewPanel code={code} />
        </div>
      </div>
    </div>
  );
}
