import type { Metadata } from "next";
import Link from "next/link";
import FAQ from "@/components/FAQ";
import CheckoutButton from "@/components/CheckoutButton";
import { TRIAL_PRICE_DISPLAY, PRO_PRICE_DISPLAY, CAREER_PASS_DISPLAY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple one-time pricing. Free Radar Score included. Career Trial for $1.50, Pro for $5, or Career Pass for $10/30 days.",
};

const PRICING_FAQ = [
  {
    question: "Is the Quick Scan really free?",
    answer:
      "Yes! The Quick Scan gives you your Hiring Manager Radar, signal breakdown, top blocker, missing keywords, and actionable suggestions — completely free, no account or payment needed.",
  },
  {
    question: "What do I get with the Career Trial?",
    answer:
      "For just $1.50, you get a full tailored resume, cover letter, recruiter insights, keyword checklist, and TXT export for one role. It's a one-time payment — no subscription. Upgrade to Pro anytime to unlock PDF/DOCX exports.",
  },
  {
    question: "Is this a subscription?",
    answer:
      "No. Trial and Pro are one-time payments. Career Pass gives you 30 days of analyses — still no recurring charges.",
  },
  {
    question: "Can I analyze multiple job descriptions?",
    answer:
      "Each Trial or Pro payment covers one full analysis. The Career Pass gives you 50 Pro analyses for 30 days — perfect for active job seekers.",
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
      <div className="mx-auto max-w-6xl">
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Simple, transparent pricing
        </h1>
        <p className="mt-2 text-center text-gray-600">
          No subscription. No account. Pay once, get your results.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {/* Free tier */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Quick Scan</h2>
            <p className="mt-1 text-3xl font-bold text-gray-900">Free</p>
            <p className="mt-2 text-sm text-gray-500">No payment required</p>
            <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
              {[
                "Hiring Manager Radar",
                "5-dimension breakdown",
                "Top blocker with fix",
                "Missing keywords",
                "Strengths & gaps",
                "1 bullet rewrite preview",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-500">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/analyze"
              className="mt-6 block rounded-lg border border-gray-300 px-6 py-2.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Start free scan
            </Link>
          </div>

          {/* Career Trial */}
          <div className="relative rounded-xl border-2 border-emerald-500 bg-white p-6 shadow-md">
            <div className="absolute -top-3 left-4">
              <span className="rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white">
                Try It
              </span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Career Trial</h2>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {TRIAL_PRICE_DISPLAY}
              <span className="text-base font-normal text-gray-500"> one-time</span>
            </p>
            <p className="mt-2 text-sm text-gray-500">1 job, full results</p>
            <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
              {[
                "Full tailored resume",
                "Full cover letter",
                "Recruiter insights",
                "Keyword checklist",
                "Editable content",
                "PDF, DOCX, TXT exports",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-500">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
            <CheckoutButton
              plan="trial"
              label={`Try Career Trial — ${TRIAL_PRICE_DISPLAY}`}
              className="mt-6 block w-full rounded-lg bg-emerald-600 px-6 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            />
            <p className="mt-2 text-center text-xs text-gray-400">
              One-time trial. Upgrade anytime.
            </p>
          </div>

          {/* Pro tier */}
          <div className="relative rounded-xl border-2 border-blue-800 bg-white p-6 shadow-lg">
            <div className="absolute -top-3 left-4">
              <span className="rounded-full bg-blue-800 px-3 py-0.5 text-xs font-semibold text-white">
                Most Popular
              </span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Pro</h2>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {PRO_PRICE_DISPLAY}
              <span className="text-base font-normal text-gray-500"> one-time</span>
            </p>
            <p className="mt-2 text-sm text-gray-500">1 job + 2 re-generations</p>
            <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
              {[
                "Everything in Trial",
                "Email delivery",
                "Bulk CV Generator",
                "Radar before/after",
                "Re-generate versions (x2)",
                "Priority support",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-blue-500">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
            <CheckoutButton
              plan="pro"
              label={`Unlock Full Career Pack — ${PRO_PRICE_DISPLAY}`}
              className="mt-6 block w-full rounded-lg bg-blue-800 px-6 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
            />
            <p className="mt-2 text-center text-xs text-gray-400">
              No subscription. No surprises.
            </p>
          </div>

          {/* Career Pass */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Career Pass</h2>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {CAREER_PASS_DISPLAY}
              <span className="text-base font-normal text-gray-500"> / 30 days</span>
            </p>
            <p className="mt-2 text-sm text-gray-500">50 jobs over 30 days</p>
            <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
              {[
                "Everything in Pro",
                "50 job analyses",
                "Unlimited JDs",
                "Career dashboard",
                "Priority processing",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-indigo-500">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
            <CheckoutButton
              plan="pass"
              label={`Get Career Pass — ${CAREER_PASS_DISPLAY}`}
              className="mt-6 block w-full rounded-lg border border-indigo-300 bg-indigo-50 px-6 py-2.5 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
            />
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
