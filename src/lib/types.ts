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
}

export interface ProGenerationResult {
  tailoredResume: string;
  coverLetter: string;
  keywordChecklist: Array<{
    keyword: string;
    found: boolean;
    section?: string;
    suggestion?: string;
  }>;
  recruiterFeedback: string;
  bulletRewrites: Array<{
    original: string;
    rewritten: string;
    section: string;
    notes: string;
  }>;
  skillsSectionRewrite: string;
  experienceGaps: Array<{
    gap: string;
    suggestion: string;
    severity: "high" | "medium" | "low";
  }>;
  nextActions: string[];
  summary: string;
}
