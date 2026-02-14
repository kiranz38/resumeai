import type {
  CandidateProfile,
  JobProfile,
  RadarResult,
  RadarBreakdown,
  RadarLabel,
  RadarBlocker,
  RadarDiagnostics,
} from "./types";

// ── Constants ──

const METRIC_PATTERNS =
  /\d+[%xX]|\$[\d,]+|\d+[KkMm]\b|\d+\s*ms\b|reduced|increased|improved|grew|saved|cut|boosted/i;

const VAGUE_VERBS =
  /^(utilized|various|responsible for|helped|worked on|assisted|participated in|involved in|was part of|tasked with|handled|dealt with)/i;

const STRONG_OWNERSHIP_VERBS =
  /^(led|designed|shipped|built|architected|spearheaded|established|pioneered|launched|created|drove|owned|directed|orchestrated|transformed|founded|initiated)/i;

const WEAK_OWNERSHIP_VERBS =
  /^(helped|worked on|assisted|participated in|contributed to|supported|involved in|was part of|collaborated|aided)/i;

const LEADERSHIP_SIGNALS =
  /\b(led|managed|mentored|coached|directed|supervised|coordinated team|headed|oversaw|guided|trained|recruited|hired)\b/i;

const SCOPE_PHRASES =
  /\b(cross-functional|company-wide|organization|enterprise|platform|global|department|division|org-wide|firm-wide|end-to-end|full-stack)\b/i;

// ── Main scoring function ──

export function scoreRadar(
  candidate: CandidateProfile,
  job: JobProfile,
): RadarResult {
  const allBullets = [
    ...candidate.experience.flatMap((e) => e.bullets),
    ...candidate.projects.flatMap((p) => p.bullets),
  ];

  const impact = computeImpact(allBullets);
  const clarity = computeClarity(allBullets);
  const ownership = computeOwnership(allBullets);
  const seniority = computeSeniority(candidate, job);
  const alignment = computeAlignment(candidate, job);

  const breakdown: RadarBreakdown = {
    impact: clamp(Math.round(impact)),
    clarity: clamp(Math.round(clarity)),
    ownership: clamp(Math.round(ownership)),
    seniority: clamp(Math.round(seniority)),
    alignment: clamp(Math.round(alignment)),
  };

  const score = clamp(
    Math.round(
      breakdown.impact * 0.3 +
      breakdown.clarity * 0.2 +
      breakdown.ownership * 0.2 +
      breakdown.seniority * 0.15 +
      breakdown.alignment * 0.15,
    ),
  );

  const label = scoreToLabel(score);
  const diagnostics = buildDiagnostics(candidate, job, allBullets);
  const blockers = generateBlockers(breakdown, candidate, job, allBullets);

  // Legacy ATS compat data
  const candidateText = buildCandidateText(candidate);
  const { matched, missing } = computeKeywordLists(candidateText, job);
  const warnings = generateCompatWarnings(candidate);

  return {
    score,
    label,
    breakdown,
    blockers,
    diagnostics,
    atsCompat: {
      matchedKeywords: matched,
      missingKeywords: missing,
      warnings,
    },
  };
}

// ── Re-score from tailored resume (Pro output) ──

export function computeRadarFromTailored(
  tailoredCandidate: CandidateProfile,
  job: JobProfile,
): RadarResult {
  return scoreRadar(tailoredCandidate, job);
}

// ── Category scorers ──

function computeImpact(bullets: string[]): number {
  if (bullets.length === 0) return 20;
  const withMetrics = bullets.filter((b) => METRIC_PATTERNS.test(b)).length;
  return (withMetrics / bullets.length) * 100;
}

function computeClarity(bullets: string[]): number {
  if (bullets.length === 0) return 50;
  let score = 100;
  const penalties: number[] = [];

  for (const bullet of bullets) {
    let penalty = 0;
    // Penalize long bullets (>150 chars)
    if (bullet.length > 150) penalty += 10;
    // Penalize vague verbs
    if (VAGUE_VERBS.test(bullet)) penalty += 15;
    // Penalize very short bullets (<30 chars) — likely incomplete
    if (bullet.length < 30 && bullet.length > 0) penalty += 5;
    penalties.push(penalty);
  }

  const avgPenalty =
    penalties.reduce((sum, p) => sum + p, 0) / penalties.length;
  score -= avgPenalty;
  return Math.max(10, score);
}

function computeOwnership(bullets: string[]): number {
  if (bullets.length === 0) return 30;

  let strongCount = 0;
  let weakCount = 0;

  for (const bullet of bullets) {
    if (STRONG_OWNERSHIP_VERBS.test(bullet)) strongCount++;
    else if (WEAK_OWNERSHIP_VERBS.test(bullet)) weakCount++;
  }

  const total = strongCount + weakCount;
  if (total === 0) return 50; // neutral — no clear ownership verbs
  return (strongCount / total) * 100;
}

