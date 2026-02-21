import type { CandidateProfile, JobProfile } from "@/lib/types";
import type { RoleProfile, RoleMatch } from "./types";
import { SEED_PROFILES } from "./seed-profiles";

// ── Public API ──

/**
 * Extract the user's likely target role from their CV.
 * Uses most recent job title, headline, or falls back to skill-cluster inference.
 */
export function extractTargetRole(candidate: CandidateProfile): {
  title: string;
  seniority: string;
  skills: string[];
} {
  const skills = candidate.skills.map((s) => s.toLowerCase());

  // 1. Try most recent job title
  const recentTitle = candidate.experience[0]?.title?.trim();
  if (recentTitle && recentTitle.length > 2) {
    return {
      title: recentTitle,
      seniority: inferSeniority(recentTitle, candidate),
      skills,
    };
  }

  // 2. Try headline
  if (candidate.headline && candidate.headline.length > 2) {
    return {
      title: candidate.headline,
      seniority: inferSeniority(candidate.headline, candidate),
      skills,
    };
  }

  // 3. Infer from skills cluster
  const inferred = inferRoleFromSkills(skills);
  return {
    title: inferred,
    seniority: inferSeniority(inferred, candidate),
    skills,
  };
}

/**
 * Find matching role profiles for a candidate.
 * Returns top N matches sorted by relevance.
 */
export function findMatchingProfiles(
  roleTitle: string,
  skills: string[],
  seniority: string,
  countryCode?: string,
  limit: number = 10,
): RoleProfile[] {
  const normalizedTitle = normalizeTitle(roleTitle);
  const normalizedSeniority = normalizeSeniority(seniority);
  const skillsLower = new Set(skills.map((s) => s.toLowerCase()));

  // Filter by country if specified, otherwise use all
  const candidates = countryCode
    ? SEED_PROFILES.filter(
        (p) => p.countryCode === countryCode || p.countryCode === "GLOBAL",
      )
    : SEED_PROFILES;

  const scored = candidates.map((profile) => {
    const titleScore = computeTitleScore(normalizedTitle, profile);
    const skillScore = computeSkillScore(skillsLower, profile);

    // No seniority bonus — we WANT to show higher-level roles too
    // Instead, give a small relevance bonus for same-category matches
    const categoryBonus = detectCategory(normalizedTitle, skillsLower) === profile.category ? 0.15 : 0;

    // Weight: skills are most important (transferable), then title, then category
    const combined = skillScore * 0.45 + titleScore * 0.40 + categoryBonus * 0.15;

    return { profile, score: combined };
  });

  scored.sort((a, b) => b.score - a.score);

  // Deduplicate: if same normalizedTitle appears at different seniorities,
  // keep all of them (that's the point — show junior, mid, senior, lead)
  // But avoid showing identical profiles
  const seen = new Set<string>();
  const results: RoleProfile[] = [];

  for (const { profile, score } of scored) {
    if (score < 0.03) break;
    if (seen.has(profile.id)) continue;
    seen.add(profile.id);
    results.push(profile);
    if (results.length >= limit) break;
  }

  // Ensure we include aspirational roles: if the user's category has
  // higher-seniority roles that weren't already included, inject them
  if (results.length > 0) {
    const primaryCategory = results[0].category;
    const includedIds = new Set(results.map((r) => r.id));
    const aspirational = candidates.filter(
      (p) =>
        p.category === primaryCategory &&
        !includedIds.has(p.id) &&
        isSeniorTo(p.seniority, normalizedSeniority),
    );

    for (const asp of aspirational) {
      if (results.length >= limit) break;
      results.push(asp);
    }
  }

  return results;
}

const SENIORITY_RANK: Record<string, number> = {
  junior: 0,
  mid: 1,
  senior: 2,
  lead: 3,
  executive: 4,
};

function isSeniorTo(a: string, b: string): boolean {
  return (SENIORITY_RANK[a] ?? 1) > (SENIORITY_RANK[b] ?? 1);
}

/**
 * Detect the most likely category from title and skills.
 */
