"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Topic, Template, Level } from "@/types";
import { CURRICULUM } from "@/data/curriculum";
import { groupTopics, LEGACY_ID } from "@/lib/curriculumGrouping";

interface CurriculumTreeProps {
  topics: Topic[];
  templatesByTopic: Record<string, Template[]>;
  onTogglePublish: (topicId: string, currentStatus: boolean) => void;
  onDeleteTemplate: (templateId: string, topicId: string, name: string) => void;
}

const LEVELS: Level[] = [1, 2, 3];
const LEVEL_SHORT: Record<Level, string> = { 1: "I", 2: "II", 3: "III" };

function Chevron({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-block text-gray-400 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
      aria-hidden
    >
      ▶
    </span>
  );
}

export default function CurriculumTree({
  topics,
  templatesByTopic,
  onTogglePublish,
  onDeleteTemplate,
}: CurriculumTreeProps) {
  const courses = useMemo(() => groupTopics(topics), [topics]);
  const [openUnits, setOpenUnits] = useState<Set<string>>(new Set());
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set());
  const [openCourses, setOpenCourses] = useState<Set<string>>(
    () => new Set(CURRICULUM.map((c) => c.id))
  );

  const toggle = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const countTemplates = (list: Topic[]) =>
    list.reduce((n, t) => n + (templatesByTopic[t.id]?.length ?? 0), 0);
  const countApproved = (list: Topic[]) => list.filter((t) => t.published).length;

  return (
    <div className="flex flex-col gap-6">
      {courses.map((course) => {
        const courseTopics = course.units.flatMap((u) => u.topics);
        const courseOpen = openCourses.has(course.id);
        const isLegacy = course.id === LEGACY_ID;

        return (
          <section key={course.id} className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            {/* Course header */}
            <button
              onClick={() => toggle(openCourses, course.id, setOpenCourses)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Chevron open={courseOpen} />
                <h2 className={`text-lg font-bold ${isLegacy ? "text-gray-500" : "text-gray-900"}`}>
                  {course.name}
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                <span>{courseTopics.length} subtopics</span>
                <span>{countTemplates(courseTopics)} templates</span>
                <span className="text-green-600">{countApproved(courseTopics)} approved</span>
              </div>
            </button>

            {courseOpen && (
              <div className="border-t divide-y">
                {isLegacy && (
                  <p className="px-6 py-3 text-xs text-amber-700 bg-amber-50">
                    These topics predate the curriculum and have no course or unit. They can be deleted
                    once you are sure nothing depends on them.
                  </p>
                )}
                {course.units.map((unit) => {
                  const unitOpen = openUnits.has(unit.id);
                  const unitTemplates = countTemplates(unit.topics);
                  const unitApproved = countApproved(unit.topics);

                  return (
                    <div key={unit.id}>
                      {/* Unit header */}
                      <button
                        onClick={() => toggle(openUnits, unit.id, setOpenUnits)}
                        className="w-full flex items-center justify-between px-6 py-3 pl-12 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Chevron open={unitOpen} />
                          <span className="font-semibold text-gray-800">{unit.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-400">{unit.topics.length} subtopics</span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              unitTemplates > 0 ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {unitTemplates} templates
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              unitApproved > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {unitApproved}/{unit.topics.length} approved
                          </span>
                        </div>
                      </button>

                      {/* Subtopic rows */}
                      {unitOpen && (
                        <ul className="bg-gray-50/60 border-t divide-y divide-gray-100">
                          {unit.topics.map((topic) => {
                            const tmpls = templatesByTopic[topic.id] ?? [];
                            const perLevel = LEVELS.map(
                              (lvl) => tmpls.filter((t) => t.level === lvl).length
                            );
                            const topicOpen = openTopics.has(topic.id);

                            return (
                              <li key={topic.id} className="pl-20 pr-6 py-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <button
                                        onClick={() => toggle(openTopics, topic.id, setOpenTopics)}
                                        className="flex items-center gap-2 text-left"
                                        disabled={tmpls.length === 0}
                                      >
                                        {tmpls.length > 0 && <Chevron open={topicOpen} />}
                                        <span className="font-medium text-gray-900">{topic.name}</span>
                                      </button>
                                      <span
                                        className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                          topic.published
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-200 text-gray-500"
                                        }`}
                                      >
                                        {topic.published ? "Approved" : "Draft"}
                                      </span>
                                    </div>
                                    {topic.description && (
                                      <p className="text-xs text-gray-500 mt-0.5">{topic.description}</p>
                                    )}
                                  </div>

                                  {/* Level chips */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    {LEVELS.map((lvl, i) => (
                                      <Link
                                        key={lvl}
                                        href={`/admin/templates/new?topicId=${topic.id}&level=${lvl}`}
                                        title={
                                          topic.levelDescriptions?.[i] ??
                                          `Add a Level ${LEVEL_SHORT[lvl]} template`
                                        }
                                        className={`text-[11px] font-bold px-2 py-1 rounded-md border transition-colors ${
                                          perLevel[i] > 0
                                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                                            : "bg-white border-dashed border-gray-300 text-gray-400 hover:border-indigo-300 hover:text-indigo-600"
                                        }`}
                                      >
                                        {LEVEL_SHORT[lvl]}
                                        <span className="ml-1 font-normal">{perLevel[i]}</span>
                                      </Link>
                                    ))}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-3 shrink-0 text-xs font-bold">
                                    <Link
                                      href={`/admin/topics/${topic.id}/preview`}
                                      className="text-indigo-600 hover:text-indigo-800"
                                    >
                                      Preview
                                    </Link>
                                    <Link
                                      href={`/admin/topics/${topic.id}/weights`}
                                      className="text-gray-400 hover:text-indigo-600"
                                    >
                                      Weights
                                    </Link>
                                    <button
                                      onClick={() => onTogglePublish(topic.id, topic.published)}
                                      className={`px-2.5 py-1 rounded-md transition-colors ${
                                        topic.published
                                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                                          : "bg-green-50 text-green-600 hover:bg-green-100"
                                      }`}
                                    >
                                      {topic.published ? "Unapprove" : "Approve"}
                                    </button>
                                  </div>
                                </div>

                                {/* Template list */}
                                {topicOpen && tmpls.length > 0 && (
                                  <ul className="mt-3 ml-5 space-y-1">
                                    {tmpls
                                      .slice()
                                      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
                                      .map((tmpl) => (
                                        <li
                                          key={tmpl.id}
                                          className="group flex items-center justify-between bg-white border rounded-lg px-3 py-2"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                              {LEVEL_SHORT[tmpl.level] ?? "?"}
                                            </span>
                                            <span className="text-sm text-gray-700">{tmpl.name}</span>
                                          </div>
                                          <div className="flex items-center gap-3 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link
                                              href={`/admin/templates/${tmpl.id}`}
                                              className="text-indigo-600 hover:underline"
                                            >
                                              Edit
                                            </Link>
                                            <button
                                              onClick={() => onDeleteTemplate(tmpl.id, topic.id, tmpl.name)}
                                              className="text-red-500 hover:underline"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </li>
                                      ))}
                                  </ul>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
