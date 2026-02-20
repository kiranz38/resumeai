import Link from "next/link";
import FAQ from "@/components/FAQ";
import ShareCard from "@/components/ShareCard";
import SampleResumeModal from "@/components/SampleResumeModal";
import SocialProofCounter from "@/components/SocialProofCounter";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import AnimatedDemo from "@/components/AnimatedDemo";
import { PRO_PRICE_DISPLAY, CAREER_PASS_DISPLAY } from "@/lib/constants";

const FAQ_ITEMS = [
  {
    question: "Is my resume data stored or shared?",
    answer:
      "No. Your resume and job description are processed in memory and never stored on our servers. We use anonymous analytics only — no personal data is retained.",
  },
  {
    question: "How does the Match Score work?",
    answer:
      "We analyze your resume across five industry-standard dimensions — Hard Skills, Soft Skills, Measurable Results, Keyword Optimization, and Formatting & Best Practices — to compute how strongly your resume signals to hiring managers. Each category uses deterministic heuristics: skill matching, metrics density, keyword coverage, and more.",
  },
  {
    question: "How accurate are the results?",
    answer:
      "Our analysis provides directional guidance based on keyword matching and best practices. Results are not guaranteed — always use your judgment and tailor recommendations to your specific situation. We never invent metrics or achievements.",
  },
  {
    question: "What file formats are supported?",
    answer:
      "We support PDF, DOCX, and TXT files. You can also paste your resume text directly. For best results, use a clean PDF or plain text version of your resume.",
  },
  {
    question: "What data do you store?",
    answer:
      "We store only anonymous event data (e.g., 'analysis completed') and payment records via Stripe. We never store your resume, job description, or any personal information from your documents.",
  },
];

