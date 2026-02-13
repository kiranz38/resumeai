import type { CandidateProfile, JobProfile, ATSResult } from "./types";

/**
 * Deterministic ATS scoring engine.
 * No LLM required - uses keyword matching, overlap analysis, and heuristics.
 */
export function scoreATS(candidate: CandidateProfile, job: JobProfile): ATSResult {
  const candidateText = buildCandidateText(candidate);
  const candidateKeywords = extractCandidateKeywords(candidate);

  const { skillOverlap, matchedSkills, missingSkills } = computeSkillOverlap(
    candidateKeywords,
    job.requiredSkills,
    job.preferredSkills,
    job.keywords,
    candidateText
  );

  const keywordCoverage = computeKeywordCoverage(candidateText, job.keywords);
  const seniorityMatch = computeSeniorityMatch(candidate, job);
  const impactStrength = computeImpactStrength(candidate);

  // Weighted composite score
  const score = Math.round(
    skillOverlap * 0.40 +
    keywordCoverage * 0.30 +
    seniorityMatch * 0.15 +
    impactStrength * 0.15
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  const suggestions = generateSuggestions(candidate, job, missingSkills);
  const warnings = generateWarnings(candidate);

  return {
    score: clampedScore,
    missingKeywords: missingSkills,
    matchedKeywords: matchedSkills,
    suggestions,
    warnings,
    breakdown: {
      skillOverlap: Math.round(skillOverlap),
      keywordCoverage: Math.round(keywordCoverage),
      seniorityMatch: Math.round(seniorityMatch),
      impactStrength: Math.round(impactStrength),
    },
  };
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

function extractCandidateKeywords(candidate: CandidateProfile): Set<string> {
  const keywords = new Set<string>();

  // Add skills directly
  for (const skill of candidate.skills) {
    keywords.add(skill.toLowerCase());
  }

  // Extract tech terms from bullets
  const allBullets = [
    ...candidate.experience.flatMap((e) => e.bullets),
    ...candidate.projects.flatMap((p) => p.bullets),
  ];

  const techPattern = /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Go|Rust|Ruby|PHP|React|Angular|Vue|Next\.?js|Node\.?js|Express|Django|Flask|Spring|AWS|GCP|Azure|Docker|Kubernetes|Terraform|PostgreSQL|MySQL|MongoDB|Redis|GraphQL|REST|CI\/CD|Git|Agile|Scrum|HTML|CSS|Tailwind|Kafka|SQL|NoSQL|Linux|Bash|Figma|OAuth|JWT|TDD|Machine Learning|AI)\b/gi;

  const fullText = allBullets.join(" ");
  const matches = fullText.matchAll(techPattern);
  for (const match of matches) {
    keywords.add(match[0].toLowerCase());
  }

  return keywords;
}

function computeSkillOverlap(
  candidateKeywords: Set<string>,
  requiredSkills: string[],
  preferredSkills: string[],
  jobKeywords: string[],
  candidateText: string
): { skillOverlap: number; matchedSkills: string[]; missingSkills: string[] } {
  const matched: string[] = [];
  const missing: string[] = [];

  // All job-related keywords combined
  const allJobTerms = new Set<string>();
  const extractTerms = (items: string[]) => {
    for (const item of items) {
      // Extract individual tech terms from requirement sentences
      const terms = extractTechTerms(item);
      terms.forEach((t) => allJobTerms.add(t.toLowerCase()));
    }
  };

  extractTerms(requiredSkills);
  extractTerms(preferredSkills);
  for (const kw of jobKeywords) {
    allJobTerms.add(kw.toLowerCase());
  }

  if (allJobTerms.size === 0) {
    return { skillOverlap: 50, matchedSkills: [], missingSkills: [] };
  }

  // Required skills are weighted 2x
  const requiredTerms = new Set<string>();
  for (const skill of requiredSkills) {
    extractTechTerms(skill).forEach((t) => requiredTerms.add(t.toLowerCase()));
  }

  let totalWeight = 0;
  let matchedWeight = 0;

  for (const term of allJobTerms) {
    const weight = requiredTerms.has(term) ? 2 : 1;
    totalWeight += weight;

    const found = candidateKeywords.has(term) ||
      candidateText.includes(term) ||
      fuzzyMatch(term, candidateKeywords, candidateText);

    if (found) {
      matchedWeight += weight;
      matched.push(term);
    } else {
      missing.push(term);
    }
  }

  const score = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 50;

  return {
    skillOverlap: score,
    matchedSkills: [...new Set(matched)],
    missingSkills: [...new Set(missing)],
  };
}

function extractTechTerms(text: string): string[] {
  const terms: string[] = [];
  const patterns = [
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Go|Golang|Rust|Ruby|PHP|Swift|Kotlin|Scala)\b/gi,
    /\b(React|Angular|Vue|Svelte|Next\.?js|Nuxt|Gatsby|Remix)\b/gi,
    /\b(Node\.?js|Express|Django|Flask|FastAPI|Spring|Rails|Laravel|\.NET)\b/gi,
    /\b(AWS|GCP|Azure|Google Cloud|Amazon Web Services)\b/gi,
    /\b(Docker|Kubernetes|K8s|Terraform|Pulumi|Ansible|CloudFormation)\b/gi,
    /\b(PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch|DynamoDB|Cassandra)\b/gi,
    /\b(GraphQL|REST|gRPC|WebSocket|microservices)\b/gi,
    /\b(CI\/CD|GitHub Actions|Jenkins|CircleCI|GitLab CI)\b/gi,
    /\b(Git|Agile|Scrum|Kanban|Jira)\b/gi,
    /\b(HTML|CSS|SASS|Tailwind|Bootstrap)\b/gi,
    /\b(Kafka|RabbitMQ|Redis Streams|SQS)\b/gi,
    /\b(TensorFlow|PyTorch|Machine Learning|Deep Learning|NLP|AI|ML|LLM)\b/gi,
    /\b(Linux|Bash|Shell)\b/gi,
    /\b(SQL|NoSQL|ETL)\b/gi,
    /\b(system design|architecture|distributed systems|scalability)\b/gi,
    /\b(leadership|mentoring|technical leadership)\b/gi,
    /\b(testing|TDD|unit test|integration test|e2e)\b/gi,
    /\b(performance|optimization|monitoring|observability)\b/gi,
    /\b(security|compliance|GDPR|SOC 2|HIPAA)\b/gi,
    /\b(OAuth|JWT|SAML|SSO)\b/gi,
    /\b(Figma|Sketch)\b/gi,
    /\b(open[- ]?source)\b/gi,
    /\b(infrastructure[- ]?as[- ]?code|IaC)\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      terms.push(match[0]);
    }
  }

  // Also extract "N+ years" patterns
  const yearsMatch = text.match(/(\d+)\+?\s*years?/i);
  if (yearsMatch) {
    terms.push(`${yearsMatch[1]}+ years experience`);
  }

  return terms.length > 0 ? terms : [text.trim()];
}

