"use client";

import TemplateSandbox from "@/components/admin/TemplateSandbox";
import Link from "next/link";

export default function NewTemplatePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/admin" className="text-indigo-600 hover:underline text-sm font-medium">
            &larr; Back to Admin Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Developer Portal</h1>
        <p className="text-gray-500">Create, test, and preview question generation templates in real-time.</p>
      </header>

      <TemplateSandbox />
    </div>
  );
}
