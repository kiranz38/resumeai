import type { CandidateProfile, RadarBreakdown } from "@/lib/types";

export interface WeightedItem {
  value: string;
  weight: number; // 0.0 - 1.0 (frequency across source JDs)
}

export interface RoleProfile {
  id: string;
  normalizedTitle: string;
  aliases: string[];
  category: string;
  seniority: "junior" | "mid" | "senior" | "lead" | "executive";
  countryCode: string; // "US", "GB", "GLOBAL", etc.

  requiredSkills: WeightedItem[];
  preferredSkills: WeightedItem[];
  commonKeywords: WeightedItem[];
  typicalResponsibilities: string[];

  salaryRange?: { min: number; median: number; max: number; currency: string };
  sourceCount: number;
  lastRefreshed: string; // ISO date
}

export interface RoleMatch {
  profile: RoleProfile;
  score: number;
  radarBreakdown: RadarBreakdown;
  missingSkills: string[];
  missingKeywords: string[];
  matchedSkills: string[];
}

export interface QuickScanResult {
  candidateProfile: CandidateProfile;
  roleMatches: RoleMatch[];
  generalStrengths: string[];
  formattingIssues: string[];
  rewritePreviews: Array<{ original: string; improved: string }>;
  bestMatchScore: number;
  bestMatchRole: string;
}
