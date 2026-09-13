import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-dm-bg">
      {/* Top nav bar */}
      <header className="bg-dm-navy border-b border-dm-navy-light">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">α</span>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">
              Alpha<span className="text-indigo-300">Code</span>
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-indigo-200 hover:text-white px-4 py-2 rounded-lg transition-colors hover:bg-white/10"
            >
              Log In
            </Link>
            <Link
              href="/auth/register"
              className="gradient-brand text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all hover:opacity-90 shadow-lg shadow-indigo-500/30"
            >
              Sign Up Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-dm-navy">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-indigo-200 text-sm font-medium">AP Computer Science Principles Practice</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
                Master AP CSP with
                <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
                  Adaptive Practice
                </span>
              </h1>
              <p className="text-lg md:text-xl text-indigo-200 mb-10 leading-relaxed max-w-2xl mx-auto">
                Teachers assign skills. Students practice randomized problems to mastery. 
                Step-by-step explanations and real-time progress — built for AP CSP.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/auth/register"
                  className="gradient-brand text-white font-bold px-8 py-4 rounded-xl transition-all hover:opacity-90 shadow-xl shadow-indigo-500/40 text-base"
                >
                  Get Started Free →
                </Link>
                <Link
                  href="/auth/login"
                  className="bg-white/10 border border-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:bg-white/20 text-base backdrop-blur-sm"
                >
                  Log In
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="bg-white border-b border-dm-border">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="grid grid-cols-3 gap-8 text-center">
              {[
                { value: "125+", label: "Questions per Topic" },
                { value: "Mastery", label: "Based Learning" },
                { value: "Real-time", label: "Progress Tracking" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-extrabold gradient-brand-text">{stat.value}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-extrabold text-dm-navy mb-4">
                Everything you need to
                <span className="gradient-brand-text"> succeed</span>
              </h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">
                A complete practice platform designed specifically for AP Computer Science Principles.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: "🎯",
                  title: "Mastery-Based",
                  desc: "Students work until they truly understand each concept — not just get a grade.",
                  color: "bg-dm-blue-light border-dm-border",
                  iconBg: "bg-indigo-100",
                },
                {
                  icon: "🔀",
                  title: "Randomized Problems",
                  desc: "Every student gets unique questions drawn from a large bank. No copying answers.",
                  color: "bg-dm-purple-light border-purple-100",
                  iconBg: "bg-purple-100",
                },
                {
                  icon: "📊",
                  title: "Real-Time Grades",
                  desc: "Teachers see exactly where each student stands with live progress tracking.",
                  color: "bg-dm-green-light border-green-100",
                  iconBg: "bg-green-100",
                },
                {
                  icon: "💡",
                  title: "Step-by-Step Explanations",
                  desc: "After every answer, students see a worked explanation — not just right or wrong.",
                  color: "bg-dm-yellow-light border-yellow-100",
                  iconBg: "bg-yellow-100",
                },
                {
                  icon: "🏫",
                  title: "Class Management",
                  desc: "Create classes, share join codes, and manage multiple groups with ease.",
                  color: "bg-dm-teal-light border-teal-100",
                  iconBg: "bg-teal-100",
                },
                {
                  icon: "⚡",
                  title: "Instant Feedback",
                  desc: "Students know immediately if they got it right — no waiting for grading.",
                  color: "bg-dm-orange-light border-orange-100",
                  iconBg: "bg-orange-100",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className={`border rounded-2xl p-6 ${f.color} hover:shadow-card-hover transition-shadow`}
                >
                  <div className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold text-dm-navy mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-dm-navy py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-extrabold text-white mb-3">How it works</h2>
              <p className="text-indigo-300">Simple for teachers. Powerful for students.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center text-white font-bold text-lg mb-5">T</div>
                <h3 className="text-white font-bold text-xl mb-4">For Teachers</h3>
                <ol className="space-y-3">
                  {[
                    "Create a class and share the join code",
                    "Browse AP CSP skills and create an assignment",
                    "Set required problems and due date",
                    "Watch real-time progress in the grade table",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 text-indigo-200 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 bg-indigo-500/30 text-indigo-300 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-5">S</div>
                <h3 className="text-white font-bold text-xl mb-4">For Students</h3>
                <ol className="space-y-3">
                  {[
                    "Join your class with the code your teacher shares",
                    "Open an assignment and pick a skill to practice",
                    "Answer randomized questions one by one",
                    "Read explanations and keep going until mastery",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 text-indigo-200 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 bg-emerald-500/30 text-emerald-300 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-dm-navy mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-500 text-lg mb-8">
              Free for teachers and students. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/auth/register"
                className="gradient-brand text-white font-bold px-8 py-4 rounded-xl transition-all hover:opacity-90 shadow-xl shadow-indigo-500/30 text-base"
              >
                Create Free Account →
              </Link>
              <Link
                href="/auth/login"
                className="bg-white border border-dm-border text-dm-navy font-semibold px-8 py-4 rounded-xl transition-all hover:bg-dm-blue-light text-base"
              >
                Log In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-dm-navy border-t border-dm-navy-light py-6 text-center text-xs text-indigo-300">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-5 h-5 rounded gradient-brand flex items-center justify-center">
            <span className="text-white font-bold text-xs">α</span>
          </div>
          <span className="text-white font-semibold">AlphaCode</span>
        </div>
        AP Computer Science Principles Mastery Practice
      </footer>
    </div>
  );
}
