"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface NavItem {
  label: string;
  href: string;
  exact?: boolean;
  icon: string;
}

const NAV: Record<string, NavItem[]> = {
  teacher: [
    { label: "Skills Library", href: "/teacher", exact: true, icon: "📚" },
    { label: "Assignments", href: "/teacher/assignments", icon: "📝" },
    { label: "Classes", href: "/teacher/classes", icon: "🏫" },
  ],
  student: [{ label: "Assignments", href: "/student", exact: true, icon: "📝" }],
  admin: [{ label: "Dashboard", href: "/admin", icon: "⚙️" }],
};

interface AppShellProps {
  role: "teacher" | "student" | "admin";
  userEmail?: string | null;
  title?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShell({ role, userEmail, title, headerActions, children }: AppShellProps) {
  const pathname = usePathname();

  const initials = userEmail
    ? userEmail.split("@")[0].slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="min-h-screen bg-dm-bg">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-60 bg-dm-navy flex flex-col z-20 shadow-xl">
        <Link href={`/${role}`} className="px-5 py-5 border-b border-white/10 block">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">α</span>
            </div>
            <div>
              <span className="text-white text-lg font-bold tracking-tight leading-none">
                Alpha<span className="text-indigo-300">Code</span>
              </span>
              <span className="block text-[10px] text-indigo-400/70 mt-0.5 uppercase tracking-wider">
                AP Computer Science
              </span>
            </div>
          </div>
        </Link>

        {role === "teacher" && (
          <div className="px-4 pt-4">
            <Link
              href="/teacher/assignments/new"
              className="flex items-center justify-center gap-2 w-full gradient-brand text-white text-sm font-semibold py-2.5 rounded-xl transition-all hover:opacity-90 shadow-lg shadow-indigo-500/30"
            >
              <span className="text-base">+</span>
              Create Assignment
            </Link>
          </div>
        )}

        <nav className="flex-1 mt-5 px-3">
          <p className="px-3 text-[10px] uppercase tracking-wider text-indigo-400/60 font-semibold mb-2">
            Navigation
          </p>
          {NAV[role].map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-0.5 transition-all ${
                  active
                    ? "bg-white/15 text-white font-semibold shadow-sm"
                    : "text-indigo-200/80 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 bg-indigo-300 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 gradient-brand rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              {userEmail && (
                <p className="text-[11px] text-indigo-200/80 truncate" title={userEmail}>
                  {userEmail}
                </p>
              )}
              <p className="text-[10px] text-indigo-400/60 capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="text-xs text-indigo-300/70 hover:text-white font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>↩</span> Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-60 flex flex-col min-h-screen">
        {(title || headerActions) && (
          <header className="bg-white border-b border-dm-border px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <h1 className="text-xl font-bold text-dm-navy">{title}</h1>
            <div className="flex items-center gap-3">{headerActions}</div>
          </header>
        )}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
