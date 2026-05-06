"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getClassesForStudent, getPostedAssignmentsForStudent } from "@/services/assignmentsService";
import { getClassByJoinCode, addStudentToClass } from "@/services/classesService";
import { getProgressForStudentInAssignment } from "@/services/progressService";
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
  const [showJoinModal, setShowJoinModal] = useState(false);

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
          const progs = await getProgressForStudentInAssignment(user.uid, asgn.id);
          if (progs.length > 0) {
            // Aggregate progress across all topics for this assignment
            const aggregated: StudentProgress = {
              ...progs[0],
              correctCount: progs.reduce((acc, p) => acc + (Number(p.correctCount) || 0), 0),
              questionsAnswered: progs.reduce((acc, p) => acc + (Number(p.questionsAnswered) || 0), 0),
              completed: progs.every(p => p.completed) && progs.length >= asgn.topicIds.length
            };
            
            if (asgn.mixedMode) {
              const mixed = progs.find(p => p.topicId === "mixed");
              if (mixed) progressMap[asgn.id] = mixed;
              else progressMap[asgn.id] = aggregated;
            } else {
              progressMap[asgn.id] = aggregated;
            }
          }
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
      <header className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-black text-indigo-700 uppercase tracking-tighter">Student Portal</h1>
          <nav className="flex gap-4">
            <Link href="/student" className="text-sm font-bold text-gray-900 border-b-2 border-indigo-600 pb-1">Dashboard</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowJoinModal(true)}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Join Class
          </button>
          <div className="h-8 w-[1px] bg-gray-200 mx-2" />
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
                          <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-700 transition-colors">
                            {asgn.name}
                          </h3>
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

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Join a Class</h3>
            <p className="text-gray-500 mb-6 text-sm">Enter the 6-character code from your teacher.</p>
            
            <form onSubmit={async (e) => {
              await handleJoinClass(e);
              if (!joinError) setShowJoinModal(false);
            }} className="flex flex-col gap-4">
              <div>
                <input
                  autoFocus
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABCDEF"
                  maxLength={6}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-4 text-2xl font-black focus:border-indigo-600 outline-none transition-all uppercase text-center tracking-widest bg-gray-50"
                  required
                />
              </div>
              {joinError && <p className="text-xs font-bold text-red-600">{joinError}</p>}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-3 border rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining || joinCode.length < 6}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-colors shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isJoining ? "Joining..." : "Join Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
