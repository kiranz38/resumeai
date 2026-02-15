import { describe, it, expect } from "vitest";
import { scoreRadar, tailoredToCandidateProfile } from "@/lib/radar-scorer";
import { validateConsistency, resumeTextForScoring } from "@/lib/consistency-validator";
import { dedupeBullets, dedupeProOutput } from "@/lib/dedupe-bullets";
import { runQualityGate } from "@/lib/quality-gate";
import { ensureScoreImprovement } from "@/lib/score-booster";
import type { CandidateProfile, JobProfile } from "@/lib/types";
import type { ProOutput } from "@/lib/schema";

// ── Test fixtures ──

const mockCandidate: CandidateProfile = {
  name: "Jane Doe",
  headline: "Senior Software Engineer",
  summary: "Full-stack engineer with 7 years experience in web development",
  skills: ["JavaScript", "React", "Node.js", "PostgreSQL", "Git"],
  experience: [
    {
      title: "Senior Software Engineer",
      company: "TechCorp",
      start: "2020",
      end: "Present",
      bullets: [
        "Led development of customer-facing dashboard serving 100K monthly users",
        "Built REST API endpoints using Node.js, reducing response times by 40%",
        "Mentored 4 junior engineers through code reviews",
      ],
    },
    {
      title: "Software Engineer",
      company: "StartupABC",
      start: "2017",
      end: "2020",
      bullets: [
        "Developed React components for e-commerce platform",
        "Implemented CI/CD pipeline reducing deployment time by 85%",
      ],
    },
  ],
  education: [{ school: "MIT", degree: "B.S. Computer Science", end: "2017" }],
  projects: [],
};

const mockJob: JobProfile = {
  title: "Senior Frontend Engineer",
  company: "BigCo",
  requiredSkills: ["TypeScript", "React", "Next.js", "MUI", "REST APIs"],
  preferredSkills: ["GraphQL", "Storybook", "Figma"],
  responsibilities: ["Build frontend features", "Mentor engineers"],
  keywords: ["frontend", "component library", "accessibility", "responsive design"],
  seniorityLevel: "senior",
};

function makeMockProOutput(overrides?: Partial<ProOutput>): ProOutput {
  return {
    summary: "Strong candidate for the Senior Frontend Engineer role.",
    tailoredResume: {
      name: "Jane Doe",
      headline: "Senior Frontend Engineer",
      summary: "Full-stack engineer with expertise in React, TypeScript, and modern frontend architecture.",
      skills: [
        { category: "Core", items: ["TypeScript", "React", "Next.js", "JavaScript"] },
        { category: "Tools", items: ["Git", "Node.js", "PostgreSQL"] },
      ],
      experience: [
        {
          company: "TechCorp",
          title: "Senior Software Engineer",
          period: "2020 – Present",
          bullets: [
            "Led development of customer-facing React dashboard serving 100K monthly users with responsive design",
            "Built TypeScript REST API endpoints, reducing response times by 40%",
            "Mentored 4 junior frontend engineers through code reviews and pair programming",
          ],
        },
        {
          company: "StartupABC",
          title: "Software Engineer",
          period: "2017 – 2020",
          bullets: [
            "Developed accessible React components for e-commerce platform",
            "Implemented CI/CD pipeline reducing deployment time by 85%",
          ],
        },
      ],
      education: [{ school: "MIT", degree: "B.S. Computer Science", year: "2017" }],
    },
    coverLetter: {
      paragraphs: [
        "Dear Hiring Manager,",
        "I am excited to apply for the Senior Frontend Engineer role at BigCo.",
        "My experience in React and frontend architecture aligns well with your needs.",
        "Sincerely, Jane Doe",
      ],
    },
    keywordChecklist: [
      { keyword: "TypeScript", found: true, section: "Skills" },
      { keyword: "React", found: true, section: "Skills" },
      { keyword: "Next.js", found: true, section: "Skills" },
      { keyword: "MUI", found: false, suggestion: "Add MUI to skills" },
      { keyword: "GraphQL", found: false, suggestion: "Add GraphQL" },
    ],
    recruiterFeedback: [
      "Strong React and TypeScript experience demonstrated",
      "Good leadership signals with mentoring experience",
    ],
    bulletRewrites: [],
    experienceGaps: [],
    nextActions: ["Consider adding MUI to your skills section"],
    ...overrides,
  };
}

// ── Radar Scorer Tests ──

describe("Radar Scorer", () => {
  it("uses new label system: Strong Match / Good Match / Moderate Match", () => {
    const result = scoreRadar(mockCandidate, mockJob);
    expect(["Strong Match", "Good Match", "Moderate Match"]).toContain(result.label);
  });

  it("never returns Weak match or Needs improvement labels", () => {
    const result = scoreRadar(mockCandidate, mockJob);
    expect(result.label).not.toBe("Weak match");
    expect(result.label).not.toBe("Needs improvement");
  });

  it("converts tailored resume to CandidateProfile for re-scoring", () => {
    const output = makeMockProOutput();
    const candidate = tailoredToCandidateProfile(output.tailoredResume);
    expect(candidate.skills).toContain("TypeScript");
    expect(candidate.skills).toContain("React");
    expect(candidate.experience).toHaveLength(2);
    expect(candidate.education).toHaveLength(1);
  });
});

