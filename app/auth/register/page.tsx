"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUser } from "@/services/usersService";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | "admin">("student");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      
      await createUser(credential.user.uid, email, displayName, role);

      const res = await fetch("/api/auth/set-role", {
        method: "POST",
        body: JSON.stringify({ uid: credential.user.uid, role }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to set user role permissions.");

      await credential.user.getIdToken(true);

      router.push(`/${role}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dm-bg p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-lg">α</span>
            </div>
            <span className="text-2xl font-bold text-dm-navy tracking-tight">
              Alpha<span className="gradient-brand-text">Code</span>
            </span>
          </Link>
          <p className="text-gray-500 text-sm mt-1">Create your free account to get started.</p>
        </div>

        <div className="bg-white rounded-2xl border border-dm-border shadow-card overflow-hidden">
          <div className="px-6 py-5 border-b border-dm-border">
            <h1 className="text-lg font-bold text-dm-navy">Create Account</h1>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Jane Smith"
                  className="w-full rounded-lg border border-dm-border px-3 py-2.5 text-sm outline-none transition-all focus:border-dm-blue focus:ring-2 focus:ring-dm-blue/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@school.edu"
                  className="w-full rounded-lg border border-dm-border px-3 py-2.5 text-sm outline-none transition-all focus:border-dm-blue focus:ring-2 focus:ring-dm-blue/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["student", "teacher"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                        role === r
                          ? "gradient-brand text-white border-transparent shadow-md shadow-indigo-500/20"
                          : "border-dm-border text-gray-600 hover:border-dm-blue hover:text-dm-blue bg-white"
                      }`}
                    >
                      {r === "student" ? "🎓 Student" : "👩‍🏫 Teacher"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-dm-border px-3 py-2.5 text-sm outline-none transition-all focus:border-dm-blue focus:ring-2 focus:ring-dm-blue/20"
                />
              </div>
              {error && (
                <div className="rounded-lg border border-dm-red/30 bg-dm-red-light px-3 py-2.5 text-sm text-red-700 flex items-start gap-2">
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="gradient-brand rounded-lg py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20 mt-1"
              >
                {loading ? "Creating account…" : "Create Account →"}
              </button>
            </form>
            <div className="mt-5 pt-5 border-t border-dm-border text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-semibold text-dm-blue hover:underline">
                  Log In
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/" className="hover:text-dm-blue">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
