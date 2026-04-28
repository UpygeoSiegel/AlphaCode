import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-indigo-700">CSP Ready</h1>
        <p className="mt-2 text-lg text-gray-600">
          AP Computer Science Principles — Mastery Practice
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/auth/login"
          className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          Log In
        </Link>
        <Link
          href="/auth/register"
          className="rounded-lg border border-indigo-600 px-6 py-3 text-indigo-600 font-medium hover:bg-indigo-50 transition-colors"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