function detectCategory(title: string, skills: Set<string>): string {
  const t = title.toLowerCase();

  if (/engineer|developer|sde|swe|devops|frontend|backend|full.?stack|mobile/.test(t)) return "engineering";
  if (/data scien|machine learn|ml |ai /.test(t)) return "data";
  if (/data analy|bi |business intel/.test(t)) return "data";
  if (/data engineer|etl|pipeline/.test(t)) return "data";
  if (/product manag|program manag/.test(t)) return "product";
  if (/ux |ui |design/.test(t)) return "design";
  if (/market|seo|content|growth/.test(t)) return "marketing";
  if (/sales|account exec|csm|customer success/.test(t)) return "sales";
  if (/financ|account|fpa|controller|invest/.test(t)) return "finance";
  if (/project manag|operations|supply chain|hr |human resource|consult/.test(t)) return "business";
  if (/nurs|clinical|patient/.test(t)) return "healthcare";
  if (/teach|educat|instructor/.test(t)) return "education";
  if (/compliance|legal|counsel/.test(t)) return "legal";

  // Fallback: infer from skills
  const skillArr = [...skills];
  const techSkills = skillArr.filter((s) =>
    /python|java|react|node|aws|docker|sql|typescript|go|rust|kubernetes/i.test(s),
  );
  if (techSkills.length >= 3) return "engineering";

  const dataSkills = skillArr.filter((s) =>
    /pandas|tensorflow|pytorch|tableau|power bi|spark|jupyter|r |statistics/i.test(s),
  );
  if (dataSkills.length >= 2) return "data";

  return "business"; // safe default
}

/**
 * Convert a RoleProfile into the existing JobProfile type
 * so it can be fed into scoreRadar() and scoreATS().
 */
export function roleProfileToJobProfile(profile: RoleProfile): JobProfile {
  // Use skills above a frequency threshold for required vs preferred
  const requiredSkills = profile.requiredSkills
    .filter((s) => s.weight >= 0.3)
    .map((s) => s.value);
  const preferredSkills = profile.preferredSkills.map((s) => s.value);
  const keywords = profile.commonKeywords
    .filter((k) => k.weight >= 0.2)
    .map((k) => k.value);

  return {
    title: profile.normalizedTitle,
    company: undefined,
    requiredSkills,
    preferredSkills,
    responsibilities: profile.typicalResponsibilities,
    keywords,
    seniorityLevel: profile.seniority,
  };
}

// ── Title matching ──

function computeTitleScore(
  normalizedInput: string,
  profile: RoleProfile,
): number {
  const profileTitle = normalizeTitle(profile.normalizedTitle);
  const allTitles = [profileTitle, ...profile.aliases.map(normalizeTitle)];

  let bestScore = 0;

  for (const title of allTitles) {
    // Exact match
    if (normalizedInput === title) return 1.0;

    // Token overlap
    const inputTokens = tokenize(normalizedInput);
    const titleTokens = tokenize(title);
    const overlap = setIntersectionSize(
      new Set(inputTokens),
      new Set(titleTokens),
    );
    const union = new Set([...inputTokens, ...titleTokens]).size;
    const jaccard = union > 0 ? overlap / union : 0;

    // Substring containment bonus
    const containsBonus =
      normalizedInput.includes(title) || title.includes(normalizedInput)
        ? 0.3
        : 0;

    const score = Math.min(1.0, jaccard + containsBonus);
    bestScore = Math.max(bestScore, score);
  }

  return bestScore;
}

// ── Skill matching ──

function computeSkillScore(
  candidateSkills: Set<string>,
  profile: RoleProfile,
): number {
  if (candidateSkills.size === 0) return 0;

  const profileSkills = new Set(
    [
      ...profile.requiredSkills.map((s) => s.value.toLowerCase()),
      ...profile.preferredSkills.map((s) => s.value.toLowerCase()),
    ],
  );

  const overlap = setIntersectionSize(candidateSkills, profileSkills);
  const union = new Set([...candidateSkills, ...profileSkills]).size;

  return union > 0 ? overlap / union : 0;
}

// ── Seniority inference ──

const SENIORITY_PATTERNS: Array<{ pattern: RegExp; level: string }> = [
  { pattern: /\b(intern|trainee|apprentice)\b/i, level: "junior" },
  { pattern: /\b(junior|jr\.?|entry[- ]level|associate|graduate)\b/i, level: "junior" },
  { pattern: /\b(mid[- ]?level|intermediate)\b/i, level: "mid" },
  { pattern: /\b(senior|sr\.?|principal|staff|lead)\b/i, level: "senior" },
  { pattern: /\b(manager|director|head of|vp|chief|executive)\b/i, level: "lead" },
];

function inferSeniority(
  title: string,
  candidate: CandidateProfile,
): string {
  // Check title for seniority keywords
  for (const { pattern, level } of SENIORITY_PATTERNS) {
    if (pattern.test(title)) return level;
  }

  // Infer from experience years
  const years = estimateYears(candidate);
  if (years >= 8) return "senior";
  if (years >= 3) return "mid";
  if (years >= 0) return "junior";

  return "mid"; // default
}