const BENEFITS = [
  {
    title: "Signal Score + Keyword Map",
    description:
      "See your Match Score and get a categorized map of missing keywords with specific placement suggestions.",
    icon: (
      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Rewrite Pack",
    description:
      "Get 12-20 tailored bullet rewrites with stronger action verbs, scope, and impact — plus a skills section rewrite.",
    icon: (
      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    title: "Action Plan",
    description:
      "Get a prioritized list of exactly what to fix, add, and improve — no guesswork, just clear next steps.",
    icon: (
      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Bulk CV Generator",
    description:
      "Applying to multiple roles? Select jobs from our Job Board or paste up to 5 job descriptions — get a tailored CV for each, generated in parallel.",
    icon: (
      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

const TRUST_ITEMS = [
  "No signup required",
  "Privacy-first — nothing stored",
  "One-time payment",
  "No auto-renew",
  "Clear pricing",
];

const TESTIMONIALS = [
  {
    quote: "I was applying to 20+ jobs with the same resume and getting nothing. After using ResumeMate, I tailored my CV to a Product Manager role and got an interview within a week.",
    name: "Lucas R.",
    role: "Product Manager",
    score: "47 → 84",
  },
  {
    quote: "The keyword matching is spot on. It showed me exactly which skills were missing from my resume and rewrote my bullets to match the job description. Landed 3 interviews in 2 weeks.",
    name: "James T.",
    role: "Software Engineer",
    score: "52 → 79",
  },
  {
    quote: "I was skeptical about another resume tool, but the free scan convinced me. The Match Score breakdown was so detailed I upgraded to Pro immediately. Best $5 I've spent on my job search.",
    name: "Sarah L.",
    role: "Marketing Analyst",
    score: "39 → 76",
  },
];

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* Sticky mobile CTA — appears after scrolling past hero */}
      <StickyMobileCTA />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white px-4 pb-16 pt-12 sm:pb-24 sm:pt-20">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-indigo-100/30 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
            Free instant analysis
          </span>
          <h1 className="font-[var(--font-inter)] text-[28px] font-extrabold leading-tight tracking-[-0.04em] text-gray-900 sm:text-5xl lg:text-6xl">
            Tailor your CV to any
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">job description.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600 sm:mt-5 sm:text-lg">
            Most resumes get rejected before a human ever reads them.
            Upload yours, paste the job description, and get a tailored CV
            that actually passes the filter — in under a minute.
          </p>

          {/* Micro flow — Upload → Match → Download */}
          <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-gray-400 sm:mt-6">
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Upload</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Match</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Download</span>
          </div>

          {/* "No signup" badge — above CTA on mobile, below on desktop */}
          <div className="mt-6 flex justify-center sm:hidden">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              No signup required
            </span>
          </div>

          {/* Primary CTA — large, unmissable, min 48px touch target */}
          <div className="mt-4 flex flex-col items-center gap-3 sm:mt-8 sm:gap-4">
            <Link
              href="/analyze?action=upload"
              className="group relative inline-flex min-h-[48px] items-center gap-3 rounded-xl bg-blue-600 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30"
            >
              <svg className="h-6 w-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Optimize My Resume — Free
            </Link>
            <p className="text-sm text-gray-500">No credit card. No signup. Results in 60 seconds.</p>
            <div className="flex items-center gap-3">
              <SampleResumeModal />
              <span className="hidden text-sm text-gray-400 sm:inline">PDF, DOCX, or paste text</span>
            </div>
          </div>

          {/* Social proof counter — dynamic, client component */}
          <SocialProofCounter />

          {/* Trust strip — "No signup" badge hidden on mobile (shown above CTA instead) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {TRUST_ITEMS.map((item) => (
              <span
                key={item}
                className={`inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700${item === "No signup required" ? " hidden sm:inline-flex" : ""}`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo + How it works */}
      <section className="border-t border-gray-100 bg-white px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">See it in action</h2>
          <p className="mt-2 text-gray-600">
            Upload, match, download — watch the entire flow in seconds.
          </p>
          <div className="mt-10">
            <AnimatedDemo />
          </div>
          <Link
            href="/analyze?action=upload"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Try It Yourself — Free
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          {/* 3 steps below the demo */}
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Upload your CV", desc: "Drop a PDF or DOCX — we extract it instantly." },
              { step: "2", title: "Paste the job description", desc: "Copy the target listing so we can match keywords." },
              { step: "3", title: "Get your Match Score", desc: "See what's blocking callbacks and how to fix it." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {s.step}
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After Score Preview */}
      <section className="bg-gradient-to-b from-white to-blue-50/50 px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Stop losing interviews to a weak resume
          </h2>
          <p className="mt-2 text-gray-600">
            Real example: a Software Engineer resume matched against a Senior Full-Stack role.
          </p>
          <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12">
            {/* Before */}
            <div className="w-48 rounded-xl border-2 border-red-200 bg-white p-6 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Before</p>
              <p className="mt-2 text-5xl font-bold text-red-500">47</p>
              <p className="mt-1 text-sm text-gray-500">Match Score</p>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-400">Missing keywords</p>
                <p className="text-xs text-gray-400">Weak action verbs</p>
                <p className="text-xs text-gray-400">No metrics</p>
              </div>
            </div>
            {/* Arrow */}
            <div className="flex flex-col items-center gap-1">
              <svg className="h-8 w-8 rotate-90 text-blue-500 sm:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">ResumeMate AI</span>
            </div>
            {/* After */}
            <div className="w-48 rounded-xl border-2 border-green-200 bg-white p-6 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-500">After</p>
              <p className="mt-2 text-5xl font-bold text-green-500">84</p>
              <p className="mt-1 text-sm text-gray-500">Match Score</p>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-400">Keywords aligned</p>
                <p className="text-xs text-gray-400">Impact-driven bullets</p>
                <p className="text-xs text-gray-400">Quantified results</p>
              </div>
            </div>
          </div>
          <p className="mt-8 text-sm text-gray-500">
            +37 point improvement — same resume, same experience, better presentation.
          </p>
          <p className="mt-2 text-xs font-medium text-blue-600">
            Optimized resumes are 3x more likely to land interview callbacks.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Stop guessing why you&apos;re not getting callbacks
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-xl border border-gray-200 p-6"
              >
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Trusted by job seekers worldwide
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Real results from real users.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                    {t.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Simple, fair pricing
          </h2>
          <p className="mt-2 text-gray-600">
            No subscription. No surprises. Just results.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {/* Free Quick Scan */}
            <div className="rounded-xl border-2 border-gray-200 bg-white p-8 text-left">
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Quick Scan
              </p>
              <p className="mt-2 text-4xl font-bold text-gray-900">
                Free
              </p>
              <p className="mt-1 text-sm text-gray-500">No payment required</p>
              <ul className="mt-5 space-y-2 text-sm text-gray-600">
                {[
                  "Match Score",
                  "5-dimension breakdown",
                  "Top blocker with fix",
                  "Missing keywords",
                  "Strengths & gaps",
                  "1 bullet rewrite preview",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-500">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/analyze?action=upload"
                className="mt-6 block rounded-lg border border-gray-300 px-6 py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Scan My Resume Free
              </Link>
            </div>

            {/* Pro Plan — highlighted "Most Popular" */}
            <div className="relative rounded-xl border-2 border-blue-500 bg-white p-8 shadow-md text-left">
              <div className="absolute -top-3 left-4">
                <span className="rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Most Popular
                </span>
              </div>
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Pro
              </p>
              <p className="mt-2 text-4xl font-bold text-gray-900">
                {PRO_PRICE_DISPLAY}
                <span className="text-base font-normal text-gray-500"> one-time</span>
              </p>
              <p className="mt-1 text-sm text-gray-500">1 job + 2 re-generations</p>
              <p className="mt-1 text-xs text-gray-400 line-through">Resume writers charge $300–500</p>
              <ul className="mt-5 space-y-2 text-sm text-gray-600">
                {[
                  "Full tailored resume",
                  "Full cover letter",
                  "Recruiter insights",
                  "PDF, DOCX, TXT exports",
                  "Bulk CV Generator",
                  "Radar before/after",
                  "Re-generate versions (x2)",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 text-blue-500">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/analyze?action=upload"
                className="mt-6 block rounded-lg bg-blue-600 px-6 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
              >
                Get Pro — {PRO_PRICE_DISPLAY}
              </Link>
            </div>

            {/* Career Pass */}
            <div className="rounded-xl border-2 border-gray-200 bg-white p-8 text-left">
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Career Pass
              </p>
              <p className="mt-2 text-4xl font-bold text-gray-900">
                {CAREER_PASS_DISPLAY}
                <span className="text-base font-normal text-gray-500"> / 30 days</span>
              </p>
              <p className="mt-1 text-sm text-gray-500">50 jobs over 30 days</p>
              <ul className="mt-5 space-y-2 text-sm text-gray-600">
                {[
                  "Everything in Pro",
                  "50 jobs over 30 days",
                  "Unlimited job descriptions",
                  "Career dashboard",
                  "Priority processing",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 text-indigo-500">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/analyze?action=upload"
                className="mt-6 block rounded-lg border border-indigo-300 bg-indigo-50 px-6 py-2.5 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Get Career Pass — {CAREER_PASS_DISPLAY}
              </Link>
            </div>
          </div>

          {/* Guarantee + trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              100% Money-Back Guarantee
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secured by Stripe
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              One-time payment
            </span>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Free quick scan included — no payment required to start.
          </p>
        </div>
      </section>

      {/* Bottom CTA banner */}
      <section className="bg-blue-600 px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Don&apos;t send another application with an unoptimized CV
          </h2>
          <p className="mt-2 text-blue-100">
            Every generic resume you send is an interview you&apos;ll never get.
            Upload, tailor, and download — free, no signup.
          </p>
          <Link
            href="/analyze?action=upload"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-blue-600 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Optimize My Resume Now
          </Link>
          <p className="mt-3 text-sm text-blue-200">No credit card. No signup. Free instant analysis.</p>
        </div>
      </section>

      {/* Share */}
      <section className="px-4 pt-12">
        <div className="mx-auto max-w-md">
          <ShareCard />
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="border-t border-gray-100 bg-white px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Your data stays yours
          </h2>
          <p className="mt-2 text-gray-600">
            Privacy isn&apos;t a feature — it&apos;s how we built this from day one.
          </p>
          <div className="mt-8 grid gap-6 text-left sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Auto-deleted</h3>
              <p className="mt-1 text-xs text-gray-500">Your resume and job description are processed in memory and automatically deleted. Nothing is stored on our servers.</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">No account needed</h3>
              <p className="mt-1 text-xs text-gray-500">No signup, no email, no tracking cookies. Just upload and go. We never collect personal information from your documents.</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Secure payments</h3>
              <p className="mt-1 text-xs text-gray-500">All payments handled by Stripe. We never see or store your card details. One-time payment, no recurring charges.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Frequently asked questions
          </h2>
          <FAQ items={FAQ_ITEMS} />
        </div>
      </section>
    </div>
  );
}
