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

// ── Canonical ProOutput schema (structured, editable) ──

export const ResumeSkillGroupSchema = z.object({
  category: z.string(),
  items: z.array(z.string()),
});

export const ResumeExperienceEntrySchema = z.object({
  company: z.string(),
  title: z.string(),
  period: z.string(),
  bullets: z.array(z.string()),
});

export const ResumeEducationEntrySchema = z.object({
  school: z.string(),
  degree: z.string(),
  year: z.string().optional(),
});

export const ResumeProjectEntrySchema = z.object({
  name: z.string(),
  bullets: z.array(z.string()),
  tech: z.array(z.string()).optional(),
});

export const TailoredResumeSchema = z.object({
  name: z.string(),
  headline: z.string(),
  summary: z.string(),
  skills: z.array(ResumeSkillGroupSchema),
  experience: z.array(ResumeExperienceEntrySchema),
  education: z.array(ResumeEducationEntrySchema),
  // Optional fields populated from parsed resume (not LLM-generated)
  projects: z.array(ResumeProjectEntrySchema).optional(),
  certifications: z.array(z.string()).optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  links: z.array(z.string()).optional(),
});

export const CoverLetterSchema = z.object({
  paragraphs: z.array(z.string()),
});

export const KeywordChecklistItemSchema = z.object({
  keyword: z.string(),
  found: z.boolean(),
  section: z.string().optional(),
  suggestion: z.string().optional(),
});

export const ProBulletRewriteSchema = z.object({
  original: z.string(),
  rewritten: z.string(),
  section: z.string(),
  notes: z.string(),
});

export const ProExperienceGapSchema = z.object({
  gap: z.string(),
  suggestion: z.string(),
  severity: z.enum(["high", "medium", "low"]),
});

export const RadarScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  skillsMatch: z.number().min(0).max(100),
  experienceAlignment: z.number().min(0).max(100),
  impactStrength: z.number().min(0).max(100),
  atsReadiness: z.number().min(0).max(100),
});

export const BeforeAfterPreviewSchema = z.object({
  before: z.string(),
  after: z.string(),
});

export const ProOutputSchema = z.object({
  summary: z.string(),
  tailoredResume: TailoredResumeSchema,
  coverLetter: CoverLetterSchema,
  keywordChecklist: z.array(KeywordChecklistItemSchema),
  recruiterFeedback: z.array(z.string()),
  bulletRewrites: z.array(ProBulletRewriteSchema),
  experienceGaps: z.array(ProExperienceGapSchema),
  nextActions: z.array(z.string()),
  radar: RadarScoreSchema.optional(),
  beforeAfterPreview: BeforeAfterPreviewSchema.optional(),
  interviewTalkingPoints: z.array(z.string()).optional(),
});

export type ProOutput = z.infer<typeof ProOutputSchema>;
export type RadarScore = z.infer<typeof RadarScoreSchema>;
export type BeforeAfterPreview = z.infer<typeof BeforeAfterPreviewSchema>;
