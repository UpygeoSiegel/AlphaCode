"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTopic, updateTopic } from "@/services/topicsService";
import { getTemplate, updateTemplate } from "@/services/templatesService";
import { writeBatch, doc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TemplateSandbox from "@/components/admin/TemplateSandbox";
import { CSP_CATEGORIES } from "@/lib/cspCategories";
import Link from "next/link";

const BANK_SIZE = 125;

const GENERATOR_SRC = `
  self.onmessage = function(e) {
    try {
      var userCode = e.data;
      var transformedCode = userCode.replace(/export default/, 'var template =') + '; return template;';
      var template = new Function(transformedCode)();
      var questions = [];
      for (var i = 0; i < ${BANK_SIZE}; i++) {
        try {
          var q = template.generate();
          var exp = template.explain(q);
          questions.push(Object.assign({}, q, { explanation: exp, index: i, templateId: "main" }));
        } catch(err) {
          // skip bad questions
        }
      }
      self.postMessage({ type: "SUCCESS", questions: questions });
    } catch(err) {
      self.postMessage({ type: "ERROR", message: err.message });
    }
  };
`;

export default function EditTopicPage() {
  const { id } = useParams();
  const router = useRouter();
  const topicId = decodeURIComponent(Array.isArray(id) ? id[0] : id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cspCategory, setCspCategory] = useState("");
  const [code, setCode] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState<"idle" | "success" | "error">("idle");
  const [generateMessage, setGenerateMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

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
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      console.error(err);
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateBank() {
    if (!code.trim()) {
      setGenerateStatus("error");
      setGenerateMessage("No template code found.");
      return;
    }
    setIsGenerating(true);
    setGenerateStatus("idle");
    setGenerateMessage("");

    const blob = new Blob([GENERATOR_SRC], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;

    worker.onmessage = async (e) => {
      worker.terminate();
      if (e.data.type === "ERROR") {
        setGenerateStatus("error");
        setGenerateMessage("Template error: " + e.data.message);
        setIsGenerating(false);
        return;
      }

      const questions = e.data.questions as object[];
      if (questions.length === 0) {
        setGenerateStatus("error");
        setGenerateMessage("Template generated 0 questions. Check your code.");
        setIsGenerating(false);
        return;
      }

      try {
        const banksCol = collection(db, "questionBanks", topicId, "questions");
        const existing = await getDocs(banksCol);
        if (!existing.empty) {
          const deleteBatch = writeBatch(db);
          existing.docs.forEach((d) => deleteBatch.delete(d.ref));
          await deleteBatch.commit();
        }
        const CHUNK = 400;
        for (let i = 0; i < questions.length; i += CHUNK) {
          const batch = writeBatch(db);
          questions.slice(i, i + CHUNK).forEach((q, offset) => {
            const idx = i + offset;
            batch.set(doc(banksCol, String(idx)), { ...q, index: idx });
          });
          await batch.commit();
        }
        await updateTopic(topicId, { bankGeneratedAt: new Date() as unknown as import("firebase/firestore").Timestamp });
        setGenerateStatus("success");
        setGenerateMessage(`✓ Generated ${questions.length} questions and saved to Firestore.`);
      } catch (err) {
        console.error(err);
        setGenerateStatus("error");
        setGenerateMessage("Failed to write to Firestore. Check your permissions.");
      } finally {
        setIsGenerating(false);
      }
    };

    worker.postMessage(code);
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <Link href="/admin" className="text-indigo-600 hover:underline text-sm font-medium">
            &larr; Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Edit Topic</h1>
          <p className="text-gray-500">Update the topic details and question generation code.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="mt-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md flex items-center gap-2"
        >
          {isSaving ? "Saving…" : saveStatus === "saved" ? "✓ Saved" : "Save"}
        </button>
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

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={handleGenerateBank}
          disabled={isGenerating || !code.trim()}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-md flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating {BANK_SIZE} questions…
            </>
          ) : (
            <>⚡ Generate Question Bank</>
          )}
        </button>
        {generateStatus !== "idle" && (
          <span className={`text-sm font-semibold ${generateStatus === "success" ? "text-emerald-700" : "text-red-600"}`}>
            {generateMessage}
          </span>
        )}
      </div>
    </div>
  );
}