function fuzzyMatch(term: string, candidateKeywords: Set<string>, candidateText: string): boolean {
  // Handle common synonyms
  const synonyms: Record<string, string[]> = {
    "golang": ["go"],
    "go": ["golang"],
    "k8s": ["kubernetes"],
    "kubernetes": ["k8s"],
    "gcp": ["google cloud"],
    "google cloud": ["gcp"],
    "aws": ["amazon web services"],
    "node.js": ["nodejs", "node"],
    "next.js": ["nextjs", "next"],
    "react.js": ["react"],
    "ci/cd": ["cicd", "continuous integration", "continuous deployment", "github actions", "jenkins"],
    "system design": ["architecture", "system architecture"],
    "microservices": ["micro-services", "micro services"],
    "machine learning": ["ml"],
    "artificial intelligence": ["ai"],
    "infrastructure-as-code": ["iac", "terraform", "pulumi", "cloudformation"],
    "iac": ["infrastructure-as-code", "infrastructure as code", "terraform", "pulumi"],
  };

  const termLower = term.toLowerCase();
  const alts = synonyms[termLower] || [];
  for (const alt of alts) {
    if (candidateKeywords.has(alt) || candidateText.includes(alt)) {
      return true;
    }
  }

  return false;
}

function computeKeywordCoverage(candidateText: string, jobKeywords: string[]): number {
  if (jobKeywords.length === 0) return 50;

  let matched = 0;
  for (const keyword of jobKeywords) {
    const lower = keyword.toLowerCase();
    if (candidateText.includes(lower)) {
      matched++;
    }
  }

  return (matched / jobKeywords.length) * 100;
}

