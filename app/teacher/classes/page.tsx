"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { getTeacherClasses, createClass, archiveClass, unarchiveClass, deleteClass } from "@/services/classesService";
import { getAssignmentsByClass } from "@/services/assignmentsService";
import type { ClassDoc, Assignment } from "@/types";
import AppShell from "@/components/shared/AppShell";
import Link from "next/link";

export default function TeacherClassesPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [assignmentsByClass, setAssignmentsByClass] = useState<Record<string, Assignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && role && role !== "teacher") router.push(`/${role}`);
  }, [user, role, authLoading, router]);

  async function loadData() {
    if (!user) return;
    try {
      const classesData = await getTeacherClasses(user.uid);
      setClasses(classesData);
      const assignmentsMap: Record<string, Assignment[]> = {};
      await Promise.all(
        classesData.map(async (cls) => {
          assignmentsMap[cls.id] = await getAssignmentsByClass(cls.id);
        })
      );
      setAssignmentsByClass(assignmentsMap);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [user]);

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newClassName.trim()) return;
    try {
      await createClass(user.uid, newClassName);
      setNewClassName("");
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      console.error("Error creating class:", err);
      alert("Failed to create class.");
    }
  }

  async function handleArchive(cls: ClassDoc) {
    try {
      if ((cls as ClassDoc & { archived?: boolean }).archived) {
        await unarchiveClass(cls.id);
      } else {
        await archiveClass(cls.id);
      }
      setClasses((prev) =>
        prev.map((c) =>
          c.id === cls.id ? { ...c, archived: !(c as ClassDoc & { archived?: boolean }).archived } : c
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update class.");
    }
  }

  async function handleDelete(cls: ClassDoc) {
    if (!confirm(`Permanently delete "${cls.name}"? This cannot be undone.`)) return;
    try {
      await deleteClass(cls.id);
      setClasses((prev) => prev.filter((c) => c.id !== cls.id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete class.");
    }
  }

  const activeClasses = classes.filter((c) => !(c as ClassDoc & { archived?: boolean }).archived);
  const archivedClasses = classes.filter((c) => (c as ClassDoc & { archived?: boolean }).archived);
  const visibleClasses = showArchived ? archivedClasses : activeClasses;

  if (authLoading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <AppShell
      role="teacher"
      userEmail={user?.email}
      title="Classes"
      headerActions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="gradient-brand text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90 shadow-md shadow-indigo-500/20"
        >
          + Add New Class
        </button>
      }
    >
      {/* Tab toggle */}
      {archivedClasses.length > 0 && (
        <div className="flex gap-2 mb-4">
          {[false, true].map((archived) => (
            <button
              key={String(archived)}
              onClick={() => setShowArchived(archived)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                showArchived === archived
                  ? "gradient-brand text-white shadow-sm"
                  : "bg-white border border-dm-border text-gray-500 hover:border-dm-blue hover:text-dm-blue"
              }`}
            >
              {archived ? `Archived (${archivedClasses.length})` : `Active (${activeClasses.length})`}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading classes...</div>
      ) : visibleClasses.length === 0 ? (
        <div className="bg-white border border-dm-border rounded-2xl p-12 text-center">
          <p className="text-gray-500 mb-4">
            {showArchived ? "No archived classes." : "No classes created yet."}
          </p>
          {!showArchived && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="gradient-brand text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90"
            >
              Create your first class
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-dm-border rounded-2xl shadow-card overflow-visible">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-dm-border bg-dm-bg">
                <th className="px-4 py-3 font-semibold text-gray-700">Class Name</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center">Class Code</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center">Students</th>
                <th className="px-4 py-3 font-semibold text-gray-700 text-center">Assignments</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visibleClasses.map((cls, i) => (
                <tr
                  key={cls.id}
                  className={`border-b border-gray-100 hover:bg-dm-blue-light transition-colors ${
                    i % 2 === 1 ? "bg-gray-50/50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/teacher/classes/${cls.id}`} className="text-dm-blue font-semibold hover:underline">
                      {cls.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono font-bold text-gray-700 bg-gray-100 border border-dm-border px-2 py-0.5 rounded text-xs">
                      {cls.joinCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">{cls.studentIds.length}</td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {assignmentsByClass[cls.id]?.length || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {!(cls as ClassDoc & { archived?: boolean }).archived && (
                        <Link
                          href={`/teacher/assignments/new?classId=${cls.id}`}
                          className="text-xs font-semibold text-dm-blue hover:underline"
                        >
                          + Assign
                        </Link>
                      )}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            if (openMenuId === cls.id) {
                              setOpenMenuId(null);
                              setMenuPos(null);
                            } else {
                              const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                              setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                              setOpenMenuId(cls.id);
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-lg leading-none"
                        >
                          ···
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dropdown menu — fixed position to escape table overflow clipping */}
      {openMenuId && menuPos && (() => {
        const cls = classes.find((c) => c.id === openMenuId)!;
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setOpenMenuId(null); setMenuPos(null); }} />
            <div
              className="fixed z-50 bg-white border border-dm-border rounded-xl shadow-card-hover w-36 overflow-hidden"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <button
                onClick={() => { handleArchive(cls); setOpenMenuId(null); setMenuPos(null); }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-dm-bg transition-colors"
              >
                {(cls as ClassDoc & { archived?: boolean }).archived ? "Unarchive" : "Archive"}
              </button>
              <button
                onClick={() => { handleDelete(cls); setOpenMenuId(null); setMenuPos(null); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </>
        );
      })()}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-dm-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-dm-navy">Add New Class</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleCreateClass}>
              <div className="px-5 py-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Class Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Period 1 - AP CSP"
                  className="w-full border border-dm-border rounded-lg px-3 py-2 text-sm focus:border-dm-blue focus:ring-2 focus:ring-dm-blue/20 outline-none"
                  required
                />
              </div>
              <div className="px-5 py-3 border-t border-dm-border bg-gray-50 flex justify-end gap-3 rounded-b">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-dm-border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newClassName.trim()}
                  className="gradient-brand text-white px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
