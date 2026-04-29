"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTopic, updateTopic } from "@/services/topicsService";
import { getTemplatesByTopic } from "@/services/templatesService";
import type { Topic, Template } from "@/types";
import Link from "next/link";

export default function TopicSkillsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const topicId = id as string;
        const [topicData, templatesData] = await Promise.all([
          getTopic(topicId),
          getTemplatesByTopic(topicId)
        ]);

        if (topicData) {
          setTopic(topicData);
          
          // Initialize weights: use existing if they match current templates, otherwise distribute evenly
          const initialWeights: Record<string, number> = {};
          const currentWeights = topicData.weights || {};
          
          if (templatesData.length > 0) {
            const evenWeight = parseFloat((1 / templatesData.length).toFixed(2));
            templatesData.forEach((t, i) => {
              // If we have an existing weight for this template, use it, otherwise use even distribution
              // But only if current weights add up to something meaningful
              initialWeights[t.id] = currentWeights[t.id] !== undefined 
                ? currentWeights[t.id] 
                : (i === templatesData.length - 1 
                    ? parseFloat((1 - (evenWeight * (templatesData.length - 1))).toFixed(2)) 
                    : evenWeight);
            });
          }
          setWeights(initialWeights);
          setTemplates(templatesData);
        }
      } catch (err) {
        console.error("Error loading skills:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const isValid = Math.abs(totalWeight - 1) < 0.001; // Allow for tiny floating point errors

  const handleWeightChange = (templateId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setWeights(prev => ({
      ...prev,
      [templateId]: numValue
    }));
  };

  const handleSave = async () => {
    if (!topic || !isValid) return;
    setIsSaving(true);
    try {
      await updateTopic(topic.id, {
        weights,
        templateIds: templates.map(t => t.id)
      });
      router.push("/admin");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save weights.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading skills...</div>;
  if (!topic) return <div className="p-8 text-center text-red-600">Topic not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <Link href="/admin" className="text-indigo-600 hover:underline text-sm font-medium">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{topic.name}</h1>
          <p className="text-gray-500">Assign weights to each skill. Total must equal 1.0 (100%)</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !isValid || templates.length === 0}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-md transition-all active:scale-95"
        >
          {isSaving ? "Saving..." : "Save Weights"}
        </button>
      </header>

      <div className="max-w-4xl">
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Skill Name</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Ratio (0.0 - 1.0)</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Preview Count</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                    No skills added to this topic yet. Go to the Sandbox to create templates for this topic.
                  </td>
                </tr>
              ) : (
                templates.map(tmpl => (
                  <tr key={tmpl.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{tmpl.name}</div>
                      <div className="text-xs text-gray-400 truncate max-w-xs">{tmpl.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          step="0.05"
                          min="0"
                          max="1"
                          value={weights[tmpl.id] || 0}
                          onChange={(e) => handleWeightChange(tmpl.id, e.target.value)}
                          className="w-24 border rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <span className="text-xs text-gray-400">({Math.round((weights[tmpl.id] || 0) * 100)}%)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-mono text-gray-600">
                        {Math.round((weights[tmpl.id] || 0) * topic.bankSize)} questions
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-indigo-50/50">
              <tr>
                <td className="px-6 py-4 font-bold text-gray-900">Total Weight</td>
                <td className="px-6 py-4">
                  <div className={`text-lg font-black ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {totalWeight.toFixed(2)} / 1.00
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {!isValid && (
                    <span className="text-xs font-bold text-red-500 uppercase">Must equal 1.00</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
