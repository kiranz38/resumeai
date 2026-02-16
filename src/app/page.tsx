import Link from "next/link";
import FAQ from "@/components/FAQ";
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

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white px-4 pb-24 pt-20">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-indigo-100/30 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
            Free instant analysis
          </span>
          <h1 className="font-[var(--font-inter)] text-4xl font-extrabold tracking-[-0.04em] text-gray-900 sm:text-5xl lg:text-6xl">
            Stop guessing why you&apos;re not
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">getting callbacks.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
            Upload your resume, paste a job description, and see exactly what&apos;s missing.
            Get your Match Score in 30 seconds.
          </p>

          {/* Primary CTA — large, unmissable */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/analyze"
              className="group relative inline-flex items-center gap-3 rounded-xl bg-blue-600 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30"
            >
              <svg className="h-6 w-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Your Resume
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/demo"
                className="text-sm font-medium text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
              >
                See a demo first
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-400">PDF, DOCX, or paste text</span>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {TRUST_ITEMS.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
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

      {/* How it works — 3 steps */}
      <section className="border-t border-gray-100 bg-white px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Three steps. 30 seconds.
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
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

      {/* Benefits */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Everything you need to land the interview
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

      {/* Pricing */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Simple, fair pricing
          </h2>
          <p className="mt-2 text-gray-600">
            No subscription. No surprises. Just results.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* Pro Plan */}
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
              <p className="mt-1 text-sm text-gray-500">1 job analysis + 2 re-generations</p>
              <ul className="mt-5 space-y-2 text-sm text-gray-600">
                {[
                  "Full tailored resume rewrite",
                  "Custom cover letter draft",
                  "Complete keyword heatmap",
                  "Recruiter-style feedback",
                  "All bullet rewrites (12-20)",
                  "Bulk CV Generator",
                  "PDF, DOCX, TXT exports",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 text-blue-500">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/analyze"
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
                  "Career dashboard with history",
                  "Priority processing",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 text-indigo-500">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/analyze"
                className="mt-6 block rounded-lg border border-indigo-300 bg-indigo-50 px-6 py-2.5 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Get Career Pass — {CAREER_PASS_DISPLAY}
              </Link>
            </div>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Free quick scan included — no payment required to start. Secure payment via Stripe.
          </p>
        </div>
      </section>

      {/* Bottom CTA banner */}
      <section className="bg-blue-600 px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to see what&apos;s holding you back?
          </h2>
          <p className="mt-2 text-blue-100">
            Upload your resume and get your Match Score in under a minute. Free, no signup.
          </p>
          <Link
            href="/analyze"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-blue-600 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Your Resume Now
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16">
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