function estimateYears(candidate: CandidateProfile): number {
  const currentYear = new Date().getFullYear();
  let earliest = currentYear;

  for (const exp of candidate.experience) {
    const startMatch = exp.start?.match(/(\d{4})/);
    if (startMatch) {
      const year = parseInt(startMatch[1], 10);
      if (year > 1970 && year < currentYear) {
        earliest = Math.min(earliest, year);
      }
    }
  }

  return earliest < currentYear ? currentYear - earliest : 0;
}

// ── Skill-cluster role inference (fallback) ──

const SKILL_CLUSTERS: Array<{ keywords: string[]; role: string }> = [
  {
    keywords: ["react", "angular", "vue", "css", "html", "javascript", "typescript", "frontend", "next.js", "tailwind"],
    role: "Frontend Developer",
  },
  {
    keywords: ["python", "java", "go", "rust", "node.js", "api", "microservices", "database", "sql", "backend"],
    role: "Software Engineer",
  },
  {
    keywords: ["docker", "kubernetes", "terraform", "aws", "azure", "gcp", "ci/cd", "jenkins", "ansible", "devops"],
    role: "DevOps Engineer",
  },
  {
    keywords: ["machine learning", "deep learning", "pytorch", "tensorflow", "nlp", "computer vision", "ai"],
    role: "Machine Learning Engineer",
  },
  {
    keywords: ["data science", "statistics", "r", "pandas", "jupyter", "modeling", "hypothesis"],
    role: "Data Scientist",
  },
  {
    keywords: ["sql", "tableau", "power bi", "excel", "reporting", "analytics", "data analysis", "dashboards"],
    role: "Data Analyst",
  },
  {
    keywords: ["spark", "airflow", "etl", "data pipeline", "data warehouse", "snowflake", "redshift", "kafka"],
    role: "Data Engineer",
  },
  {
    keywords: ["swift", "kotlin", "ios", "android", "react native", "flutter", "mobile"],
    role: "Mobile Developer",
  },
  {
    keywords: ["product management", "roadmap", "user stories", "stakeholder", "sprint", "agile", "prd"],
    role: "Product Manager",
  },
  {
    keywords: ["figma", "sketch", "user research", "wireframe", "prototype", "usability", "ux"],
    role: "UX Designer",
  },
  {
    keywords: ["seo", "google ads", "social media", "content marketing", "campaign", "hubspot", "marketing"],
    role: "Marketing Manager",
  },
  {
    keywords: ["salesforce", "crm", "pipeline", "quota", "b2b", "prospecting", "account management"],
    role: "Sales Manager",
  },
  {
    keywords: ["financial modeling", "valuation", "excel", "bloomberg", "accounting", "gaap", "ifrs"],
    role: "Financial Analyst",
  },
  {
    keywords: ["project management", "pmp", "gantt", "stakeholder", "risk management", "budget", "jira"],
    role: "Project Manager",
  },
  {
    keywords: ["nursing", "patient care", "clinical", "medication", "ehr", "vital signs", "bls"],
    role: "Registered Nurse",
  },
  {
    keywords: ["compliance", "regulatory", "audit", "risk", "aml", "kyc", "sox"],
    role: "Compliance Officer",
  },
];

function inferRoleFromSkills(skills: string[]): string {
  const skillSet = new Set(skills.map((s) => s.toLowerCase()));

  let bestMatch = "Professional";
  let bestOverlap = 0;

  for (const cluster of SKILL_CLUSTERS) {
    const overlap = cluster.keywords.filter((k) =>
      [...skillSet].some(
        (s) => s.includes(k.toLowerCase()) || k.toLowerCase().includes(s),
      ),
    ).length;

    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestMatch = cluster.role;
    }
  }

  return bestMatch;
}

// ── Utilities ──

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSeniority(seniority: string): string {
  const s = seniority.toLowerCase();
  if (s.includes("junior") || s.includes("jr") || s.includes("entry")) return "junior";
  if (s.includes("senior") || s.includes("sr") || s.includes("principal") || s.includes("staff")) return "senior";
  if (s.includes("lead") || s.includes("manager") || s.includes("director") || s.includes("head")) return "lead";
  if (s.includes("executive") || s.includes("chief") || s.includes("vp")) return "executive";
  return "mid";
}

function tokenize(text: string): string[] {
  return text.split(/\s+/).filter((t) => t.length > 1);
}

function setIntersectionSize(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const item of a) {
    if (b.has(item)) count++;
  }
  return count;
}
