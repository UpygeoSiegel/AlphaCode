import type { Level } from "@/types";

export const LEVEL_LABEL: Record<Level, string> = {
  1: "Level I",
  2: "Level II",
  3: "Level III",
};

interface TopicPathProps {
  courseName?: string;
  unitName?: string;
  level?: Level;
  className?: string;
}

/** Small "Course › Unit" breadcrumb with an optional level badge. Renders nothing for legacy data. */
export default function TopicPath({ courseName, unitName, level, className = "" }: TopicPathProps) {
  const crumbs = [courseName, unitName].filter(Boolean);
  if (crumbs.length === 0 && !level) return null;

  return (
    <div className={`flex items-center gap-2 flex-wrap text-[11px] font-medium text-gray-500 ${className}`}>
      {crumbs.length > 0 && <span>{crumbs.join(" › ")}</span>}
      {level && (
        <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
          {LEVEL_LABEL[level]}
        </span>
      )}
    </div>
  );
}
