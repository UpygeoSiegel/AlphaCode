"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getPublishedTopics } from "@/services/topicsService";
import { getQuestionBank } from "@/services/questionBankService";
import type { Topic, Question } from "@/types";
import AppShell from "@/components/shared/AppShell";
import QuestionCard from "@/components/shared/QuestionCard";
import {
  CSP_CATEGORIES,
  CSP_CATEGORY_MAP,
  type CspCategory,
} from "@/lib/cspCategories";

export default function TeacherDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [previewTopic, setPreviewTopic] = useState<Topic | null>(null);
  const [previewBank, setPreviewBank] = useState<Question[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);

  const previewQuestion = previewBank[previewIndex] ?? null;

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && role && role !== "teacher") router.push(`/${role}`);
  }, [user, role, authLoading, router]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const data = await getPublishedTopics();
        setTopics(data);
      } catch (err) {
        console.error("Error loading topics:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
    );
  }, [topics, search]);

  const grouped = useMemo(() => {
    const groups: { category: CspCategory | null; topics: Topic[] }[] =
      CSP_CATEGORIES.map((cat) => ({
        category: cat,
        topics: filtered.filter((t) => t.cspCategory === cat.id),
      })).filter((g) => g.topics.length > 0);
    const uncategorized = filtered.filter(
      (t) => !t.cspCategory || !CSP_CATEGORY_MAP[t.cspCategory]
    );
    if (uncategorized.length > 0) {
      groups.push({ category: null, topics: uncategorized });
    }
    return groups;
  }, [filtered]);

  // Auto-expand all categories when searching
  useEffect(() => {
    if (search.trim()) {
      setExpandedCategories(new Set(grouped.map((g) => g.category?.id || "uncategorized")));
    }
  }, [search, grouped]);

  function toggleCategory(id: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function openPreview(topic: Topic) {
    setPreviewTopic(topic);
    setPreviewLoading(true);
    setPreviewBank([]);
    setPreviewIndex(0);
    try {
      const bank = await getQuestionBank(topic.id);
      setPreviewBank(bank);
      setPreviewIndex(0);
    } catch (err) {
      console.error("Error loading preview:", err);
    } finally {
      setPreviewLoading(false);
    }
  }

  function nextPreviewQuestion() {
    setPreviewIndex((i) => Math.min(i + 1, previewBank.length - 1));
  }

  function prevPreviewQuestion() {
    setPreviewIndex((i) => Math.max(i - 1, 0));
  }

  function closePreview() {
    setPreviewTopic(null);
    setPreviewBank([]);
    setPreviewIndex(0);
  }

  if (authLoading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <AppShell
      role="teacher"
      userEmail={user?.email}
      title="AP CSP Skills"
      headerActions={
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search skills..."
          className="w-64 border border-dm-border rounded-lg px-3 py-1.5 text-sm focus:border-dm-blue focus:ring-2 focus:ring-dm-blue/20 outline-none"
        />
      }
    >
      <p className="text-sm text-gray-500 mb-5">
        Click a category to expand it, then click any skill to preview a sample problem. You can also{" "}
        <Link href="/teacher/assignments/new" className="text-dm-blue font-semibold hover:underline">
          create an assignment
        </Link>
        {" "}directly.
      </p>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading skills...</div>
      ) : grouped.length === 0 ? (
        <div className="bg-white border border-dm-border rounded-2xl p-12 text-center text-gray-400">
          {topics.length === 0
            ? "No skills have been published yet."
            : "No skills match your search."}
        </div>
      ) : (
        <div className="space-y-2">
          {grouped.map(({ category, topics: groupTopics }) => {
            const catId = category?.id || "uncategorized";
            const isOpen = expandedCategories.has(catId);
            return (
              <div
                key={catId}
                className="bg-white border border-dm-border rounded-2xl overflow-hidden shadow-card"
              >
                {/* Category header — click to expand */}
                <button
                  onClick={() => toggleCategory(catId)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-dm-bg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-bold text-sm text-dm-navy">
                        {category ? category.label : "Other Skills"}
                      </span>
                      {category && (
                        <span className="ml-2 text-xs text-gray-400">{category.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {groupTopics.length} skill{groupTopics.length !== 1 ? "s" : ""}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Skills list — shown when expanded */}
                {isOpen && (
                  <div className="border-t border-dm-border divide-y divide-gray-50">
                    {groupTopics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => openPreview(topic)}
                        className="w-full text-left px-6 py-3 flex items-center justify-between hover:bg-dm-blue-light transition-colors group"
                      >
                        <div>
                          <span className="text-sm text-dm-blue font-semibold group-hover:underline">
                            {topic.name}
                          </span>
                          {topic.description && (
                            <span className="block text-xs text-gray-400 mt-0.5">
                              {topic.description}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-300 group-hover:text-dm-blue shrink-0 ml-4">
                          Preview →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Skill Preview Modal */}
      {previewTopic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-dm-border flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-dm-navy">{previewTopic.name}</h3>
                <p className="text-xs text-gray-500">
                  Sample problem — students receive randomized versions
                </p>
              </div>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 bg-dm-bg">
              {previewLoading ? (
                <div className="py-16 text-gray-400 text-sm">Loading sample problem...</div>
              ) : previewQuestion ? (
                <QuestionCard
                  question={previewQuestion}
                  onNext={nextPreviewQuestion}
                  isLast={previewBank.length <= 1}
                />
              ) : (
                <div className="py-16 text-gray-400 text-sm">
                  No question bank has been generated for this skill yet.
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-dm-border bg-gray-50 flex justify-between items-center rounded-b shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevPreviewQuestion}
                  disabled={previewIndex === 0 || previewBank.length === 0}
                  className="px-3 py-2 text-sm font-semibold text-gray-600 border border-dm-border rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-30"
                >
                  ← Back
                </button>
                <button
                  onClick={nextPreviewQuestion}
                  disabled={previewIndex >= previewBank.length - 1 || previewBank.length === 0}
                  className="px-3 py-2 text-sm font-semibold text-gray-600 border border-dm-border rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={closePreview}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-dm-border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <Link
                  href={`/teacher/assignments/new?topicId=${previewTopic.id}`}
                  className="gradient-brand text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                >
                  Assign This Skill
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
