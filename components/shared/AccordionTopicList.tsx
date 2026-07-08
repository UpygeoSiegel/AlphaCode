"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Topic } from "@/types";
import {
  CSP_CATEGORIES,
  CSP_CATEGORY_MAP,
  UNCATEGORIZED_ID,
  type CspCategory,
} from "@/lib/cspCategories";

interface AdminActions {
  onTogglePublish: (topicId: string, current: boolean) => void;
  onDelete: (topicId: string, templateId: string, name: string) => void;
}

interface AccordionTopicListProps {
  topics: Topic[];
  mode: "admin" | "teacher";
  adminActions?: AdminActions;
  selectedTopicIds?: string[];
  onToggle?: (topicId: string) => void;
  forceOpen?: boolean;
}

export default function AccordionTopicList({
  topics,
  mode,
  adminActions,
  selectedTopicIds = [],
  onToggle,
  forceOpen = false,
}: AccordionTopicListProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  function toggle(categoryId: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  const grouped: { category: CspCategory | null; id: string; topics: Topic[] }[] =
    CSP_CATEGORIES.map((cat) => ({
      category: cat,
      id: cat.id,
      topics: topics.filter((t) => t.cspCategory === cat.id),
    })).filter((g) => g.topics.length > 0);

  const uncategorized = topics.filter(
    (t) => !t.cspCategory || !CSP_CATEGORY_MAP[t.cspCategory]
  );
  if (uncategorized.length > 0) {
    grouped.push({ category: null, id: UNCATEGORIZED_ID, topics: uncategorized });
  }

  if (grouped.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400 border border-dashed border-dm-border rounded">
        No skills available.
      </div>
    );
  }

  const menuTopic = openMenuId ? topics.find((t) => t.id === openMenuId) : null;

  return (
    <>
      <div className="flex flex-col gap-2">
        {grouped.map(({ category, id, topics: groupTopics }) => {
          const isOpen = forceOpen || openCategories.has(id);
          const selectedCount = groupTopics.filter((t) => selectedTopicIds.includes(t.id)).length;

          return (
            <div key={id} className="rounded border border-dm-border overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggle(id)}
                className="w-full flex items-center justify-between px-4 py-3 transition-colors bg-white hover:bg-dm-bg"
              >
                <div className="text-left">
                  <p className="font-semibold text-sm leading-tight text-dm-navy">
                    {category ? category.label : "Uncategorized"}
                  </p>
                  {category && (
                    <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {mode === "teacher" && selectedCount > 0 && (
                    <span className="text-xs font-bold bg-dm-blue text-white px-2.5 py-0.5 rounded-full">
                      {selectedCount} selected
                    </span>
                  )}
                  <span className="text-xs font-semibold text-gray-400">
                    {groupTopics.length} skill{groupTopics.length !== 1 ? "s" : ""}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="divide-y divide-gray-100 bg-white">
                  {groupTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className={`flex items-center justify-between px-4 py-3 gap-4 transition-colors ${
                        selectedTopicIds.includes(topic.id) ? "bg-dm-blue-light" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {mode === "teacher" && onToggle && (
                          <button
                            type="button"
                            onClick={() => onToggle(topic.id)}
                            className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              selectedTopicIds.includes(topic.id)
                                ? "bg-dm-blue border-dm-blue"
                                : "border-gray-300 hover:border-dm-blue"
                            }`}
                            aria-label={selectedTopicIds.includes(topic.id) ? "Deselect" : "Select"}
                          >
                            {selectedTopicIds.includes(topic.id) && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">{topic.name}</p>
                          {topic.description && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{topic.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {mode === "admin" && (
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            topic.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {topic.published ? "Live" : "Draft"}
                          </span>
                        )}

                        {mode === "admin" && (
                          <Link
                            href={`/admin/topics/${encodeURIComponent(topic.id)}/edit`}
                            className="text-xs font-bold text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            Edit
                          </Link>
                        )}

                        {mode === "admin" && adminActions && (
                          <button
                            type="button"
                            onClick={(e) => {
                              if (openMenuId === topic.id) {
                                setOpenMenuId(null);
                                setMenuPos(null);
                              } else {
                                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                setOpenMenuId(topic.id);
                              }
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-lg leading-none"
                          >
                            ···
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dropdown portal */}
      {openMenuId && menuPos && menuTopic && adminActions && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpenMenuId(null); setMenuPos(null); }} />
          <div
            className="fixed z-50 bg-white border border-dm-border rounded-xl shadow-card-hover w-36 overflow-hidden"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button
              type="button"
              onClick={() => { adminActions.onTogglePublish(menuTopic.id, menuTopic.published); setOpenMenuId(null); setMenuPos(null); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-dm-bg transition-colors"
            >
              {menuTopic.published ? "Unpublish" : "Approve"}
            </button>
            <button
              type="button"
              onClick={() => { adminActions.onDelete(menuTopic.id, menuTopic.templateId, menuTopic.name); setOpenMenuId(null); setMenuPos(null); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </>
  );
}
