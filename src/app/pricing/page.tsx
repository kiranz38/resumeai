import type { Metadata } from "next";
import Link from "next/link";
import FAQ from "@/components/FAQ";
import { PRO_PRICE_DISPLAY, CAREER_PASS_DISPLAY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple one-time pricing. Free Radar Score included. Pro with full rewrites for $7.99 or Career Pass for $19/30 days unlimited.",
};

const PRICING_FAQ = [
  {
    question: "Is the Quick Scan really free?",
    answer:
      "Yes! The Quick Scan gives you your Radar Score, signal breakdown, top blocker, missing keywords, and actionable suggestions — completely free, no account or payment needed.",
  },
  {
    question: "Is this a subscription?",
    answer:
      "No. Pro is a one-time payment for one resume + job description analysis. Career Pass gives you 30 days of unlimited analyses — still no recurring charges.",
  },
  {
    question: "Can I analyze multiple job descriptions?",
    answer:
      "Each Pro payment covers one full analysis. You can run as many free Quick Scans as you like. The Career Pass ($19) gives you unlimited Pro analyses for 30 days — perfect for active job seekers.",
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
      <div className="mx-auto max-w-5xl">
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Simple, transparent pricing
        </h1>
        <p className="mt-2 text-center text-gray-600">
          No subscription. No account. Pay once, get your results.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Free tier */}
          <div className="rounded-xl border border-gray-200 bg-white p-8">
            <h2 className="text-lg font-semibold text-gray-900">Quick Scan</h2>
            <p className="mt-1 text-3xl font-bold text-gray-900">Free</p>
            <p className="mt-2 text-sm text-gray-500">No payment required</p>
            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              {[
                "Radar Score with 5-dimension breakdown",
                "Top blocker with fix",
                "Missing keywords (grouped)",
                "Strengths analysis",
                "Gaps & fixes",
                "3 bullet rewrite previews",
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
            <h2 className="text-lg font-semibold text-gray-900">Pro</h2>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {PRO_PRICE_DISPLAY}
              <span className="text-base font-normal text-gray-500"> one-time</span>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Everything free, plus:
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              {[
                "Full tailored resume rewrite",
                "Custom cover letter draft",
                "All blockers with detailed fixes",
                "Complete keyword heatmap",
                "Recruiter-style feedback",
                "All 12-20 bullet rewrites",
                "Experience gap analysis",
                "PDF, DOCX, and TXT exports",
                "Email delivery of report",
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
              No subscription. No surprises.
            </p>
          </div>

          {/* Career Pass */}
          <div className="rounded-xl border border-gray-200 bg-white p-8">
            <h2 className="text-lg font-semibold text-gray-900">Career Pass</h2>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {CAREER_PASS_DISPLAY}
              <span className="text-base font-normal text-gray-500"> / 30 days</span>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Everything Pro, plus:
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              {[
                "Unlimited Pro analyses",
                "Unlimited job descriptions",
                "Priority processing",
                "Perfect for active job seekers",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-indigo-500">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-gray-400 italic">
              Applying to multiple roles? This is for you.
            </p>
            <Link
              href="/analyze"
              className="mt-6 block rounded-lg border border-indigo-300 bg-indigo-50 px-6 py-2.5 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Get Career Pass
            </Link>
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
