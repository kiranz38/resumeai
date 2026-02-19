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

const SOFT_SKILL_VERBS =
  /\b(led|managed|mentored|coached|directed|supervised|coordinated|headed|oversaw|guided|trained|recruited|hired|communicated|collaborated|facilitated|negotiated|presented|influenced|motivated|empowered|delegated|resolved|mediated)\b/i;

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

  const hardSkills = computeHardSkills(candidate, job);
  const softSkills = computeSoftSkills(allBullets);
  const measurableResults = computeMeasurableResults(allBullets);
  const keywordOptimization = computeKeywordOptimization(candidate, job);
  const formattingBestPractices = computeFormattingBestPractices(candidate, allBullets);

  const breakdown: RadarBreakdown = {
    hardSkills: clamp(Math.round(hardSkills)),
    softSkills: clamp(Math.round(softSkills)),
    measurableResults: clamp(Math.round(measurableResults)),
    keywordOptimization: clamp(Math.round(keywordOptimization)),
    formattingBestPractices: clamp(Math.round(formattingBestPractices)),
  };

  const score = clamp(
    Math.round(
      breakdown.hardSkills * 0.25 +
      breakdown.softSkills * 0.15 +
      breakdown.measurableResults * 0.25 +
      breakdown.keywordOptimization * 0.20 +
      breakdown.formattingBestPractices * 0.15,
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

// ── Quick relevance check (blocks generation for irrelevant resumes) ──

/**
 * Fast relevance gate — checks if the candidate has enough overlap
 * with the job to produce a meaningful tailored CV.
 *
 * Uses hard-skills match + keyword coverage (the two most indicative
 * signals for job relevance). If the combined score falls below the
 * threshold, the resume has essentially zero relevant experience and
 * any tailored output would fabricate content.
 */
export function checkRelevance(
  candidate: CandidateProfile,
  job: JobProfile,
): { relevant: boolean; score: number; reason?: string } {
  const hardSkills = computeHardSkills(candidate, job);
  const keywordOpt = computeKeywordOptimization(candidate, job);

  // Weighted relevance score (0-100): 60% skills, 40% keywords
  const relevanceScore = Math.round(hardSkills * 0.6 + keywordOpt * 0.4);

  if (relevanceScore < 10) {
    return {
      relevant: false,
      score: relevanceScore,
      reason:
        "Your resume doesn't have enough relevant experience or skills for this role. " +
        "A tailored CV requires some matching background to work with — we won't fabricate experience you don't have.",
    };
  }

  return { relevant: true, score: relevanceScore };
}

// ── Re-score from tailored resume (Pro output) ──

export function computeRadarFromTailored(
  tailoredCandidate: CandidateProfile,
  job: JobProfile,
): RadarResult {
  return scoreRadar(tailoredCandidate, job);
}

// ── Category scorers ──

function computeHardSkills(
  candidate: CandidateProfile,
  job: JobProfile,
): number {
  const candidateText = buildCandidateText(candidate);
  const candidateSkillsLower = new Set(
    candidate.skills.map((s) => s.toLowerCase()),
  );

  // Extract individual terms from JD requirement sentences
  // (JD requirements are full sentences like "5+ years of JavaScript and React experience")
  const requiredTerms = extractTermsFromRequirements(job.requiredSkills);
  const preferredTerms = extractTermsFromRequirements(job.preferredSkills);
  // Also use the already-extracted keywords from the JD parser
  const keywordTerms = job.keywords.map((k) => k.toLowerCase());

  let totalWeight = 0;
  let matchedWeight = 0;

  // Required terms have 2x weight
  const seenRequired = new Set<string>();
  for (const term of [...requiredTerms, ...keywordTerms]) {
    if (seenRequired.has(term)) continue;
    seenRequired.add(term);
    totalWeight += 2;
    if (candidateSkillsLower.has(term) || candidateText.includes(term)) {
      matchedWeight += 2;
    }
  }

  // Preferred terms have 1x weight
  const seenPreferred = new Set<string>();
  for (const term of preferredTerms) {
    if (seenPreferred.has(term) || seenRequired.has(term)) continue;
    seenPreferred.add(term);
    totalWeight += 1;
    if (candidateSkillsLower.has(term) || candidateText.includes(term)) {
      matchedWeight += 1;
    }
  }

  if (totalWeight === 0) return 50;
  return (matchedWeight / totalWeight) * 100;
}

/** Extract individual skill/tech terms from JD requirement sentences */
function extractTermsFromRequirements(requirements: string[]): string[] {
  const terms: string[] = [];
  const techPatterns = [
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Go|Golang|Rust|Ruby|PHP|Swift|Kotlin|Scala|R|MATLAB)\b/gi,
    /\b(React|Angular|Vue|Svelte|Next\.?js|Nuxt|Gatsby|Remix)\b/gi,
    /\b(Node\.?js|Express|Django|Flask|FastAPI|Spring|Rails|Laravel|\.NET|ASP\.NET)\b/gi,
    /\b(AWS|GCP|Azure|Google Cloud|Amazon Web Services)\b/gi,
    /\b(Docker|Kubernetes|K8s|Terraform|Pulumi|Ansible|CloudFormation)\b/gi,
    /\b(PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch|DynamoDB|Cassandra|SQLite)\b/gi,
    /\b(GraphQL|REST|gRPC|WebSocket|API|microservices)\b/gi,
    /\b(CI\/CD|GitHub Actions|Jenkins|CircleCI|GitLab CI)\b/gi,
    /\b(Git|Agile|Scrum|Kanban|Jira|Confluence)\b/gi,
    /\b(HTML|CSS|SASS|SCSS|Tailwind|Bootstrap)\b/gi,
    /\b(Kafka|RabbitMQ|SQS|Pub\/Sub)\b/gi,
    /\b(TensorFlow|PyTorch|Scikit-learn|NLP|Machine Learning|Deep Learning|AI|ML|LLM)\b/gi,
    /\b(Linux|Unix|Bash|Shell|PowerShell)\b/gi,
    /\b(SQL|NoSQL|ETL|Data Pipeline|Data Engineering)\b/gi,
    /\b(OAuth|JWT|SAML|SSO|Authentication|Authorization|Security)\b/gi,
    /\b(Figma|Sketch|Adobe|Photoshop|InDesign)\b/gi,
    /\b(Excel|Power BI|Tableau|Looker|Google Analytics|SEO|SEM)\b/gi,
    /\b(Salesforce|HubSpot|SAP|Oracle|Workday)\b/gi,
    /\b(PRINCE2|PMP|ITIL|Six Sigma|Lean)\b/gi,
    // Soft/domain skills
    /\b(leadership|mentoring|coaching|team lead|system design|architecture|scalability|distributed systems)\b/gi,
    /\b(communication|collaboration|cross-functional|stakeholder management|project management|product management)\b/gi,
    /\b(testing|TDD|BDD|unit test|integration test|e2e|QA)\b/gi,
    /\b(performance|optimization|monitoring|observability)\b/gi,
    /\b(compliance|GDPR|SOC\s*2|HIPAA|PCI)\b/gi,
    /\b(budget|forecasting|financial modelling|risk management|audit)\b/gi,
    /\b(patient care|clinical|triage|wound care|medication administration)\b/gi,
  ];

  for (const req of requirements) {
    for (const pattern of techPatterns) {
      const matches = req.matchAll(pattern);
      for (const match of matches) {
        terms.push(match[0].toLowerCase());
      }
    }
  }

  return [...new Set(terms)];
}

function computeSoftSkills(bullets: string[]): number {
  if (bullets.length === 0) return 30;

  let softCount = 0;
  for (const bullet of bullets) {
    if (SOFT_SKILL_VERBS.test(bullet)) softCount++;
  }

  // Score based on density of soft-skill verbs across bullets
  const density = softCount / bullets.length;
  // 30%+ bullets with soft skills = 100, scale linearly
  if (density >= 0.3) return 100;
  return Math.round((density / 0.3) * 100);
}

function computeMeasurableResults(bullets: string[]): number {
  if (bullets.length === 0) return 20;
  const withMetrics = bullets.filter((b) => METRIC_PATTERNS.test(b)).length;
  return (withMetrics / bullets.length) * 100;
}

function computeKeywordOptimization(
  candidate: CandidateProfile,
  job: JobProfile,
): number {
  const candidateText = buildCandidateText(candidate);
  const candidateSkillsLower = new Set(
    candidate.skills.map((s) => s.toLowerCase()),
  );

  // Combine all JD terms
  const allTerms = new Set([
    ...job.requiredSkills.map((s) => s.toLowerCase()),
    ...job.preferredSkills.map((s) => s.toLowerCase()),
    ...job.keywords.map((k) => k.toLowerCase()),
  ]);

  if (allTerms.size === 0) return 50;

  let matched = 0;
  let skillsSectionBonus = 0;

  for (const term of allTerms) {
    if (candidateText.includes(term)) {
      matched++;
      // Placement bonus: if also in skills section specifically
      if (candidateSkillsLower.has(term)) {
        skillsSectionBonus++;
      }
    }
  }

  const coverageScore = (matched / allTerms.size) * 80;
  const placementScore = allTerms.size > 0
    ? (skillsSectionBonus / allTerms.size) * 20
    : 0;

  return Math.min(100, coverageScore + placementScore);
}

function computeFormattingBestPractices(
  candidate: CandidateProfile,
  bullets: string[],
): number {
  let score = 100;

  // Penalty: long bullets (>150 chars)
  const longBullets = bullets.filter((b) => b.length > 150).length;
  if (longBullets > 0) score -= Math.min(15, longBullets * 3);

  // Penalty: vague verbs
  const vagueBullets = bullets.filter((b) => VAGUE_VERBS.test(b)).length;
  if (vagueBullets > 0) score -= Math.min(15, vagueBullets * 5);

  // Penalty: missing summary
  if (!candidate.summary) score -= 15;

  // Penalty: missing education
  if (candidate.education.length === 0) score -= 10;

  // Penalty: short bullets (<30 chars)
  const shortBullets = bullets.filter((b) => b.length < 30 && b.length > 0).length;
  if (shortBullets > 0) score -= Math.min(10, shortBullets * 3);

  // Penalty: too many unfocused skills (>25 is a red flag)
  if (candidate.skills.length > 25) score -= 10;

  return Math.max(10, score);
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
    { key: "hardSkills", score: breakdown.hardSkills },
    { key: "softSkills", score: breakdown.softSkills },
    { key: "measurableResults", score: breakdown.measurableResults },
    { key: "keywordOptimization", score: breakdown.keywordOptimization },
    { key: "formattingBestPractices", score: breakdown.formattingBestPractices },
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
    case "hardSkills": {
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
        title: "Opportunity to strengthen hard skills",
        why: `Could further emphasize: ${missing.length > 0 ? missing.join(", ") : "several key skills"}. These are highlighted in the job description.`,
        how: "Add these skills to your Skills section and weave them into experience bullets where you've used them.",
      };
    }
    case "softSkills": {
      const softCount = allBullets.filter((b) => SOFT_SKILL_VERBS.test(b)).length;
      return {
        title: "Could highlight more soft skills",
        why: `${softCount} of ${allBullets.length} bullets show leadership, communication, or teamwork. Highlighting more could strengthen your profile.`,
        how: "Consider adding bullets about mentoring, leading meetings, cross-team collaboration, stakeholder communication, or conflict resolution.",
      };
    }
    case "measurableResults": {
      const withMetrics = allBullets.filter((b) => METRIC_PATTERNS.test(b));
      const withoutMetrics = allBullets.filter((b) => !METRIC_PATTERNS.test(b));
      const sample = withoutMetrics[0];
      return {
        title: "Opportunity to add measurable results",
        why: `${withMetrics.length} of ${allBullets.length} bullets include metrics. Adding more numbers could strengthen your impact.`,
        how: "Consider adding %, $, time saved, team size, or user count to more bullets. Even estimates help demonstrate impact.",
        ...(sample
          ? {
              beforeAfter: {
                before: sample,
                after: `${sample.replace(/\.$/, "")}, reducing turnaround time by 30% and improving team throughput`,
              },
            }
          : {}),
      };
    }
    case "keywordOptimization": {
      const candidateText = buildCandidateText(candidate);
      const allTerms = new Set([
        ...job.requiredSkills.map((s) => s.toLowerCase()),
        ...job.preferredSkills.map((s) => s.toLowerCase()),
        ...job.keywords.map((k) => k.toLowerCase()),
      ]);
      let missingCount = 0;
      for (const term of allTerms) {
        if (!candidateText.includes(term)) missingCount++;
      }
      return {
        title: "Could strengthen keyword alignment",
        why: `${missingCount} job description keywords could be better represented. ATS systems and recruiters scan for exact matches.`,
        how: "Consider mirroring the exact phrases from the job description in your skills section and experience bullets.",
      };
    }
    case "formattingBestPractices": {
      const issues: string[] = [];
      const longB = allBullets.filter((b) => b.length > 150);
      const vagueB = allBullets.filter((b) => VAGUE_VERBS.test(b));
      if (longB.length > 0) issues.push(`${longB.length} bullets over 150 chars`);
      if (vagueB.length > 0) issues.push(`${vagueB.length} vague verb openings`);
      if (!candidate.summary) issues.push("missing professional summary");
      if (candidate.education.length === 0) issues.push("no education section");
      return {
        title: "Optional formatting enhancements",
        why: `Areas to refine: ${issues.length > 0 ? issues.join(", ") : "a few formatting details"}.`,
        how: "Consider keeping bullets under 150 characters, starting with strong verbs, adding a professional summary, and listing education.",
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

  // Missing keyword clusters — grouped by JD source (profession-agnostic)
  const candidateText = buildCandidateText(candidate);
  const clusters: Array<{ cluster: string; keywords: string[] }> = [];

  const requiredSet = new Set(job.requiredSkills.map((s) => s.toLowerCase()));
  const preferredSet = new Set(job.preferredSkills.map((s) => s.toLowerCase()));

  const requiredMissing: string[] = [];
  const preferredMissing: string[] = [];
  const otherMissing: string[] = [];

  const seen = new Set<string>();
  for (const kw of [
    ...job.requiredSkills,
    ...job.preferredSkills,
    ...job.keywords,
  ]) {
    const lower = kw.toLowerCase();
    if (seen.has(lower) || candidateText.includes(lower)) continue;
    seen.add(lower);

    if (requiredSet.has(lower)) {
      requiredMissing.push(kw);
    } else if (preferredSet.has(lower)) {
      preferredMissing.push(kw);
    } else {
      otherMissing.push(kw);
    }
  }

  if (requiredMissing.length > 0) {
    clusters.push({ cluster: "Required Skills", keywords: requiredMissing });
  }
  if (preferredMissing.length > 0) {
    clusters.push({ cluster: "Preferred Skills", keywords: preferredMissing });
  }
  if (otherMissing.length > 0) {
    clusters.push({ cluster: "Additional Keywords", keywords: otherMissing });
  }

  return {
    missingMetrics,
    weakVerbs: [...new Set(weakVerbs)],
    missingKeywordClusters: clusters,
  };
}

// ── Helpers ──

function scoreToLabel(score: number): RadarLabel {
  if (score >= 75) return "Strong Match";
  if (score >= 60) return "Good Match";
  return "Moderate Match";
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
