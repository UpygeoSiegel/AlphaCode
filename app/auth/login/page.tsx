"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUser } from "@/services/usersService";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Role } from "@/types";

const ROLE_ROUTES: Record<Role, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const tokenResult = await credential.user.getIdTokenResult(true);
      const role = tokenResult.claims["role"] as Role | undefined;

      if (!role) {
        const userDoc = await getUser(credential.user.uid);
        router.push(userDoc ? ROLE_ROUTES[userDoc.role] : "/student");
      } else {
        router.push(ROLE_ROUTES[role]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
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
          <p className="text-gray-500 text-sm mt-1">Welcome back! Log in to continue.</p>
        </div>

        <div className="bg-white rounded-2xl border border-dm-border shadow-card overflow-hidden">
          <div className="px-6 py-5 border-b border-dm-border">
            <h1 className="text-lg font-bold text-dm-navy">Log In</h1>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
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
                {loading ? "Logging in…" : "Log In →"}
              </button>
            </form>
            <div className="mt-5 pt-5 border-t border-dm-border text-center">
              <p className="text-sm text-gray-500">
                New student?{" "}
                <Link href="/auth/register" className="font-semibold text-dm-blue hover:underline">
                  Create an account
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