function computeSeniority(
  candidate: CandidateProfile,
  job: JobProfile,
): number {
  const years = estimateYearsExperience(candidate);
  const jobSeniority = job.seniorityLevel || "Mid";

  const seniorityYears: Record<string, [number, number]> = {
    Junior: [0, 2],
    Mid: [2, 5],
    Senior: [5, 10],
    Manager: [5, 15],
    Principal: [8, 20],
    Director: [10, 25],
  };

  const [minYears, maxYears] = seniorityYears[jobSeniority] || [2, 5];
  let score = 0;

  // Years match
  if (years >= minYears && years <= maxYears + 3) score += 50;
  else if (years >= minYears - 1) score += 30;
  else if (years >= minYears - 2) score += 15;

  // Leadership signals
  const allBullets = candidate.experience.flatMap((e) => e.bullets);
  const leadershipCount = allBullets.filter((b) =>
    LEADERSHIP_SIGNALS.test(b),
  ).length;
  if (leadershipCount >= 3) score += 30;
  else if (leadershipCount >= 1) score += 15;

  // Scope phrases
  const scopeCount = allBullets.filter((b) => SCOPE_PHRASES.test(b)).length;
  if (scopeCount >= 2) score += 20;
  else if (scopeCount >= 1) score += 10;

  return Math.min(100, score);
}

function computeAlignment(
  candidate: CandidateProfile,
  job: JobProfile,
): number {
  const candidateText = buildCandidateText(candidate);
  const candidateKeywords = new Set(
    candidate.skills.map((s) => s.toLowerCase()),
  );

  // Combine all job terms
  const requiredTerms: string[] = [];
  const otherTerms: string[] = [];

  for (const skill of job.requiredSkills) {
    requiredTerms.push(skill.toLowerCase());
  }
  for (const skill of job.preferredSkills) {
    otherTerms.push(skill.toLowerCase());
  }
  for (const kw of job.keywords) {
    otherTerms.push(kw.toLowerCase());
  }

  // Required keywords have 2x weight
  let totalWeight = 0;
  let matchedWeight = 0;

  for (const term of requiredTerms) {
    totalWeight += 2;
    if (candidateKeywords.has(term) || candidateText.includes(term)) {
      matchedWeight += 2;
    }
  }
  for (const term of otherTerms) {
    totalWeight += 1;
    if (candidateKeywords.has(term) || candidateText.includes(term)) {
      matchedWeight += 1;
    }
  }

  if (totalWeight === 0) return 50;
  return (matchedWeight / totalWeight) * 100;
}

// ── Blocker generation ──

function generateBlockers(
  breakdown: RadarBreakdown,
  candidate: CandidateProfile,
  job: JobProfile,
  allBullets: string[],
): RadarBlocker[] {
  const categories: Array<{
    key: keyof RadarBreakdown;
    score: number;
  }> = [
    { key: "impact", score: breakdown.impact },
    { key: "clarity", score: breakdown.clarity },
    { key: "ownership", score: breakdown.ownership },
    { key: "seniority", score: breakdown.seniority },
    { key: "alignment", score: breakdown.alignment },
  ];

  // Sort by score ascending — weakest first
  categories.sort((a, b) => a.score - b.score);

  const blockers: RadarBlocker[] = [];

  for (const cat of categories.slice(0, 3)) {
    if (cat.score >= 80) continue; // skip strong categories
    const blocker = buildBlocker(cat.key, cat.score, candidate, job, allBullets);
    if (blocker) blockers.push(blocker);
  }

  return blockers;
}

