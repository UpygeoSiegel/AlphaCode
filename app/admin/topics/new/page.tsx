"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createTopic, updateTopic } from "@/services/topicsService";
import { createTemplate } from "@/services/templatesService";
import TemplateSandbox from "@/components/admin/TemplateSandbox";
import Link from "next/link";

const DEFAULT_CODE = `export default {
  id: "new-topic",
  name: "New Topic",

  generate() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const answer = a + b;

    return {
      prompt: \`What is \${a} + \${b}?\`,
      promptType: "text",
      answer: String(answer),
      distractors: [String(answer + 1), String(answer - 1), String(answer + 2)],
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

export default function NewTopicPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure only admins can access this page
  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && role && role !== "admin") router.push(`/${role}`);
  }, [user, role, authLoading, router]);

  async function handleSave() {
    if (!name.trim()) {
      setError("Please enter a name for the topic before saving.");
      return;
    }
    if (!user) {
      setError("You must be logged in to save a topic.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const topicId = await createTopic({
        name: name.trim(),
        description: description.trim(),
        tier: "official",
        createdBy: user.uid,
        published: false,
        templateId: "",
        bankSize: 125,
      });

      const templateId = await createTemplate({
        topicId,
        name: name.trim(),
        description: description.trim(),
        code,
        createdBy: user.uid,
        tier: "official",
      });

      await updateTopic(topicId, { templateId });

      router.push("/admin");
    } catch (err) {
      console.error(err);
      setError("Failed to save. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (authLoading) return <div className="p-12 text-center text-gray-400 font-bold">Checking authorization...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <Link href="/admin" className="text-indigo-600 hover:underline text-sm font-medium">
          &larr; Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Create New Topic</h1>
        <p className="text-gray-500">Name your topic, then write the question generation code.</p>
      </header>

      <div className="bg-white border rounded-xl p-6 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Topic Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Binary to Decimal"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What concept does this topic cover?"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium">
          {error}
        </div>
      )}

      <TemplateSandbox
        code={code}
        onChange={setCode}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md active:scale-95"
        >
          {isSaving ? "Saving…" : "Save Topic"}
        </button>
      </div>
    </div>
  );
}
