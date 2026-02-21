"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { QuickScanResult, RoleMatch } from "@/lib/role-profiles/types";
import PaywallPlanPicker from "@/components/PaywallPlanPicker";
import { trackEvent } from "@/lib/analytics";
import { PRO_PRICE_DISPLAY, TRIAL_PRICE_DISPLAY } from "@/lib/constants";

const SENIORITY_RANK: Record<string, number> = {
  junior: 0, mid: 1, senior: 2, lead: 3, executive: 4,
};

function getScoreColor(score: number) {
  if (score >= 55) return { bg: "bg-green-500", text: "text-green-700", light: "bg-green-50", border: "border-green-200", bar: "bg-green-500" };
  if (score >= 40) return { bg: "bg-blue-500", text: "text-blue-700", light: "bg-blue-50", border: "border-blue-200", bar: "bg-blue-500" };
  if (score >= 25) return { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50", border: "border-amber-200", bar: "bg-amber-500" };
  return { bg: "bg-red-400", text: "text-red-700", light: "bg-red-50", border: "border-red-200", bar: "bg-red-400" };
}

function getSeniorityLabel(seniority: string) {
  const labels: Record<string, string> = {
    junior: "Junior", mid: "Mid-Level", senior: "Senior", lead: "Lead / Manager", executive: "Executive",
  };
  return labels[seniority] || seniority;
}

export default function QuickScanResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<QuickScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const data = sessionStorage.getItem("rt_quick_scan");
      if (data) {
        try {
          const parsed = JSON.parse(data) as QuickScanResult;
          setResult(parsed);
          setLoading(false);
          trackEvent("quick_scan_viewed", {
            bestScore: parsed.bestMatchScore,
            bestRole: parsed.bestMatchRole,
            matchCount: parsed.roleMatches.length,
          });
          return;
        } catch { /* fall through */ }
      }
      setLoading(false);
      setNoData(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">Loading results...</p>
        </div>
      </div>
    );
  }

  if (noData || !result) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">No results yet</h2>
          <p className="mt-2 text-sm text-gray-600">Upload your resume first to see your market score.</p>
          <button
            onClick={() => router.push("/analyze")}
            className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Check My Resume — Free
          </button>
        </div>
      </div>
    );
  }

  const best = result.roleMatches[0];
  const candidateSeniority = best?.profile.seniority || "mid";

  // Split roles into current-level matches and aspirational (higher-level) roles
  const currentMatches = result.roleMatches.filter(
    (m) => (SENIORITY_RANK[m.profile.seniority] ?? 1) <= (SENIORITY_RANK[candidateSeniority] ?? 1),
  );
  const aspirationalMatches = result.roleMatches.filter(
    (m) => (SENIORITY_RANK[m.profile.seniority] ?? 1) > (SENIORITY_RANK[candidateSeniority] ?? 1),
  );

  const activeRole = result.roleMatches.find((m) => m.profile.id === selectedRole) || best;
  const totalIssues = activeRole.missingSkills.length + activeRole.missingKeywords.length;

  function handleUpgradeForRole(match: RoleMatch) {
    const syntheticJD = buildSyntheticJD(match.profile);
    sessionStorage.setItem("rt_jd_text", syntheticJD);
    trackEvent("quick_scan_upgrade_click", { role: match.profile.normalizedTitle, score: match.score });
    document.getElementById("quick-pro-upgrade")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">

      {/* ── Hero Score Card ── */}
      <div className="mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-10 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">
              {result.roleMatches.length} roles analyzed
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your best match: {best.score}%
            </h1>
            <p className="mt-2 text-lg text-slate-300">
              {best.profile.normalizedTitle}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {best.matchedSkills.slice(0, 5).map((s) => (
                <span key={s} className="rounded-full bg-green-500/20 border border-green-400/30 px-2.5 py-0.5 text-xs font-medium text-green-300">
                  {s}
                </span>
              ))}
              {best.missingSkills.length > 0 && (
                <span className="rounded-full bg-red-500/20 border border-red-400/30 px-2.5 py-0.5 text-xs font-medium text-red-300">
                  +{best.missingSkills.length} missing
                </span>
              )}
            </div>
          </div>

          {/* Circular score gauge */}
          <div className="relative flex-shrink-0 self-center">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={best.score >= 55 ? "#22c55e" : best.score >= 40 ? "#3b82f6" : "#f59e0b"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(best.score / 100) * 327} 327`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black">{best.score}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">/100</span>
            </div>
          </div>
        </div>

        {/* Mini breakdown bar */}
        <div className="mt-6 grid grid-cols-5 gap-2 text-center">
          {([
            ["Skills", best.radarBreakdown.hardSkills],
            ["Soft Skills", best.radarBreakdown.softSkills],
            ["Impact", best.radarBreakdown.measurableResults],
            ["Keywords", best.radarBreakdown.keywordOptimization],
            ["Format", best.radarBreakdown.formattingBestPractices],
          ] as const).map(([label, val]) => (
            <div key={label}>
              <div className="mx-auto h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full ${val >= 55 ? "bg-green-400" : val >= 40 ? "bg-blue-400" : "bg-amber-400"}`}
                  style={{ width: `${val}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">{label}</p>
              <p className="text-xs font-bold">{val}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Inline CTA after hero (strike while iron is hot) ── */}
      <div className="mb-10 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => handleUpgradeForRole(best)}
          className="w-full sm:w-auto rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-primary-hover hover:shadow-blue-500/40 hover:scale-[1.02]"
        >
          Fix My Resume Now — {PRO_PRICE_DISPLAY}
        </button>
        <button
          onClick={() => handleUpgradeForRole(best)}
          className="w-full sm:w-auto rounded-xl bg-emerald-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-700 hover:shadow-emerald-500/40 hover:scale-[1.02]"
        >
          See Full Results — {TRIAL_PRICE_DISPLAY}
        </button>
      </div>

      {/* ── Role Matches — Full Ranked List ── */}
      <div className="mb-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Your CV fits {result.roleMatches.length} roles
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Tap any role to see what&apos;s missing. Higher roles show what you need to level up.
            </p>
          </div>
        </div>

        {/* Current-level matches */}
        {currentMatches.length > 0 && (
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Current-level matches
            </p>
            <div className="space-y-3">
              {currentMatches.map((match, i) => (
                <RoleRow
                  key={match.profile.id}
                  match={match}
                  rank={i + 1}
                  isSelected={selectedRole === match.profile.id}
                  isBest={i === 0 && !aspirationalMatches.length}
                  onSelect={() => setSelectedRole(selectedRole === match.profile.id ? null : match.profile.id)}
                  onUpgrade={() => handleUpgradeForRole(match)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Aspirational / higher-level matches */}
        {aspirationalMatches.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
                Career growth paths
              </p>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                Level Up
              </span>
            </div>
            <div className="space-y-3">
              {aspirationalMatches.map((match, i) => (
                <RoleRow
                  key={match.profile.id}
                  match={match}
                  rank={currentMatches.length + i + 1}
                  isSelected={selectedRole === match.profile.id}
                  isAspirational
                  onSelect={() => setSelectedRole(selectedRole === match.profile.id ? null : match.profile.id)}
                  onUpgrade={() => handleUpgradeForRole(match)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Urgency + Social Proof Bar ── */}
      <div className="mb-10 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-amber-800">
              This analysis is saved for this session only. Close this tab and it&apos;s gone.
            </p>
          </div>
          <button
            onClick={() => handleUpgradeForRole(best)}
            className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors"
          >
            Save My Results
          </button>
        </div>
      </div>

      {/* ── Missing Skills Detail (for selected or best role) ── */}
      <div className="mb-10 grid gap-5 md:grid-cols-2">
        {activeRole.missingSkills.length > 0 && (
          <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-lg bg-red-100 p-1.5">
                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                Missing for {activeRole.profile.normalizedTitle}
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeRole.missingSkills.map((skill) => (
                <span key={skill} className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                  {skill}
                </span>
              ))}
              {activeRole.missingKeywords.slice(0, 8).map((kw) => (
                <span key={kw} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  {kw}
                </span>
              ))}
            </div>
            <button
              onClick={() => handleUpgradeForRole(activeRole)}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              Fix all {totalIssues} issues automatically &rarr;
            </button>
          </div>
        )}

        {activeRole.matchedSkills.length > 0 && (
          <div className="rounded-xl border border-green-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-lg bg-green-100 p-1.5">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">Skills you have</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeRole.matchedSkills.map((skill) => (
                <span key={skill} className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Strengths + Areas to Improve ── */}
      <div className="mb-10 grid gap-5 md:grid-cols-2">
        {result.generalStrengths.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-gray-900">Your Strengths</h3>
            <ul className="space-y-2">
              {result.generalStrengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.formattingIssues.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-gray-900">Areas to Improve</h3>
            <ul className="space-y-2">
              {result.formattingIssues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Price Anchor + Paywall ── */}
      <div id="quick-pro-upgrade" className="mb-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900">
            Your tailored resume is ready
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            We&apos;ve analyzed your CV against {result.roleMatches.length} roles and prepared your fixes.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Professional resume writers charge <span className="font-bold text-gray-800">$300–500</span> per rewrite.
            Get the same result for <span className="font-bold text-primary">{PRO_PRICE_DISPLAY}</span>, instantly.
          </p>
        </div>

        {/* Social proof */}
        <div className="mx-auto mb-6 max-w-md rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-sm italic text-gray-600">&ldquo;Went from 47 to 84. Got 3 interviews in 2 weeks.&rdquo;</p>
          <p className="mt-1 text-xs font-medium text-gray-500">&mdash; Lucas R.</p>
          <p className="mt-3 text-xs text-gray-400">
            Join 10,000+ job seekers &middot; 100% money-back guarantee &middot; Ready in 60 seconds
          </p>
        </div>

        <PaywallPlanPicker context="quick_scan" />
      </div>

      {/* ── Back ── */}
      <div className="mt-8 text-center">
        <Link href="/analyze" className="text-sm font-medium text-primary hover:underline">
          Analyze another resume
        </Link>
      </div>
    </div>
  );
}

// ── Role Row Component ──

function RoleRow({
  match,
  rank,
  isSelected,
  isBest,
  isAspirational,
  onSelect,
  onUpgrade,
}: {
  match: RoleMatch;
  rank: number;
  isSelected: boolean;
  isBest?: boolean;
  isAspirational?: boolean;
  onSelect: () => void;
  onUpgrade: () => void;
}) {
  const color = getScoreColor(match.score);

  return (
    <div
      className={`group rounded-xl border bg-white transition-all cursor-pointer ${
        isSelected ? `${color.border} shadow-md ring-1 ring-${color.bar}` : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      } ${isAspirational ? "border-l-4 border-l-indigo-400" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
        {/* Rank */}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
          {rank}
        </span>

        {/* Role info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {match.profile.normalizedTitle}
            </p>
            {isBest && (
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                Best Match
              </span>
            )}
            {isAspirational && (
              <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                {getSeniorityLabel(match.profile.seniority)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 capitalize mt-0.5">
            {match.profile.category} &middot; {getSeniorityLabel(match.profile.seniority)}
          </p>
        </div>

        {/* Score bar + number */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block w-24">
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                style={{ width: `${match.score}%` }}
              />
            </div>
          </div>
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color.light} text-sm font-black ${color.text}`}>
            {match.score}
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {isSelected && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 sm:px-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {match.missingSkills.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold text-red-600">Missing skills ({match.missingSkills.length})</p>
                <div className="flex flex-wrap gap-1">
                  {match.missingSkills.slice(0, 8).map((skill) => (
                    <span key={skill} className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[11px] text-red-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {match.matchedSkills.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold text-green-600">Matched skills ({match.matchedSkills.length})</p>
                <div className="flex flex-wrap gap-1">
                  {match.matchedSkills.slice(0, 8).map((skill) => (
                    <span key={skill} className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[11px] text-green-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); onUpgrade(); }}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-hover transition-all hover:scale-105"
            >
              Get Tailored CV for this role — {PRO_PRICE_DISPLAY}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper ──

function buildSyntheticJD(profile: RoleMatch["profile"]): string {
  const lines: string[] = [];
  lines.push(profile.normalizedTitle);
  lines.push("");
  lines.push("About the Role:");
  lines.push(`We are looking for a ${profile.seniority}-level ${profile.normalizedTitle} to join our team.`);
  lines.push("");
  lines.push("Requirements:");
  for (const skill of profile.requiredSkills.slice(0, 12)) {
    lines.push(`- ${skill.value}`);
  }
  lines.push("");
  lines.push("Preferred Qualifications:");
  for (const skill of profile.preferredSkills.slice(0, 8)) {
    lines.push(`- ${skill.value}`);
  }
  lines.push("");
  lines.push("Responsibilities:");
  for (const resp of profile.typicalResponsibilities.slice(0, 6)) {
    lines.push(`- ${resp}`);
  }
  lines.push("");
  lines.push("Keywords:");
  lines.push(profile.commonKeywords.slice(0, 15).map((k) => k.value).join(", "));
  return lines.join("\n");
}
