"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ProGenerationResult } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";

export default function ProResultsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">Loading Pro results...</p>
        </div>
      </div>
    }>
      <ProResultsPage />
    </Suspense>
  );
}

function ProResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<ProGenerationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading Pro results...");
  const [activeTab, setActiveTab] = useState<"resume" | "cover" | "keywords" | "feedback">("resume");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    async function init() {
      // Check if we already have results cached
      const cached = sessionStorage.getItem("rt_pro_result");
      if (cached) {
        try {
          setResult(JSON.parse(cached));
          setLoading(false);
          trackEvent("pro_viewed");
          return;
        } catch { /* fall through */ }
      }

      // Check if returning from Stripe payment or pending generation
      const sessionId = searchParams.get("session_id");
      const pendingPro = sessionStorage.getItem("rt_pending_pro");

      if (sessionId || pendingPro) {
        // User paid (or was already marked for generation) — generate Pro results now
        const resumeText = sessionStorage.getItem("rt_resume_text");
        const jdText = sessionStorage.getItem("rt_jd_text");

        if (!resumeText || !jdText) {
          router.push("/analyze");
          return;
        }

        sessionStorage.removeItem("rt_pending_pro");
        setLoadingMessage("Generating your tailored resume with AI...");

        try {
          const response = await fetch("/api/generate-pro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resumeText, jobDescriptionText: jdText }),
          });

          if (!response.ok) {
            throw new Error("Generation failed");
          }

          const data = await response.json();
          sessionStorage.setItem("rt_pro_result", JSON.stringify(data));
          setResult(data);
          setLoading(false);
          trackEvent("pro_viewed");
        } catch {
          setLoadingMessage("Generation failed. Redirecting...");
          setTimeout(() => router.push("/results"), 2000);
        }
        return;
      }

      // No data at all
      router.push("/results");
    }

    init();
  }, [router, searchParams]);

  const handleSendEmail = async () => {
    if (!emailInput || !result) return;
    setSendingEmail(true);
    setEmailError(null);

    try {
      const reportText = [
        "=== TAILORED RESUME ===",
        result.tailoredResume,
        "",
        "=== COVER LETTER ===",
        result.coverLetter,
        "",
        "=== SKILLS SECTION ===",
        result.skillsSectionRewrite,
        "",
        "=== NEXT ACTIONS ===",
        ...result.nextActions.map((a, i) => `${i + 1}. ${a}`),
        "",
        "=== SUMMARY ===",
        result.summary,
      ].join("\n");

      const response = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, reportText }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setEmailSent(true);
      trackEvent("email_report_sent");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading || !result) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "resume" as const, label: "Tailored Resume" },
    { id: "cover" as const, label: "Cover Letter" },
    { id: "keywords" as const, label: "Keyword Checklist" },
    { id: "feedback" as const, label: "Recruiter Feedback" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1 inline-block rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
            Pro
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Your Full Tailor Pack</h1>
          <p className="mt-1 text-gray-600">{result.summary.slice(0, 150)}...</p>
        </div>
        <DownloadDropdown result={result} />
      </div>

      {/* Tab navigation */}
      <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {activeTab === "resume" && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Tailored Resume</h2>
              <button
                onClick={() => copyToClipboard(result.tailoredResume)}
                className="text-sm text-blue-600 hover:underline"
              >
                Copy to clipboard
              </button>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 font-mono text-sm text-gray-800 leading-relaxed">
              {result.tailoredResume}
            </pre>
          </div>
        )}

        {activeTab === "cover" && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Cover Letter</h2>
              <button
                onClick={() => copyToClipboard(result.coverLetter)}
                className="text-sm text-blue-600 hover:underline"
              >
                Copy to clipboard
              </button>
            </div>
            <div className="rounded-lg bg-gray-50 p-6">
              {result.coverLetter.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mb-4 text-sm text-gray-800 leading-relaxed last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {activeTab === "keywords" && (
          <div className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Keyword Checklist</h2>
            <div className="space-y-2">
              {result.keywordChecklist.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                    item.found ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.found ? (
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`text-sm font-medium ${item.found ? "text-green-800" : "text-red-800"}`}>
                      {item.keyword}
                    </span>
                  </div>
                  {item.suggestion && (
                    <span className="text-xs text-gray-500">{item.suggestion}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "feedback" && (
          <div className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Recruiter Feedback</h2>
            <div className="prose prose-sm max-w-none rounded-lg bg-gray-50 p-6">
              {result.recruiterFeedback.split("\n").map((line, i) => {
                if (line.startsWith("**") && line.endsWith("**")) {
                  return <h3 key={i} className="mt-4 mb-2 text-base font-semibold text-gray-900">{line.replace(/\*\*/g, "")}</h3>;
                }
                if (line.startsWith("- ")) {
                  return <li key={i} className="ml-4 text-sm text-gray-700">{line.slice(2)}</li>;
                }
                if (line.trim()) {
                  return <p key={i} className="mb-2 text-sm text-gray-700">{line.replace(/\*\*/g, "")}</p>;
                }
                return <br key={i} />;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bullet Rewrites */}
      {result.bulletRewrites.length > 0 && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Bullet Rewrites ({result.bulletRewrites.length})
          </h2>
          <div className="space-y-4">
            {result.bulletRewrites.map((rewrite, i) => (
              <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="mb-1 text-xs font-medium text-gray-400">{rewrite.section}</p>
                <div className="mb-2">
                  <span className="text-xs font-medium text-red-500 uppercase tracking-wide">Before</span>
                  <p className="mt-0.5 text-sm text-gray-600 line-through decoration-red-300">
                    {rewrite.original || "(new bullet)"}
                  </p>
                </div>
                <div className="mb-2">
                  <span className="text-xs font-medium text-green-600 uppercase tracking-wide">After</span>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">{rewrite.rewritten}</p>
                </div>
                <p className="text-xs text-blue-600">{rewrite.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience Gaps */}
      {result.experienceGaps.length > 0 && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Experience Gaps</h2>
          <div className="space-y-3">
            {result.experienceGaps.map((gap, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
                <span
                  className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                    gap.severity === "high"
                      ? "bg-red-100 text-red-700"
                      : gap.severity === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {gap.severity}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{gap.gap}</p>
                  <p className="mt-1 text-xs text-gray-600">{gap.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Section Rewrite */}
      {result.skillsSectionRewrite && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Skills Section Rewrite</h2>
            <button
              onClick={() => copyToClipboard(result.skillsSectionRewrite)}
              className="text-sm text-blue-600 hover:underline"
            >
              Copy
            </button>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 font-mono text-sm text-gray-800">
            {result.skillsSectionRewrite}
          </pre>
        </div>
      )}

      {/* Next Actions */}
      {result.nextActions.length > 0 && (
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-blue-900">Next Actions</h2>
          <ol className="space-y-2">
            {result.nextActions.map((action, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-blue-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold text-blue-800">
                  {i + 1}
                </span>
                {action}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Email delivery */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Email Your Report</h2>
        <p className="mb-4 text-sm text-gray-500">Get a copy of your full report delivered to your inbox.</p>

        {emailSent ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Report sent! Check your inbox.
          </div>
        ) : (
          <div className="flex gap-3">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail || !emailInput.includes("@")}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sendingEmail ? "Sending..." : "Send"}
            </button>
          </div>
        )}
        {emailError && (
          <p className="mt-2 text-sm text-red-600">{emailError}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <Link href="/results" className="text-sm text-blue-600 hover:underline">
          Back to free analysis
        </Link>
        <Link href="/analyze" className="text-sm text-blue-600 hover:underline">
          Analyze another resume
        </Link>
      </div>
    </div>
  );
}

function DownloadDropdown({ result }: { result: ProGenerationResult }) {
  const [open, setOpen] = useState(false);

  const handleExportTXT = () => {
    trackEvent("export_txt_clicked");
    const content = [
      "=== TAILORED RESUME ===",
      result.tailoredResume,
      "",
      "=== COVER LETTER ===",
      result.coverLetter,
      "",
      "=== SKILLS SECTION ===",
      result.skillsSectionRewrite,
      "",
      "=== NEXT ACTIONS ===",
      ...result.nextActions.map((a, i) => `${i + 1}. ${a}`),
      "",
      "=== SUMMARY ===",
      result.summary,
    ].join("\n");

    downloadFile(content, "resumemate-ai-pro.txt", "text/plain");
    setOpen(false);
  };

  const handleExportPDF = async () => {
    trackEvent("export_pdf_clicked");
    try {
      const { generatePDF } = await import("@/lib/export-pdf");
      const blob = await generatePDF(result);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resumemate-ai-pro.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF export failed:", error);
      // Fallback to TXT
      handleExportTXT();
    }
    setOpen(false);
  };

  const handleExportDOCX = async () => {
    trackEvent("export_docx_clicked");
    try {
      const { generateDOCX } = await import("@/lib/export-docx");
      const blob = await generateDOCX(result);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resumemate-ai-pro.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("DOCX export failed:", error);
      handleExportTXT();
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              onClick={handleExportPDF}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              PDF
            </button>
            <button
              onClick={handleExportDOCX}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              DOCX
            </button>
            <button
              onClick={handleExportTXT}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Plain Text
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    // Fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  });
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
