"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FreeAnalysisResult } from "@/lib/types";
import ScoreCard from "@/components/ScoreCard";
import KeywordList from "@/components/KeywordList";
import StrengthsList from "@/components/StrengthsList";
import GapsList from "@/components/GapsList";
import RewritePreviews from "@/components/RewritePreviews";
import ProUpgradeCard from "@/components/ProUpgradeCard";
import { trackEvent } from "@/lib/analytics";

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<FreeAnalysisResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    // Small delay to ensure sessionStorage writes from /demo are flushed
    const timer = setTimeout(() => {
      // Check for demo data first
      const demoData = sessionStorage.getItem("rt_demo");
      if (demoData) {
        try {
          const parsed = JSON.parse(demoData);
          setResult(convertDemoToFreeResult(parsed));
          setIsDemo(true);
          sessionStorage.removeItem("rt_demo");
          setLoading(false);
          return;
        } catch {
          // Fall through to analysis data
        }
      }

      // Check for analysis data
      const analysisData = sessionStorage.getItem("rt_analysis");
      if (analysisData) {
        try {
          const parsed = JSON.parse(analysisData);
          setResult(parsed);
          setLoading(false);
          return;
        } catch {
          // Fall through
        }
      }

      // No data found — show message instead of silent redirect
      setLoading(false);
      setNoData(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">Loading results...</p>
        </div>
      </div>
    );
  }

  if (noData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">No results yet</h2>
          <p className="mt-2 text-sm text-gray-600">Analyze your resume first to see results here.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => router.push("/analyze")}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Analyze My Resume
            </button>
            <button
              onClick={() => router.push("/demo")}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              See a Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {isDemo && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          This is a demo with sample data.{" "}
          <Link href="/analyze" className="font-medium underline">
            Analyze your own resume
          </Link>{" "}
          for personalized results.
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Analysis Results</h1>
        <p className="mt-2 text-gray-600">
          {result.jobProfile.title
            ? `Analysis for ${result.jobProfile.title}${result.jobProfile.company ? ` at ${result.jobProfile.company}` : ""}`
            : "Resume analysis complete"}
        </p>
      </div>

      {/* Score cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard
          label="ATS Match Score"
          score={result.atsResult.score}
          description="How well your resume matches the job requirements"
        />
        <ScoreCard
          label="Skill Overlap"
          score={result.atsResult.breakdown.skillOverlap}
          description="Matching skills and technologies"
        />
        <ScoreCard
          label="Keyword Coverage"
          score={result.atsResult.breakdown.keywordCoverage}
          description="Relevant keywords found in your resume"
        />
        <ScoreCard
          label="Impact Strength"
          score={result.atsResult.breakdown.impactStrength}
          description="Use of metrics, action verbs, and results"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <KeywordList
            matched={result.atsResult.matchedKeywords}
            missing={result.atsResult.missingKeywords}
          />
          <StrengthsList strengths={result.strengths} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <GapsList gaps={result.gaps} />
          {result.atsResult.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <h3 className="mb-3 text-lg font-semibold text-amber-900">ATS Warnings</h3>
              <ul className="space-y-2">
                {result.atsResult.warnings.map((warning, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Rewrite previews */}
      {result.rewritePreviews.length > 0 && (
        <div className="mt-8">
          <RewritePreviews previews={result.rewritePreviews} />
        </div>
      )}

      {/* Suggestions */}
      {result.atsResult.suggestions.length > 0 && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Actionable Suggestions</h3>
          <ol className="space-y-3">
            {result.atsResult.suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                  {i + 1}
                </span>
                {suggestion}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Pro upgrade CTA - only for real analyses, not demos */}
      {!isDemo && (
        <div className="mt-10">
          <ProUpgradeCard onUpgrade={() => {
            trackEvent("pro_viewed");
          }} />
        </div>
      )}

      {/* Back to analyze */}
      <div className="mt-8 text-center">
        <Link
          href="/analyze"
          className="text-sm text-blue-600 hover:underline"
        >
          Analyze another resume
        </Link>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertDemoToFreeResult(demo: any): FreeAnalysisResult {
  return {
    atsResult: {
      score: demo.atsMatchScore || 58,
      missingKeywords: (demo.missingKeywords || []).map((k: { keyword: string }) => k.keyword),
      matchedKeywords: [],
      suggestions: demo.nextActions || [],
      warnings: (demo.atsWarnings || []).map((w: { issue: string; fix: string }) => `${w.issue}: ${w.fix}`),
      breakdown: {
        skillOverlap: 45,
        keywordCoverage: 52,
        seniorityMatch: 75,
        impactStrength: 60,
      },
    },
    candidateProfile: {
      name: "Sarah Chen",
      headline: "Senior Software Engineer",
      skills: ["JavaScript", "TypeScript", "React", "Node.js", "Express", "PostgreSQL", "MongoDB", "Git", "AWS", "Docker"],
      experience: [],
      education: [],
      projects: [],
    },
    jobProfile: {
      title: "Senior Full-Stack Engineer",
      company: "CloudScale Inc.",
      requiredSkills: [],
      preferredSkills: [],
      responsibilities: [],
      keywords: [],
    },
    strengths: [
      "7+ years of relevant experience across 3 positions",
      "Multiple bullets include quantifiable impact metrics",
      "Demonstrates leadership and mentoring experience",
      "Strong action verbs showing ownership and impact",
    ],
    gaps: [
      "Missing key required skills: Python, Go, Kubernetes",
      "No professional summary section",
      "Less than 30% of bullets include quantifiable results",
    ],
    rewritePreviews: (demo.bulletRewrites || []).slice(0, 3).map((b: { original: string; rewritten: string }) => ({
      original: b.original,
      improved: b.rewritten,
    })),
  };
}