function computeSeniorityMatch(candidate: CandidateProfile, job: JobProfile): number {
  const candidateYears = estimateYearsExperience(candidate);
  const jobSeniority = job.seniorityLevel || "Mid";

  const seniorityYears: Record<string, [number, number]> = {
    "Junior": [0, 2],
    "Mid": [2, 5],
    "Senior": [5, 10],
    "Manager": [5, 15],
    "Principal": [8, 20],
    "Director": [10, 25],
  };

  const [minYears, maxYears] = seniorityYears[jobSeniority] || [2, 5];

  if (candidateYears >= minYears && candidateYears <= maxYears + 3) {
    return 100;
  } else if (candidateYears >= minYears - 1) {
    return 75;
  } else if (candidateYears >= minYears - 2) {
    return 50;
  }
  return 25;
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

  if (latestYear === 0) return candidate.experience.length * 2; // Rough estimate
  return Math.max(0, latestYear - earliestYear);
}

function extractYear(dateStr?: string): number | null {
  if (!dateStr) return null;
  if (/present|current/i.test(dateStr)) return new Date().getFullYear();
  const match = dateStr.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0]) : null;
}

function computeImpactStrength(candidate: CandidateProfile): number {
  const allBullets = candidate.experience.flatMap((e) => e.bullets);

  if (allBullets.length === 0) return 20;

  let score = 0;
  let total = allBullets.length;

  for (const bullet of allBullets) {
    let bulletScore = 0;

    // Starts with action verb
    const actionVerbs = /^(led|built|designed|developed|implemented|created|launched|optimized|reduced|increased|improved|managed|architected|delivered|scaled|mentored|automated|migrated|spearheaded|orchestrated|established|transformed|pioneered)/i;
    if (actionVerbs.test(bullet)) bulletScore += 25;

    // Contains metrics/numbers
    if (/\d+[%xX]|\$[\d,]+|\d+[KkMm]\b|\d+\s*(users|customers|clients|requests|transactions|engineers|team)/i.test(bullet)) {
      bulletScore += 40;
    }

    // Contains scope indicators
    if (/\b(team|cross-functional|company-wide|organization|enterprise|platform|global)\b/i.test(bullet)) {
      bulletScore += 15;
    }

    // Contains result indicators
    if (/\b(resulting in|leading to|which|achieving|enabling|saving|reducing|increasing|improving)\b/i.test(bullet)) {
      bulletScore += 20;
    }

    score += Math.min(100, bulletScore);
  }

  return total > 0 ? score / total : 20;
}

function generateSuggestions(
  candidate: CandidateProfile,
  job: JobProfile,
  missingSkills: string[]
): string[] {
  const suggestions: string[] = [];

  // Missing skills suggestions
  const highPriority = missingSkills.slice(0, 5);
  if (highPriority.length > 0) {
    suggestions.push(
      `Add these missing keywords to your resume: ${highPriority.join(", ")}`
    );
  }

  // Summary suggestion
  if (!candidate.summary) {
    suggestions.push(
      "Add a professional summary at the top of your resume that includes key terms from the job description"
    );
  }

  // Skills organization
  if (candidate.skills.length < 5) {
    suggestions.push(
      "Expand your skills section with specific technologies, tools, and methodologies mentioned in the job description"
    );
  }

  // Quantifiable metrics
  const bullets = candidate.experience.flatMap((e) => e.bullets);
  const bulletsWithMetrics = bullets.filter((b) =>
    /\d+[%xX]|\$[\d,]+|\d+[KkMm]\b/.test(b)
  );
  if (bullets.length > 0 && bulletsWithMetrics.length / bullets.length < 0.3) {
    suggestions.push(
      "Add more quantifiable metrics to your experience bullets (numbers, percentages, dollar amounts)"
    );
  }

  // Title match
  if (job.title && candidate.headline) {
    const jobTitleWords = job.title.toLowerCase().split(/\s+/);
    const hasMatch = jobTitleWords.some((w) =>
      candidate.headline!.toLowerCase().includes(w)
    );
    if (!hasMatch) {
      suggestions.push(
        `Consider aligning your title/headline to match "${job.title}" for better ATS matching`
      );
    }
  }

  // Action verbs
  const weakStarts = bullets.filter((b) =>
    /^(responsible for|helped|assisted|worked on|participated in|involved in)/i.test(b)
  );
  if (weakStarts.length > 0) {
    suggestions.push(
      "Replace weak bullet openings like 'Responsible for' or 'Helped with' with strong action verbs"
    );
  }

  return suggestions.slice(0, 7);
}