// ── Score Booster Tests ──

describe("Score Booster", () => {
  it("radarAfter >= radarBefore after boosting", () => {
    const output = makeMockProOutput();
    const { radarBefore, radarAfter } = ensureScoreImprovement(output, mockCandidate, mockJob);
    expect(radarAfter.score).toBeGreaterThanOrEqual(radarBefore.score);
  });

  it("radarAfter shows meaningful improvement (>= +15 or >= 45)", () => {
    const output = makeMockProOutput();
    const { radarBefore, radarAfter } = ensureScoreImprovement(output, mockCandidate, mockJob);

    // Either: after >= before + 15, OR after >= 45 (score floor)
    const meetsImprovement = radarAfter.score >= radarBefore.score + 15;
    const meetsFloor = radarAfter.score >= 45;
    expect(meetsImprovement || meetsFloor).toBe(true);
  });

  it("never shows Weak Match label after boosting", () => {
    const output = makeMockProOutput();
    const { radarAfter } = ensureScoreImprovement(output, mockCandidate, mockJob);
    expect(radarAfter.label).not.toBe("Weak match");
    expect(radarAfter.label).not.toBe("Weak Match");
  });

  it("injects missing skills when score is low", () => {
    // Create an output with minimal skills
    const sparseOutput = makeMockProOutput({
      tailoredResume: {
        ...makeMockProOutput().tailoredResume,
        skills: [{ category: "Core", items: ["JavaScript"] }],
        summary: "Junior developer.",
      },
    });

    const { output, boosted } = ensureScoreImprovement(sparseOutput, mockCandidate, mockJob);
    const allSkills = output.tailoredResume.skills.flatMap((g) => g.items.map((s) => s.toLowerCase()));

    // Should have injected some required skills
    const hasTypescript = allSkills.some((s) => s.includes("typescript"));
    const hasReact = allSkills.some((s) => s.includes("react"));
    expect(hasTypescript || hasReact || boosted).toBe(true);
  });
});

// ── Consistency Validator Tests ──

describe("Consistency Validator", () => {
  it("flips keyword from not-found to found when present in tailored resume", () => {
    const output = makeMockProOutput({
      keywordChecklist: [
        { keyword: "TypeScript", found: false, suggestion: "Add TypeScript" },
        { keyword: "React", found: false, suggestion: "Add React" },
      ],
    });

    const fixed = validateConsistency(output);

    // TypeScript and React are in the tailored resume skills
    const tsItem = fixed.keywordChecklist.find((k) => k.keyword === "TypeScript");
    const reactItem = fixed.keywordChecklist.find((k) => k.keyword === "React");
    expect(tsItem?.found).toBe(true);
    expect(reactItem?.found).toBe(true);
  });

  it("removes contradictory recruiter feedback about TypeScript", () => {
    const output = makeMockProOutput({
      recruiterFeedback: [
        "Good React experience shown",
        "No TypeScript shown in the resume",
        "Missing leadership from the candidate",
      ],
    });

    const fixed = validateConsistency(output);

    // "No TypeScript shown" should be removed (TypeScript IS in the skills)
    expect(fixed.recruiterFeedback).not.toContainEqual(
      expect.stringContaining("No TypeScript shown"),
    );
  });

  it("removes experience gaps contradicted by tailored resume", () => {
    const output = makeMockProOutput({
      experienceGaps: [
        {
          gap: 'Requirement not demonstrated: "TypeScript"',
          suggestion: "Add TypeScript to your skills",
          severity: "high" as const,
        },
        {
          gap: "No cloud computing experience",
          suggestion: "Add AWS or Azure experience",
          severity: "medium" as const,
        },
      ],
    });

    const fixed = validateConsistency(output);

    // TypeScript gap should be removed (it's in the resume)
    expect(fixed.experienceGaps.length).toBeLessThan(output.experienceGaps.length);
  });

  it("replaces forbidden language with supportive tone", () => {
    const output = makeMockProOutput({
      recruiterFeedback: [
        "This is a weak match for the role",
        "Candidate lacks experience in cloud computing",
        "Underqualified for the seniority level",
      ],
      summary: "Weak match overall. Candidate fails to demonstrate leadership.",
    });

    const fixed = validateConsistency(output);

    // Check that forbidden phrases are replaced
    for (const line of fixed.recruiterFeedback) {
      expect(line.toLowerCase()).not.toContain("weak match");
      expect(line.toLowerCase()).not.toContain("underqualified");
    }
    expect(fixed.summary.toLowerCase()).not.toContain("weak match");
    expect(fixed.summary.toLowerCase()).not.toContain("fails to");
  });

  it("resumeTextForScoring includes all resume sections", () => {
    const output = makeMockProOutput();
    const text = resumeTextForScoring(output.tailoredResume);

    expect(text).toContain("jane doe");
    expect(text).toContain("typescript");
    expect(text).toContain("react");
    expect(text).toContain("techcorp");
    expect(text).toContain("mit");
  });
});

