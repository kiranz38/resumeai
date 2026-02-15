/**
 * JobFamilyClassifier — determines the profession/domain of a job
 * using keyword scoring across curated token maps.
 *
 * Uses BOTH resume + JD (JD weighted 2x higher).
 * If confidence < 0.4 → family = "general".
 *
 * This is NOT for keyword injection — only for selecting
 * rewrite style and metric heuristics.
 */

import type { CandidateProfile, JobProfile } from "../types";
import type { JobFamily, JobFamilyResult } from "./types";

// ── Curated token map per family ──
// Each token contributes 1 point when found (case-insensitive).

const FAMILY_TOKENS: Record<JobFamily, string[]> = {
  engineering: [
    // Software/IT
    "software", "engineer", "developer", "programming", "codebase", "api",
    "backend", "frontend", "full-stack", "fullstack", "devops", "sre",
    "infrastructure", "microservices", "deployment", "ci/cd", "testing",
    "debugging", "repository", "pull request", "code review", "architecture",
    "database", "cloud", "kubernetes", "docker", "aws", "gcp", "azure",
    "react", "node", "python", "java", "typescript", "javascript", "rust",
    "go", "c++", "scala", "sql", "nosql", "machine learning", "data engineer",
    "system design", "scalability", "latency", "throughput", "uptime",
    "sprint", "agile", "scrum", "jira", "git", "linux",
  ],
  product: [
    "product manager", "product owner", "product management", "roadmap",
    "backlog", "user stories", "stakeholder", "prioritization", "okr",
    "kpi", "discovery", "user research", "a/b testing", "feature",
    "release", "go-to-market", "gtm", "product strategy", "market fit",
    "customer feedback", "wireframe", "prototype", "prd",
  ],
  sales: [
    "sales", "account executive", "account manager", "business development",
    "bdr", "sdr", "quota", "pipeline", "revenue", "closing", "deal",
    "prospect", "cold call", "crm", "salesforce", "hubspot", "territory",
    "commission", "forecast", "win rate", "upsell", "cross-sell",
    "negotiation", "contract", "renewal", "client relationship",
    "customer acquisition", "saas sales",
  ],
  marketing: [
    "marketing", "brand", "content", "seo", "sem", "ppc", "social media",
    "campaign", "demand generation", "lead generation", "email marketing",
    "ctr", "cvr", "roas", "cac", "ltv", "impression", "engagement",
    "analytics", "google analytics", "copywriting", "creative",
    "advertising", "media buy", "influencer", "pr", "public relations",
    "growth", "acquisition", "retention", "funnel",
  ],
  finance: [
    "finance", "financial", "accounting", "cpa", "cfa", "budget",
    "forecast", "variance", "audit", "compliance", "tax", "treasury",
    "p&l", "balance sheet", "cash flow", "gaap", "ifrs", "sox",
    "reconciliation", "journal entry", "accounts payable", "accounts receivable",
    "financial modeling", "valuation", "due diligence", "investment",
    "portfolio", "risk management", "actuarial", "underwriting",
    "controller", "fp&a",
  ],
  operations: [
    "operations", "logistics", "supply chain", "procurement", "warehouse",
    "inventory", "lean", "six sigma", "process improvement", "efficiency",
    "sla", "vendor management", "fleet", "distribution", "fulfillment",
    "quality assurance", "quality control", "iso", "erp", "sap",
    "throughput", "cycle time", "capacity planning",
  ],
  healthcare: [
    "healthcare", "clinical", "patient", "hipaa", "ehr", "emr",
    "medical", "nursing", "rn", "physician", "pharmacy", "lab",
    "diagnosis", "treatment", "care plan", "hospital", "health system",
    "regulatory", "fda", "cms", "medicare", "medicaid", "clinical trial",
    "biotech", "pharmaceutical", "life sciences",
  ],
  education: [
    "education", "teaching", "curriculum", "student", "classroom",
    "learning outcomes", "pedagogy", "assessment", "grading", "cohort",
    "academic", "faculty", "professor", "instructor", "k-12",
    "higher education", "university", "school", "training", "workshop",
    "e-learning", "lms", "enrollment", "retention rate",
  ],
  general: [], // Fallback — no specific tokens
};

// Families that should be mapped to a strategy key when below threshold
const MIN_CONFIDENCE = 0.4;

/**
 * Classify the job family from candidate + JD text.
 * JD text is weighted 2x higher than resume text.
 */
export function classifyJobFamily(
  candidate: CandidateProfile,
  job: JobProfile,
): JobFamilyResult {
  // Build text blobs
  const resumeText = buildResumeText(candidate).toLowerCase();
  const jdText = buildJDText(job).toLowerCase();

  const scores: Record<JobFamily, number> = {
    engineering: 0,
    product: 0,
    sales: 0,
    marketing: 0,
    finance: 0,
    operations: 0,
    healthcare: 0,
    education: 0,
    general: 0,
  };

  let maxScore = 0;
  let maxFamily: JobFamily = "general";

  for (const [family, tokens] of Object.entries(FAMILY_TOKENS) as Array<
    [JobFamily, string[]]
  >) {
    if (family === "general") continue;

    for (const token of tokens) {
      const tokenLower = token.toLowerCase();
      // JD match = 2 points, resume match = 1 point
      if (jdText.includes(tokenLower)) scores[family] += 2;
      if (resumeText.includes(tokenLower)) scores[family] += 1;
    }

    if (scores[family] > maxScore) {
      maxScore = scores[family];
      maxFamily = family;
    }
  }

  // Calculate confidence: ratio of top score to max possible
  // Max possible = 3 * tokens.length (2 from JD + 1 from resume for each token)
  const maxPossible =
    (FAMILY_TOKENS[maxFamily]?.length || 1) * 3;
  const confidence = Math.min(1, maxScore / Math.max(1, maxPossible * 0.3));

  if (confidence < MIN_CONFIDENCE) {
    return { family: "general", confidence };
  }

  return { family: maxFamily, confidence: Math.round(confidence * 100) / 100 };
}

/**
 * Map a JobFamily to its closest strategy key.
 * Some families share strategies.
 */
export function familyToStrategyKey(
  family: JobFamily,
): "engineering" | "business" | "sales" | "marketing" | "finance" {
  switch (family) {
    case "engineering":
      return "engineering";
    case "sales":
      return "sales";
    case "marketing":
      return "marketing";
    case "finance":
      return "finance";
    case "product":
    case "operations":
    case "healthcare":
    case "education":
    case "general":
    default:
      return "business";
  }
}

// ── Helpers ──

function buildResumeText(candidate: CandidateProfile): string {
  const parts: string[] = [];
  if (candidate.headline) parts.push(candidate.headline);
  if (candidate.summary) parts.push(candidate.summary);
  parts.push(...candidate.skills);
  for (const exp of candidate.experience) {
    if (exp.title) parts.push(exp.title);
    parts.push(...exp.bullets);
  }
  return parts.join(" ");
}

function buildJDText(job: JobProfile): string {
  const parts: string[] = [];
  if (job.title) parts.push(job.title);
  parts.push(...job.requiredSkills);
  parts.push(...job.preferredSkills);
  parts.push(...job.responsibilities);
  parts.push(...job.keywords);
  return parts.join(" ");
}