function generateWarnings(candidate: CandidateProfile): string[] {
  const warnings: string[] = [];

  // No summary
  if (!candidate.summary) {
    warnings.push("Missing professional summary section — most ATS systems prioritize the top of the resume");
  }

  // Very few skills listed
  if (candidate.skills.length < 3) {
    warnings.push("Very few skills detected — ensure your Skills section is clearly formatted with comma-separated items");
  }

  // Long bullets
  const longBullets = candidate.experience.flatMap((e) => e.bullets).filter((b) => b.length > 200);
  if (longBullets.length > 0) {
    warnings.push("Some bullets exceed 200 characters — keep bullets concise for ATS readability");
  }

  // Too few experience entries
  if (candidate.experience.length === 0) {
    warnings.push("No experience section detected — ensure your work experience is clearly labeled");
  }

  // No education
  if (candidate.education.length === 0) {
    warnings.push("No education section detected — include your educational background");
  }

  return warnings;
}

/**
 * Generate strengths based on the candidate profile.
 */
export function generateStrengths(candidate: CandidateProfile, job: JobProfile): string[] {
  const strengths: string[] = [];

  // Years of experience
  const years = estimateYearsExperience(candidate);
  if (years > 0) {
    strengths.push(`${years}+ years of relevant experience across ${candidate.experience.length} position${candidate.experience.length !== 1 ? "s" : ""}`);
  }

  // Metrics in bullets
  const bullets = candidate.experience.flatMap((e) => e.bullets);
  const metricBullets = bullets.filter((b) => /\d+[%xX]|\$[\d,]+|\d+[KkMm]\b/.test(b));
  if (metricBullets.length > 0) {
    strengths.push(`${metricBullets.length} experience bullet${metricBullets.length !== 1 ? "s" : ""} include quantifiable impact metrics`);
  }

  // Skill overlap
  const candidateSkillsLower = new Set(candidate.skills.map((s) => s.toLowerCase()));
  const jobKeywordsLower = job.keywords.map((k) => k.toLowerCase());
  const matchCount = jobKeywordsLower.filter((k) => candidateSkillsLower.has(k)).length;
  if (matchCount > 0) {
    strengths.push(`${matchCount} direct skill match${matchCount !== 1 ? "es" : ""} with the job requirements`);
  }

  // Leadership signals
  const leadershipBullets = bullets.filter((b) =>
    /\b(led|managed|mentored|coached|directed|supervised|coordinated team|headed)\b/i.test(b)
  );
  if (leadershipBullets.length > 0) {
    strengths.push("Demonstrates leadership and mentoring experience");
  }

  // Strong action verbs
  const strongBullets = bullets.filter((b) =>
    /^(architected|spearheaded|pioneered|transformed|orchestrated|established)\b/i.test(b)
  );
  if (strongBullets.length > 0) {
    strengths.push("Uses strong action verbs that convey ownership and impact");
  }

  // Education
  if (candidate.education.length > 0) {
    const edu = candidate.education[0];
    if (edu.degree && edu.school) {
      strengths.push(`${edu.degree} from ${edu.school}`);
    }
  }

  return strengths.slice(0, 5);
}

/**
 * Generate gaps analysis.
 */
