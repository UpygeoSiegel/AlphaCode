"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getPublishedTopics } from "@/services/topicsService";
import { getAllTemplates } from "@/services/templatesService";
import { groupTopics, LEGACY_ID } from "@/lib/curriculumGrouping";
import { LEVEL_LABEL } from "@/components/shared/TopicPath";
import type { Topic, Template, Level } from "@/types";

interface TopicBrowserProps {
  selectedTopicId: string | null;
  selectedLevel: Level | null;
  onSelectTopic: (topic: Topic) => void;
  onSelectLevel: (level: Level) => void;
}

const LEVELS: Level[] = [1, 2, 3];

export default function TopicBrowser({
  selectedTopicId,
  selectedLevel,
  onSelectTopic,
  onSelectLevel,
}: TopicBrowserProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [openUnits, setOpenUnits] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const [topicData, templateData] = await Promise.all([getPublishedTopics(), getAllTemplates()]);
        setTopics(topicData);
        setTemplates(templateData);
        // Open the first unit so the page is not a wall of closed rows
        const first = groupTopics(topicData)[0]?.units[0];
        if (first) setOpenUnits(new Set([first.id]));
      } catch (err) {
        console.error("Error loading topics:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const courses = useMemo(() => groupTopics(topics), [topics]);

  /** templatesByTopic[topicId][levelIndex] = count */
  const levelCounts = useMemo(() => {
    const map: Record<string, [number, number, number]> = {};
    for (const t of templates) {
      const counts = (map[t.topicId] ??= [0, 0, 0]);
      if (t.level >= 1 && t.level <= 3) counts[t.level - 1] += 1;
    }
    return map;
  }, [templates]);

  const toggleUnit = (id: string) => {
    const next = new Set(openUnits);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenUnits(next);
  };

  if (loading) return <div className="py-8 text-center text-gray-400">Loading topics...</div>;

  if (topics.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400 border-2 border-dashed rounded-xl">
        No published topics available yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {courses.map((course) => (
        <section key={course.id} className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
            <h3 className={`font-bold ${course.id === LEGACY_ID ? "text-gray-500" : "text-gray-900"}`}>
              {course.name}
            </h3>
            <span className="text-xs text-gray-400">
              {course.units.reduce((n, u) => n + u.topics.length, 0)} topics
            </span>
          </div>

          <div className="divide-y">
            {course.units.map((unit) => {
              const open = openUnits.has(unit.id) || unit.topics.some((t) => t.id === selectedTopicId);
              return (
                <div key={unit.id}>
                  <button
                    type="button"
                    onClick={() => toggleUnit(unit.id)}
                    className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-3 font-semibold text-gray-800">
                      <span
                        className={`inline-block text-gray-400 text-xs transition-transform ${open ? "rotate-90" : ""}`}
                        aria-hidden
                      >
                        ▶
                      </span>
                      {unit.name}
                    </span>
                    <span className="text-xs text-gray-400">{unit.topics.length} topics</span>
                  </button>

                  {open && (
                    <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {unit.topics.map((topic) => {
                        const selected = selectedTopicId === topic.id;
                        const counts = levelCounts[topic.id] ?? [0, 0, 0];
                        return (
                          <div key={topic.id} className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => onSelectTopic(topic)}
                              className={`text-left p-4 rounded-xl border-2 transition-all h-full ${
                                selected
                                  ? "border-indigo-600 bg-indigo-50 shadow-md ring-1 ring-indigo-600"
                                  : "border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm"
                              }`}
                            >
                              <h4 className={`font-bold text-sm mb-1 ${selected ? "text-indigo-900" : "text-gray-900"}`}>
                                {topic.name}
                              </h4>
                              <p className="text-xs text-gray-500 line-clamp-2">{topic.description}</p>
                              <div className="mt-3 flex items-center gap-1">
                                {LEVELS.map((lvl, i) => (
                                  <span
                                    key={lvl}
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                      counts[i] > 0
                                        ? "bg-white border-indigo-200 text-indigo-700"
                                        : "bg-gray-50 border-gray-200 text-gray-300"
                                    }`}
                                    title={
                                      counts[i] > 0
                                        ? `${counts[i]} template${counts[i] === 1 ? "" : "s"} at ${LEVEL_LABEL[lvl]}`
                                        : `No ${LEVEL_LABEL[lvl]} templates yet`
                                    }
                                  >
                                    {["I", "II", "III"][i]}
                                  </span>
                                ))}
                              </div>
                            </button>

                            {/* Level picker appears under the selected tile */}
                            {selected && (
                              <div className="mt-2 flex gap-2">
                                {LEVELS.map((lvl, i) => {
                                  const available = counts[i] > 0;
                                  const active = selectedLevel === lvl;
                                  return (
                                    <button
                                      key={lvl}
                                      type="button"
                                      disabled={!available}
                                      onClick={() => onSelectLevel(lvl)}
                                      className={`flex-1 text-xs font-bold py-2 rounded-lg border transition-all ${
                                        active
                                          ? "bg-indigo-600 border-indigo-600 text-white shadow"
                                          : available
                                          ? "bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                          : "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                                      }`}
                                      title={
                                        available
                                          ? topic.levelDescriptions?.[i] ?? LEVEL_LABEL[lvl]
                                          : `No ${LEVEL_LABEL[lvl]} questions yet`
                                      }
                                    >
                                      {LEVEL_LABEL[lvl]}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            {selected && selectedLevel && topic.levelDescriptions && (
                              <p className="mt-1.5 text-[11px] text-gray-500 italic">
                                {topic.levelDescriptions[selectedLevel - 1]}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
