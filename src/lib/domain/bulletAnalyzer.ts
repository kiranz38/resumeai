/**
 * Universal Bullet Analyzer — works for all professions.
 *
 * Analyzes a resume bullet point and returns structured signals
 * about its quality: action verb, scope, metrics, clarity.
 *
 * Pure function, no LLM needed.
 */

import type { BulletSignals } from "./types";

// ── Action verb detection ──

const STRONG_VERBS = new Set([
  "led", "designed", "built", "shipped", "architected", "spearheaded",
  "established", "pioneered", "launched", "created", "drove", "owned",
  "directed", "orchestrated", "transformed", "founded", "initiated",
  "developed", "implemented", "delivered", "reduced", "increased",
  "improved", "optimized", "streamlined", "automated", "managed",
  "negotiated", "closed", "secured", "generated", "exceeded",
  "expanded", "scaled", "migrated", "consolidated", "restructured",
  "analyzed", "evaluated", "assessed", "audited", "forecasted",
  "trained", "mentored", "coached", "recruited", "onboarded",
  "published", "presented", "authored", "coordinated", "facilitated",
]);

const WEAK_VERB_PATTERN =
  /^(responsible for|helped|assisted|worked on|participated in|involved in|was part of|tasked with|handled|dealt with|utilized|used|made|did)\b/i;

// ── Scope noun detection ──

const SCOPE_NOUNS = [
  "project", "system", "platform", "application", "service", "product",
  "campaign", "process", "program", "initiative", "pipeline", "team",
  "department", "organization", "client", "customer", "portfolio",
  "market", "territory", "account", "budget", "fund", "strategy",
  "framework", "infrastructure", "curriculum", "protocol",
];

// ── Metric detection ──

const METRIC_PATTERNS: Array<{ type: BulletSignals["metricType"]; pattern: RegExp }> = [
  { type: "percentage", pattern: /\d+\s*%/ },
  { type: "currency", pattern: /\$[\d,.]+[KkMmBb]?|\d+\s*(million|billion|thousand)?\s*dollars?/i },
  { type: "time", pattern: /\d+\s*(hours?|days?|weeks?|months?|minutes?|ms|seconds?)\b/i },
  { type: "volume", pattern: /\d+[KkMm]\+?\s*(users?|customers?|transactions?|requests?|records?|views?|visits?|sessions?)/i },
  { type: "count", pattern: /\b\d+\s*(people|engineers?|reports?|teams?|projects?|clients?|accounts?|hires?|deals?)\b/i },
  { type: "percentage", pattern: /\d+[xX]\b/ }, // "3x" multiplier
];

// ── Dangling ending detection ──

const DANGLING_ENDINGS = [
  /,\s*(leading to|resulting in|delivering|achieving|enabling|driving|ensuring)\s*\.?\s*$/i,
  /,\s*(which led to|which resulted in|which enabled|which drove)\s*\.?\s*$/i,
  /\b(leading to|resulting in|delivering|achieving)\s*$/i,
];

/**
 * Analyze a single bullet point and return quality signals.
 */
export function analyzeBullet(bullet: string): BulletSignals {
  const trimmed = bullet.trim();
  const words = trimmed.split(/\s+/);
  const firstWord = words[0]?.toLowerCase() || "";

  // Action verb
  const hasActionVerb = STRONG_VERBS.has(firstWord) || /^[A-Z][a-z]+ed\b/.test(words[0] || "");
  const isVague = WEAK_VERB_PATTERN.test(trimmed);

  // Scope nouns
  const lower = trimmed.toLowerCase();
  const scopeNouns = SCOPE_NOUNS.filter((noun) => lower.includes(noun));

  // Metrics
  let hasMetric = false;
  let metricType: BulletSignals["metricType"] = null;
  let metricValue: string | null = null;

  for (const { type, pattern } of METRIC_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      hasMetric = true;
      metricType = type;
      metricValue = match[0];
      break;
    }
  }

  // Dangling ending
  const hasDanglingEnding = DANGLING_ENDINGS.some((p) => p.test(trimmed));

  return {
    hasActionVerb,
    actionVerb: hasActionVerb ? firstWord : null,
    hasScopeNoun: scopeNouns.length > 0,
    scopeNouns,
    hasMetric,
    metricType,
    metricValue,
    isVague,
    isTooLong: trimmed.length > 150,
    isTooShort: trimmed.length < 30 && trimmed.length > 0,
    hasDanglingEnding,
    wordCount: words.length,
  };
}

/**
 * Analyze all bullets across all experience entries.
 * Returns an array of signals in the same order.
 */
export function analyzeAllBullets(
  bullets: string[],
): BulletSignals[] {
  return bullets.map(analyzeBullet);
}
