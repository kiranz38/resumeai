"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { detectResume } from "@/lib/resume-detector";
import { saveJobSession } from "@/lib/job-sessions";
import ResumeUploader from "@/components/ResumeUploader";

const MAX_RESUME_LENGTH = 50_000;
const MAX_JD_LENGTH = 30_000;

type Step = "upload" | "jd" | "analyzing";

/**
 * Inline resume analyzer for the landing page.
 * Collapses the entire Upload → JD → Analyze flow into one section.
 * After analysis completes, redirects to /results.
 */
export default function LandingAnalyzer() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeWarning, setResumeWarning] = useState<string | null>(null);
  const jdRef = useRef<HTMLTextAreaElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const jdTrackedRef = useRef(false);

  const resumeReady = resumeText.trim().length >= 50;
  const jdReady = jobDescription.trim().length >= 30;

  // Fire landing_viewed once on mount
  useEffect(() => {
    trackEvent("landing_viewed", { page_name: "landing" });
  }, []);

  // Auto-advance to JD step when resume is uploaded
  useEffect(() => {
    if (resumeReady && step === "upload") {
      setStep("jd");
      setTimeout(() => {
        jdRef.current?.focus();
        jdRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    }
  }, [resumeReady, step]);

  // File upload handler
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
          setError("Could not extract enough text. Try pasting your resume instead.");
          setFileName(null);
          setProgress("");
          return;
        }

        const detection = detectResume(text);
        if (!detection.isLikelyResume) {
          setResumeWarning(detection.message || "This doesn't look like a resume.");
        } else {
          setResumeWarning(null);
        }

        setResumeText(text);
        setProgress("");
        trackEvent("resume_uploaded", {
          fileType: file.name.split(".").pop() || "unknown",
          page_name: "landing",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse file. Try pasting instead.");
        setFileName(null);
        setProgress("");
      }
    },
    [],
  );

  // Analyze handler
  const handleAnalyze = useCallback(async () => {
    setError(null);

    if (!resumeText.trim() || resumeText.trim().length < 50) {
      setError("Please provide your resume text (at least 50 characters).");
      return;
    }

    const detection = detectResume(resumeText);
    if (!detection.isLikelyResume) {
      setError(detection.message || "This doesn't look like a resume.");
      return;
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 30) {
      setError("Please paste the job description (at least 30 characters).");
      return;
    }

    setIsAnalyzing(true);
    setStep("analyzing");
    setProgress("Computing your Match Score...");

    try {
      trackEvent("check_resume_clicked", { page_name: "landing" });

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
        throw new Error(data.error || `Analysis failed (${response.status})`);
      }

      const result = await response.json();

      sessionStorage.setItem("rt_analysis", JSON.stringify(result));
      sessionStorage.setItem("rt_resume_text", resumeText);
      sessionStorage.setItem("rt_jd_text", jobDescription);

      if (result.radarResult) {
        sessionStorage.setItem("rt_radar_before", JSON.stringify(result.radarResult));
      }

      trackEvent("match_score_shown", {
        score_value: result.radarResult?.score || result.atsResult.score,
        page_name: "landing",
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
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setIsAnalyzing(false);
      setStep("jd");
      setProgress("");
    }
  }, [resumeText, jobDescription, router]);

  return (
    <div ref={sectionRef} id="analyze" className="mx-auto max-w-2xl">
      {/* Step indicators */}
      <div className="mb-6 flex items-center justify-center gap-3">
        <StepDot active={step === "upload"} done={resumeReady} label="1. Upload Resume" />
        <div className="h-px w-8 bg-gray-200" />
        <StepDot active={step === "jd"} done={jdReady && resumeReady} label="2. Paste Job Description" />
        <div className="h-px w-8 bg-gray-200" />
        <StepDot active={step === "analyzing"} done={false} label="3. Get Score" />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Warning */}
      {resumeWarning && !error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {resumeWarning}
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-blue-800">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {progress}
        </div>
      )}

      {/* Step 1: Resume Upload */}
      {(step === "upload" || (step === "jd" && !isAnalyzing)) && (
        <div className={step === "jd" ? "mb-6" : ""}>
          {inputMode === "upload" ? (
            <ResumeUploader
              fileName={fileName}
              resumeText={resumeText}
              disabled={isAnalyzing}
              onFileUpload={handleFileUpload}
              onRemove={() => {
                setFileName(null);
                setResumeText("");
                setResumeWarning(null);
                setStep("upload");
              }}
              onSwitchToPaste={() => setInputMode("paste")}
            />
          ) : (
            <div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your full resume text here..."
                className="h-40 w-full resize-none rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isAnalyzing}
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {resumeText ? `${resumeText.length.toLocaleString()} characters` : "Min 50 characters"}
                </p>
                <button
                  onClick={() => setInputMode("upload")}
                  className="text-xs text-blue-800 hover:text-blue-800"
                >
                  Switch to file upload
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Job Description */}
      {step === "jd" && !isAnalyzing && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Job Description
          </label>
          <textarea
            ref={jdRef}
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              if (e.target.value.length > 30 && !jdTrackedRef.current) {
                trackEvent("job_description_started", { page_name: "landing" });
                jdTrackedRef.current = true;
              }
            }}
            placeholder="Paste the full job description here..."
            className="h-40 w-full resize-none rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {jobDescription ? `${jobDescription.length.toLocaleString()} characters` : "\u00A0"}
            </p>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !jdReady || !resumeReady}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Check my resume
            </button>
          </div>
        </div>
      )}

      {/* Analyzing state */}
      {step === "analyzing" && (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-gray-600">{progress || "Analyzing..."}</p>
        </div>
      )}

      {/* Trust line */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Privacy-first — resumes processed securely and deleted automatically
      </div>
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-2.5 w-2.5 rounded-full transition-colors ${
          done ? "bg-green-500" : active ? "bg-blue-800" : "bg-gray-200"
        }`}
      />
      <span className={`text-xs ${active ? "font-medium text-gray-700" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}
