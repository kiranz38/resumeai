import Link from "next/link";
import FAQ from "@/components/FAQ";
import { PRO_PRICE_DISPLAY } from "@/lib/constants";

const FAQ_ITEMS = [
  {
    question: "Is my resume data stored or shared?",
    answer:
      "No. Your resume and job description are processed in memory and never stored on our servers. We use anonymous analytics only — no personal data is retained.",
  },
  {
    question: "How does the Radar Score work?",
    answer:
      "We analyze your resume across five dimensions — Impact, Clarity, Ownership, Seniority, and Alignment — to compute how strongly your resume signals to hiring managers. Each category uses deterministic heuristics: metrics density, verb strength, keyword overlap, and more.",
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
      "See your Hiring Manager Radar Score and get a categorized map of missing keywords with specific placement suggestions.",
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
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Hiring Manager Radar for your resume.
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Paste your resume + job description. See what&apos;s blocking callbacks — then fix it in minutes.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/analyze"
              className="rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Check my resume
            </Link>
            <Link
              href="/demo"
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              See a demo
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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

      {/* Pricing teaser */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Simple, fair pricing
          </h2>
          <p className="mt-2 text-gray-600">
            No subscription. No surprises. Just results.
          </p>
          <div className="mt-8 inline-block rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Unlock Pro
            </p>
            <p className="mt-2 text-4xl font-bold text-gray-900">
              {PRO_PRICE_DISPLAY}
              <span className="text-base font-normal text-gray-500"> one-time</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">No subscription. No surprises.</p>
            <ul className="mt-4 space-y-2 text-left text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-500">&#10003;</span>
                12-20 tailored bullet rewrites
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-500">&#10003;</span>
                Full keyword map with placements
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-500">&#10003;</span>
                Experience gap analysis
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-500">&#10003;</span>
                Cover letter draft
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-500">&#10003;</span>
                Downloadable report
              </li>
            </ul>
            <Link
              href="/analyze"
              className="mt-6 block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Get started
            </Link>
            <p className="mt-3 text-xs text-gray-400">
              Free quick scan included — no payment required to start
            </p>
          </div>
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
