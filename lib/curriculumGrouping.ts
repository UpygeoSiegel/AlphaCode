import type { Topic } from "@/types";
import { CURRICULUM } from "@/data/curriculum";

export interface UnitGroup {
  id: string;
  name: string;
  topics: Topic[];
}

export interface CourseGroup {
  id: string;
  name: string;
  units: UnitGroup[];
}

/** Bucket used for topics that predate the curriculum and carry no course/unit. */
export const LEGACY_ID = "__legacy__";

/** Group Firestore topics into course → unit, ordered by the curriculum file. */
export function groupTopics(topics: Topic[]): CourseGroup[] {
  const courseOrder = CURRICULUM.map((c) => c.id);
  const unitOrder = CURRICULUM.flatMap((c) => c.units.map((u) => u.id));

  const byCourse = new Map<string, CourseGroup>();
  for (const t of topics) {
    const courseId = t.courseId ?? LEGACY_ID;
    const unitId = t.unitId ?? LEGACY_ID;
    let course = byCourse.get(courseId);
    if (!course) {
      course = {
        id: courseId,
        name: t.courseName ?? "Legacy topics (not in curriculum)",
        units: [],
      };
      byCourse.set(courseId, course);
    }
    let unit = course.units.find((u) => u.id === unitId);
    if (!unit) {
      unit = { id: unitId, name: t.unitName ?? "Uncategorized", topics: [] };
      course.units.push(unit);
    }
    unit.topics.push(t);
  }

  const rank = (list: string[], id: string) => {
    const i = list.indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };

  const courses = Array.from(byCourse.values()).sort(
    (a, b) => rank(courseOrder, a.id) - rank(courseOrder, b.id)
  );
  for (const course of courses) {
    course.units.sort((a, b) => rank(unitOrder, a.id) - rank(unitOrder, b.id));
    for (const unit of course.units) {
      unit.topics.sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)
      );
    }
  }
  return courses;
}
