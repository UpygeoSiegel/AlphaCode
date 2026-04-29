"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { getClassesForStudent, getPostedAssignmentsForStudent } from "@/services/assignmentsService";
import { getClassByJoinCode, addStudentToClass } from "@/services/classesService";
import { getProgress } from "@/services/progressService";
import type { Assignment, ClassDoc, StudentProgress } from "@/types";
import Link from "next/link";

export default function StudentDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<Record<string, StudentProgress>>({});
  const [loading, setLoading] = useState(true);
  
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && role && role !== "student") router.push(`/${role}`);
  }, [user, role, authLoading, router]);

  async function loadData() {
    if (!user) return;
    try {
      setLoading(true);
      console.log("Loading data for student:", user.uid);
      const classesData = await getClassesForStudent(user.uid);
      console.log("Classes found:", classesData);
      setClasses(classesData);

      if (classesData.length > 0) {
        const classIds = classesData.map(c => c.id);
        const assignmentsData = await getPostedAssignmentsForStudent(classIds);
        console.log("Assignments found:", assignmentsData);
        setAssignments(assignmentsData);

        const progressMap: Record<string, StudentProgress> = {};
        await Promise.all(assignmentsData.map(async (asgn) => {
          const p = await getProgress(user.uid, asgn.id);
          if (p) progressMap[asgn.id] = p;
        }));
        setProgress(progressMap);
      } else {
        console.log("No classes found for this student UID.");
      }
    } catch (err) {
      console.error("Error loading student data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  async function handleJoinClass(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;

    setIsJoining(true);
    setJoinCodeError(null);
    try {
      const cls = await getClassByJoinCode(joinCode);
      if (!cls) {
        setJoinCodeError("Invalid join code.");
        return;
      }
      await addStudentToClass(cls.id, user.uid);
      setJoinCode("");
      await loadData();
    } catch (err) {
      console.error("Join error:", err);
      setJoinCodeError("Failed to join class.");
    } finally {
      setIsJoining(false);
    }
  }

  if (authLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-black text-indigo-700 uppercase tracking-tighter">Student Portal</h1>
          <nav className="flex gap-4">
            <Link href="/student" className="text-sm font-bold text-gray-900 border-b-2 border-indigo-600 pb-1">Dashboard</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-gray-500">{user?.email}</span>
          <button
            onClick={() => signOut(auth)}
            className="text-xs font-bold text-gray-400 hover:text-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="p-8 max-w-5xl mx-auto flex flex-col gap-12">
        {/* Join Class Section */}
        <section className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter italic">Join a Class</h2>
            <p className="text-indigo-100 font-medium">Enter the 6-character code from your teacher to join.</p>
          </div>
          <form onSubmit={handleJoinClass} className="flex flex-col gap-2 min-w-[300px]">
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
                maxLength={6}
                className="flex-1 bg-white/20 border-2 border-white/30 rounded-xl px-4 py-3 text-lg font-black placeholder:text-white/40 focus:bg-white focus:text-indigo-700 outline-none transition-all uppercase text-center tracking-widest"
              />
              <button
                disabled={isJoining || joinCode.length < 6}
                className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-black hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50"
              >
                Join
              </button>
            </div>
            {joinError && <p className="text-xs font-bold text-red-200">{joinError}</p>}
          </form>
        </section>

        {/* Your Classes Section */}
        {classes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Your Classes</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {classes.map(cls => (
                <div key={cls.id} className="bg-white border-2 border-indigo-100 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <div>
                    <div className="text-xs font-black text-gray-900 leading-none">{cls.name}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Enrolled</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Assignments Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Active Assignments</h2>
              <button 
                onClick={loadData}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                title="Refresh Assignments"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{assignments.length} Total</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 font-medium italic">Loading your curriculum...</div>
          ) : assignments.length === 0 ? (
            <div className="bg-white border-2 border-dashed rounded-3xl p-12 text-center">
              <p className="text-gray-400 font-bold mb-2">No assignments found.</p>
              <p className="text-sm text-gray-400">Join a class using a code to see your work.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments.map((asgn) => {
                const prog = progress[asgn.id];
                const percent = prog ? Math.min(100, Math.round((prog.correctCount / asgn.requiredCorrect) * 100)) : 0;
                
                return (
                  <div key={asgn.id} className="bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 inline-block">
                            {classes.find(c => c.id === asgn.classId)?.name}
                          </span>
                          <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-700 transition-colors">Practice Session</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-gray-900">{percent}%</div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mastery</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-3 bg-gray-100 rounded-full mb-8 relative overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                          <div>
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Correct</div>
                            <div className="text-sm font-bold text-gray-700">{prog?.correctCount || 0} / {asgn.requiredCorrect}</div>
                          </div>
                          <div>
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Due</div>
                            <div className="text-sm font-bold text-gray-700">{asgn.dueDate.toDate().toLocaleDateString()}</div>
                          </div>
                        </div>
                        <Link
                          href={`/student/assignment/${asgn.id}`}
                          className="bg-gray-900 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-indigo-600 transition-all active:scale-95 shadow-lg"
                        >
                          {percent === 100 ? "Review" : percent > 0 ? "Continue" : "Start"}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
