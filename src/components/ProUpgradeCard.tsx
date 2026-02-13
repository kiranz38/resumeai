"use client";

import { useState } from "react";
import { PRICE_DISPLAY } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";

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
  "Downloadable PDF, DOCX, and TXT exports",
];

export default function ProUpgradeCard({ onUpgrade }: ProUpgradeCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlockPro = async () => {
    setError(null);
    trackEvent("pro_generate_clicked");
    onUpgrade?.();

    // Check if Stripe is configured
    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!stripeKey) {
      // Dev mode: generate Pro output for free
      setIsGenerating(true);
      try {
        const resumeText = sessionStorage.getItem("rt_resume_text");
        const jdText = sessionStorage.getItem("rt_jd_text");

        if (!resumeText || !jdText) {
          setError("Resume data not found. Please re-analyze your resume first.");
          setIsGenerating(false);
          return;
        }

        const response = await fetch("/api/generate-pro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText, jobDescriptionText: jdText }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Generation failed");
        }

        const result = await response.json();
        sessionStorage.setItem("rt_pro_result", JSON.stringify(result));
        setIsUnlocked(true);

        // Redirect to pro results
        window.location.href = "/results/pro";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate Pro results.");
        setIsGenerating(false);
      }
      return;
    }

    // Stripe is configured - redirect to checkout
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
      });
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      setError("Unable to start checkout. Please try again.");
    }
  };

  if (isUnlocked) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-blue-200 opacity-20" />
      <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-24 w-24 rounded-full bg-indigo-200 opacity-20" />

      <div className="relative">
        <div className="mb-2 inline-block rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
          {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "Pro" : "Pro Preview Mode"}
        </div>

        <h3 className="mb-2 text-2xl font-bold text-gray-900">
          Get Your Full Tailor Pack
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Unlock the complete analysis with tailored rewrites, cover letter, and downloadable exports.
        </p>

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
                <span>{PRICE_DISPLAY}</span>
              </>
            )}
          </button>
          {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
            <span className="text-xs text-gray-400">
              Stripe not configured — free in dev mode
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
