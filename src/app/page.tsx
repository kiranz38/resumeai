import Link from "next/link";
import FAQ from "@/components/FAQ";
import ShareCard from "@/components/ShareCard";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import AnimatedDemo from "@/components/AnimatedDemo";
import RotatingText from "@/components/RotatingText";
import FadeInOnScroll from "@/components/FadeInOnScroll";
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
      <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Rewrite Pack",
    description:
      "Get 12-20 tailored bullet rewrites with stronger action verbs, scope, and impact — plus a skills section rewrite.",
    icon: (
      <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    title: "Action Plan",
    description:
      "Get a prioritized list of exactly what to fix, add, and improve — no guesswork, just clear next steps.",
    icon: (
      <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Bulk CV Generator",
    description:
      "Applying to multiple roles? Select jobs from our Job Board or paste up to 5 job descriptions — get a tailored CV for each, generated in parallel.",
    icon: (
      <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

const AVATAR_FACES = [
  { initial: "S", color: "bg-slate-600" },
  { initial: "J", color: "bg-primary" },
  { initial: "L", color: "bg-indigo-500" },
  { initial: "M", color: "bg-emerald-500" },
  { initial: "A", color: "bg-amber-500" },
];

const TESTIMONIALS = [
  {
    quote: "I was applying to 20+ jobs with the same resume and getting nothing. After tailoring my CV to a Product Manager role, I got an interview within a week.",
    name: "Lucas R.",
    role: "Product Manager",
    color: "bg-slate-600",
    score: "52 → 81",
  },
  {
    quote: "The keyword matching showed me exactly which skills were missing from my resume and rewrote my bullets to match the job description. Landed 3 interviews in 2 weeks.",
    name: "James T.",
    role: "Software Engineer",
    color: "bg-primary",
    score: "47 → 84",
  },
  {
    quote: "I was skeptical about another resume tool, but the free scan convinced me. The Match Score breakdown was so detailed I upgraded to Pro immediately.",
    name: "Sarah L.",
    role: "Marketing Analyst",
    color: "bg-indigo-500",
    score: "39 → 76",
  },
];

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* Sticky mobile CTA — appears after scrolling past hero */}
      <StickyMobileCTA />

      {/* Hero — full-width background image with text overlay */}
      <section className="relative overflow-hidden bg-gray-50">
        {/* Background image — right-aligned, sharp, no wash-out */}
        <div className="absolute inset-0 hidden lg:block">
          <img
            src="/images/hero-mockup.png"
            alt=""
            className="absolute right-[10%] top-1/2 w-[55%] max-w-[780px] -translate-y-1/2"
          />
          {/* Minimal gradient — thin fade only behind the text column */}
          <div className="absolute inset-y-0 left-0 w-[42%] bg-gradient-to-r from-gray-50 from-70% to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-16 sm:pb-24 sm:pt-24 lg:pb-28 lg:pt-28">
          <div className="max-w-xl text-center lg:max-w-lg lg:text-left">
            {/* Urgency hook */}
            <p className="mb-4 inline-block rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 sm:text-sm">
              Only 3% of resumes make it past the first screen
            </p>
            {/* min-h reserves space for the longest rotating word so layout doesn't shift */}
            <h1 className="min-h-[4.5rem] text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-gray-900 sm:min-h-[6rem] sm:text-[2.75rem] lg:min-h-[7.5rem] lg:text-[3.25rem]">
              The resume that gets you{" "}
              <RotatingText />
            </h1>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-gray-500 sm:text-lg lg:mx-0">
              Upload your CV, see what&apos;s holding you back, and fix it instantly.
            </p>

            {/* Primary CTA */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 lg:items-start">
              <Link
                href="/analyze?action=upload"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25"
              >
                Upload my resume
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <p className="text-sm text-gray-400">
                Free · No signup required
              </p>
            </div>

            {/* Avatar faces social proof */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 lg:justify-start">
              <div className="flex -space-x-2">
                {AVATAR_FACES.map((a) => (
                  <div
                    key={a.initial}
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${a.color} text-[10px] font-bold text-white ring-2 ring-white sm:h-8 sm:w-8 sm:text-xs`}
                  >
                    {a.initial}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-3.5 w-3.5 text-yellow-400 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-gray-500 sm:text-sm">
                  Trusted by 10,000+ job seekers
                </span>
              </div>
            </div>
          </div>

          {/* Mobile: show full image below text */}
          <div className="mt-10 lg:hidden">
            <img
              src="/images/hero-mockup.png"
              alt="ResumeMate product screenshot showing a resume analysis with score improvement"
              className="mx-auto w-full max-w-sm rounded-lg"
            />
          </div>

          {/* Thin stats strip */}
          <p className="mt-12 text-center text-xs text-gray-400 sm:text-sm lg:mt-16 lg:text-left">
            250 applicants compete for every opening · 97% never get a call · Recruiters spend 6 seconds on your resume
          </p>
        </div>
      </section>

      {/* Interactive demo — right below hero */}
      <section className="bg-white px-4 pb-16 pt-8 sm:pt-12">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">See it in action</h2>
          <AnimatedDemo />
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="border-t border-gray-100 bg-white px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">How it works</h2>
          <p className="mt-2 text-gray-600">
            Upload your CV and see how you score against real market roles — no job description needed.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Upload your CV", desc: "Drop a PDF or DOCX — we extract it instantly." },
              { step: "2", title: "We match against real roles", desc: "Your CV is scored against 45+ job profiles across your field." },
              { step: "3", title: "See where you stand", desc: "Get scores for 8-10 roles — including career growth paths." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
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
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Stop losing interviews to a weak resume
          </h2>
          <p className="mt-2 text-gray-600">
            Real example: a Software Engineer resume matched against a Senior Full-Stack role.
          </p>
          <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12">
            {/* Before */}
            <FadeInOnScroll direction="left">
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
            </FadeInOnScroll>
            {/* Arrow */}
            <FadeInOnScroll delay={200} direction="none">
              <div className="flex flex-col items-center gap-1">
                <svg className="h-8 w-8 rotate-90 text-blue-400 sm:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">ResumeMate AI</span>
              </div>
            </FadeInOnScroll>
            {/* After */}
            <FadeInOnScroll direction="right" delay={400}>
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
            </FadeInOnScroll>
          </div>
          <p className="mt-8 text-sm text-gray-500">
            +37 point improvement — same resume, same experience, better presentation.
          </p>
          <p className="mt-2 text-xs font-medium text-primary">
            Optimized resumes are 3x more likely to land interview callbacks.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Stop guessing why you&apos;re not getting callbacks
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {BENEFITS.map((benefit, i) => (
              <FadeInOnScroll key={benefit.title} delay={i * 150}>
                <div className="rounded-xl border border-gray-200 p-6">
                  <div className="mb-4">{benefit.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              </FadeInOnScroll>
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
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <FadeInOnScroll key={t.name} delay={i * 150}>
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${t.color} text-sm font-bold text-white`}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                  {t.score && (
                    <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      {t.score}
                    </span>
                  )}
                </div>
              </div>
              </FadeInOnScroll>
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
          <p className="mt-3 text-sm text-gray-500">
            Professional resume writers charge <span className="font-semibold text-gray-700">$300–500</span> per rewrite. Get the same result for <span className="font-semibold text-primary">$5</span>, instantly.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {/* Free Quick Scan */}
            <FadeInOnScroll delay={0}>
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
                  Check My Resume — Free
                </Link>
              </div>
            </FadeInOnScroll>

            {/* Pro Plan — highlighted "Most Popular" */}
            <FadeInOnScroll delay={150}>
              <div className="relative rounded-xl border-2 border-primary bg-white p-8 shadow-md text-left">
                <div className="absolute -top-3 left-4">
                  <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
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
                      <span className="mt-0.5 text-primary">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/analyze?action=deep"
                  className="mt-6 block rounded-lg bg-primary px-6 py-3 text-center text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  Get My Tailored Resume — {PRO_PRICE_DISPLAY}
                </Link>
              </div>
            </FadeInOnScroll>

            {/* Career Pass */}
            <FadeInOnScroll delay={300}>
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
                  href="/analyze?action=deep"
                  className="mt-6 block rounded-lg border border-indigo-300 bg-indigo-50 px-6 py-2.5 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  Get Career Pass — {CAREER_PASS_DISPLAY}
                </Link>
              </div>
            </FadeInOnScroll>
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
      <section className="bg-gray-900 px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Don&apos;t send another application with an unoptimized CV
          </h2>
          <p className="mt-2 text-gray-300">
            Every generic resume you send is an interview you&apos;ll never get.
            Upload, tailor, and download — free, no signup.
          </p>
          <Link
            href="/analyze?action=upload"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Check My Resume — Free
          </Link>
          <p className="mt-3 text-sm text-gray-400">No credit card. No signup. Free instant analysis.</p>
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
