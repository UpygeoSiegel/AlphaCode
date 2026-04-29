"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTopic } from "@/services/topicsService";
import { getTemplatesByTopic } from "@/services/templatesService";
import type { Topic, Template, Question } from "@/types";
import QuestionCard from "@/components/shared/QuestionCard";
import Link from "next/link";

export default function TopicPreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const topicId = id as string;
        const [topicData, templatesData] = await Promise.all([
          getTopic(topicId),
          getTemplatesByTopic(topicId)
        ]);

        if (!topicData) {
          setError("Topic not found.");
          return;
        }

        setTopic(topicData);
        setTemplates(templatesData);
        
        if (templatesData.length > 0) {
          generateQuestion(templatesData);
        } else {
          setError("This topic has no templates yet. Add a template in the Sandbox to preview.");
        }
      } catch (err) {
        console.error("Preview error:", err);
        setError("Failed to load preview.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const generateQuestion = (availableTemplates: Template[]) => {
    try {
      // Pick a random template
      const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
      
      // Execute the template code (safe enough for admin preview)
      const transformedCode = template.code.replace(/export default/, 'const template =') + '; return template;';
      const templateObj = new Function(transformedCode)();
      
      const q = templateObj.generate();
      const exp = templateObj.explain(q);
      
      setCurrentQuestion({
        ...q,
        explanation: exp,
        index: Math.floor(Math.random() * 100)
      });
    } catch (err) {
      console.error("Generation error:", err);
      setError("Error generating question from template.");
    }
  };

  const handleNext = () => {
    if (templates.length > 0) {
      generateQuestion(templates);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading preview...</div>;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl border shadow-sm text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Wait a moment</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/admin/topics" className="text-indigo-600 font-medium hover:underline">Back to Topics</Link>
            <Link href="/admin/templates/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Add Template</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-2xl flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{topic?.name}</h1>
          <p className="text-sm text-gray-500">Previewing Live Generation</p>
        </div>
        <Link 
          href="/admin/topics"
          className="text-sm font-medium text-gray-500 hover:text-indigo-600"
        >
          Exit Preview
        </Link>
      </div>

      {currentQuestion && (
        <QuestionCard 
          key={`${currentQuestion.prompt.substring(0, 20)}-${currentQuestion.index}`}
          question={currentQuestion} 
          onNext={handleNext} 
        />
      )}
      
      <p className="mt-8 text-xs text-gray-400 text-center max-w-sm">
        This is a live preview of the question generation templates. Actual question banks will be pre-generated for students.
      </p>
    </div>
  );
}
