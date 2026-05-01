export interface CspCategory {
  id: string;
  label: string;
  description: string;
  color: {
    bg: string;
    text: string;
    border: string;
    headerBg: string;
    badge: string;
    badgeText: string;
  };
}

// AP CSP Big Idea 3: Algorithms & Programming
export const CSP_CATEGORIES: CspCategory[] = [
  {
    id: "variables-assignments",
    label: "Variables and Assignments",
    description: "Storing and changing values using variables",
    color: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", headerBg: "bg-indigo-50 hover:bg-indigo-100", badge: "bg-indigo-100", badgeText: "text-indigo-700" },
  },
  {
    id: "data-abstraction",
    label: "Data Abstraction",
    description: "Using lists and other structures to manage collections of data",
    color: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", headerBg: "bg-violet-50 hover:bg-violet-100", badge: "bg-violet-100", badgeText: "text-violet-700" },
  },
  {
    id: "mathematical-expressions",
    label: "Mathematical Expressions",
    description: "Arithmetic operators and numeric computation",
    color: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", headerBg: "bg-blue-50 hover:bg-blue-100", badge: "bg-blue-100", badgeText: "text-blue-700" },
  },
  {
    id: "strings",
    label: "Strings",
    description: "Working with text data and string operations",
    color: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", headerBg: "bg-sky-50 hover:bg-sky-100", badge: "bg-sky-100", badgeText: "text-sky-700" },
  },
  {
    id: "boolean-expressions",
    label: "Boolean Expressions",
    description: "AND, OR, NOT logic and relational operators",
    color: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", headerBg: "bg-cyan-50 hover:bg-cyan-100", badge: "bg-cyan-100", badgeText: "text-cyan-700" },
  },
  {
    id: "conditionals",
    label: "Conditionals",
    description: "IF / IF-ELSE statements and decision making",
    color: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", headerBg: "bg-teal-50 hover:bg-teal-100", badge: "bg-teal-100", badgeText: "text-teal-700" },
  },
  {
    id: "nested-conditionals",
    label: "Nested Conditionals",
    description: "Conditionals inside other conditionals",
    color: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", headerBg: "bg-emerald-50 hover:bg-emerald-100", badge: "bg-emerald-100", badgeText: "text-emerald-700" },
  },
  {
    id: "iteration",
    label: "Iteration",
    description: "REPEAT and REPEAT UNTIL loops",
    color: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", headerBg: "bg-green-50 hover:bg-green-100", badge: "bg-green-100", badgeText: "text-green-700" },
  },
  {
    id: "developing-algorithms",
    label: "Developing Algorithms",
    description: "Designing step-by-step solutions to problems",
    color: { bg: "bg-lime-50", text: "text-lime-700", border: "border-lime-200", headerBg: "bg-lime-50 hover:bg-lime-100", badge: "bg-lime-100", badgeText: "text-lime-700" },
  },
  {
    id: "lists",
    label: "Lists",
    description: "Creating, accessing, and modifying list elements",
    color: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", headerBg: "bg-yellow-50 hover:bg-yellow-100", badge: "bg-yellow-100", badgeText: "text-yellow-700" },
  },
  {
    id: "binary-search",
    label: "Binary Search",
    description: "Searching sorted lists efficiently",
    color: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", headerBg: "bg-amber-50 hover:bg-amber-100", badge: "bg-amber-100", badgeText: "text-amber-700" },
  },
  {
    id: "binary-conversions",
    label: "Binary Conversions",
    description: "Converting between binary, decimal, and other number systems",
    color: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", headerBg: "bg-orange-50 hover:bg-orange-100", badge: "bg-orange-100", badgeText: "text-orange-700" },
  },
  {
    id: "calling-procedures",
    label: "Calling Procedures",
    description: "Using existing procedures and understanding parameters",
    color: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", headerBg: "bg-red-50 hover:bg-red-100", badge: "bg-red-100", badgeText: "text-red-700" },
  },
  {
    id: "developing-procedures",
    label: "Developing Procedures",
    description: "Writing reusable procedures with parameters and return values",
    color: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", headerBg: "bg-rose-50 hover:bg-rose-100", badge: "bg-rose-100", badgeText: "text-rose-700" },
  },
  {
    id: "libraries",
    label: "Libraries",
    description: "Using built-in and external libraries",
    color: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", headerBg: "bg-pink-50 hover:bg-pink-100", badge: "bg-pink-100", badgeText: "text-pink-700" },
  },
  {
    id: "random-values",
    label: "Random Values",
    description: "Generating and using random numbers in programs",
    color: { bg: "bg-fuchsia-50", text: "text-fuchsia-700", border: "border-fuchsia-200", headerBg: "bg-fuchsia-50 hover:bg-fuchsia-100", badge: "bg-fuchsia-100", badgeText: "text-fuchsia-700" },
  },
  {
    id: "simulations",
    label: "Simulations",
    description: "Using programs to model real-world phenomena",
    color: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", headerBg: "bg-purple-50 hover:bg-purple-100", badge: "bg-purple-100", badgeText: "text-purple-700" },
  },
  {
    id: "algorithmic-efficiency",
    label: "Algorithmic Efficiency",
    description: "Comparing algorithms by their time and resource use",
    color: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", headerBg: "bg-slate-50 hover:bg-slate-100", badge: "bg-slate-100", badgeText: "text-slate-700" },
  },
  {
    id: "undecidable-problems",
    label: "Undecidable Problems",
    description: "Problems that cannot be solved algorithmically",
    color: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-300", headerBg: "bg-gray-50 hover:bg-gray-100", badge: "bg-gray-200", badgeText: "text-gray-700" },
  },
];

export const CSP_CATEGORY_MAP = Object.fromEntries(
  CSP_CATEGORIES.map((c) => [c.id, c])
) as Record<string, CspCategory>;

export const UNCATEGORIZED_ID = "uncategorized";
