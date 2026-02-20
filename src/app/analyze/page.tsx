"use client";

import { Suspense, useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { detectResume } from "@/lib/resume-detector";
import { saveJobSession } from "@/lib/job-sessions";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTile from "@/components/DashboardTile";
import SpotlightOverlay, { type SpotlightStep } from "@/components/SpotlightOverlay";
import JobBoard from "@/components/JobBoard";
import ApplyPackFlow from "@/components/ApplyPackFlow";
import ResumeUploader from "@/components/ResumeUploader";

type InputMode = "upload" | "paste";
type Phase =
  | "hub"
  | "resume_input"
  | "jd_input"
  | "ready"
  | "analyzing"
  | "jobs"
  | "pack_resume"
  | "pack_jds";

const MAX_RESUME_LENGTH = 50_000;
const MAX_JD_LENGTH = 30_000;

const ONBOARDING_KEY = "rt_onboarding_complete";

// Step dots config
const STEP_LABELS = ["Resume", "Job Description"] as const;

function getStepIndex(phase: Phase): number {
  switch (phase) {
    case "resume_input":
      return 0;
    case "jd_input":
    case "analyzing":
      return 1;
    default:
      return -1;
  }
}

export default function AnalyzePageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><div className="text-center"><p className="text-sm text-gray-500">Loading...</p><p className="mt-2 text-xs text-gray-400">If this takes more than a few seconds, <a href="/" className="text-blue-500 hover:underline">go home</a>.</p></div></div>}>
      <AnalyzePage />
    </Suspense>
  );
}

function AnalyzePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [phase, setPhase] = useState<Phase>(initialTab === "jobs" ? "jobs" : "hub");
  const [resumeMode, setResumeMode] = useState<InputMode>("upload");
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [resumeWarning, setResumeWarning] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState<"dashboard" | "jobs">(initialTab === "jobs" ? "jobs" : "dashboard");
  const [autoFilledJobTitle, setAutoFilledJobTitle] = useState<string | null>(null);
  const [pendingPackJobCount, setPendingPackJobCount] = useState(0);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Refs for spotlight targets
  const optimizeTileRef = useRef<HTMLButtonElement>(null);
  const resumePanelRef = useRef<HTMLDivElement>(null);
  const jdPanelRef = useRef<HTMLDivElement>(null);
  const analyzeBtnRef = useRef<HTMLButtonElement>(null);

  // Sync phase when query params change (e.g. nav click from /analyze to /analyze?tab=jobs)
  const currentTab = searchParams.get("tab");
  useEffect(() => {
    if (currentTab === "jobs" && phase !== "jobs") {
      setPhase("jobs");
      setActiveNav("jobs");
    } else if (currentTab !== "jobs" && phase === "jobs") {
      setPhase("hub");
      setActiveNav("dashboard");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab]);

  // Check onboarding flag on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }, []);

  // Memoized spotlight steps
  const spotlightSteps = useMemo<SpotlightStep[]>(
    () => [
      {
        targetRef: optimizeTileRef,
        title: "Start here — Optimize for a Job",
        description:
          "Match your resume to any job description and see your Match Score with actionable feedback.",
        placement: "bottom" as const,
      },
      {
        targetRef: resumePanelRef,
        title: "Paste your resume",
        description:
          "Paste your resume text or upload a PDF/DOCX file. We'll extract the content automatically.",
        placement: "right" as const,
      },
      {
        targetRef: jdPanelRef,
        title: "Add the job description",
        description:
          "Paste the job description you're targeting and hit 'Check my resume' to see your Match Score.",
        placement: "right" as const,
      },
    ],
    [],
  );

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, "1");
  }, []);

  const handleOnboardingNext = useCallback(() => {
    const nextStep = onboardingStep + 1;
    if (nextStep >= spotlightSteps.length) {
      dismissOnboarding();
      return;
    }
    setOnboardingStep(nextStep);
    // Sync phase with onboarding step
    if (nextStep === 1) setPhase("resume_input");
    else if (nextStep === 2) setPhase("jd_input");
  }, [onboardingStep, spotlightSteps.length, dismissOnboarding]);

  const handleQuickAnalyze = useCallback(() => {
    dismissOnboarding();
    setPhase("resume_input");
    setActiveNav("dashboard");
  }, [dismissOnboarding]);

  const handleNavChange = useCallback(
    (nav: "dashboard" | "jobs") => {
      setActiveNav(nav);
      if (nav === "jobs") {
        dismissOnboarding();
        setPhase("jobs");
      } else {
        setPhase("hub");
      }
    },
    [dismissOnboarding],
  );

  // Tile actions
  const handleOptimize = useCallback(() => {
    if (showOnboarding) {
      // Advance onboarding
      setOnboardingStep(1);
    }
    setPhase("resume_input");
  }, [showOnboarding]);

  const handleApplyPack = useCallback(() => {
    dismissOnboarding();
    setPhase("pack_resume");
  }, [dismissOnboarding]);

  // Resume continue
  const handleResumeContinue = useCallback(() => {
    if (showOnboarding && onboardingStep === 1) {
      setOnboardingStep(2);
    }
    setPhase("jd_input");
  }, [showOnboarding, onboardingStep]);

  // JD continue (only used by onboarding flow)
  const handleJdContinue = useCallback(() => {
    if (showOnboarding) {
      dismissOnboarding();
    }
  }, [showOnboarding, dismissOnboarding]);

  // File upload handler (memoized with useCallback)
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setFileName(file.name);
      setProgress("Extracting text from file...");

      try {
        const { extractTextFromFile } = await import("@/lib/file-parser");
        const text = await extractTextFromFile(file);

        if (!text || text.trim().length < 20) {
          setError(
            "Could not extract enough text from the file. Try pasting your resume instead.",
          );
          setFileName(null);
          setProgress("");
          return;
        }

        const detection = detectResume(text);
        if (!detection.isLikelyResume) {
          setResumeWarning(
            detection.message ||
              "This doesn't look like a resume. Please upload your resume.",
          );
        } else {
          setResumeWarning(null);
        }

        setResumeText(text);
        setProgress("");
        trackEvent("resume_uploaded", {
          fileType: file.name.split(".").pop() || "unknown",
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to parse file. Try pasting your resume instead.",
        );
        setFileName(null);
        setProgress("");
      }
    },
    [],
  );

  // Analyze handler
  const handleAnalyze = useCallback(async () => {
    setError(null);

    if (!resumeText.trim()) {
      setError("Please provide your resume text.");
      return;
    }
    if (resumeText.trim().length < 50) {
      setError("Resume seems too short. Please provide more content.");
      return;
    }

    const detection = detectResume(resumeText);
    if (!detection.isLikelyResume) {
      setError(
        detection.message ||
          "This doesn't look like a resume. Please provide your actual resume content.",
      );
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }
    if (jobDescription.trim().length < 30) {
      setError(
        "Job description seems too short. Please provide more content.",
      );
      return;
    }

    dismissOnboarding();
    setIsAnalyzing(true);
    setPhase("analyzing");
    setProgress("Parsing resume and job description...");

    try {
      trackEvent("analysis_started");
      setProgress("Computing your Match Score...");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeText.slice(0, MAX_RESUME_LENGTH),
          jobDescriptionText: jobDescription.slice(0, MAX_JD_LENGTH),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || `Analysis failed (${response.status})`,
        );
      }

      const result = await response.json();

      sessionStorage.setItem("rt_analysis", JSON.stringify(result));
      sessionStorage.setItem("rt_resume_text", resumeText);
      sessionStorage.setItem("rt_jd_text", jobDescription);

      if (result.radarResult) {
        sessionStorage.setItem(
          "rt_radar_before",
          JSON.stringify(result.radarResult),
        );
      }

      trackEvent("analysis_generated", {
        score: result.radarResult?.score || result.atsResult.score,
      });

      const jobTitle = result.jobProfile?.title || "Untitled Role";
      const company = result.jobProfile?.company || "";
      const session = saveJobSession({
        jobTitle,
        company,
        radarBefore: result.radarResult?.score || result.atsResult.score,
      });
      sessionStorage.setItem("rt_current_session_id", session.id);

      setProgress("Redirecting to results...");
      router.push("/results");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Analysis failed. Please try again.",
      );
      setIsAnalyzing(false);
      setPhase("jd_input");
      setProgress("");
    }
  }, [resumeText, jobDescription, router, dismissOnboarding]);

  // Pre-fill JD from job board
  const handleJobSelect = useCallback(
    (jdText: string, jobTitle?: string) => {
      setJobDescription(jdText);
      setAutoFilledJobTitle(jobTitle || null);
      setPhase("resume_input");
      setActiveNav("dashboard");
    },
    [],
  );

  // Bulk generate from job board: pre-fill pack jobs, go to resume step
  const handleBulkGenerateFromJobs = useCallback(
    (selectedJobs: Array<{ title: string; jd: string }>) => {
      // Store selected jobs in sessionStorage so ApplyPackFlow or results/pack can use them
      sessionStorage.setItem(
        "rt_pending_pack_jobs",
        JSON.stringify(selectedJobs),
      );
      setPendingPackJobCount(selectedJobs.length);
      setActiveNav("dashboard");
      // If resume is already provided, go directly to pack generation
      if (resumeText.trim().length >= 50) {
        sessionStorage.setItem("rt_resume_text", resumeText);
        sessionStorage.setItem("rt_pack_jobs", JSON.stringify(selectedJobs));
        router.push("/results/pack");
      } else {
        // Need resume first
        setPhase("pack_resume");
      }
    },
    [resumeText, router],
  );

  // Apply pack resume continue
  const handlePackResumeContinue = useCallback(() => {
    // Check if we have pending pack jobs from job board selection
    const pendingJobs = sessionStorage.getItem("rt_pending_pack_jobs");
    if (pendingJobs) {
      // Skip manual JD entry — go straight to generation with job board selections
      sessionStorage.setItem("rt_resume_text", resumeText);
      sessionStorage.setItem("rt_pack_jobs", pendingJobs);
      sessionStorage.removeItem("rt_pending_pack_jobs");
      router.push("/results/pack");
    } else {
      setPhase("pack_jds");
    }
  }, [resumeText, router]);

  // Back navigation
  const handleBack = useCallback(() => {
    switch (phase) {
      case "resume_input":
        setPhase("hub");
        break;
      case "jd_input":
        setPhase("resume_input");
        break;
      case "pack_resume":
        setPhase("hub");
        break;
      case "pack_jds":
        setPhase("pack_resume");
        break;
      case "jobs":
        setPhase("hub");
        setActiveNav("dashboard");
        break;
      default:
        break;
    }
  }, [phase]);

  const resumeReady = resumeText.trim().length >= 50;
  const jdReady = jobDescription.trim().length >= 30;
  const stepIndex = getStepIndex(phase);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full max-w-full overflow-x-hidden">
      {/* Sidebar */}
      <DashboardSidebar
        activeNav={activeNav}
        onNavChange={handleNavChange}
        onQuickAnalyze={handleQuickAnalyze}
      />

      {/* Main content area */}
      <div className="min-w-0 flex-1 overflow-x-hidden px-4 py-8 lg:px-8">
        {/* Error / Warning banners */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {resumeWarning && !error && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {resumeWarning}
          </div>
        )}

        {/* ── Hub Phase ── */}
        {phase === "hub" && (
          <div className="animate-slide-up-in mx-auto max-w-3xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                What would you like to do?
              </h1>
              <p className="mt-1 text-gray-500">
                Pick an action to get started, or use Quick Analyze in the
                sidebar.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DashboardTile
                ref={optimizeTileRef}
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="Optimize for a Job"
                description="Match your resume to a specific job and see your Match Score."
                badge="Free"
                onClick={handleOptimize}
              />
              <DashboardTile
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
                title="Bulk CV Generator"
                description="Add up to 5 job descriptions and get a tailored CV for each one — all generated in one go."
                badge="From $19.99"
                onClick={handleApplyPack}
              />
              <DashboardTile
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
                title="Create from Scratch"
                description="Start with a blank canvas and build a tailored resume from scratch."
                comingSoon
              />
            </div>
          </div>
        )}

        {/* ── Step Dots + Back Arrow (for input phases) ── */}
        {stepIndex >= 0 && (
          <div className="mx-auto mb-6 flex max-w-2xl items-center gap-2 sm:gap-4">
            <button
              onClick={handleBack}
              className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Go back"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 overflow-x-auto">
              {STEP_LABELS.map((label, i) => (
                <div key={label} className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
                  <div
                    className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2 py-1 sm:px-3 text-xs font-medium transition-colors ${
                      i === stepIndex
                        ? "bg-blue-100 text-blue-700"
                        : i < stepIndex
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {i < stepIndex ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="flex h-3.5 w-3.5 items-center justify-center text-[10px]">
                        {i + 1}
                      </span>
                    )}
                    {label}
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div
                      className={`h-px w-4 sm:w-6 ${
                        i < stepIndex ? "bg-green-300" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Resume Input Phase ── */}
        {(phase === "resume_input" ||
          phase === "jd_input" ||
          phase === "ready" ||
          phase === "analyzing") && (
          <div
            ref={resumePanelRef}
            className="animate-slide-up-in mx-auto max-w-2xl"
          >
            {resumeMode === "upload" ? (
              <ResumeUploader
                fileName={fileName}
                resumeText={resumeText}
                disabled={isAnalyzing}
                onFileUpload={handleFileUpload}
                onRemove={() => {
                  setFileName(null);
                  setResumeText("");
                }}
                onSwitchToPaste={() => setResumeMode("paste")}
              />
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Paste Your Resume
                  </h2>
                  <button
                    onClick={() => setResumeMode("upload")}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Switch to upload
                  </button>
                </div>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  className="h-64 w-full resize-none rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isAnalyzing}
                />
                {resumeText && (
                  <p className="mt-2 text-sm text-gray-400">
                    {resumeText.length.toLocaleString()} characters
                  </p>
                )}
              </div>
            )}

            {resumeText && phase === "resume_input" && resumeReady && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleResumeContinue}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── JD Input Phase ── */}
        {(phase === "jd_input" ||
          phase === "ready" ||
          phase === "analyzing") && (
          <div
            ref={jdPanelRef}
            className="animate-slide-up-in mx-auto mt-4 max-w-2xl"
          >
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Job Description
              </h2>

              {/* Auto-fill banner when JD came from Job Board */}
              {autoFilledJobTitle && jobDescription.trim().length > 0 && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Auto-filled from Job Board
                    </p>
                    <p className="mt-0.5 text-sm text-green-700">
                      Job description for <span className="font-medium">{autoFilledJobTitle}</span> has been loaded automatically. You can edit it below or proceed as-is.
                    </p>
                  </div>
                </div>
              )}

              <textarea
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  // Clear auto-fill banner if user manually edits
                  if (autoFilledJobTitle) setAutoFilledJobTitle(null);
                  if (
                    e.target.value.length > 30 &&
                    !sessionStorage.getItem("rt_jd_tracked")
                  ) {
                    trackEvent("jd_pasted");
                    sessionStorage.setItem("rt_jd_tracked", "1");
                  }
                }}
                placeholder="Paste the full job description here..."
                className="h-48 w-full resize-none rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isAnalyzing}
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  {jobDescription ? `${jobDescription.length.toLocaleString()} characters` : "\u00A0"}
                </p>
                <button
                  ref={analyzeBtnRef}
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !jdReady || !resumeReady}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    "Check my resume"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Analyzing progress ── */}
        {phase === "analyzing" && progress && (
          <div className="mx-auto mt-4 max-w-2xl text-center">
            <p className="text-sm text-gray-500">{progress}</p>
            <p className="mt-2 text-xs text-gray-400">
              If this takes more than a few seconds,{" "}
              <button
                onClick={() => window.location.reload()}
                className="text-blue-500 hover:underline"
              >
                refresh the page
              </button>.
            </p>
          </div>
        )}

        {/* ── Job Board Phase ── */}
        {phase === "jobs" && (
          <div className="animate-slide-up-in mx-auto max-w-4xl">
            <JobBoard
              onSelectJob={handleJobSelect}
              onBulkGenerate={handleBulkGenerateFromJobs}
              resumeText={resumeText.trim().length >= 50 ? resumeText : undefined}
            />
          </div>
        )}

        {/* ── Bulk CV Generator Resume Phase ── */}
        {phase === "pack_resume" && (
          <div className="animate-slide-up-in mx-auto max-w-2xl">
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              Bulk CV Generator — Your Resume
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              {pendingPackJobCount > 0
                ? `Provide your resume and we'll generate ${pendingPackJobCount} tailored CV${pendingPackJobCount !== 1 ? "s" : ""} — one for each job you selected.`
                : "First, provide your resume. Then you'll add up to 5 job descriptions and we'll generate a tailored CV for each one."}
            </p>

            {/* Auto-fill banner when jobs came from Job Board */}
            {pendingPackJobCount > 0 && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {pendingPackJobCount} job description{pendingPackJobCount !== 1 ? "s" : ""} loaded from Job Board
                  </p>
                  <p className="mt-0.5 text-sm text-green-700">
                    No need to paste anything — just upload your resume and we&apos;ll handle the rest.
                  </p>
                </div>
              </div>
            )}

            {resumeMode === "upload" ? (
              <ResumeUploader
                fileName={fileName}
                resumeText={resumeText}
                disabled={false}
                onFileUpload={handleFileUpload}
                onRemove={() => {
                  setFileName(null);
                  setResumeText("");
                }}
                onSwitchToPaste={() => setResumeMode("paste")}
              />
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">
                    Paste Your Resume
                  </h3>
                  <button
                    onClick={() => setResumeMode("upload")}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Switch to upload
                  </button>
                </div>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  className="h-64 w-full resize-none rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {resumeText && (
                  <p className="mt-2 text-sm text-gray-400">
                    {resumeText.length.toLocaleString()} characters
                  </p>
                )}
              </div>
            )}

            {resumeReady && (
              <div className="mt-4 text-center">
                <button
                  onClick={handlePackResumeContinue}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  {pendingPackJobCount > 0
                    ? `Generate ${pendingPackJobCount} Tailored CV${pendingPackJobCount !== 1 ? "s" : ""}`
                    : "Continue to Job Descriptions"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Bulk CV Generator JDs Phase ── */}
        {phase === "pack_jds" && (
          <div className="animate-slide-up-in mx-auto max-w-3xl">
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
            <ApplyPackFlow resumeText={resumeText} />
          </div>
        )}
      </div>

      {/* Spotlight overlay */}
      {showOnboarding && (
        <SpotlightOverlay
          steps={spotlightSteps}
          currentStep={onboardingStep}
          onNext={handleOnboardingNext}
          onSkip={dismissOnboarding}
        />
      )}
    </div>
  );
}
