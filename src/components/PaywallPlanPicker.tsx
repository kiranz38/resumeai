"use client";

import { useState } from "react";
import { PRO_PRICE_DISPLAY, CAREER_PASS_DISPLAY } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";
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
}

const PRO_FEATURES = [
  "Full tailored resume rewrite",
  "Custom cover letter draft",
  "Complete keyword heatmap",
  "Recruiter-style feedback",
  "All bullet rewrites (12-20)",
  "Bulk CV Generator",
  "PDF, DOCX, TXT exports",
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
}: PaywallPlanPickerProps) {
  const [loading, setLoading] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (plan: Plan) => {
    setError(null);
    setLoading(plan);
    trackEvent("plan_selected", { plan, context });

    try {
      // Ensure resume data exists
      const resumeText = sessionStorage.getItem("rt_resume_text");
      const jdText = sessionStorage.getItem("rt_jd_text");
      if (!resumeText || !jdText) {
        setError("Resume data not found. Please re-analyze your resume first.");
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
    <div className={compact ? "" : "mx-auto max-w-3xl"}>
      {message && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {message}
        </div>
      )}

      <div className={`grid gap-4 ${compact ? "grid-cols-1 sm:grid-cols-2" : "md:grid-cols-2"}`}>
        {/* Pro Plan */}
        <div
          className={`relative rounded-xl border-2 p-6 transition-all ${
            defaultPlan === "pass"
              ? "border-gray-200 bg-white"
              : "border-blue-500 bg-blue-50/30 shadow-md"
          }`}
        >
          {!defaultPlan && (
            <div className="absolute -top-3 left-4">
              <span className="rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                Most Popular
              </span>
            </div>
          )}
          <h3 className="text-lg font-bold text-gray-900">Pro</h3>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {PRO_PRICE_DISPLAY}
            <span className="text-sm font-normal text-gray-500"> one-time</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">1 job analysis + 2 re-generations</p>

          {!compact && (
            <ul className="mt-4 space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 text-blue-500">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => handleCheckout("pro")}
            disabled={loading !== null}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === "pro" ? "Processing..." : `Get Pro — ${PRO_PRICE_DISPLAY}`}
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
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="mt-3 text-center text-xs text-gray-400">
        No subscription. Secure payment via Stripe.
      </p>
    </div>
  );
}