function buildBlocker(
  category: keyof RadarBreakdown,
  score: number,
  candidate: CandidateProfile,
  job: JobProfile,
  allBullets: string[],
): RadarBlocker | null {
  switch (category) {
    case "impact": {
      const withMetrics = allBullets.filter((b) => METRIC_PATTERNS.test(b));
      const withoutMetrics = allBullets.filter((b) => !METRIC_PATTERNS.test(b));
      const sample = withoutMetrics[0];
      return {
        title: "Weak quantified impact",
        why: `Only ${withMetrics.length} of ${allBullets.length} bullets include metrics. Hiring managers scan for numbers first.`,
        how: "Add %, $, time saved, team size, or user count to each bullet. Even estimates are better than nothing.",
        ...(sample
          ? {
              beforeAfter: {
                before: sample,
                after: `${sample.replace(/\.$/, "")}, resulting in [X]% improvement in [key metric]`,
              },
            }
          : {}),
      };
    }
    case "clarity": {
      const vagueB = allBullets.filter((b) => VAGUE_VERBS.test(b));
      const longB = allBullets.filter((b) => b.length > 150);
      return {
        title: "Unclear bullet language",
        why: `${vagueB.length} bullets start with vague verbs and ${longB.length} exceed 150 characters. Recruiters spend ~6 seconds scanning.`,
        how: "Start every bullet with a strong past-tense verb. Keep bullets under 150 characters. Cut filler words.",
        ...(vagueB[0]
          ? {
              beforeAfter: {
                before: vagueB[0],
                after: vagueB[0]
                  .replace(/^Responsible for\s+/i, "Led ")
                  .replace(/^Helped\s+/i, "Drove ")
                  .replace(/^Worked on\s+/i, "Developed ")
                  .replace(/^Assisted\s+(with\s+)?/i, "Delivered ")
                  .replace(/^Participated in\s+/i, "Contributed to ")
                  .replace(/^Involved in\s+/i, "Drove "),
              },
            }
          : {}),
      };
    }
    case "ownership": {
      return {
        title: "Low ownership signals",
        why: "Your bullets use collaborative or passive language. Hiring managers want to see what YOU did, not the team.",
        how: 'Replace "helped", "assisted", "worked on" with "led", "designed", "built", "shipped", "architected".',
      };
    }
    case "seniority": {
      const years = estimateYearsExperience(candidate);
      const target = job.seniorityLevel || "Mid";
      return {
        title: "Seniority signals are thin",
        why: `${years} years of experience for a ${target}-level role. Scope and leadership cues are also needed.`,
        how: "Add cross-functional scope, team size, system-level decisions, and mentorship to your bullets.",
      };
    }
    case "alignment": {
      const missing = job.requiredSkills
        .filter(
          (s) =>
            !candidate.skills
              .map((sk) => sk.toLowerCase())
              .includes(s.toLowerCase()) &&
            !buildCandidateText(candidate).includes(s.toLowerCase()),
        )
        .slice(0, 3);
      return {
        title: "Keyword alignment gap",
        why: `Key required terms not found: ${missing.length > 0 ? missing.join(", ") : "several job keywords missing"}.`,
        how: "Mirror the exact phrases from the job description in your skills section and experience bullets.",
      };
    }
    default:
      return null;
  }
}

// ── Diagnostics ──

function buildDiagnostics(
  candidate: CandidateProfile,
  job: JobProfile,
  allBullets: string[],
): RadarDiagnostics {
  // Missing metrics — bullets without numbers
  const missingMetrics = allBullets
    .filter((b) => !METRIC_PATTERNS.test(b) && b.length > 20)
    .slice(0, 5);

  // Weak verbs
  const weakVerbs = allBullets
    .filter((b) => VAGUE_VERBS.test(b))
    .map((b) => {
      const match = b.match(VAGUE_VERBS);
      return match ? match[0].trim() : "";
    })
    .filter(Boolean);

  // Missing keyword clusters
  const candidateText = buildCandidateText(candidate);
  const clusters: Array<{ cluster: string; keywords: string[] }> = [];
  const clusterMap: Record<string, string[]> = {
    "Backend Languages": [],
    Cloud: [],
    "DevOps & Infra": [],
    Frontend: [],
    Databases: [],
    Leadership: [],
  };

  for (const kw of [
    ...job.requiredSkills,
    ...job.preferredSkills,
    ...job.keywords,
  ]) {
    const lower = kw.toLowerCase();
    if (candidateText.includes(lower)) continue;

    if (/python|go|java|rust|ruby|c\+\+|c#|kotlin|scala/i.test(kw)) {
      clusterMap["Backend Languages"].push(kw);
    } else if (/aws|gcp|azure|cloud/i.test(kw)) {
      clusterMap["Cloud"].push(kw);
    } else if (/docker|kubernetes|terraform|ci\/cd|devops|ansible/i.test(kw)) {
      clusterMap["DevOps & Infra"].push(kw);
    } else if (/react|vue|angular|next|frontend|css|html/i.test(kw)) {
      clusterMap["Frontend"].push(kw);
    } else if (/sql|postgres|mongo|redis|dynamo|database/i.test(kw)) {
      clusterMap["Databases"].push(kw);
    } else if (/lead|mentor|manage|architect|design/i.test(kw)) {
      clusterMap["Leadership"].push(kw);
    }
  }

  for (const [cluster, keywords] of Object.entries(clusterMap)) {
    if (keywords.length > 0) {
      clusters.push({ cluster, keywords: [...new Set(keywords)] });
    }
  }

  return {
    missingMetrics,
    weakVerbs: [...new Set(weakVerbs)],
    missingKeywordClusters: clusters,
  };
}

