"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { APPLY_PACK_5_DISPLAY } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";

const isDev = process.env.NODE_ENV === "development";

/** Trusted domains for checkout redirects */
const TRUSTED_REDIRECT_HOSTS = new Set(["checkout.stripe.com", "pay.stripe.com"]);

function isSafeRedirect(url: string): boolean {
  if (url.startsWith("/")) return true;
  try { return TRUSTED_REDIRECT_HOSTS.has(new URL(url).hostname); }
  catch { return false; }
}

interface PackJob {
  id: string;
  title: string;
  jd: string;
}

interface ApplyPackFlowProps {
  resumeText: string;
}

function createEmptyJob(): PackJob {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    jd: "",
  };
}

const MAX_JOBS = 5;

export default function ApplyPackFlow({ resumeText }: ApplyPackFlowProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<PackJob[]>(() => [createEmptyJob()]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized pricing based on job count
  const pricing = useMemo(() => {
    return { display: APPLY_PACK_5_DISPLAY, product: "apply_pack_5" as const };
  }, []);

  const validJobs = useMemo(
    () => jobs.filter((j) => j.title.trim() && j.jd.trim().length >= 30),
    [jobs],
  );

  const updateJob = useCallback((id: string, field: "title" | "jd", value: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, [field]: value } : j)),
    );
  }, []);

  const removeJob = useCallback((id: string) => {
    setJobs((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((j) => j.id !== id);
    });
  }, []);

  const addJob = useCallback(() => {
    setJobs((prev) => {
      if (prev.length >= MAX_JOBS) return prev;
      return [...prev, createEmptyJob()];
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (validJobs.length === 0) {
      setError("Please add at least one job with a title and description.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Store pack data in sessionStorage for results page
      sessionStorage.setItem("rt_resume_text", resumeText);
      sessionStorage.setItem(
        "rt_pack_jobs",
        JSON.stringify(validJobs.map((j) => ({ title: j.title, jd: j.jd }))),
      );

      trackEvent("apply_pack_generate", { jobCount: validJobs.length });

      if (isDev) {
        // Skip Stripe in development — go straight to generation
        router.push("/results/pack");
        return;
      }

      // Production: Stripe checkout
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: pricing.product }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session.");
      }

      const data = await response.json();
      if (data.url && isSafeRedirect(data.url)) {
        window.location.href = data.url;
      } else {
        throw new Error("No valid checkout URL returned.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed. Please try again.",
      );
      setIsLoading(false);
    }
  }, [validJobs, resumeText, pricing.product, router]);

  return (
    <div>
      {/* Resume summary card */}
      <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium text-green-700">
            Resume loaded ({resumeText.length.toLocaleString()} characters)
          </span>
        </div>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-gray-900">
        Job Descriptions ({jobs.length}/{MAX_JOBS})
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        Paste up to {MAX_JOBS} different job descriptions below. We&apos;ll generate a
        separate tailored CV and cover letter for each one, matched to your resume.
      </p>
      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-sm text-blue-700">
          <span className="font-medium">How it works:</span> Your resume stays the same — for each
          job description you add, we rewrite and tailor your CV to highlight the most relevant
          experience, skills, and keywords for that specific role. You&apos;ll get {MAX_JOBS} unique,
          job-ready CVs.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {jobs.map((job, idx) => (
          <div
            key={job.id}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Job {idx + 1}
              </span>
              {jobs.length > 1 && (
                <button
                  onClick={() => removeJob(job.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              type="text"
              value={job.title}
              onChange={(e) => updateJob(job.id, "title", e.target.value)}
              placeholder="Job title (e.g. Senior Frontend Engineer)"
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <textarea
              value={job.jd}
              onChange={(e) => updateJob(job.id, "jd", e.target.value)}
              placeholder="Paste the full job description..."
              className="h-32 w-full resize-none rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      {jobs.length < MAX_JOBS && (
        <button
          onClick={addJob}
          className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-800 hover:text-blue-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add another job
        </button>
      )}

      {/* CTA */}
      <div className="mt-6 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div>
          <p className="text-sm text-gray-600">
            {validJobs.length} job{validJobs.length !== 1 ? "s" : ""} ready
          </p>
          {!isDev && (
            <>
              <p className="text-lg font-bold text-gray-900">{pricing.display}</p>
              <p className="text-xs text-gray-400">Up to {MAX_JOBS} jobs</p>
            </>
          )}
          {isDev && (
            <p className="text-xs text-gray-400">Dev mode — Stripe skipped</p>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading || validJobs.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : (
            "Generate All Packs"
          )}
        </button>
      </div>
    </div>
  );
}
