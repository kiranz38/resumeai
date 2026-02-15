/**
 * Domain module barrel export.
 *
 * Provides job family classification, rewrite strategies,
 * and bullet analysis for the generic resume engine.
 */

export type {
  JobFamily,
  JobFamilyResult,
  BulletSignals,
  MetricHeuristic,
  RewriteStrategy,
  SummaryParams,
  CoverLetterParams,
  SkillCategory,
} from "./types";

export { classifyJobFamily, familyToStrategyKey } from "./jobFamilies";
export { getStrategy, getStrategyByKey } from "./strategies";
export { analyzeBullet, analyzeAllBullets } from "./bulletAnalyzer";
