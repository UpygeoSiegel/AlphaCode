"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getTemplate } from "@/services/templatesService";
import type { Template } from "@/types";
import TemplateSandbox from "@/components/admin/TemplateSandbox";
import Link from "next/link";

export default function EditTemplatePage() {
  const { id } = useParams();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const data = await getTemplate(id as string);
        if (!data) {
          setError("Template not found.");
        } else {
          setTemplate(data);
        }
      } catch (err) {
        console.error("Error loading template:", err);
        setError("Failed to load template.");
      } finally {
        setLoading(false);
      }
    }
    loadTemplate();
  }, [id]);

  if (loading) return <div className="p-8">Loading template...</div>;

  if (error || !template) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/admin" className="text-indigo-600 hover:underline font-medium">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/admin" className="text-indigo-600 hover:underline text-sm font-medium">
            &larr; Back to Admin Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Template</h1>
        <p className="text-gray-500">Updating: <span className="font-semibold text-gray-700">{template.name}</span></p>
      </header>

      <TemplateSandbox initialTemplate={template} />
    </div>
  );
}
