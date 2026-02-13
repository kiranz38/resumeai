import type { Metadata } from "next";
import Link from "next/link";
import FAQ from "@/components/FAQ";
import { PRICE_DISPLAY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple one-time pricing. Free quick scan included. Full Tailor Pack with bullet rewrites, keyword map, cover letter, and exports for just $4.99.",
};

const PRICING_FAQ = [
  {
    question: "Is the Quick Scan really free?",
    answer:
      "Yes! The Quick Scan gives you your ATS match score, top missing keywords, 3 bullet rewrite samples, and actionable suggestions — completely free, no account or payment needed.",
  },
  {
    question: "Is this a subscription?",
    answer:
      "No. The Full Tailor Pack is a one-time payment for one resume + job description analysis. No recurring charges, no hidden fees.",
  },
  {
    question: "Can I analyze multiple job descriptions?",
    answer:
      "Each payment covers one full analysis. You can run as many free Quick Scans as you like. For Pro results on a different job description, you would purchase another pack.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards through Stripe. Your card details are never seen or stored by us — Stripe handles everything securely.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "We handle refund requests on a case-by-case basis. If you're not satisfied with your results, contact support@resumemate.ai and we'll work with you.",
  },
];

export default function PricingPage() {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Simple, transparent pricing
        </h1>
        <p className="mt-2 text-center text-gray-600">
          No subscription. No account. Pay once, get your results.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Free tier */}
          <div className="rounded-xl border border-gray-200 bg-white p-8">
            <h2 className="text-lg font-semibold text-gray-900">Quick Scan</h2>
            <p className="mt-1 text-3xl font-bold text-gray-900">Free</p>
            <p className="mt-2 text-sm text-gray-500">No payment required</p>
            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              {[
                "ATS Match Score (0-100)",
                "Missing keywords (grouped)",
                "Strengths analysis (3-5 items)",
                "Gaps & fixes (3-7 items)",
                "3 bullet rewrite previews",
                "ATS formatting warnings",
                "Actionable suggestions",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-500">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/analyze"
              className="mt-8 block rounded-lg border border-gray-300 px-6 py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Start free scan
            </Link>
          </div>

          {/* Pro tier */}
          <div className="relative rounded-xl border-2 border-blue-600 bg-white p-8 shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                Most Popular
              </span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Full Tailor Pack</h2>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {PRICE_DISPLAY}
              <span className="text-base font-normal text-gray-500"> one-time</span>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Everything in Quick Scan, plus:
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              {[
                "Full tailored resume rewrite (ATS-optimized)",
                "Custom cover letter draft",
                "Complete keyword heatmap with placements",
                "Recruiter-style feedback section",
                "All 12-20 bullet rewrites with notes",
                "Experience gap analysis with suggestions",
                "Skills section rewrite (categorized)",
                "Downloadable PDF, DOCX, and TXT exports",
                "Prioritized next-action checklist",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-blue-500">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/analyze"
              className="mt-8 block rounded-lg bg-blue-600 px-6 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
            >
              Get started
            </Link>
            <p className="mt-3 text-center text-xs text-gray-400">
              Free quick scan included — try before you buy
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Pricing FAQ
          </h2>
          <FAQ items={PRICING_FAQ} />
        </div>
      </div>
    </div>
  );
}
