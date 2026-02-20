"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FreeAnalysisResult, RadarResult } from "@/lib/types";
import type { Plan } from "@/lib/entitlement";
import ScoreCard from "@/components/ScoreCard";
import BlockerCard from "@/components/BlockerCard";
import KeywordList from "@/components/KeywordList";
import StrengthsList from "@/components/StrengthsList";
import GapsList from "@/components/GapsList";
import RewritePreviews from "@/components/RewritePreviews";
import ResumePreviewCard from "@/components/ResumePreviewCard";
import PaywallPlanPicker from "@/components/PaywallPlanPicker";
import ShareCard from "@/components/ShareCard";
import { trackEvent } from "@/lib/analytics";
import { validateJD } from "@/lib/jd-validator";
import { DEMO_RADAR_RESULT, DEMO_PRO_OUTPUT } from "@/lib/demo-data";
import { saveBaseProOutput } from "@/lib/pro-store";
import { loadJobSessions, type JobSession } from "@/lib/job-sessions";
import { TRIAL_PRICE_DISPLAY, PRO_PRICE_DISPLAY, CAREER_PASS_DISPLAY } from "@/lib/constants";

const TRUSTED_REDIRECT_HOSTS = new Set(["checkout.stripe.com", "pay.stripe.com"]);
function isSafeRedirect(url: string): boolean {
  if (url.startsWith("/")) return true;
  try { return TRUSTED_REDIRECT_HOSTS.has(new URL(url).hostname); }
  catch { return false; }
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<FreeAnalysisResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const [showAtsDetails, setShowAtsDetails] = useState(false);
  const [recentRoles, setRecentRoles] = useState<JobSession[]>([]);
  const [showRecentRoles, setShowRecentRoles] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<Plan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleQuickCheckout = async (plan: Plan) => {
    setCheckoutError(null);
    setCheckoutLoading(plan);
    trackEvent("plan_selected", { plan, context: "top_cards" });

    try {
      const resumeText = sessionStorage.getItem("rt_resume_text");
      const jdText = sessionStorage.getItem("rt_jd_text");
      if (!resumeText || !jdText) {
        setCheckoutError("Resume data not found. Please re-analyze your resume first.");
        setCheckoutLoading(null);
        return;
      }

      const jdCheck = validateJD(jdText);
      if (!jdCheck.valid) {
        setCheckoutError(jdCheck.reason || "Job description is too short or invalid.");
        setCheckoutLoading(null);
        return;
      }

      sessionStorage.setItem("rt_pending_pro", "true");

      // Speculative pre-generation: start LLM work NOW while user
      // completes Stripe checkout (~1-3 min). Result lands in server
      // cache so /api/generate-pro hits it instantly after payment.
      fetch("/api/pre-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescriptionText: jdText }),
      }).catch(() => {}); // fire-and-forget, never block checkout

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Checkout failed");
      }

      const data = await res.json();

      if (data.devMode && data.token) {
        sessionStorage.setItem("rt_entitlement_token", data.token);
        sessionStorage.setItem("rt_entitlement_plan", plan);
        if (isSafeRedirect(data.url)) window.location.href = data.url;
      } else if (data.url && isSafeRedirect(data.url)) {
        window.location.href = data.url;
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Unable to start checkout.");
      setCheckoutLoading(null);
    }
  };

  useEffect(() => {
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
          // Fall through
        }
      }

      // Check for analysis data
      const analysisData = sessionStorage.getItem("rt_analysis");
      if (analysisData) {
        try {
          const parsed = JSON.parse(analysisData);
          setResult(parsed);
          setLoading(false);
          trackEvent("radar_viewed", { bucket: getBucket(parsed.radarResult?.score) });
          return;
        } catch {
          // Fall through
        }
      }

      setLoading(false);
      setNoData(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Load recent roles
  useEffect(() => {
    const sessions = loadJobSessions();
    if (sessions.length > 0) setRecentRoles(sessions);
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
          <p className="mt-2 text-xs text-gray-400">If this takes more than a few seconds, refresh or go back.</p>
          <Link href="/analyze" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
            Back to Analyze
          </Link>
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
              Check my resume
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

  const radar: RadarResult | undefined = result.radarResult || (isDemo ? DEMO_RADAR_RESULT : undefined);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {isDemo && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-700">
            This is a demo with sample data.{" "}
            <Link href="/analyze" className="font-medium underline">
              Analyze your own resume
            </Link>{" "}
            for personalized results.
          </p>
          <button
            onClick={() => {
              saveBaseProOutput(DEMO_PRO_OUTPUT);
              sessionStorage.setItem("rt_is_demo", "true");
              router.push("/results/pro");
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Continue to CV
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      )}

      {/* Recent Roles */}
      {recentRoles.length > 1 && (
        <div className="mb-6">
          <button
            onClick={() => setShowRecentRoles(!showRecentRoles)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <svg
              className={`h-4 w-4 transition-transform ${showRecentRoles ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Recent Roles ({recentRoles.length})
          </button>
          {showRecentRoles && (
            <div className="mt-3 space-y-2">
              {recentRoles.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{session.jobTitle}</p>
                    {session.company && (
                      <p className="text-xs text-gray-500">{session.company}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      session.radarBefore >= 75 ? "bg-green-100 text-green-700" :
                      session.radarBefore >= 60 ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {session.radarBefore}
                    </span>
                    {session.radarAfter != null && (
                      <>
                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          {session.radarAfter}
                        </span>
                      </>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Resume Match</h1>
        <p className="mt-2 text-gray-600">
          {result.jobProfile.title
            ? `Analysis for ${result.jobProfile.title}${result.jobProfile.company ? ` at ${result.jobProfile.company}` : ""}`
            : "Resume analysis complete"}
        </p>
      </div>

      {/* Radar Score + Breakdown */}
      {radar && (
        <div className="mb-8">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Primary radar gauge */}
            <ScoreCard
              variant="primary"
              label="Match Score"
              score={radar.score}
              description="How well your resume matches this job"
              radarLabel={radar.label}
            />

            {/* Breakdown bars */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Match Breakdown</h3>
              <ScoreCard variant="breakdown" label="Hard Skills" score={radar.breakdown.hardSkills} description="" />
              <ScoreCard variant="breakdown" label="Soft Skills" score={radar.breakdown.softSkills} description="" />
              <ScoreCard variant="breakdown" label="Results" score={radar.breakdown.measurableResults} description="" />
              <ScoreCard variant="breakdown" label="Keywords" score={radar.breakdown.keywordOptimization} description="" />
              <ScoreCard variant="breakdown" label="Formatting" score={radar.breakdown.formattingBestPractices} description="" />
            </div>
          </div>
        </div>
      )}

      {/* Blockers — blurred on free tier */}
      {radar && radar.blockers.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Top Blockers</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {radar.blockers.slice(0, 3).map((blocker, i) => (
              <BlockerCard
                key={i}
                blocker={blocker}
                index={i}
                locked={!isDemo && i > 0}
              />
            ))}
          </div>
          {!isDemo && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-500">
                Unlock all blockers with detailed fixes —{" "}
                <Link href="#pro-upgrade" className="font-semibold text-emerald-600 hover:underline">
                  Try for $1.50
                </Link>{" "}
                or{" "}
                <Link href="#pro-upgrade" className="font-semibold text-blue-600 hover:underline">
                  Get Pro
                </Link>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Generate tailored CV — plan options */}
      {!isDemo && process.env.NEXT_PUBLIC_PRO_ENABLED !== "false" && (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-gray-900">Generate a tailored CV</h2>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">AI-powered</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              onClick={() => handleQuickCheckout("trial")}
              disabled={checkoutLoading !== null}
              className="group rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 disabled:opacity-50"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-gray-900">Career Trial</span>
                <span className="text-sm font-bold text-emerald-700">{TRIAL_PRICE_DISPLAY}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Full CV + cover letter for 1 job</p>
              {checkoutLoading === "trial" && <p className="mt-1 text-xs font-medium text-emerald-600">Redirecting...</p>}
            </button>
            <button
              onClick={() => handleQuickCheckout("pro")}
              disabled={checkoutLoading !== null}
              className="group rounded-lg border-2 border-blue-200 bg-blue-50/30 px-4 py-3 text-left transition-colors hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
            >
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-gray-900">Pro</span>
                  <span className="rounded bg-blue-600 px-1.5 py-px text-[10px] font-bold text-white">Popular</span>
                </div>
                <span className="text-sm font-bold text-blue-700">{PRO_PRICE_DISPLAY}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">PDF/DOCX exports + 2 re-generations</p>
              {checkoutLoading === "pro" && <p className="mt-1 text-xs font-medium text-blue-600">Redirecting...</p>}
            </button>
            <button
              onClick={() => handleQuickCheckout("pass")}
              disabled={checkoutLoading !== null}
              className="group rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 disabled:opacity-50"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-gray-900">Career Pass</span>
                <span className="text-sm font-bold text-indigo-700">{CAREER_PASS_DISPLAY}<span className="text-xs font-normal text-gray-400">/30d</span></span>
              </div>
              <p className="mt-1 text-xs text-gray-500">50 jobs + dashboard + all exports</p>
              {checkoutLoading === "pass" && <p className="mt-1 text-xs font-medium text-indigo-600">Redirecting...</p>}
            </button>
          </div>
          {checkoutError && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {checkoutError}
            </div>
          )}
        </div>
      )}

      {/* Resume Preview — free tier teaser */}
      {!isDemo && result.candidateProfile && process.env.NEXT_PUBLIC_PRO_ENABLED !== "false" && (
        <ResumePreviewCard
          candidate={result.candidateProfile}
          job={result.jobProfile}
          improvedBullets={result.rewritePreviews}
          onUpgrade={(plan) => handleQuickCheckout(plan)}
          loading={checkoutLoading !== null}
        />
      )}

      {/* Keywords, Strengths, Gaps */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <KeywordList
            matched={radar?.atsCompat.matchedKeywords || result.atsResult.matchedKeywords}
            missing={radar?.atsCompat.missingKeywords || result.atsResult.missingKeywords}
          />
          <StrengthsList strengths={result.strengths} />
        </div>
        <div className="space-y-6">
          <GapsList gaps={result.gaps} />
          {(radar?.atsCompat.warnings || result.atsResult.warnings).length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <h3 className="mb-3 text-lg font-semibold text-amber-900">Formatting Warnings</h3>
              <ul className="space-y-2">
                {(radar?.atsCompat.warnings || result.atsResult.warnings).map((warning, i) => (
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

      {/* Collapsible ATS details */}
      {result.atsResult && (
        <div className="mt-6">
          <button
            onClick={() => setShowAtsDetails(!showAtsDetails)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <svg
              className={`h-4 w-4 transition-transform ${showAtsDetails ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Compatibility checks (advanced)
          </button>
          {showAtsDetails && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ScoreCard
                label="ATS Match"
                score={result.atsResult.score}
                description="Overall ATS compatibility"
              />
              <ScoreCard
                label="Skill Overlap"
                score={result.atsResult.breakdown.skillOverlap}
                description="Matching skills"
              />
              <ScoreCard
                label="Keyword Coverage"
                score={result.atsResult.breakdown.keywordCoverage}
                description="Keywords found"
              />
              <ScoreCard
                label="Impact Strength"
                score={result.atsResult.breakdown.impactStrength}
                description="Metrics and results"
              />
            </div>
          )}
        </div>
      )}

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

      {/* Share card */}
      <ShareCard className="mt-8" />

      {/* Plan upgrade CTA — hidden in demo or when Pro is disabled */}
      {!isDemo && process.env.NEXT_PUBLIC_PRO_ENABLED !== "false" && (
        <div className="mt-10" id="pro-upgrade">
          <h2 className="mb-4 text-center text-xl font-bold text-gray-900">
            Unlock the full analysis
          </h2>
          <p className="mb-6 text-center text-sm text-gray-500">
            Try everything for $1.50, or go Pro for PDF exports and re-generations.
          </p>
          <PaywallPlanPicker context="free_results" />
        </div>
      )}

      {/* Back to analyze */}
      <div className="mt-8 text-center">
        <Link
          href="/analyze"
          className="text-base font-medium text-blue-600 hover:underline"
        >
          Analyze another resume
        </Link>
      </div>
    </div>
  );
}

function getBucket(score?: number): string {
  if (!score) return "unknown";
  if (score >= 75) return "strong";
  if (score >= 50) return "needs_sharpening";
  return "signal_hidden";
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
    radarResult: DEMO_RADAR_RESULT,
  };
}
