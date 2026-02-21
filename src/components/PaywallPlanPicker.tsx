"use client";

import { useState } from "react";
import { TRIAL_PRICE_DISPLAY, PRO_PRICE_DISPLAY, CAREER_PASS_DISPLAY } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";
import { validateJD } from "@/lib/jd-validator";
import type { Plan } from "@/lib/entitlement";

const TRUSTED_REDIRECT_HOSTS = new Set(["checkout.stripe.com", "pay.stripe.com"]);
function isSafeRedirect(url: string): boolean {
  if (url.startsWith("/")) return true;
  try { return TRUSTED_REDIRECT_HOSTS.has(new URL(url).hostname); }
  catch { return false; }
}

interface PaywallPlanPickerProps {
  /** Pre-select a plan (e.g., from a quota-exhausted upsell) */
  defaultPlan?: Plan;
  /** Context: where the picker is shown (for analytics) */
  context?: string;
  /** Optional message to show above plans (e.g., "Quota exhausted") */
  message?: string;
  /** Compact mode for inline embedding */
  compact?: boolean;
  /** Hide trial option (e.g. after trial used, or quota-exhausted upsell) */
  hideTrial?: boolean;
}

const TRIAL_FEATURES = [
  "Full tailored resume",
  "Full cover letter",
  "Recruiter insights",
  "Keyword checklist",
  "Editable content",
  "PDF, DOCX, TXT exports",
];

const PRO_FEATURES = [
  "Everything in Trial",
  "Email delivery",
  "Bulk CV Generator",
  "Radar before/after",
  "Re-generate versions (x2)",
  "Priority support",
];

const PASS_FEATURES = [
  "Everything in Pro",
  "50 jobs over 30 days",
  "Unlimited job descriptions",
  "Career dashboard with history",
  "Priority processing",
];

export default function PaywallPlanPicker({
  defaultPlan,
  context = "paywall",
  message,
  compact = false,
  hideTrial = false,
}: PaywallPlanPickerProps) {
  const [loading, setLoading] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Show trial unless explicitly hidden or this is a quota-exhausted upsell
  const showTrial = !hideTrial && !defaultPlan;

  const handleCheckout = async (plan: Plan) => {
    setError(null);
    setLoading(plan);
    trackEvent("plan_selected", { plan, context });

    try {
      // Ensure resume data exists and JD is valid
      const resumeText = sessionStorage.getItem("rt_resume_text");
      const jdText = sessionStorage.getItem("rt_jd_text");
      if (!resumeText || !jdText) {
        setError("Resume data not found. Please re-analyze your resume first.");
        setLoading(null);
        return;
      }

      const jdCheck = validateJD(jdText);
      if (!jdCheck.valid) {
        setError(jdCheck.reason || "Job description is too short or invalid. Please go back and paste the full job listing.");
        setLoading(null);
        return;
      }

      // Mark pending generation
      sessionStorage.setItem("rt_pending_pro", "true");

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Checkout failed");
      }

      const data = await res.json();

      if (data.devMode && data.token) {
        // Dev mode: store token and redirect
        sessionStorage.setItem("rt_entitlement_token", data.token);
        sessionStorage.setItem("rt_entitlement_plan", plan);
        if (isSafeRedirect(data.url)) window.location.href = data.url;
      } else if (data.url && isSafeRedirect(data.url)) {
        // Production: redirect to Stripe
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
      setLoading(null);
    }
  };

  return (
    <div className={compact ? "" : "mx-auto max-w-4xl"}>
      {message && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{message}</span>
        </div>
      )}

      {/* Social proof */}
      <div className="mb-5 text-center">
        <div className="mx-auto max-w-md rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-center gap-1 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-sm italic text-gray-600">&ldquo;Went from 47 to 84. Got 3 interviews in 2 weeks.&rdquo;</p>
          <p className="mt-1 text-xs font-medium text-gray-500">&mdash; Lucas R.</p>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Join 10,000+ job seekers &middot; 100% money-back guarantee &middot; Ready in 60 seconds
        </p>
      </div>

      <div className={`grid gap-4 ${showTrial ? (compact ? "grid-cols-1 sm:grid-cols-3" : "md:grid-cols-3") : (compact ? "grid-cols-1 sm:grid-cols-2" : "md:grid-cols-2")}`}>
        {/* Career Trial */}
        {showTrial && (
          <div className="relative rounded-xl border-2 border-emerald-500 bg-white p-6 transition-all shadow-md">
            <div className="absolute -top-3 left-4">
              <span className="rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white">
                Try It
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Career Trial</h3>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {TRIAL_PRICE_DISPLAY}
              <span className="text-sm font-normal text-gray-500"> one-time</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">1 job, full results</p>

            {!compact && (
              <ul className="mt-4 space-y-2">
                {TRIAL_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5 text-emerald-500">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={() => handleCheckout("trial")}
              disabled={loading !== null}
              className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading === "trial" ? "Processing..." : `See My Full Results — ${TRIAL_PRICE_DISPLAY}`}
            </button>
            <p className="mt-2 text-center text-xs text-gray-400">Upgrade to Pro anytime.</p>
          </div>
        )}

        {/* Pro Plan */}
        <div
          className={`relative rounded-xl border-2 p-6 transition-all ${
            defaultPlan === "pass"
              ? "border-gray-200 bg-white"
              : "border-primary bg-blue-50/30 shadow-md"
          }`}
        >
          {!defaultPlan && (
            <div className="absolute -top-3 left-4">
              <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                Most Popular
              </span>
            </div>
          )}
          <h3 className="text-lg font-bold text-gray-900">Pro</h3>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {PRO_PRICE_DISPLAY}
            <span className="text-sm font-normal text-gray-500"> one-time</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">1 job + 2 re-generations</p>

          {!compact && (
            <ul className="mt-4 space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 text-primary">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => handleCheckout("pro")}
            disabled={loading !== null}
            className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {loading === "pro" ? "Processing..." : `Fix My Resume Now — ${PRO_PRICE_DISPLAY}`}
          </button>
        </div>

        {/* Career Pass */}
        <div
          className={`relative rounded-xl border-2 p-6 transition-all ${
            defaultPlan === "pass"
              ? "border-indigo-500 bg-indigo-50/30 shadow-md"
              : "border-gray-200 bg-white"
          }`}
        >
          {defaultPlan === "pass" && (
            <div className="absolute -top-3 left-4">
              <span className="rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                Recommended
              </span>
            </div>
          )}
          <h3 className="text-lg font-bold text-gray-900">Career Pass</h3>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {CAREER_PASS_DISPLAY}
            <span className="text-sm font-normal text-gray-500"> / 30 days</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">50 jobs over 30 days</p>

          {!compact && (
            <ul className="mt-4 space-y-2">
              {PASS_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 text-indigo-500">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => handleCheckout("pass")}
            disabled={loading !== null}
            className="mt-4 w-full rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50"
          >
            {loading === "pass" ? "Processing..." : `Get Career Pass — ${CAREER_PASS_DISPLAY}`}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {error}
        </div>
      )}

      <p className="mt-3 text-center text-xs text-gray-400">
        No subscription. Secure payment via Stripe.
      </p>
    </div>
  );
}
