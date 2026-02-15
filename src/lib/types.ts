// Core domain types for ResumeMate AI

export interface CandidateProfile {
  name?: string;
  headline?: string;
  summary?: string;
  email?: string;
  phone?: string;
  location?: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
}

export interface ExperienceEntry {
  company?: string;
  title?: string;
  start?: string;
  end?: string;
  bullets: string[];
}

export interface EducationEntry {
  school?: string;
  degree?: string;
  field?: string;
  start?: string;
  end?: string;
}

export interface ProjectEntry {
  name?: string;
  bullets: string[];
}

export interface JobProfile {
  title?: string;
  company?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  keywords: string[];
  seniorityLevel?: string;
}

export interface ATSResult {
  score: number; // 0-100
  missingKeywords: string[];
  matchedKeywords: string[];
  suggestions: string[];
  warnings: string[];
  breakdown: {
    skillOverlap: number;
    keywordCoverage: number;
    seniorityMatch: number;
    impactStrength: number;
  };
}

export interface FreeAnalysisResult {
  atsResult: ATSResult;
  candidateProfile: CandidateProfile;
  jobProfile: JobProfile;
  strengths: string[];
  gaps: string[];
  rewritePreviews: Array<{
    original: string;
    improved: string;
  }>;
  radarResult?: RadarResult;
}

// ── Radar Score types ──

export interface RadarBreakdown {
  hardSkills: number;            // 0-100, weight 25%
  softSkills: number;            // 0-100, weight 15%
  measurableResults: number;     // 0-100, weight 25%
  keywordOptimization: number;   // 0-100, weight 20%
  formattingBestPractices: number; // 0-100, weight 15%
}

export type RadarLabel = "Strong match" | "Needs improvement" | "Weak match";

export interface RadarBlocker {
  title: string;
  why: string;
  how: string;
  beforeAfter?: { before: string; after: string };
}

export interface RadarDiagnostics {
  missingMetrics: string[];
  weakVerbs: string[];
  missingKeywordClusters: Array<{ cluster: string; keywords: string[] }>;
}

export interface RadarResult {
  score: number;
  label: RadarLabel;
  breakdown: RadarBreakdown;
  blockers: RadarBlocker[];      // top 3
  diagnostics: RadarDiagnostics;
  atsCompat: {                    // legacy ATS for collapsed section
    matchedKeywords: string[];
    missingKeywords: string[];
    warnings: string[];
  };
}

// Re-export the canonical ProOutput from schema
export type { ProOutput } from "./schema";

export interface TailoredResume {
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
  education: Array<{
    school: string;
    degree: string;
    year?: string;
  }>;
}

export interface CoverLetter {
  paragraphs: string[];
}
