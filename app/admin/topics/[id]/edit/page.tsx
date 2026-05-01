"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTopic, updateTopic } from "@/services/topicsService";
import { getTemplate, updateTemplate } from "@/services/templatesService";
import TemplateSandbox from "@/components/admin/TemplateSandbox";
import { CSP_CATEGORIES } from "@/lib/cspCategories";
import Link from "next/link";

export default function EditTopicPage() {
  const { id } = useParams();
  const router = useRouter();
  const topicId = Array.isArray(id) ? id[0] : id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cspCategory, setCspCategory] = useState("");
  const [code, setCode] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const topic = await getTopic(topicId);
        if (!topic) { router.push("/admin"); return; }
        setName(topic.name);
        setDescription(topic.description);
        setCspCategory(topic.cspCategory ?? "");
        if (topic.templateId) {
          setTemplateId(topic.templateId);
          const tmpl = await getTemplate(topic.templateId);
          if (tmpl) setCode(tmpl.code);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load topic.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [topicId, router]);

  async function handleSave() {
    if (!name.trim()) { setError("Topic name is required."); return; }
    setIsSaving(true);
    setError(null);
    try {
      await updateTopic(topicId, {
        name: name.trim(),
        description: description.trim(),
        ...(cspCategory ? { cspCategory } : { cspCategory: undefined }),
      });
      if (templateId) {
        await updateTemplate(templateId, { name: name.trim(), description: description.trim(), code });
      }
      router.push("/admin");
    } catch (err) {
      console.error(err);
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <Link href="/admin" className="text-indigo-600 hover:underline text-sm font-medium">
          &larr; Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Edit Topic</h1>
        <p className="text-gray-500">Update the topic details and question generation code.</p>
      </header>

      <div className="bg-white border rounded-xl p-6 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Topic Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Big Idea 3 Topic</label>
          <select
            value={cspCategory}
            onChange={(e) => setCspCategory(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="">— Select a topic —</option>
            {CSP_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium">
          {error}
        </div>
      )}

      {code && (
        <TemplateSandbox
          code={code}
          onChange={setCode}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md active:scale-95"
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
