import { describe, it, expect } from "vitest";
import { scoreATS, generateStrengths, generateGaps, generateRewritePreviews } from "@/lib/ats-scorer";
import type { CandidateProfile, JobProfile } from "@/lib/types";

const mockCandidate: CandidateProfile = {
  name: "Jane Doe",
  headline: "Senior Software Engineer",
  summary: "Experienced engineer with 7 years in full-stack development",
  skills: ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "Docker", "Git"],
  experience: [
    {
      title: "Senior Software Engineer",
      company: "TechCorp",
      start: "2020",
      end: "Present",
      bullets: [
        "Led development of customer-facing dashboard serving 100K monthly active users",
        "Built REST API endpoints using Node.js and Express, reducing response times by 40%",
        "Mentored 4 junior engineers through code reviews and pair programming",
        "Collaborated with product team to define technical roadmap",
      ],
    },
    {
      title: "Software Engineer",
      company: "StartupABC",
      start: "2017",
      end: "2020",
      bullets: [
        "Developed React components for e-commerce platform processing $5M annual revenue",
        "Implemented CI/CD pipeline using GitHub Actions, reducing deployment time by 85%",
        "Wrote unit tests achieving 90% code coverage",
      ],
    },
  ],
  education: [
    {
      school: "MIT",
      degree: "B.S. Computer Science",
      end: "2017",
    },
  ],
  projects: [],
};

const mockJob: JobProfile = {
  title: "Senior Full-Stack Engineer",
  company: "CloudScale Inc.",
  requiredSkills: [
    "5+ years of experience in full-stack web development",
    "Expert-level TypeScript and React (Next.js preferred)",
    "Strong backend experience with Python or Go",
    "Experience with Kubernetes and containerized deployments",
    "GraphQL API experience",
  ],
  preferredSkills: [
    "Experience with real-time data processing (Kafka, Redis Streams)",
    "Open-source contributions",
    "Microservices architecture experience",
  ],
  responsibilities: [
    "Build and scale cloud infrastructure management platform",
    "Lead technical projects and mentor engineers",
  ],
  keywords: [
    "TypeScript", "React", "Next.js", "Python", "Go", "Kubernetes",
    "GraphQL", "AWS", "Docker", "CI/CD", "system design", "microservices",
  ],
  seniorityLevel: "Senior",
};

describe("ATS Scorer", () => {
  describe("scoreATS", () => {
    it("should return a score between 0 and 100", () => {
      const result = scoreATS(mockCandidate, mockJob);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should not return NaN for any score component", () => {
      const result = scoreATS(mockCandidate, mockJob);
      expect(Number.isNaN(result.score)).toBe(false);
      expect(Number.isNaN(result.breakdown.skillOverlap)).toBe(false);
      expect(Number.isNaN(result.breakdown.keywordCoverage)).toBe(false);
      expect(Number.isNaN(result.breakdown.seniorityMatch)).toBe(false);
      expect(Number.isNaN(result.breakdown.impactStrength)).toBe(false);
    });

    it("should identify matched keywords", () => {
      const result = scoreATS(mockCandidate, mockJob);
      expect(result.matchedKeywords.length).toBeGreaterThan(0);
      // TypeScript, React, AWS, Docker, CI/CD should all match
      const matchedLower = result.matchedKeywords.map((k) => k.toLowerCase());
      expect(matchedLower).toContain("react");
    });

    it("should identify missing keywords", () => {
      const result = scoreATS(mockCandidate, mockJob);
      expect(result.missingKeywords.length).toBeGreaterThan(0);
      // Python, Go, Kubernetes, GraphQL should be missing
      const missingLower = result.missingKeywords.map((k) => k.toLowerCase());
      expect(missingLower.some((k) => k.includes("python") || k.includes("go") || k.includes("kubernetes"))).toBe(true);
    });

    it("should generate suggestions", () => {
      const result = scoreATS(mockCandidate, mockJob);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it("should return breakdown scores", () => {
      const result = scoreATS(mockCandidate, mockJob);
      expect(result.breakdown.skillOverlap).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.skillOverlap).toBeLessThanOrEqual(100);
      expect(result.breakdown.keywordCoverage).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.keywordCoverage).toBeLessThanOrEqual(100);
    });

    it("should handle empty candidate gracefully", () => {
      const emptyCandidate: CandidateProfile = {
        skills: [],
        experience: [],
        education: [],
        projects: [],
      };
      const result = scoreATS(emptyCandidate, mockJob);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Number.isNaN(result.score)).toBe(false);
    });

    it("should handle empty job gracefully", () => {
      const emptyJob: JobProfile = {
        requiredSkills: [],
        preferredSkills: [],
        responsibilities: [],
        keywords: [],
      };
      const result = scoreATS(mockCandidate, emptyJob);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(result.score)).toBe(false);
    });

    it("should score higher when candidate has more matching skills", () => {
      const strongCandidate: CandidateProfile = {
        ...mockCandidate,
        skills: [...mockCandidate.skills, "Python", "Go", "Kubernetes", "GraphQL", "Next.js", "system design"],
      };
      const weakResult = scoreATS(mockCandidate, mockJob);
      const strongResult = scoreATS(strongCandidate, mockJob);
      expect(strongResult.score).toBeGreaterThan(weakResult.score);
    });
  });

  describe("generateStrengths", () => {
    it("should return 1-5 strengths", () => {
      const strengths = generateStrengths(mockCandidate, mockJob);
      expect(strengths.length).toBeGreaterThanOrEqual(1);
      expect(strengths.length).toBeLessThanOrEqual(5);
    });

    it("should include years of experience", () => {
      const strengths = generateStrengths(mockCandidate, mockJob);
      expect(strengths.some((s) => s.includes("years"))).toBe(true);
    });
  });

  describe("generateGaps", () => {
    it("should return gaps for missing skills", () => {
      const result = scoreATS(mockCandidate, mockJob);
      const gaps = generateGaps(mockCandidate, mockJob, result.missingKeywords);
      expect(gaps.length).toBeGreaterThan(0);
    });

    it("should be empty-safe", () => {
      const gaps = generateGaps(mockCandidate, mockJob, []);
      expect(Array.isArray(gaps)).toBe(true);
    });
  });

  describe("generateRewritePreviews", () => {
    it("should return up to 3 previews", () => {
      const previews = generateRewritePreviews(mockCandidate);
      expect(previews.length).toBeLessThanOrEqual(3);
    });

    it("should have original and improved strings", () => {
      const previews = generateRewritePreviews(mockCandidate);
      for (const preview of previews) {
        expect(typeof preview.original).toBe("string");
        expect(typeof preview.improved).toBe("string");
      }
    });
  });
});
