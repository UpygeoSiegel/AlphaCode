"use client";

import React, { useState, useEffect } from "react";
import { getPublishedTopics } from "@/services/topicsService";
import type { Topic } from "@/types";

interface TopicBrowserProps {
  selectedTopicId: string | null;
  onSelect: (topicId: string) => void;
}

export default function TopicBrowser({ selectedTopicId, onSelect }: TopicBrowserProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTopics() {
      try {
        const data = await getPublishedTopics();
        setTopics(data);
      } catch (err) {
        console.error("Error loading topics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTopics();
  }, []);

  if (loading) return <div className="py-8 text-center text-gray-400">Loading topics...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {topics.length === 0 ? (
        <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed rounded-xl">
          No published topics available.
        </div>
      ) : (
        topics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => onSelect(topic.id)}
            className={`text-left p-6 rounded-2xl border-2 transition-all ${
              selectedTopicId === topic.id
                ? "border-indigo-600 bg-indigo-50 shadow-md ring-1 ring-indigo-600"
                : "border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm"
            }`}
          >
            <h4 className={`font-bold mb-1 ${selectedTopicId === topic.id ? "text-indigo-900" : "text-gray-900"}`}>
              {topic.name}
            </h4>
            <p className="text-xs text-gray-500 line-clamp-2">{topic.description}</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {topic.templateIds?.length || 0} Skills
              </span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
