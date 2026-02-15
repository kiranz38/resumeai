"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProOutput } from "@/lib/schema";
import { trackEvent } from "@/lib/analytics";

interface PackJob {
  title: string;
  jd: string;
}

type JobStage = "queued" | "parsing" | "generating" | "validating" | "complete" | "error";

interface PackResult {
  title: string;
  stage: JobStage;
  /** Server-reported percentage (0-100) */
  serverPct: number;
  /** Display percentage (smoothly animated on client) */
  displayPct: number;
  /** Timestamp when "generating" stage started (for smooth animation) */
  generatingStartedAt?: number;
  output?: ProOutput;
  error?: string;
}

// Stage labels shown to users
const STAGE_LABELS: Record<JobStage, string> = {
  queued: "Waiting in queue...",
  parsing: "Analyzing job description...",
  generating: "Generating tailored CV...",
  validating: "Validating accuracy...",
  complete: "Complete",
  error: "Failed",
};

// ── NDJSON stream event types ──
interface StageEvent {
  type: "stage";
  index: number;
  title: string;
  stage: string;
  pct: number;
}
interface ResultEvent {
  type: "result";
  index: number;
  title: string;
  status: "done" | "error";
  output?: ProOutput;
  error?: string;
  pct: number;
}
interface DoneEvent {
  type: "done";
  completed: number;
  failed: number;
  elapsed: string;
}
interface ErrorEvent {
  type: "error";
  message: string;
}
type StreamEvent = StageEvent | ResultEvent | DoneEvent | ErrorEvent;

/**
 * Smooth progress animation during the "generating" phase.
 * Eases from 15% → 75% over ~30s using a decelerating curve,
 * so it feels fast at first then slows — matching user perception.
 */
function getAnimatedGeneratingPct(startedAt: number): number {
  const elapsed = (Date.now() - startedAt) / 1000;
  const maxDuration = 35; // seconds to reach ~75%
  const progress = Math.min(elapsed / maxDuration, 1);
  // Ease-out: fast start, slow end
  const eased = 1 - Math.pow(1 - progress, 2.5);
  return Math.round(15 + eased * 60); // 15% → 75%
}

