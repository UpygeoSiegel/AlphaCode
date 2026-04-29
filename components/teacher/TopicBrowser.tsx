"use client";

import React, { useState, useEffect } from "react";
import { getPublishedTopics } from "@/services/topicsService";
import type { Topic } from "@/types";

interface TopicBrowserProps {
  selectedTopicIds: string[]; // Changed from selectedTopicId: string | null
  onToggle: (topicId: string) => void; // Changed from onSelect
  multiSelect?: boolean;
}

export default function TopicBrowser({ selectedTopicIds, onToggle, multiSelect = true }: TopicBrowserProps) {
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
        topics.map((topic) => {
          const isSelected = selectedTopicIds.includes(topic.id);
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onToggle(topic.id)}
              className={`text-left p-6 rounded-2xl border-2 transition-all relative ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50 shadow-md ring-1 ring-indigo-600"
                  : "border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm"
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <h4 className={`font-bold mb-1 pr-6 ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                {topic.name}
              </h4>
              <p className="text-xs text-gray-500 line-clamp-2">{topic.description}</p>
            </button>
          );
        })
      )}
    </div>
  );
}
