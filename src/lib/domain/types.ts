/**
 * Domain types for the generic resume improvement engine.
 *
 * These types power the Pipeline + Strategy pattern used across
 * all professions (engineering, sales, marketing, finance, ops, etc.)
 */

// ── Job Family ──

export type JobFamily =
  | "engineering"
  | "product"
  | "sales"
  | "marketing"
  | "finance"
  | "operations"
  | "healthcare"
  | "education"
  | "general";

export interface JobFamilyResult {
  family: JobFamily;
  confidence: number; // 0..1
}

// ── Bullet Analysis ──

export interface BulletSignals {
  hasActionVerb: boolean;
  actionVerb: string | null;
  hasScopeNoun: boolean;
  scopeNouns: string[];
  hasMetric: boolean;
  metricType: "percentage" | "currency" | "time" | "volume" | "count" | null;
  metricValue: string | null;
  isVague: boolean;
  isTooLong: boolean;  // >150 chars
  isTooShort: boolean; // <30 chars
  hasDanglingEnding: boolean;
  wordCount: number;
}

// ── Metric Heuristic ──

export interface MetricHeuristic {
  /** Pattern to detect if this type of metric is already present */
  detectPattern: RegExp;
  /** The inference to append if no metric is present, e.g. "reducing cycle time by ~20%" */
  templates: string[];
  /** Max one inference per role — caller enforces this */
}

// ── Rewrite Strategy ──

export interface RewriteStrategy {
  family: JobFamily;
  /** Preferred strong action verbs for this domain */
  preferredVerbs: string[];
  /** Safe metric inference types for this domain */
  metricHeuristics: MetricHeuristic[];
  /** Rewrite a bullet with stronger framing. Must NOT inject keywords not in JD. */
  rewriteBullet(bullet: string, signals: BulletSignals): string;
  /** Draft a professional summary for this domain */
  draftSummary(params: SummaryParams): string;
  /** Draft a cover letter for this domain */
  draftCoverLetter(params: CoverLetterParams): string[];
  /** Verb palette replacement map for weak verbs */
  verbReplacements: Array<[RegExp, string]>;
}

export interface SummaryParams {
  headline: string;
  years: number;
  skills: string[];
  jobTitle: string;
  company: string;
  family: JobFamily;
}

export interface CoverLetterParams {
  name: string;
  title: string;
  company: string;
  topSkills: string;
  recentRole: string;
  topBullet: string;
  years: number;
  responsibilities: string[];
  family: JobFamily;
}

// ── Skill grouping for different domains ──

export interface SkillCategory {
  name: string;
  /** Regex pattern to match skills into this category */
  pattern: RegExp;
}
