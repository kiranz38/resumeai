/**
 * Bullet deduplication and diversity enforcement.
 *
 * Removes near-duplicate bullets, caps backend-focused bullets per role,
 * and enforces sentence-ending diversity. Runs as deterministic
 * post-processing — no LLM call needed.
 */

import type { ProOutput } from "./schema";

// ── Configuration ──

const MAX_BACKEND_BULLETS_PER_ROLE = 3;
const JACCARD_THRESHOLD = 0.85; // Higher threshold to avoid removing similar-but-distinct technical bullets
const ENDING_WORD_COUNT = 5;

/** Tokens that signal a backend-focused bullet */
const BACKEND_TOKENS = new Set([
  "api", "apis", ".net", "microservice", "microservices", "jwt",
  "service bus", "servicebus", "azure functions", "sql", "sql server",
  "worker service", "rest api", "graphql", "endpoint", "endpoints",
  "backend", "database", "migration", "stored procedure", "entity framework",
  "redis", "rabbitmq", "kafka", "grpc", "middleware", "authentication",
  "authorization", "lambda", "dynamodb", "cosmos",
]);

// ── Normalization ──

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): Set<string> {
  return new Set(normalize(text).split(" ").filter((w) => w.length > 2));
}

// ── Similarity ──

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function isNearDuplicate(a: string, b: string): boolean {
  // Exact match after normalization
  if (normalize(a) === normalize(b)) return true;
  // Jaccard word-set similarity
  return jaccardSimilarity(tokenize(a), tokenize(b)) >= JACCARD_THRESHOLD;
}

// ── Backend bullet detection ──

function isBackendBullet(bullet: string): boolean {
  const lower = bullet.toLowerCase();
  for (const token of BACKEND_TOKENS) {
    if (lower.includes(token)) return true;
  }
  return false;
}

// ── Bullet strength scoring (prefer longer bullets with metrics) ──

function bulletStrength(bullet: string): number {
  let score = bullet.length; // Longer is generally more detailed
  if (/\d+%/.test(bullet)) score += 50; // Has percentage
  if (/\$[\d,]+|[\d,]+\s*(users|customers|transactions)/i.test(bullet)) score += 40; // Has scale
  if (/\d+x|\d+\.\d+/.test(bullet)) score += 30; // Has multiplier
  return score;
}

// ── Sentence ending extraction ──

function getEnding(bullet: string): string {
  const words = bullet.replace(/[.!?]+$/, "").trim().split(/\s+/);
  return words.slice(-ENDING_WORD_COUNT).join(" ").toLowerCase();
}

// ── Ending diversity: deterministic rewrite of duplicate endings ──

const OUTCOME_SYNONYMS: Record<string, string[]> = {
  "improved": ["strengthened", "enhanced", "elevated", "advanced"],
  "increased": ["boosted", "grew", "raised", "expanded"],
  "reduced": ["lowered", "decreased", "minimized", "cut"],
  "resulting in": ["leading to", "achieving", "yielding", "delivering"],
  "across the": ["throughout the", "spanning the", "within the"],
  "for the team": ["for the engineering group", "across the team", "organization-wide"],
  "and reliability": ["and system stability", "and uptime", "and resilience"],
  "and performance": ["and throughput", "and responsiveness", "and efficiency"],
};

function rewriteEnding(bullet: string): string {
  let result = bullet;
  for (const [phrase, synonyms] of Object.entries(OUTCOME_SYNONYMS)) {
    if (result.toLowerCase().includes(phrase)) {
      const replacement = synonyms[Math.floor(Math.random() * synonyms.length)];
      const regex = new RegExp(escapeRegExp(phrase), "i");
      result = result.replace(regex, replacement);
      break; // One substitution per bullet
    }
  }
  // If no synonym worked, trim the trailing clause
  if (result === bullet) {
    const parts = result.split(/,\s*(?=[a-z])/);
    if (parts.length > 1) {
      result = parts.slice(0, -1).join(", ").replace(/[,\s]+$/, ".");
    }
  }
  return result;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Main deduplication for a single role's bullets ──

export function dedupeBullets(bullets: string[]): string[] {
  if (bullets.length <= 1) return bullets;

  // Step 1: Remove near-duplicates (keep stronger bullet)
  const unique: string[] = [];
  for (const bullet of bullets) {
    const isDupe = unique.some((existing) => isNearDuplicate(existing, bullet));
    if (isDupe) {
      // Replace if new bullet is stronger
      const dupeIdx = unique.findIndex((existing) => isNearDuplicate(existing, bullet));
      if (dupeIdx >= 0 && bulletStrength(bullet) > bulletStrength(unique[dupeIdx])) {
        unique[dupeIdx] = bullet;
      }
    } else {
      unique.push(bullet);
    }
  }

  // Step 2: No backend cap — removing content violates core principle.
  // The LLM prompt already handles domain-appropriate bullet distribution.
  const capped = unique;

  // Step 3: Enforce sentence-ending diversity
  const endings = new Set<string>();
  const diversified = capped.map((bullet) => {
    const ending = getEnding(bullet);
    if (endings.has(ending)) {
      return rewriteEnding(bullet);
    }
    endings.add(ending);
    return bullet;
  });

  return diversified;
}

// ── Apply deduplication to entire ProOutput ──

export function dedupeProOutput(output: ProOutput): ProOutput {
  const experience = output.tailoredResume.experience.map((entry) => ({
    ...entry,
    bullets: dedupeBullets(entry.bullets),
  }));

  // Also dedupe cover letter paragraphs for repeated greetings/signoffs
  const paragraphs = dedupeGreetings(output.coverLetter.paragraphs);

  return {
    ...output,
    tailoredResume: {
      ...output.tailoredResume,
      experience,
    },
    coverLetter: { paragraphs },
  };
}

// ── Cover letter greeting/signoff deduplication ──

function dedupeGreetings(paragraphs: string[]): string[] {
  if (paragraphs.length <= 1) return paragraphs;

  const greetingPattern = /^(dear\s|hi\s|hello\s|to\s+whom)/i;
  const signoffPattern = /^(sincerely|regards|best\s+regards|warm\s+regards|thank\s+you|yours)/i;

  let greetingSeen = false;
  let signoffSeen = false;

  return paragraphs.filter((p) => {
    const trimmed = p.trim();
    if (greetingPattern.test(trimmed)) {
      if (greetingSeen) return false;
      greetingSeen = true;
    }
    if (signoffPattern.test(trimmed)) {
      if (signoffSeen) return false;
      signoffSeen = true;
    }
    return true;
  });
}
