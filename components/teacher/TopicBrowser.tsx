"use client";

import React, { useState, useEffect } from "react";
import { getPublishedTopics } from "@/services/topicsService";
import AccordionTopicList from "@/components/shared/AccordionTopicList";
import type { Topic } from "@/types";

interface TopicBrowserProps {
  selectedTopicIds: string[];
  onToggle: (topicId: string) => void;
}

export default function TopicBrowser({ selectedTopicIds, onToggle }: TopicBrowserProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublishedTopics()
      .then(setTopics)
      .catch((err) => console.error("Error loading topics:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center text-gray-400">Loading topics...</div>;

  return (
    <AccordionTopicList
      topics={topics}
      mode="teacher"
      selectedTopicIds={selectedTopicIds}
      onToggle={onToggle}
    />
  );
}
