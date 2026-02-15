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
import type { RadarResult } from "@/lib/types";
import { scoreRadar, tailoredToCandidateProfile } from "@/lib/radar-scorer";
import { updateSessionRadarAfter } from "@/lib/job-sessions";

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

  const [radarBefore, setRadarBefore] = useState<RadarResult | null>(null);
  const [radarAfter, setRadarAfter] = useState<RadarResult | null>(null);
  const [liveRadarScore, setLiveRadarScore] = useState<number | null>(null);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const liveScoreTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
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

  // ── Live radar recomputation (debounced 500ms) ──

  const recomputeLiveRadar = useCallback(() => {
    if (!result) return;
    if (liveScoreTimer.current) clearTimeout(liveScoreTimer.current);
    liveScoreTimer.current = setTimeout(() => {
      try {
        const analysisStr = sessionStorage.getItem("rt_analysis");
        if (!analysisStr) return;
        const analysis = JSON.parse(analysisStr);
        const jobProfile = analysis.jobProfile;
        if (!jobProfile) return;

        const candidateProfile = tailoredToCandidateProfile(result.tailoredResume);
        const newRadar = scoreRadar(candidateProfile, jobProfile);
        setLiveRadarScore(newRadar.score);
        setRadarAfter(newRadar);
      } catch {
        // Silently fail — non-critical
      }
    }, 500);
  }, [result]);

  // Trigger live radar recomputation when edits change
  useEffect(() => {
    if (dirty && result) {
      recomputeLiveRadar();
    }
  }, [dirty, result, recomputeLiveRadar]);

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

          // Compute radar delta
          try {
            let beforeScore = 0;
            const beforeStr = sessionStorage.getItem("rt_radar_before");
            if (beforeStr) {
              const beforeData = JSON.parse(beforeStr);
              setRadarBefore(beforeData);
              beforeScore = beforeData.score || 0;
            }
            const analysisStr = sessionStorage.getItem("rt_analysis");
            if (analysisStr) {
              const analysis = JSON.parse(analysisStr);
              const candidateProfile = tailoredToCandidateProfile(data.tailoredResume);
              const after = scoreRadar(candidateProfile, analysis.jobProfile);
              setRadarAfter(after);
              setLiveRadarScore(after.score);
              trackEvent("radar_improvement_shown", {
                before: beforeScore,
                after: after.score,
              });
              // Update job session with after score
              const sessionId = sessionStorage.getItem("rt_current_session_id");
              if (sessionId) {
                updateSessionRadarAfter(sessionId, after.score);
              }
            }
          } catch {
            // Non-critical
          }
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

      {/* Radar delta banner */}
      {radarBefore && radarAfter && (
        <div className="mb-6 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-sm text-gray-600">
              Before: <span className="font-bold text-gray-900">{radarBefore.score}</span>
            </div>
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div className="text-sm">
              New Match: <span className="text-2xl font-bold text-green-700">{radarAfter.score}</span>
              {radarAfter.score > radarBefore.score && (
                <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-sm font-semibold text-green-700">
                  +{radarAfter.score - radarBefore.score}
                </span>
              )}
            </div>
            <span className={`ml-2 text-sm font-semibold ${
              radarAfter.score >= 75 ? "text-green-700" : radarAfter.score >= 50 ? "text-yellow-700" : "text-red-700"
            }`}>
              {radarAfter.label}
            </span>
          </div>
        </div>
      )}

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
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* ── Resume Tab ── */}
        {activeTab === "resume" && viewMode === "preview" && (
          <div className="p-6" id="ats-preview">
            <ModernAtsResume resume={proOutputToDocument(result).resume} />
          </div>
        )}
        {activeTab === "resume" && viewMode === "edit" && (
          <div className="p-6 space-y-8">
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
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <span className="h-4 w-1 rounded-full bg-blue-500" />
                Experience
              </h3>
              {result.tailoredResume.experience.map((exp, expIdx) => (
                <div key={expIdx} className="mb-4 flex rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="w-1 shrink-0 bg-blue-500" />
                  <div className="flex-1 p-4">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">
                        {(exp.company || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">{exp.title}</span>
                          <span className="text-sm text-gray-500">{exp.company}</span>
                        </div>
                      </div>
                      {exp.period && (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">{exp.period}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {exp.bullets.map((bullet, bulletIdx) => (
                        <div key={bulletIdx} className="flex gap-2">
                          <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                          <EditableText
                            value={bullet}
                            onChange={(v) => updateExperienceBullet(expIdx, bulletIdx, v)}
                            label={`Bullet ${bulletIdx + 1} for ${exp.title}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Projects */}
            {result.tailoredResume.projects && result.tailoredResume.projects.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Projects</h3>
                {result.tailoredResume.projects.map((proj, projIdx) => (
                  <div key={projIdx} className="mb-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <div className="mb-2 text-sm font-semibold text-gray-900">{proj.name}</div>
                    <div className="space-y-1">
                      {proj.bullets.map((bullet, bulletIdx) => (
                        <div key={bulletIdx} className="flex gap-2 text-sm text-gray-700">
                          <span className="mt-0.5 text-gray-400 shrink-0">-</span>
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <span className="h-4 w-1 rounded-full bg-purple-500" />
                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
                Education
              </h3>
              {result.tailoredResume.education.map((edu, i) => (
                <div key={i} className="mb-2 flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                    <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{edu.degree}</p>
                    <p className="text-sm text-gray-500">{edu.school}{edu.year ? ` \u00B7 ${edu.year}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <span className="h-4 w-1 rounded-full bg-green-500" />
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Skills
              </h3>
              {result.tailoredResume.skills.map((group, groupIdx) => {
                const categoryColors = [
                  "bg-blue-100 text-blue-700",
                  "bg-green-100 text-green-700",
                  "bg-purple-100 text-purple-700",
                  "bg-amber-100 text-amber-700",
                  "bg-rose-100 text-rose-700",
                  "bg-teal-100 text-teal-700",
                ];
                const colorClass = categoryColors[groupIdx % categoryColors.length];
                return (
                  <div key={groupIdx} className="mb-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <span className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
                      {group.category}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item, itemIdx) => (
                        <input
                          key={itemIdx}
                          type="text"
                          value={item}
                          onChange={(e) => updateSkillItem(groupIdx, itemIdx, e.target.value)}
                          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                          style={{ width: Math.max(60, item.length * 8 + 24) + "px" }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
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
        {activeTab === "keywords" && (() => {
          const missing = result.keywordChecklist.filter((k) => !k.found);
          const matched = result.keywordChecklist.filter((k) => k.found);
          return (
            <div className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Keyword Checklist</h2>

              {/* Missing keywords */}
              {missing.length > 0 && (
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-700">Missing</h3>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{missing.length}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {missing.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-red-800">{item.keyword}</span>
                          {item.suggestion && (
                            <p className="mt-0.5 text-xs text-gray-500">{item.suggestion}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched keywords */}
              {matched.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-700">Matched</h3>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">{matched.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {matched.map((item, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-white px-3 py-1 text-sm font-medium text-green-700">
                        <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item.keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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

      {/* Optimize another job (return trigger) */}
      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 text-center" data-print-hide>
        <h3 className="text-lg font-semibold text-blue-900">Applying elsewhere?</h3>
        <p className="mt-1 text-sm text-blue-700">Optimize another role in seconds.</p>
        <button
          onClick={() => {
            trackEvent("optimize_another_job_clicked");
            sessionStorage.removeItem("rt_jd_text");
            window.location.href = "/analyze";
          }}
          className="mt-3 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Optimize another job
        </button>
      </div>

      {/* Coming soon badges */}
      <div className="mt-8 grid gap-4 md:grid-cols-2" data-print-hide>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 opacity-70">
          <div className="mb-2 inline-block rounded-full bg-gray-200 px-3 py-0.5 text-xs font-semibold text-gray-600">
            Coming soon
          </div>
          <h4 className="text-sm font-semibold text-gray-900">LinkedIn Profile Rewrite</h4>
          <p className="mt-1 text-sm text-gray-500">Get a tailored headline, about section, and experience bullets for LinkedIn.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 opacity-70">
          <div className="mb-2 inline-block rounded-full bg-gray-200 px-3 py-0.5 text-xs font-semibold text-gray-600">
            Coming soon
          </div>
          <h4 className="text-sm font-semibold text-gray-900">Interview Prep Bullets</h4>
          <p className="mt-1 text-sm text-gray-500">STAR-format talking points for each experience entry, tailored to the role.</p>
        </div>
      </div>

      {/* ── Sticky Action Bar ── */}
      <StickyActionBar result={result} liveRadarScore={liveRadarScore} radarBefore={radarBefore} />
    </div>
  );
}

// ── Sticky Action Bar ──

function StickyActionBar({ result, liveRadarScore, radarBefore }: { result: ProOutput; liveRadarScore?: number | null; radarBefore?: RadarResult | null }) {
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
      // Try to get radar data from sessionStorage
      let radar;
      try {
        const radarStr = sessionStorage.getItem("rt_radar_before");
        if (radarStr) radar = JSON.parse(radarStr);
      } catch { /* ignore */ }
      const blob = await generateInsightsPDF(result, radar);
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
        <div className="hidden sm:flex sm:items-center sm:gap-3">
          {liveRadarScore != null && (
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${
              liveRadarScore >= 75 ? "bg-green-100 text-green-700" :
              liveRadarScore >= 50 ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>
              Match: {liveRadarScore}
              {radarBefore && liveRadarScore > radarBefore.score && (
                <span className="ml-1 text-green-600">(+{liveRadarScore - radarBefore.score})</span>
              )}
            </span>
          )}
          <p className="text-sm text-gray-500">
            Edit above, then download.
          </p>
        </div>
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
