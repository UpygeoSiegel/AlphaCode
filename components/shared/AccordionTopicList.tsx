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
  /** Admin-only row actions */
  adminActions?: AdminActions;
  /** Teacher assignment-creation: currently selected topic IDs */
  selectedTopicIds?: string[];
  /** Teacher assignment-creation: toggle a topic on/off */
  onToggle?: (topicId: string) => void;
}

export default function AccordionTopicList({
  topics,
  mode,
  adminActions,
  selectedTopicIds = [],
  onToggle,
}: AccordionTopicListProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  function toggle(categoryId: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  // Group topics by cspCategory, preserving CSP_CATEGORIES order
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
      <div className="py-12 text-center text-gray-400 border-2 border-dashed rounded-2xl">
        No topics available.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {grouped.map(({ category, id, topics: groupTopics }) => {
        const isOpen = openCategories.has(id);
        const color = category?.color;
        const selectedCount = groupTopics.filter((t) =>
          selectedTopicIds.includes(t.id)
        ).length;

        return (
          <div
            key={id}
            className={`rounded-2xl border-2 overflow-hidden transition-all ${
              color ? color.border : "border-gray-200"
            }`}
          >
            {/* Category Header */}
            <button
              type="button"
              onClick={() => toggle(id)}
              className={`w-full flex items-center justify-between px-6 py-4 transition-colors ${
                color ? color.headerBg : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p
                    className={`font-black text-base leading-tight ${
                      color ? color.text : "text-gray-600"
                    }`}
                  >
                    {category ? category.label : "Uncategorized"}
                  </p>
                  {category && (
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {mode === "teacher" && selectedCount > 0 && (
                  <span className="text-xs font-black bg-indigo-600 text-white px-2.5 py-1 rounded-full">
                    {selectedCount} selected
                  </span>
                )}
                <span className="text-xs font-bold text-gray-400">
                  {groupTopics.length} module{groupTopics.length !== 1 ? "s" : ""}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </button>

            {/* Topic Rows */}
            {isOpen && (
              <div className="divide-y divide-gray-100 bg-white">
                {groupTopics.map((topic) => (
                  <TopicRow
                    key={topic.id}
                    topic={topic}
                    mode={mode}
                    adminActions={adminActions}
                    isSelected={selectedTopicIds.includes(topic.id)}
                    onToggle={onToggle}
                    accentColor={color}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface TopicRowProps {
  topic: Topic;
  mode: "admin" | "teacher";
  adminActions?: AdminActions;
  isSelected: boolean;
  onToggle?: (topicId: string) => void;
  accentColor: CspCategory["color"] | undefined;
}

function TopicRow({ topic, mode, adminActions, isSelected, onToggle, accentColor }: TopicRowProps) {
  return (
    <div
      className={`flex items-center justify-between px-6 py-4 gap-4 transition-colors ${
        isSelected ? "bg-indigo-50" : "hover:bg-gray-50"
      }`}
    >
      {/* Left: checkbox (teacher) + name + description */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {mode === "teacher" && onToggle && (
          <button
            type="button"
            onClick={() => onToggle(topic.id)}
            className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              isSelected
                ? "bg-indigo-600 border-indigo-600"
                : "border-gray-300 hover:border-indigo-400"
            }`}
            aria-label={isSelected ? "Deselect" : "Select"}
          >
            {isSelected && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        )}
        <div className="min-w-0">
          <p className="font-bold text-sm text-gray-900 truncate">{topic.name}</p>
          {topic.description && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{topic.description}</p>
          )}
        </div>
      </div>

      {/* Right: status badge + actions */}
      <div className="flex items-center gap-2 shrink-0">
        {mode === "admin" && (
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
              topic.published
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {topic.published ? "Live" : "Draft"}
          </span>
        )}

        {mode === "teacher" && (
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
              accentColor
                ? `${accentColor.badge} ${accentColor.badgeText}`
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {topic.tier}
          </span>
        )}

        <Link
          href={`/admin/topics/${topic.id}/preview`}
          target="_blank"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          Preview
        </Link>

        {mode === "admin" && adminActions && (
          <>
            <Link
              href={`/admin/topics/${topic.id}/edit`}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => adminActions.onTogglePublish(topic.id, topic.published)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                topic.published
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              {topic.published ? "Unpublish" : "Approve"}
            </button>
            <button
              type="button"
              onClick={() => adminActions.onDelete(topic.id, topic.templateId, topic.name)}
              className="text-[10px] font-bold text-red-400 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </>
        )}

        {mode === "teacher" && onToggle && (
          <button
            type="button"
            onClick={() => onToggle(topic.id)}
            className={`text-xs font-black px-3 py-1.5 rounded-lg transition-colors ${
              isSelected
                ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {isSelected ? "Remove" : "Add"}
          </button>
        )}
      </div>
    </div>
  );
}
