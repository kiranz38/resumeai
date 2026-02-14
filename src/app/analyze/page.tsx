"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { detectResume } from "@/lib/resume-detector";
import { saveJobSession } from "@/lib/job-sessions";

type InputMode = "upload" | "paste";

const MAX_RESUME_LENGTH = 50_000;
const MAX_JD_LENGTH = 30_000;

export default function AnalyzePage() {
  const router = useRouter();
  const [resumeMode, setResumeMode] = useState<InputMode>("paste");
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [resumeWarning, setResumeWarning] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);
    setProgress("Extracting text from file...");

    try {
      const { extractTextFromFile } = await import("@/lib/file-parser");
      const text = await extractTextFromFile(file);

      if (!text || text.trim().length < 20) {
        setError("Could not extract enough text from the file. Try pasting your resume instead.");
        setFileName(null);
        setProgress("");
        return;
      }

      // Check if the content looks like a resume
      const detection = detectResume(text);
      if (!detection.isLikelyResume) {
        setResumeWarning(detection.message || "This doesn't look like a resume. Please upload your resume.");
      } else {
        setResumeWarning(null);
      }

      setResumeText(text);
      setProgress("");
      trackEvent("resume_uploaded", { fileType: file.name.split(".").pop() || "unknown" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file. Try pasting your resume instead.");
      setFileName(null);
      setProgress("");
    }
  }, []);

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
      setError(detection.message || "This doesn't look like a resume. Please provide your actual resume content.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }
    if (jobDescription.trim().length < 30) {
      setError("Job description seems too short. Please provide more content.");
      return;
    }

    setIsAnalyzing(true);
    setProgress("Parsing resume and job description...");

    try {
      trackEvent("analysis_started");

      setProgress("Computing your Radar Score...");

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

      // Store result in sessionStorage (not permanent storage)
      sessionStorage.setItem("rt_analysis", JSON.stringify(result));
      sessionStorage.setItem("rt_resume_text", resumeText);
      sessionStorage.setItem("rt_jd_text", jobDescription);

      // Store radar score for before/after comparison on Pro page
      if (result.radarResult) {
        sessionStorage.setItem("rt_radar_before", JSON.stringify(result.radarResult));
      }

      trackEvent("analysis_generated", { score: result.radarResult?.score || result.atsResult.score });

      // Save job session for recent roles tracking
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
      setProgress("");
    }
  }, [resumeText, jobDescription, router]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Analyze Your Resume</h1>
        <p className="mt-2 text-gray-600">
          Paste your resume and a job description to get your Radar Score, missing keywords, and actionable feedback.
        </p>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resume input */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your Resume</h2>
            <div className="flex rounded-lg border border-gray-200 text-sm">
              <button
                onClick={() => setResumeMode("paste")}
                className={`px-3 py-1.5 ${
                  resumeMode === "paste"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                } rounded-l-lg transition-colors`}
              >
                Paste
              </button>
              <button
                onClick={() => setResumeMode("upload")}
                className={`px-3 py-1.5 ${
                  resumeMode === "upload"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                } rounded-r-lg transition-colors`}
              >
                Upload
              </button>
            </div>
          </div>

          {resumeMode === "paste" ? (
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="h-80 w-full resize-none rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isAnalyzing}
            />
          ) : (
            <div className="flex h-80 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              {fileName ? (
                <div className="text-center">
                  <svg className="mx-auto h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-sm font-medium text-gray-700">{fileName}</p>
                  <p className="text-sm text-gray-500">{resumeText.length.toLocaleString()} characters extracted</p>
                  <button
                    onClick={() => {
                      setFileName(null);
                      setResumeText("");
                    }}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer text-center">
                  <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="mt-1 text-sm text-gray-400">PDF, DOCX, or TXT</p>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isAnalyzing}
                  />
                </label>
              )}
            </div>
          )}

          {resumeText && (
            <p className="mt-2 text-sm text-gray-400">
              {resumeText.length.toLocaleString()} characters
            </p>
          )}
        </div>

        {/* Job description input */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Job Description</h2>
          <textarea
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              if (e.target.value.length > 30 && !sessionStorage.getItem("rt_jd_tracked")) {
                trackEvent("jd_pasted");
                sessionStorage.setItem("rt_jd_tracked", "1");
              }
            }}
            placeholder="Paste the full job description here..."
            className="h-80 w-full resize-none rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isAnalyzing}
          />
          {jobDescription && (
            <p className="mt-2 text-sm text-gray-400">
              {jobDescription.length.toLocaleString()} characters
            </p>
          )}
        </div>
      </div>

      {/* Analyze button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !resumeText.trim() || !jobDescription.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-10 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </>
          ) : (
            "Check my resume"
          )}
        </button>

        {progress && (
          <p className="mt-3 text-sm text-gray-500">{progress}</p>
        )}
      </div>

      {/* Privacy note */}
      <p className="mt-6 text-center text-sm text-gray-400">
        Your resume and job description are processed in memory only. Nothing is stored on our servers.
      </p>
    </div>
  );
}