// ── Helpers ──

function scoreToLabel(score: number): RadarLabel {
  if (score >= 75) return "Strong signal";
  if (score >= 50) return "Needs sharpening";
  return "Signal hidden";
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function estimateYearsExperience(candidate: CandidateProfile): number {
  if (candidate.experience.length === 0) return 0;

  let earliestYear = new Date().getFullYear();
  let latestYear = 0;

  for (const exp of candidate.experience) {
    const startYear = extractYear(exp.start);
    const endYear = extractYear(exp.end) || new Date().getFullYear();

    if (startYear && startYear < earliestYear) earliestYear = startYear;
    if (endYear > latestYear) latestYear = endYear;
  }

  if (latestYear === 0) return candidate.experience.length * 2;
  return Math.max(0, latestYear - earliestYear);
}

function extractYear(dateStr?: string): number | null {
  if (!dateStr) return null;
  if (/present|current/i.test(dateStr)) return new Date().getFullYear();
  const match = dateStr.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0]) : null;
}

function buildCandidateText(candidate: CandidateProfile): string {
  const parts: string[] = [];
  if (candidate.name) parts.push(candidate.name);
  if (candidate.headline) parts.push(candidate.headline);
  if (candidate.summary) parts.push(candidate.summary);
  parts.push(...candidate.skills);
  for (const exp of candidate.experience) {
    if (exp.title) parts.push(exp.title);
    if (exp.company) parts.push(exp.company);
    parts.push(...exp.bullets);
  }
  for (const edu of candidate.education) {
    if (edu.school) parts.push(edu.school);
    if (edu.degree) parts.push(edu.degree);
  }
  for (const proj of candidate.projects) {
    if (proj.name) parts.push(proj.name);
    parts.push(...proj.bullets);
  }
  return parts.join(" ").toLowerCase();
}

function computeKeywordLists(
  candidateText: string,
  job: JobProfile,
): { matched: string[]; missing: string[] } {
  const matched: string[] = [];
  const missing: string[] = [];

  const allTerms = new Set([
    ...job.requiredSkills.map((s) => s.toLowerCase()),
    ...job.preferredSkills.map((s) => s.toLowerCase()),
    ...job.keywords.map((k) => k.toLowerCase()),
  ]);

  for (const term of allTerms) {
    if (candidateText.includes(term)) {
      matched.push(term);
    } else {
      missing.push(term);
    }
  }

  return { matched, missing };
}

function generateCompatWarnings(candidate: CandidateProfile): string[] {
  const warnings: string[] = [];
  if (!candidate.summary) {
    warnings.push(
      "Missing professional summary — most reviewers prioritize the top of the resume",
    );
  }
  if (candidate.skills.length < 3) {
    warnings.push(
      "Very few skills detected — ensure your Skills section is clearly formatted",
    );
  }
  const longBullets = candidate.experience
    .flatMap((e) => e.bullets)
    .filter((b) => b.length > 200);
  if (longBullets.length > 0) {
    warnings.push(
      "Some bullets exceed 200 characters — keep bullets concise for readability",
    );
  }
  if (candidate.experience.length === 0) {
    warnings.push(
      "No experience section detected — ensure your work experience is clearly labeled",
    );
  }
  if (candidate.education.length === 0) {
    warnings.push("No education section detected");
  }
  return warnings;
}

// ── Convert tailored resume to CandidateProfile for re-scoring ──

export function tailoredToCandidateProfile(tailored: {
  name: string;
  headline: string;
  summary: string;
  skills: Array<{ category: string; items: string[] }>;
  experience: Array<{
    company: string;
    title: string;
    period: string;
    bullets: string[];
  }>;
  education: Array<{ school: string; degree: string; year?: string }>;
  projects?: Array<{ name: string; bullets: string[] }>;
}): CandidateProfile {
  return {
    name: tailored.name,
    headline: tailored.headline,
    summary: tailored.summary,
    skills: tailored.skills.flatMap((g) => g.items),
    experience: tailored.experience.map((exp) => ({
      company: exp.company,
      title: exp.title,
      start: exp.period.split(/[–\-—]/)[0]?.trim(),
      end: exp.period.split(/[–\-—]/)[1]?.trim(),
      bullets: exp.bullets,
    })),
    education: tailored.education.map((edu) => ({
      school: edu.school,
      degree: edu.degree,
      end: edu.year,
    })),
    projects: (tailored.projects || []).map((p) => ({
      name: p.name,
      bullets: p.bullets,
    })),
  };
}
