"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ProOutput } from "@/lib/schema";
import {
  loadBaseProOutput,
  saveBaseProOutput,
  loadEdits,
  saveEdits,
  clearEdits,
  mergeProOutput,
  isDirty,
  proOutputToText,
} from "@/lib/pro-store";
import { proOutputToDocument } from "@/lib/pro-document";
import ModernAtsResume from "@/components/templates/ModernAtsResume";
import ProfessionalCoverLetter from "@/components/templates/ProfessionalCoverLetter";
import { trackEvent } from "@/lib/analytics";

export default function ProResultsPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-3 text-sm text-gray-500">Loading Pro results...</p>
          </div>
        </div>
      }
    >
      <ProResultsPage />
    </Suspense>
  );
}

// ── Editable text area component ──

function EditableText({
  value,
  onChange,
  label,
  multiline = false,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  multiline?: boolean;
  className?: string;
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        rows={Math.max(3, value.split("\n").length + 1)}
        className={`w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 ${className}`}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 ${className}`}
    />
  );
}

// ── Main page ──

function ProResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [base, setBase] = useState<ProOutput | null>(null);
  const [edits, setEdits] = useState<Partial<ProOutput> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading Pro results...");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"resume" | "cover" | "keywords" | "feedback">("resume");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initStarted = useRef(false);

  // Compute current merged output
  const result = base ? mergeProOutput(base, edits) : null;
  const dirty = base ? isDirty(base, edits) : false;

  // Autosave edits to localStorage
  const scheduleAutosave = useCallback(
    (newEdits: Partial<ProOutput>) => {
      if (!base) return;
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        saveEdits(base, newEdits);
      }, 500);
    },
    [base]
  );

  const updateEdits = useCallback(
    (updater: (prev: Partial<ProOutput>) => Partial<ProOutput>) => {
      setEdits((prev) => {
        const next = updater(prev || {});
        scheduleAutosave(next);
        return next;
      });
    },
    [scheduleAutosave]
  );

  // ── Update helpers ──

  const updateResumeSummary = (v: string) =>
    updateEdits((prev) => ({
      ...prev,
      tailoredResume: { ...(result?.tailoredResume || base!.tailoredResume), summary: v },
    }));

  const updateResumeName = (v: string) =>
    updateEdits((prev) => ({
      ...prev,
      tailoredResume: { ...(result?.tailoredResume || base!.tailoredResume), name: v },
    }));

  const updateResumeHeadline = (v: string) =>
    updateEdits((prev) => ({
      ...prev,
      tailoredResume: { ...(result?.tailoredResume || base!.tailoredResume), headline: v },
    }));

  const updateExperienceBullet = (expIdx: number, bulletIdx: number, v: string) => {
    updateEdits((prev) => {
      const current = result?.tailoredResume || base!.tailoredResume;
      const experience = current.experience.map((exp, i) => {
        if (i !== expIdx) return exp;
        return {
          ...exp,
          bullets: exp.bullets.map((b, j) => (j === bulletIdx ? v : b)),
        };
      });
      return {
        ...prev,
        tailoredResume: { ...current, experience },
      };
    });
  };

  const updateSkillItem = (groupIdx: number, itemIdx: number, v: string) => {
    updateEdits((prev) => {
      const current = result?.tailoredResume || base!.tailoredResume;
      const skills = current.skills.map((group, i) => {
        if (i !== groupIdx) return group;
        return {
          ...group,
          items: group.items.map((item, j) => (j === itemIdx ? v : item)),
        };
      });
      return {
        ...prev,
        tailoredResume: { ...current, skills },
      };
    });
  };

  const updateCoverParagraph = (idx: number, v: string) => {
    updateEdits((prev) => {
      const paragraphs = [...(result?.coverLetter.paragraphs || base!.coverLetter.paragraphs)];
      paragraphs[idx] = v;
      return { ...prev, coverLetter: { paragraphs } };
    });
  };

  // ── Initialization ──

  useEffect(() => {
    // Guard against React Strict Mode double-invocation in development.
    // Without this, the second run finds rt_pending_pro already removed
    // and falls through to router.push("/results").
    if (initStarted.current) return;
    initStarted.current = true;

    async function init() {
      // Check if we need to generate fresh (from Stripe payment or dev bypass).
      // This must come BEFORE the cache check so a new "Unlock Pro" click
      // always triggers a fresh generation instead of showing stale results.
      const sessionId = searchParams.get("session_id");
      const pendingPro = sessionStorage.getItem("rt_pending_pro");

      if (sessionId || pendingPro) {
        const resumeText = sessionStorage.getItem("rt_resume_text");
        const jdText = sessionStorage.getItem("rt_jd_text");

        if (!resumeText || !jdText) {
          router.push("/analyze");
          return;
        }

        sessionStorage.removeItem("rt_pending_pro");

        // Progressive loading messages with percentage
        setLoadingProgress(5);
        setLoadingMessage("Parsing your resume...");
        await delay(400);
        setLoadingProgress(15);
        setLoadingMessage("Analyzing job description keywords...");
        await delay(400);
        setLoadingProgress(25);
        setLoadingMessage("Generating your tailored resume with AI...");

        // Start a progress ticker that slowly advances while waiting for the API
        const progressInterval = setInterval(() => {
          setLoadingProgress((prev) => {
            if (prev >= 90) return prev;
            // Slow down as we approach 90%
            const increment = prev < 50 ? 2 : prev < 70 ? 1 : 0.5;
            return Math.min(prev + increment, 90);
          });
        }, 1000);

        // Update message at various thresholds
        const messageTimeout1 = setTimeout(() => {
          setLoadingMessage("Writing cover letter and bullet rewrites...");
        }, 8000);
        const messageTimeout2 = setTimeout(() => {
          setLoadingMessage("Analyzing keyword gaps and formatting...");
        }, 20000);
        const messageTimeout3 = setTimeout(() => {
          setLoadingMessage("Almost done, finalizing your Pro report...");
        }, 40000);

        try {
          const response = await fetch("/api/generate-pro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resumeText, jobDescriptionText: jdText }),
          });

          clearInterval(progressInterval);
          clearTimeout(messageTimeout1);
          clearTimeout(messageTimeout2);
          clearTimeout(messageTimeout3);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Generation failed (${response.status})`);
          }

          setLoadingProgress(95);
          setLoadingMessage("Processing results...");

          const data: ProOutput = await response.json();
          saveBaseProOutput(data);
          setBase(data);
          setLoadingProgress(100);
          setLoading(false);
          trackEvent("pro_viewed");
        } catch (err) {
          clearInterval(progressInterval);
          clearTimeout(messageTimeout1);
          clearTimeout(messageTimeout2);
          clearTimeout(messageTimeout3);

          const errorMessage = err instanceof Error ? err.message : "Generation failed";
          setLoadingError(errorMessage);
          setLoadingMessage("Generation failed");
          setLoadingProgress(0);
        }
        return;
      }

      // No pending generation — check for cached results
      const cached = loadBaseProOutput();
      if (cached) {
        setBase(cached);
        const savedEdits = loadEdits(cached);
        if (savedEdits) setEdits(savedEdits);
        setLoading(false);
        trackEvent("pro_viewed");
        return;
      }

      // No data at all
      router.push("/results");
    }

    init();
  }, [router, searchParams]);

  // ── Reset handler ──
  const handleReset = () => {
    if (!base) return;
    clearEdits(base);
    setEdits(null);
    setShowResetConfirm(false);
  };

  // ── Email handler ──
  const handleSendEmail = async () => {
    if (!emailInput || !result) return;
    setSendingEmail(true);
    setEmailError(null);

    try {
      const response = await fetch("/api/email-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          proOutput: result,
          stripeSessionId: searchParams.get("session_id") || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send email");

      setEmailSent(true);
      trackEvent("email_report_sent");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading || !result || !base) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          {loadingError ? (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Generation Failed</h2>
              <p className="mt-2 text-sm text-gray-600">{loadingError}</p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push("/results")}
                  className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back to Results
                </button>
              </div>
            </>
          ) : (
            <>
              <svg className="mx-auto h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="mt-3 text-base font-medium text-gray-700">{loadingMessage}</p>

              {/* Progress bar */}
              {loadingProgress > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(loadingProgress)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all duration-700 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="mt-3 text-sm text-gray-400">
                This typically takes 30-60 seconds
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "resume" as const, label: "Tailored Resume" },
    { id: "cover" as const, label: "Cover Letter" },
    { id: "keywords" as const, label: "Keywords" },
    { id: "feedback" as const, label: "Feedback" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-10">
      {/* Header */}
      <div className="mb-6" data-print-hide>
        <div className="mb-1 inline-block rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
          Pro
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Your Full Tailor Pack</h1>
        <p className="mt-1 text-sm text-gray-600">{result.summary.slice(0, 150)}...</p>
        {dirty && (
          <p className="mt-2 text-sm text-amber-600">
            You have unsaved edits.{" "}
            <button onClick={() => setShowResetConfirm(true)} className="underline hover:text-amber-800">
              Reset to generated
            </button>
          </p>
        )}
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Reset all edits?</h3>
            <p className="mt-2 text-sm text-gray-600">This will discard all your changes and revert to the AI-generated version.</p>
            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={() => setShowResetConfirm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleReset} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1" data-print-hide>
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

      {/* Edit / Preview toggle (for resume + cover letter tabs) */}
      {(activeTab === "resume" || activeTab === "cover") && (
        <div className="mb-4 flex items-center justify-end gap-2" data-print-hide>
          <span className="text-sm text-gray-500">View:</span>
          <div className="flex rounded-lg border border-gray-200 text-sm">
            <button
              onClick={() => setViewMode("edit")}
              className={`px-3 py-1.5 ${viewMode === "edit" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"} rounded-l-lg transition-colors`}
            >
              Edit
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 ${viewMode === "preview" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"} rounded-r-lg transition-colors`}
            >
              Preview
            </button>
          </div>
          {viewMode === "preview" && (
            <button
              onClick={() => window.print()}
              className="ml-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              data-print-hide
            >
              Print
            </button>
          )}
        </div>
      )}

      {/* Tab content */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {/* ── Resume Tab ── */}
        {activeTab === "resume" && viewMode === "preview" && (
          <div className="p-6" id="ats-preview">
            <ModernAtsResume resume={proOutputToDocument(result).resume} />
          </div>
        )}
        {activeTab === "resume" && viewMode === "edit" && (
          <div className="p-6 space-y-6">
            {/* Name & Headline */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500 uppercase tracking-wide">Name</label>
                <EditableText value={result.tailoredResume.name} onChange={updateResumeName} label="Name" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500 uppercase tracking-wide">Headline</label>
                <EditableText value={result.tailoredResume.headline} onChange={updateResumeHeadline} label="Headline" />
              </div>
            </div>

            {/* Professional Summary */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-500 uppercase tracking-wide">Professional Summary</label>
              <EditableText value={result.tailoredResume.summary} onChange={updateResumeSummary} label="Professional Summary" multiline />
            </div>

            {/* Experience */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Experience</h3>
              {result.tailoredResume.experience.map((exp, expIdx) => (
                <div key={expIdx} className="mb-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-gray-900">{exp.title}</span>
                    <span className="text-sm text-gray-500">{exp.company}</span>
                    {exp.period && <span className="text-xs text-gray-400">{exp.period}</span>}
                  </div>
                  <div className="space-y-2">
                    {exp.bullets.map((bullet, bulletIdx) => (
                      <div key={bulletIdx} className="flex gap-2">
                        <span className="mt-2.5 text-gray-400 text-sm shrink-0">{bulletIdx + 1}.</span>
                        <EditableText
                          value={bullet}
                          onChange={(v) => updateExperienceBullet(expIdx, bulletIdx, v)}
                          label={`Bullet ${bulletIdx + 1} for ${exp.title}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Education */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Education</h3>
              {result.tailoredResume.education.map((edu, i) => (
                <div key={i} className="mb-2 text-sm text-gray-700">
                  {edu.degree} &mdash; {edu.school}{edu.year ? `, ${edu.year}` : ""}
                </div>
              ))}
            </div>

            {/* Skills */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Skills</h3>
              {result.tailoredResume.skills.map((group, groupIdx) => (
                <div key={groupIdx} className="mb-3">
                  <label className="mb-1 block text-sm font-medium text-gray-500">{group.category}</label>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item, itemIdx) => (
                      <input
                        key={itemIdx}
                        type="text"
                        value={item}
                        onChange={(e) => updateSkillItem(groupIdx, itemIdx, e.target.value)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        style={{ width: Math.max(60, item.length * 8 + 24) + "px" }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Cover Letter Tab ── */}
        {activeTab === "cover" && viewMode === "preview" && (
          <div className="p-6" id="ats-preview">
            <ProfessionalCoverLetter
              coverLetter={proOutputToDocument(result).coverLetter}
              senderName={result.tailoredResume.name}
            />
          </div>
        )}
        {activeTab === "cover" && viewMode === "edit" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Cover Letter</h2>
              <button
                onClick={() => copyToClipboard(result.coverLetter.paragraphs.join("\n\n"))}
                className="text-sm text-blue-600 hover:underline"
              >
                Copy to clipboard
              </button>
            </div>
            {result.coverLetter.paragraphs.map((paragraph, i) => (
              <EditableText
                key={i}
                value={paragraph}
                onChange={(v) => updateCoverParagraph(i, v)}
                label={`Cover letter paragraph ${i + 1}`}
                multiline
              />
            ))}
          </div>
        )}

        {/* ── Keywords Tab ── */}
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
                    <span className="text-sm text-gray-500 max-w-xs text-right">{item.suggestion}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Feedback Tab ── */}
        {activeTab === "feedback" && (
          <div className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Recruiter Feedback</h2>
            <div className="space-y-2">
              {result.recruiterFeedback.map((item, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-gray-50 px-4 py-3">
                  <span className="mt-0.5 text-blue-500 shrink-0">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  <p className="text-sm text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bullet Rewrites */}
      {result.bulletRewrites.length > 0 && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6" data-print-hide>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Bullet Rewrites ({result.bulletRewrites.length})
          </h2>
          <div className="space-y-4">
            {result.bulletRewrites.map((rewrite, i) => (
              <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="mb-1 text-sm font-medium text-gray-400">{rewrite.section}</p>
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
                <p className="text-sm text-blue-600">{rewrite.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience Gaps */}
      {result.experienceGaps.length > 0 && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6" data-print-hide>
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
                  <p className="mt-1 text-sm text-gray-600">{gap.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Actions */}
      {result.nextActions.length > 0 && (
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6" data-print-hide>
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
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6" data-print-hide>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Email Your Report</h2>
        <p className="mb-4 text-sm text-gray-500">Get your Resume, Cover Letter, and Insights PDFs delivered to your inbox.</p>

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
        {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between" data-print-hide>
        <Link href="/results" className="text-base font-medium text-blue-600 hover:underline">
          Back to free analysis
        </Link>
        <Link href="/analyze" className="text-base font-medium text-blue-600 hover:underline">
          Analyze another resume
        </Link>
      </div>

      {/* ── Sticky Action Bar ── */}
      <StickyActionBar result={result} />
    </div>
  );
}

// ── Sticky Action Bar ──

function StickyActionBar({ result }: { result: ProOutput }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTXT = () => {
    trackEvent("export_txt_clicked");
    const content = proOutputToText(result);
    downloadFile(content, "resumemate-ai-pro.txt", "text/plain");
    setDropdownOpen(false);
  };

  const handleExportZIP = async () => {
    trackEvent("export_zip_clicked");
    setDownloading(true);
    try {
      const { generateProPack } = await import("@/lib/export-zip");
      const blob = await generateProPack(result);
      downloadBlob(blob, "ResumeMate-Pro-Pack.zip");
    } catch (error) {
      console.error("ZIP export failed:", error);
      handleExportTXT();
    } finally {
      setDownloading(false);
      setDropdownOpen(false);
    }
  };

  const handleExportResumePDF = async () => {
    trackEvent("export_resume_pdf_clicked");
    try {
      const { generateResumePDF } = await import("@/lib/export-pdf");
      const blob = await generateResumePDF(result);
      downloadBlob(blob, "Resume.pdf");
    } catch (error) {
      console.error("Resume PDF export failed:", error);
      handleExportTXT();
    }
    setDropdownOpen(false);
  };

  const handleExportCoverLetterPDF = async () => {
    trackEvent("export_cover_letter_pdf_clicked");
    try {
      const { generateCoverLetterPDF } = await import("@/lib/export-pdf");
      const blob = await generateCoverLetterPDF(result);
      downloadBlob(blob, "Cover-Letter.pdf");
    } catch (error) {
      console.error("Cover Letter PDF export failed:", error);
      handleExportTXT();
    }
    setDropdownOpen(false);
  };

  const handleExportInsightsPDF = async () => {
    trackEvent("export_insights_pdf_clicked");
    try {
      const { generateInsightsPDF } = await import("@/lib/export-pdf");
      const blob = await generateInsightsPDF(result);
      downloadBlob(blob, "Insights.pdf");
    } catch (error) {
      console.error("Insights PDF export failed:", error);
      handleExportTXT();
    }
    setDropdownOpen(false);
  };

  const handleExportDOCX = async () => {
    trackEvent("export_docx_clicked");
    try {
      const { generateDOCX } = await import("@/lib/export-docx");
      const blob = await generateDOCX(result);
      downloadBlob(blob, "resumemate-ai-pro.docx");
    } catch (error) {
      console.error("DOCX export failed:", error);
      handleExportTXT();
    }
    setDropdownOpen(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <p className="text-sm text-gray-500 hidden sm:block">
          Edit your resume above, then download or email the final version.
        </p>
        <div className="relative ml-auto flex items-center gap-3">
          <button
            onClick={() => copyToClipboard(proOutputToText(result))}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Copy All
          </button>

          <div className="relative flex">
            {/* Main download button — triggers ZIP */}
            <button
              onClick={handleExportZIP}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-l-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {downloading ? "Preparing..." : "Download"}
            </button>

            {/* Dropdown chevron */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center rounded-r-lg border-l border-blue-500 bg-blue-600 px-2 py-2 text-white hover:bg-blue-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute bottom-full right-0 z-20 mb-2 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <button onClick={handleExportZIP} className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
                    Download Pack (ZIP)
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  <button onClick={handleExportResumePDF} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Resume PDF
                  </button>
                  <button onClick={handleExportCoverLetterPDF} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Cover Letter PDF
                  </button>
                  <button onClick={handleExportInsightsPDF} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Insights PDF
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  <button onClick={handleExportDOCX} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    DOCX (Resume + Cover)
                  </button>
                  <button onClick={handleExportTXT} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Plain Text
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
