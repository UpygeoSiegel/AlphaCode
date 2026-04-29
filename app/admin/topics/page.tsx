"use client";

import React, { useState, useEffect } from "react";
import { getTopics, createTopic, deleteTopic } from "@/services/topicsService";
import { deleteTemplatesByTopic } from "@/services/templatesService";
import { deleteQuestionBank } from "@/services/questionBankService";
import { useAuth } from "@/hooks/useAuth";
import type { Topic } from "@/types";
import Link from "next/link";

export default function TopicsPage() {
  const { user, loading: authLoading } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New topic form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadTopics() {
    try {
      setError(null);
      const data = await getTopics();
      setTopics(data);
    } catch (err) {
      console.error("Failed to load topics:", err);
      if (err instanceof Error && err.name !== 'AbortError') {
        setError("Failed to load topics. Please check your connection or permissions.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTopics();
  }, []);

  const handleDeleteTopic = async (e: React.MouseEvent, topicId: string, topicName: string) => {
    e.preventDefault(); // Prevent navigating to preview
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${topicName}"? This will also delete all templates and questions associated with it.`)) {
      return;
    }

    try {
      setLoading(true);
      // 1. Delete Question Bank
      await deleteQuestionBank(topicId);
      // 2. Delete Templates
      await deleteTemplatesByTopic(topicId);
      // 3. Delete Topic Document
      await deleteTopic(topicId);
      
      await loadTopics();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete topic completely.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) return;

    setIsSubmitting(true);
    try {
      await createTopic({
        name,
        description,
        tier: "official",
        createdBy: user.uid,
        published: false,
        templateIds: [],
        weights: {},
        bankSize: 125,
      });
      setName("");
      setDescription("");
      await loadTopics(); // Refresh list
    } catch (error) {
      console.error("Error creating topic:", error);
      alert("Failed to create topic");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <Link href="/admin" className="text-indigo-600 hover:underline text-sm font-medium">
          &larr; Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Manage Topics</h1>
        <p className="text-gray-500">Create curriculum categories for your questions.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Topic Form */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-xl p-6 shadow-sm sticky top-8">
            <h2 className="text-lg font-semibold mb-4">Create New Topic</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Binary Numbers"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                  placeholder="What should students master in this topic?"
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Add Topic"}
              </button>
            </form>
          </div>
        </div>

        {/* Topics List */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Existing Topics</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {topics.length === 0 ? (
              <div className="bg-white border border-dashed rounded-xl p-12 text-center text-gray-400">
                No topics created yet.
              </div>
            ) : (
              topics.map(topic => (
                <Link 
                  key={topic.id} 
                  href={`/admin/topics/${topic.id}/preview`}
                  className="bg-white border rounded-xl p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group block"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-700 transition-colors">{topic.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{topic.description || "No description provided."}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${topic.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {topic.published ? 'Published' : 'Draft'}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteTopic(e, topic.id, topic.name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Topic"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>{topic.templateIds?.length || 0} Templates</span>
                      <span>•</span>
                      <span>Bank size: {topic.bankSize}</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Preview Quiz &rarr;
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