export function generateGaps(candidate: CandidateProfile, job: JobProfile, missingKeywords: string[]): string[] {
  const gaps: string[] = [];

  // Missing critical skills
  const highPriority = missingKeywords.slice(0, 3);
  if (highPriority.length > 0) {
    gaps.push(`Missing key required skills: ${highPriority.join(", ")}`);
  }

  // No summary
  if (!candidate.summary) {
    gaps.push("No professional summary — add a targeted 2-3 sentence summary at the top");
  }

  // Weak bullets
  const bullets = candidate.experience.flatMap((e) => e.bullets);
  const weakBullets = bullets.filter((b) =>
    /^(responsible for|helped|assisted|worked on|participated in)/i.test(b)
  );
  if (weakBullets.length > 0) {
    gaps.push(`${weakBullets.length} bullet${weakBullets.length !== 1 ? "s" : ""} use weak language — rewrite with action verbs and metrics`);
  }

  // Few metrics
  const metricBullets = bullets.filter((b) => /\d+[%xX]|\$[\d,]+|\d+[KkMm]\b/.test(b));
  if (bullets.length > 0 && metricBullets.length / bullets.length < 0.3) {
    gaps.push("Less than 30% of bullets include quantifiable results — add numbers to demonstrate impact");
  }

  // Title mismatch
  if (job.title) {
    const titleWords = job.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const hasTitle = candidate.experience.some((e) =>
      titleWords.some((w) => e.title?.toLowerCase().includes(w))
    );
    if (!hasTitle) {
      gaps.push(`Resume title doesn't match "${job.title}" — consider adding a matching subtitle`);
    }
  }

  // Seniority gap
  const years = estimateYearsExperience(candidate);
  if (job.seniorityLevel === "Senior" && years < 4) {
    gaps.push("Experience may be light for a senior-level role — emphasize scope, ownership, and technical depth");
  }

  // Missing preferred skills
  const preferred = missingKeywords.filter((k) =>
    job.preferredSkills.some((s) => s.toLowerCase().includes(k.toLowerCase()))
  );
  if (preferred.length > 2) {
    gaps.push(`Missing nice-to-have skills that could differentiate you: ${preferred.slice(0, 3).join(", ")}`);
  }

  return gaps.slice(0, 7);
}

/**
 * Generate rewrite previews for the free tier (limited to 3).
 */
export function generateRewritePreviews(
  candidate: CandidateProfile
): Array<{ original: string; improved: string }> {
  const previews: Array<{ original: string; improved: string }> = [];

  const allBullets: Array<{ bullet: string; exp: string }> = [];
  for (const exp of candidate.experience) {
    for (const bullet of exp.bullets) {
      allBullets.push({ bullet, exp: exp.title || exp.company || "" });
    }
  }

  // Find bullets that can be improved
  for (const { bullet } of allBullets) {
    if (previews.length >= 3) break;

    const improved = improveDirectly(bullet);
    if (improved !== bullet) {
      previews.push({ original: bullet, improved });
    }
  }

  return previews;
}

function improveDirectly(bullet: string): string {
  let improved = bullet;

  // Replace weak openers
  const weakOpeners: [RegExp, string][] = [
    [/^Responsible for\s+/i, "Led "],
    [/^Helped\s+/i, "Contributed to "],
    [/^Assisted\s+(with\s+)?/i, "Supported "],
    [/^Worked on\s+/i, "Developed "],
    [/^Participated in\s+/i, "Contributed to "],
    [/^Involved in\s+/i, "Drove "],
    [/^Was part of\s+/i, "Collaborated on "],
  ];

  for (const [pattern, replacement] of weakOpeners) {
    if (pattern.test(improved)) {
      improved = improved.replace(pattern, replacement);
      break;
    }
  }

  // Add scope/impact hints if none present
  if (!/\d/.test(improved) && !improved.includes("[")) {
    // Suggest adding metrics
    if (improved.length < 100) {
      improved = improved.replace(/\.$/, "") + ", resulting in [X]% improvement in [metric]";
    }
  }

  // Capitalize first letter
  improved = improved.charAt(0).toUpperCase() + improved.slice(1);

  return improved === bullet ? bullet : improved;
}