function PackResultsInner() {
  const router = useRouter();
  const [results, setResults] = useState<PackResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const [elapsed, setElapsed] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const hasStarted = useRef(false);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation loop: update displayPct for "generating" jobs
  useEffect(() => {
    if (!isGenerating) {
      if (animationRef.current) clearInterval(animationRef.current);
      return;
    }

    animationRef.current = setInterval(() => {
      setResults((prev) =>
        prev.map((r) => {
          if (r.stage === "generating" && r.generatingStartedAt) {
            return {
              ...r,
              displayPct: getAnimatedGeneratingPct(r.generatingStartedAt),
            };
          }
          return r;
        }),
      );
    }, 200); // Update every 200ms for smooth animation

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [isGenerating]);

  // Initialize from sessionStorage
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
          stage: "queued",
          serverPct: 0,
          displayPct: 0,
        })),
      );
    } catch {
      router.push("/analyze");
    }
  }, [router]);

  // Consume NDJSON stream
  const startStream = useCallback(async () => {
    const jobsRaw = sessionStorage.getItem("rt_pack_jobs");
    const resumeText = sessionStorage.getItem("rt_resume_text");
    if (!jobsRaw || !resumeText) return;

    const jobs: PackJob[] = JSON.parse(jobsRaw);
    setIsGenerating(true);
    setFatalError(null);

    try {
      const response = await fetch("/api/generate-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobs: jobs.map((j) => ({ title: j.title, jd: j.jd })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Generation failed (${response.status})`);
      }

      if (!response.body) {
        throw new Error("No response body — streaming not supported.");
      }

      // Read NDJSON stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let event: StreamEvent;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }

          if (event.type === "stage") {
            const { index, stage, pct } = event as StageEvent;
            setResults((prev) =>
              prev.map((r, i) =>
                i === index
                  ? {
                      ...r,
                      stage: stage as JobStage,
                      serverPct: pct,
                      displayPct: pct,
                      ...(stage === "generating"
                        ? { generatingStartedAt: Date.now() }
                        : {}),
                    }
                  : r,
              ),
            );
          } else if (event.type === "result") {
            const { index, status, output, error: errMsg, pct } =
              event as ResultEvent;
            setResults((prev) =>
              prev.map((r, i) =>
                i === index
                  ? {
                      ...r,
                      stage: status === "done" ? "complete" : "error",
                      serverPct: pct,
                      displayPct: 100,
                      output,
                      error: errMsg,
                      generatingStartedAt: undefined,
                    }
                  : r,
              ),
            );
          } else if (event.type === "done") {
            setElapsed((event as DoneEvent).elapsed);
            setStreamDone(true);
          } else if (event.type === "error") {
            setFatalError((event as ErrorEvent).message);
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setFatalError(msg);
      // Mark all non-complete jobs as error
      setResults((prev) =>
        prev.map((r) =>
          r.stage !== "complete"
            ? { ...r, stage: "error", error: msg, displayPct: 100 }
            : r,
        ),
      );
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Start stream once results are ready
  useEffect(() => {
    if (
      results.length > 0 &&
      !hasStarted.current &&
      results.every((r) => r.stage === "queued")
    ) {
      hasStarted.current = true;
      startStream();
    }
  }, [results, startStream]);

  const doneCount = results.filter(
    (r) => r.stage === "complete" || r.stage === "error",
  ).length;
  const totalCount = results.length;
  const overallPct =
    totalCount > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.displayPct, 0) / totalCount,
        )
      : 0;

  const handleViewResult = useCallback(
    (result: PackResult) => {
      if (!result.output) return;
      // Use the same key that pro-store.ts reads from (rt_pro_result)
      sessionStorage.setItem("rt_pro_result", JSON.stringify(result.output));
      // Mark that we came from pack so the Pro page shows a "Back to Pack" link
      sessionStorage.setItem("rt_from_pack", "true");
      router.push("/results/pro");
    },
    [router],
  );

  const handleDownload = useCallback(async (result: PackResult) => {
    if (!result.output) return;
    try {
      const { generateProPack } = await import("@/lib/export-zip");
      const blob = await generateProPack(result.output);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.title.replace(/[^a-zA-Z0-9 -]/g, "").trim() || "CV"}-Pack.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      trackEvent("export_clicked", { type: "zip" });
    } catch {
      // Silently fail — user can still view and download from the Pro page
    }
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const completed = results.filter((r) => r.stage === "complete" && r.output);
    if (completed.length === 0) return;

    try {
      const [JSZip, { generateResumePDF, generateCoverLetterPDF, generateInsightsPDF }] =
        await Promise.all([
          import("jszip").then((m) => m.default),
          import("@/lib/export-pdf"),
        ]);

      const zip = new JSZip();

      for (const result of completed) {
        if (!result.output) continue;
        const safeName = result.title.replace(/[^a-zA-Z0-9 -]/g, "").trim() || "CV";
        const folder = zip.folder(safeName)!;

        const [resumeBlob, coverBlob, insightsBlob] = await Promise.all([
          generateResumePDF(result.output),
          generateCoverLetterPDF(result.output),
          generateInsightsPDF(result.output),
        ]);

        folder.file("Resume.pdf", resumeBlob);
        folder.file("Cover-Letter.pdf", coverBlob);
        folder.file("Insights.pdf", insightsBlob);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ResumeMate-Pack-${completed.length}-CVs.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      trackEvent("export_clicked", { type: "bulk_zip" });
    } catch {
      // Fallback: download individually
      for (const result of completed) {
        await handleDownload(result);
      }
    }
  }, [results, handleDownload]);

  if (results.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-gray-500">Preparing bulk generation...</p>
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
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Your Tailored CVs</h1>
        <p className="mt-1 text-gray-500">
          {isGenerating
            ? `Generating ${totalCount} tailored CVs — ${overallPct}% complete`
            : streamDone
              ? `${doneCount} of ${totalCount} CVs generated${elapsed ? ` in ${elapsed}` : ""}`
              : "Starting..."}
        </p>

        {/* Download All button — shown when at least one CV is complete */}
        {!isGenerating && results.some((r) => r.stage === "complete") && (
          <button
            onClick={handleDownloadAll}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download All ({results.filter((r) => r.stage === "complete").length} ZIPs)
          </button>
        )}
      </div>

      {fatalError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fatalError}
        </div>
      )}

      {/* Overall progress bar */}
      <div className="mb-8">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>Overall progress</span>
          <span className="font-medium text-gray-700">{overallPct}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Per-job cards with progress */}
      <div className="space-y-3">
        {results.map((result, idx) => (
          <div
            key={idx}
            className={`rounded-xl border bg-white p-4 transition-all ${
              result.stage === "generating"
                ? "border-blue-200 shadow-sm"
                : result.stage === "complete"
                  ? "border-green-200"
                  : result.stage === "error"
                    ? "border-red-200"
                    : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* Status icon */}
                {(result.stage === "queued") && (
                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-100" />
                )}
                {(result.stage === "parsing" ||
                  result.stage === "generating" ||
                  result.stage === "validating") && (
                  <div className="h-8 w-8 flex-shrink-0 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                )}
                {result.stage === "complete" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <svg
                      className="h-4 w-4 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                {result.stage === "error" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                    <svg
                      className="h-4 w-4 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium text-gray-900">
                    {result.title}
                  </h3>
                  <p
                    className={`text-sm ${
                      result.stage === "error"
                        ? "text-red-600"
                        : result.stage === "complete"
                          ? "text-green-600"
                          : "text-gray-500"
                    }`}
                  >
                    {result.stage === "error"
                      ? result.error || "Generation failed"
                      : STAGE_LABELS[result.stage]}
                  </p>

                  {/* Per-job progress bar */}
                  {result.stage !== "complete" && result.stage !== "error" && result.stage !== "queued" && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
                          style={{ width: `${result.displayPct}%` }}
                        />
                      </div>
                      <span className="flex-shrink-0 text-xs font-medium text-gray-500">
                        {result.displayPct}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-3 flex flex-shrink-0 items-center gap-2">
                {result.stage === "complete" && (
                  <>
                    <button
                      onClick={() => handleDownload(result)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      title="Download ZIP (Resume + Cover Letter + Insights)"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleViewResult(result)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      View CV
                    </button>
                  </>
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
