"use client";

import { useState } from "react";
import { PRO_PRICE_DISPLAY } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";

/** Trusted domains for checkout redirects */
const TRUSTED_REDIRECT_HOSTS = new Set(["checkout.stripe.com", "pay.stripe.com"]);

function isSafeRedirect(url: string): boolean {
  if (url.startsWith("/")) return true;
  try { return TRUSTED_REDIRECT_HOSTS.has(new URL(url).hostname); }
  catch { return false; }
}

interface ProUpgradeCardProps {
  onUpgrade?: () => void;
}

const PRO_FEATURES = [
  "Full tailored resume rewrite (ATS-optimized)",
  "Custom cover letter draft",
  "Complete keyword heatmap with placements",
  "Recruiter-style feedback",
  "All bullet rewrites (12-20)",
  "Experience gap analysis with suggestions",
  "Bulk CV Generator — select from Job Board or paste up to 5 JDs",
  "Downloadable PDF, DOCX, and TXT exports",
  "Email delivery of your report",
];

export default function ProUpgradeCard({ onUpgrade }: ProUpgradeCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlockPro = async () => {
    setError(null);
    trackEvent("pro_generate_clicked");
    onUpgrade?.();

    const resumeText = sessionStorage.getItem("rt_resume_text");
    const jdText = sessionStorage.getItem("rt_jd_text");

    if (!resumeText || !jdText) {
      setError("Resume data not found. Please re-analyze your resume first.");
      return;
    }

    // Mark pending generation
    sessionStorage.setItem("rt_pending_pro", "true");

    try {
      setIsGenerating(true);
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Checkout failed");
      }

      const data = await res.json();

      if (data.devMode && data.token) {
        // Dev mode: store token and redirect directly
        sessionStorage.setItem("rt_entitlement_token", data.token);
        sessionStorage.setItem("rt_entitlement_plan", "pro");
        if (isSafeRedirect(data.url)) window.location.href = data.url;
      } else if (data.url && isSafeRedirect(data.url)) {
        // Production: redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout. Please try again.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-blue-200 opacity-20" />
      <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-24 w-24 rounded-full bg-indigo-200 opacity-20" />

      <div className="relative">
        <div className="mb-2 inline-block rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
          Pro
        </div>

        <h3 className="mb-2 text-2xl font-bold text-gray-900">
          Unlock Pro — {PRO_PRICE_DISPLAY} one-time
        </h3>
        <p className="mb-1 text-sm text-gray-600">
          Unlock the complete analysis with tailored rewrites, cover letter, and downloadable exports.
        </p>
        <p className="mb-4 text-xs text-gray-400">No subscription. No surprises.</p>

        <ul className="mb-6 space-y-2">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={handleUnlockPro}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                Unlock Pro
                <span className="text-blue-200">|</span>
                <span>{PRO_PRICE_DISPLAY}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
