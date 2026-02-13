import { z } from "zod";

export const KeywordItemSchema = z.object({
  keyword: z.string(),
  category: z.enum(["tools", "domain", "soft_skills", "leadership", "certifications", "other"]),
  importance: z.enum(["high", "medium", "low"]),
  reason: z.string(),
  suggestedSection: z.string(),
});

export const BulletRewriteSchema = z.object({
  original: z.string(),
  rewritten: z.string(),
  section: z.string(),
  improvementNotes: z.string(),
});

export const ExperienceGapSchema = z.object({
  gap: z.string(),
  evidence: z.string(),
  suggestion: z.string(),
  severity: z.enum(["high", "medium", "low"]),
});

export const ATSWarningSchema = z.object({
  issue: z.string(),
  location: z.string(),
  fix: z.string(),
  severity: z.enum(["high", "medium", "low"]),
});

export const ResumeTailorResultSchema = z.object({
  atsMatchScore: z.number().min(0).max(100),
  interviewReadinessScore: z.number().min(0).max(100),
  atsScoreExplanation: z.string(),
  interviewScoreExplanation: z.string(),
  missingKeywords: z.array(KeywordItemSchema),
  bulletRewrites: z.array(BulletRewriteSchema),
  experienceGaps: z.array(ExperienceGapSchema),
  atsWarnings: z.array(ATSWarningSchema),
  skillsSectionRewrite: z.string(),
  coverLetterDraft: z.string(),
  nextActions: z.array(z.string()),
  summary: z.string(),
});

export type KeywordItem = z.infer<typeof KeywordItemSchema>;
export type BulletRewrite = z.infer<typeof BulletRewriteSchema>;
export type ExperienceGap = z.infer<typeof ExperienceGapSchema>;
export type ATSWarning = z.infer<typeof ATSWarningSchema>;
export type ResumeTailorResult = z.infer<typeof ResumeTailorResultSchema>;
