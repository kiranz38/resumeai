"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProOutput } from "@/lib/schema";

interface PackJob {
  title: string;
  jd: string;
}

interface PackResult {
  title: string;
  status: "pending" | "generating" | "done" | "error";
  output?: ProOutput;
  error?: string;
}

function PackResultsInner() {
  const router = useRouter();
  const [results, setResults] = useState<PackResult[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const jobsRaw = sessionStorage.getItem("rt_pack_jobs");
    const resumeText = sessionStorage.getItem("rt_resume_text");

    if (!jobsRaw || !resumeText) {
      router.push("/analyze");
      return;
    }

    try {
      const jobs: PackJob[] = JSON.parse(jobsRaw);
      if (!jobs.length) {
        router.push("/analyze");
        return;
      }
      setResults(
        jobs.map((j) => ({
          title: j.title,
          status: "pending" as const,
        })),
      );
    } catch {
      router.push("/analyze");
    }
  }, [router]);

  // Sequential generation
  const generateNext = useCallback(
    async (idx: number, allResults: PackResult[]) => {
      const jobsRaw = sessionStorage.getItem("rt_pack_jobs");
      const resumeText = sessionStorage.getItem("rt_resume_text");
      if (!jobsRaw || !resumeText) return;

      const jobs: PackJob[] = JSON.parse(jobsRaw);
      if (idx >= jobs.length) {
        setIsGenerating(false);
        return;
      }

      const job = jobs[idx];
      setCurrentIdx(idx);

      // Mark as generating
      const updated = [...allResults];
      updated[idx] = { ...updated[idx], status: "generating" };
      setResults(updated);

      try {
        const response = await fetch("/api/generate-pro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText,
            jobDescriptionText: job.jd,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Generation failed (${response.status})`);
        }

        const output: ProOutput = await response.json();
        updated[idx] = {
          ...updated[idx],
          status: "done",
          output,
        };
        setResults([...updated]);

        // Continue to next
        await generateNext(idx + 1, updated);
      } catch (err) {
        updated[idx] = {
          ...updated[idx],
          status: "error",
          error: err instanceof Error ? err.message : "Generation failed",
        };
        setResults([...updated]);

        // Continue despite error
        await generateNext(idx + 1, updated);
      }
    },
    [],
  );

  // Start generation on first render with results
  useEffect(() => {
    if (results.length > 0 && !isGenerating && results.every((r) => r.status === "pending")) {
      setIsGenerating(true);
      generateNext(0, results);
    }
  }, [results, isGenerating, generateNext]);

  const doneCount = results.filter((r) => r.status === "done").length;
  const totalCount = results.length;
  const progressPercent = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const handleViewResult = useCallback(
    (result: PackResult) => {
      if (!result.output) return;
      sessionStorage.setItem("rt_pro_output", JSON.stringify(result.output));
      router.push("/results/pro");
    },
    [router],
  );

  if (results.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-gray-500">Loading your Apply Pack...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/analyze"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Apply Pack Results</h1>
        <p className="mt-1 text-gray-500">
          {isGenerating
            ? `Generating ${currentIdx + 1} of ${totalCount}...`
            : `${doneCount} of ${totalCount} complete`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Result cards */}
      <div className="space-y-3">
        {results.map((result, idx) => (
          <div
            key={idx}
            className={`rounded-xl border bg-white p-4 transition-shadow ${
              result.status === "generating"
                ? "border-blue-200 shadow-sm"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Status indicator */}
                {result.status === "pending" && (
                  <div className="h-8 w-8 rounded-full bg-gray-100" />
                )}
                {result.status === "generating" && (
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                )}
                {result.status === "done" && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {result.status === "error" && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                    <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-gray-900">{result.title}</h3>
                  {result.status === "generating" && (
                    <p className="text-sm text-blue-600">Generating...</p>
                  )}
                  {result.status === "error" && (
                    <p className="text-sm text-red-600">{result.error}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {result.status === "done" && (
                  <button
                    onClick={() => handleViewResult(result)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    View
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PackResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <PackResultsInner />
    </Suspense>
  );
}