// ── Bullet Deduplication Tests ──

describe("Bullet Deduplication", () => {
  it("removes near-duplicate bullets", () => {
    const bullets = [
      "Built REST API endpoints using Node.js and Express framework, reducing response times by 40% across the platform",
      "Built REST API endpoints using Node.js and Express framework, reducing response times by 40% across the application",
      "Led development of customer-facing dashboard",
    ];

    const deduped = dedupeBullets(bullets);
    expect(deduped.length).toBeLessThan(bullets.length);
  });

  it("keeps unique bullets", () => {
    const bullets = [
      "Led development of React dashboard serving 100K users",
      "Built microservices architecture with Node.js and PostgreSQL",
      "Mentored 4 junior engineers through pair programming",
    ];

    const deduped = dedupeBullets(bullets);
    expect(deduped.length).toBe(bullets.length);
  });

  it("caps backend bullets at 3 per role", () => {
    const bullets = [
      "Built REST API endpoints using Node.js",
      "Designed microservices architecture with Docker and Kubernetes",
      "Implemented SQL database migrations with PostgreSQL",
      "Created GraphQL endpoint layer for frontend consumption",
      "Deployed serverless functions using AWS Lambda",
    ];

    const deduped = dedupeBullets(bullets);
    // All 5 are backend bullets; should cap at 3
    expect(deduped.length).toBeLessThanOrEqual(3);
  });

  it("deduplicates cover letter greetings", () => {
    const output = makeMockProOutput({
      coverLetter: {
        paragraphs: [
          "Dear Hiring Manager,",
          "Dear Hiring Manager,",
          "I am excited to apply.",
          "My experience aligns well.",
          "Sincerely, Jane Doe",
          "Sincerely, Jane Doe",
        ],
      },
    });

    const deduped = dedupeProOutput(output);
    const greetings = deduped.coverLetter.paragraphs.filter((p) => /^dear/i.test(p.trim()));
    const signoffs = deduped.coverLetter.paragraphs.filter((p) => /^sincerely/i.test(p.trim()));
    expect(greetings.length).toBe(1);
    expect(signoffs.length).toBe(1);
  });
});

// ── Quality Gate Tests ──

describe("Quality Gate", () => {
  it("removes filler phrases from bullets", () => {
    const output = makeMockProOutput({
      tailoredResume: {
        ...makeMockProOutput().tailoredResume,
        experience: [
          {
            company: "TechCorp",
            title: "Engineer",
            period: "2020 – Present",
            bullets: [
              "Built dashboard in a fast-paced environment, resulting in measurable performance improvements.",
              "Led team leveraging best practices to deliver features.",
            ],
          },
        ],
      },
    });

    const { output: fixed, issues } = runQualityGate(output);
    const allBullets = fixed.tailoredResume.experience.flatMap((e) => e.bullets);

    for (const bullet of allBullets) {
      expect(bullet.toLowerCase()).not.toContain("fast-paced environment");
      expect(bullet.toLowerCase()).not.toContain("leveraging best practices");
      expect(bullet.toLowerCase()).not.toContain("resulting in measurable performance improvements");
    }
    expect(issues.length).toBeGreaterThan(0);
  });

  it("tracks all quality issues with autoFixed flags", () => {
    const { issues } = runQualityGate(makeMockProOutput());
    for (const issue of issues) {
      expect(issue).toHaveProperty("type");
      expect(issue).toHaveProperty("autoFixed");
      expect(issue).toHaveProperty("location");
    }
  });
});

// ── Integration: Full Pipeline ──

describe("Full Quality Pipeline", () => {
  it("Pro output never shows Weak Match after full pipeline", () => {
    const output = makeMockProOutput();
    const { output: gated } = runQualityGate(output);
    const { radarAfter } = ensureScoreImprovement(gated, mockCandidate, mockJob);

    expect(radarAfter.label).not.toBe("Weak match");
    expect(radarAfter.label).not.toBe("Weak Match");
    expect(["Strong Match", "Good Match", "Moderate Match"]).toContain(radarAfter.label);
  });

  it("no contradictions remain after full pipeline", () => {
    const output = makeMockProOutput({
      keywordChecklist: [
        { keyword: "TypeScript", found: false },
        { keyword: "React", found: false },
      ],
      recruiterFeedback: [
        "No TypeScript shown in resume",
        "Missing React from the candidate's experience",
      ],
    });

    const { output: gated } = runQualityGate(output);
    const { output: boosted } = ensureScoreImprovement(gated, mockCandidate, mockJob);

    // TypeScript and React should now be found (they're in the tailored resume)
    const tsItem = boosted.keywordChecklist.find((k) => k.keyword === "TypeScript");
    const reactItem = boosted.keywordChecklist.find((k) => k.keyword === "React");
    expect(tsItem?.found).toBe(true);
    expect(reactItem?.found).toBe(true);

    // Contradictory feedback should be removed
    for (const line of boosted.recruiterFeedback) {
      expect(line.toLowerCase()).not.toContain("no typescript shown");
    }
  });
});
