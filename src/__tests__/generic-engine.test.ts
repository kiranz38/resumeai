import { describe, it, expect } from "vitest";
import { classifyJobFamily, familyToStrategyKey, getStrategy, getStrategyByKey, analyzeBullet, analyzeAllBullets } from "@/lib/domain";
import type { JobFamily, BulletSignals, RewriteStrategy } from "@/lib/domain";
import { validateJD } from "@/lib/jd-validator";
import { generateMockProResult } from "@/lib/mock-llm";
import { runQualityGate } from "@/lib/quality-gate";
import { BANNED_PHRASES, PROMPT_VERSION } from "@/lib/llm/prompts";
import type { CandidateProfile, JobProfile } from "@/lib/types";

// ══════════════════════════════════════════════
// Test fixtures — one per job family
// ══════════════════════════════════════════════

const engineeringCandidate: CandidateProfile = {
  name: "Jane Doe",
  headline: "Senior Software Engineer",
  skills: ["JavaScript", "React", "Node.js", "PostgreSQL", "Docker"],
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
  ],
  education: [{ school: "MIT", degree: "BS Computer Science" }],
  projects: [],
};

const engineeringJob: JobProfile = {
  title: "Senior Software Engineer",
  company: "BigTech",
  requiredSkills: ["TypeScript", "React", "Node.js", "AWS"],
  preferredSkills: ["Docker", "Kubernetes"],
  responsibilities: ["Build scalable web applications", "Mentor junior engineers"],
  keywords: ["TypeScript", "React", "API", "microservices", "agile"],
};

const salesCandidate: CandidateProfile = {
  name: "Mike Sales",
  headline: "Account Executive",
  skills: ["Salesforce", "CRM", "Cold calling", "Negotiation", "Pipeline management"],
  experience: [
    {
      title: "Account Executive",
      company: "SalesOrg",
      start: "2019",
      end: "Present",
      bullets: [
        "Closed $2M in annual revenue across 45 accounts",
        "Exceeded quarterly quota by 120% for 6 consecutive quarters",
        "Managed pipeline of $5M in opportunities",
      ],
    },
  ],
  education: [{ school: "State University", degree: "BBA Marketing" }],
  projects: [],
};

const salesJob: JobProfile = {
  title: "Senior Account Executive",
  company: "SaaS Corp",
  requiredSkills: ["B2B sales", "Salesforce", "Pipeline management"],
  preferredSkills: ["HubSpot", "Account-based selling"],
  responsibilities: ["Drive new business revenue", "Build client relationships"],
  keywords: ["quota", "pipeline", "revenue", "SaaS", "enterprise"],
};

const marketingCandidate: CandidateProfile = {
  name: "Sarah Marketing",
  headline: "Growth Marketing Manager",
  skills: ["Google Analytics", "SEO", "Content strategy", "Email marketing", "A/B testing"],
  experience: [
    {
      title: "Growth Marketing Manager",
      company: "BrandCo",
      start: "2018",
      end: "Present",
      bullets: [
        "Launched demand generation campaigns increasing MQLs by 150%",
        "Managed $500K annual advertising budget across paid channels",
        "Improved email open rates by 35% through segmentation",
      ],
    },
  ],
  education: [{ school: "Marketing University", degree: "BS Marketing" }],
  projects: [],
};

const marketingJob: JobProfile = {
  title: "Director of Marketing",
  company: "GrowthCo",
  requiredSkills: ["Digital marketing", "Content strategy", "Analytics"],
  preferredSkills: ["HubSpot", "Marketo"],
  responsibilities: ["Lead demand generation", "Manage marketing budget"],
  keywords: ["SEO", "campaign", "CTR", "conversion", "brand", "growth"],
};

const financeCandidate: CandidateProfile = {
  name: "Bob Finance",
  headline: "Financial Analyst",
  skills: ["Excel", "Financial modeling", "SQL", "Tableau", "GAAP"],
  experience: [
    {
      title: "Financial Analyst",
      company: "FinanceCorp",
      start: "2019",
      end: "Present",
      bullets: [
        "Prepared quarterly financial forecasts with 95% accuracy",
        "Analyzed $50M portfolio for variance and risk exposure",
        "Automated monthly reporting reducing close cycle by 3 days",
      ],
    },
  ],
  education: [{ school: "Business School", degree: "MBA Finance" }],
  projects: [],
};

const financeJob: JobProfile = {
  title: "Senior Financial Analyst",
  company: "InvestCo",
  requiredSkills: ["Financial modeling", "Excel", "GAAP", "Variance analysis"],
  preferredSkills: ["Tableau", "Power BI"],
  responsibilities: ["Prepare financial forecasts", "Support month-end close"],
  keywords: ["forecast", "budget", "P&L", "variance", "compliance", "audit"],
};

const businessCandidate: CandidateProfile = {
  name: "Lisa Ops",
  headline: "Operations Manager",
  skills: ["Process improvement", "Lean", "Six Sigma", "SAP", "Vendor management"],
  experience: [
    {
      title: "Operations Manager",
      company: "LogisticsCo",
      start: "2017",
      end: "Present",
      bullets: [
        "Managed supply chain operations for 3 distribution centers",
        "Reduced cycle time by 25% through lean process improvements",
        "Led vendor negotiations saving $200K annually",
      ],
    },
  ],
  education: [{ school: "University", degree: "BS Industrial Engineering" }],
  projects: [],
};

const businessJob: JobProfile = {
  title: "Director of Operations",
  company: "MegaCorp",
  requiredSkills: ["Operations management", "Process improvement", "ERP"],
  preferredSkills: ["Six Sigma", "Lean"],
  responsibilities: ["Oversee daily operations", "Optimize supply chain"],
  keywords: ["operations", "supply chain", "logistics", "SLA", "efficiency"],
};

// ══════════════════════════════════════════════
// A) JobFamilyClassifier
// ══════════════════════════════════════════════

describe("JobFamilyClassifier", () => {
  it("classifies engineering roles correctly", () => {
    const result = classifyJobFamily(engineeringCandidate, engineeringJob);
    expect(result.family).toBe("engineering");
    expect(result.confidence).toBeGreaterThan(0.4);
  });

  it("classifies sales roles correctly", () => {
    const result = classifyJobFamily(salesCandidate, salesJob);
    expect(result.family).toBe("sales");
    expect(result.confidence).toBeGreaterThan(0.4);
  });

  it("classifies marketing roles correctly", () => {
    const result = classifyJobFamily(marketingCandidate, marketingJob);
    expect(result.family).toBe("marketing");
    expect(result.confidence).toBeGreaterThan(0.4);
  });

  it("classifies finance roles correctly", () => {
    const result = classifyJobFamily(financeCandidate, financeJob);
    expect(result.family).toBe("finance");
    expect(result.confidence).toBeGreaterThan(0.4);
  });

  it("classifies operations roles correctly", () => {
    const result = classifyJobFamily(businessCandidate, businessJob);
    expect(["operations", "general"]).toContain(result.family);
  });

  it("returns general for empty/ambiguous inputs", () => {
    const empty: CandidateProfile = {
      name: "Test",
      skills: [],
      experience: [],
      education: [],
      projects: [],
    };
    const emptyJob: JobProfile = {
      requiredSkills: [],
      preferredSkills: [],
      responsibilities: [],
      keywords: [],
    };
    const result = classifyJobFamily(empty, emptyJob);
    expect(result.family).toBe("general");
  });
});

// ══════════════════════════════════════════════
// B) Strategy mapping
// ══════════════════════════════════════════════

describe("familyToStrategyKey", () => {
  it("maps engineering to engineering", () => {
    expect(familyToStrategyKey("engineering")).toBe("engineering");
  });

  it("maps product to business", () => {
    expect(familyToStrategyKey("product")).toBe("business");
  });

  it("maps sales to sales", () => {
    expect(familyToStrategyKey("sales")).toBe("sales");
  });

  it("maps marketing to marketing", () => {
    expect(familyToStrategyKey("marketing")).toBe("marketing");
  });

  it("maps finance to finance", () => {
    expect(familyToStrategyKey("finance")).toBe("finance");
  });

  it("maps operations/healthcare/education/general to business", () => {
    expect(familyToStrategyKey("operations")).toBe("business");
    expect(familyToStrategyKey("healthcare")).toBe("business");
    expect(familyToStrategyKey("education")).toBe("business");
    expect(familyToStrategyKey("general")).toBe("business");
  });
});

// ══════════════════════════════════════════════
// C) Bullet Analyzer
// ══════════════════════════════════════════════

describe("BulletAnalyzer", () => {
  it("detects strong action verbs", () => {
    const signals = analyzeBullet("Led development of a customer portal serving 50K users");
    expect(signals.hasActionVerb).toBe(true);
    expect(signals.actionVerb).toBe("led");
    expect(signals.isVague).toBe(false);
  });

  it("detects weak verb patterns", () => {
    const signals = analyzeBullet("Responsible for managing team operations");
    expect(signals.isVague).toBe(true);
  });

  it("detects percentage metrics", () => {
    const signals = analyzeBullet("Improved response time by 40%");
    expect(signals.hasMetric).toBe(true);
    expect(signals.metricType).toBe("percentage");
  });

  it("detects currency metrics", () => {
    const signals = analyzeBullet("Managed $2M annual budget");
    expect(signals.hasMetric).toBe(true);
    expect(signals.metricType).toBe("currency");
  });

  it("detects dangling endings", () => {
    const signals = analyzeBullet("Built API endpoints, resulting in");
    expect(signals.hasDanglingEnding).toBe(true);
  });

  it("detects scope nouns", () => {
    const signals = analyzeBullet("Led a cross-functional project to revamp the customer platform");
    expect(signals.hasScopeNoun).toBe(true);
    expect(signals.scopeNouns).toContain("project");
    expect(signals.scopeNouns).toContain("platform");
  });

  it("detects too-long bullets", () => {
    const long = "A".repeat(160);
    expect(analyzeBullet(long).isTooLong).toBe(true);
  });

  it("detects too-short bullets", () => {
    expect(analyzeBullet("Did stuff").isTooShort).toBe(true);
  });

  it("analyzeAllBullets processes arrays", () => {
    const results = analyzeAllBullets(["Led a team", "Responsible for testing"]);
    expect(results).toHaveLength(2);
    expect(results[0].hasActionVerb).toBe(true);
    expect(results[1].isVague).toBe(true);
  });
});

// ══════════════════════════════════════════════
// D) Strategy rewrite behavior per family
// ══════════════════════════════════════════════

describe("Strategy rewriting", () => {
  it("engineering strategy uses engineering verb replacements", () => {
    const strategy = getStrategyByKey("engineering");
    const bullet = "Responsible for building APIs";
    const signals = analyzeBullet(bullet);
    const rewritten = strategy.rewriteBullet(bullet, signals);
    expect(rewritten).not.toContain("Responsible for");
    expect(rewritten).toMatch(/^[A-Z]/);
  });

  it("sales strategy uses sales verb replacements", () => {
    const strategy = getStrategyByKey("sales");
    const bullet = "Managed the enterprise territory";
    const signals = analyzeBullet(bullet);
    const rewritten = strategy.rewriteBullet(bullet, signals);
    expect(rewritten).toContain("Owned and grew");
  });

  it("marketing strategy uses marketing verb replacements", () => {
    const strategy = getStrategyByKey("marketing");
    const bullet = "Created content for social media campaigns";
    const signals = analyzeBullet(bullet);
    const rewritten = strategy.rewriteBullet(bullet, signals);
    expect(rewritten).toContain("Produced");
  });

  it("finance strategy uses finance verb replacements", () => {
    const strategy = getStrategyByKey("finance");
    const bullet = "Managed the monthly reporting process";
    const signals = analyzeBullet(bullet);
    const rewritten = strategy.rewriteBullet(bullet, signals);
    expect(rewritten).toContain("Oversaw");
  });

  it("business strategy uses business verb replacements", () => {
    const strategy = getStrategyByKey("business");
    const bullet = "Created the vendor evaluation process";
    const signals = analyzeBullet(bullet);
    const rewritten = strategy.rewriteBullet(bullet, signals);
    expect(rewritten).toContain("Established");
  });

  it("all strategies produce complete sentences ending in period", () => {
    const keys = ["engineering", "business", "sales", "marketing", "finance"] as const;
    for (const key of keys) {
      const strategy = getStrategyByKey(key);
      const bullet = "Worked on various tasks";
      const signals = analyzeBullet(bullet);
      const rewritten = strategy.rewriteBullet(bullet, signals);
      expect(rewritten).toMatch(/\.$/);
    }
  });

  it("all strategies generate cover letters with 4 paragraphs", () => {
    const keys = ["engineering", "business", "sales", "marketing", "finance"] as const;
    for (const key of keys) {
      const strategy = getStrategyByKey(key);
      const paragraphs = strategy.draftCoverLetter({
        name: "Test User",
        title: "Manager",
        company: "TestCo",
        topSkills: "Skill1, Skill2",
        recentRole: "Previous Role at PrevCo",
        topBullet: "Led a cross-functional initiative.",
        years: 5,
        responsibilities: ["Manage team operations"],
        family: strategy.family,
      });
      expect(paragraphs.length).toBe(4);
      expect(paragraphs[0]).toContain("Dear");
    }
  });

  it("all strategies generate summaries mentioning skills", () => {
    const keys = ["engineering", "business", "sales", "marketing", "finance"] as const;
    for (const key of keys) {
      const strategy = getStrategyByKey(key);
      const summary = strategy.draftSummary({
        headline: "Senior Professional",
        years: 5,
        skills: ["Leadership", "Strategy", "Analytics"],
        jobTitle: "Director",
        company: "TestCo",
        family: strategy.family,
      });
      expect(summary).toContain("Leadership");
      expect(summary.length).toBeGreaterThan(50);
    }
  });
});

// ══════════════════════════════════════════════
// E) JD Validator
// ══════════════════════════════════════════════

describe("JD Validator", () => {
  it("rejects empty JD", () => {
    const result = validateJD("");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("empty");
  });

  it("rejects gibberish (repeated chars)", () => {
    const result = validateJD("aaaaaaaaaaaaa bbbbbbbbbbbbb");
    expect(result.valid).toBe(false);
  });

  it("rejects lorem ipsum", () => {
    const result = validateJD("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This is a really long placeholder text that should be caught by the validator and rejected as invalid input for our resume engine.");
    expect(result.valid).toBe(false);
  });

  it("accepts valid JD with structure", () => {
    const result = validateJD(
      "Software Engineer at BigCo. Requirements: 3+ years experience, TypeScript, React, Node.js. Responsibilities: Build scalable web applications, collaborate with product team."
    );
    expect(result.valid).toBe(true);
  });

  it("warns on short JD with structure", () => {
    const result = validateJD("Requirements: TypeScript, React, Node.js experience required.");
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("rejects short JD without structure", () => {
    const result = validateJD("We need someone good at things and stuff for our cool team.");
    expect(result.valid).toBe(false);
  });
});

// ══════════════════════════════════════════════
// F) Mock LLM across 5 families
// ══════════════════════════════════════════════

describe("Mock LLM: Engineering family", () => {
  const output = generateMockProResult(engineeringCandidate, engineeringJob, "resume text");

  it("produces valid ProOutput structure", () => {
    expect(output.summary).toBeTruthy();
    expect(output.tailoredResume).toBeTruthy();
    expect(output.coverLetter.paragraphs.length).toBeGreaterThanOrEqual(3);
    expect(output.radar).toBeTruthy();
  });

  it("uses engineering-appropriate skill labels", () => {
    const categories = output.tailoredResume.skills.map((g) => g.category);
    expect(categories.some((c) => /technical|tools/i.test(c))).toBe(true);
  });

  it("radar scores are valid integers 0-100", () => {
    expect(output.radar!.overall).toBeGreaterThanOrEqual(0);
    expect(output.radar!.overall).toBeLessThanOrEqual(100);
    expect(output.radar!.skillsMatch).toBeGreaterThanOrEqual(0);
    expect(output.radar!.skillsMatch).toBeLessThanOrEqual(100);
  });
});

describe("Mock LLM: Sales family", () => {
  const output = generateMockProResult(salesCandidate, salesJob, "resume text");

  it("produces valid ProOutput structure", () => {
    expect(output.summary).toBeTruthy();
    expect(output.tailoredResume.experience.length).toBeGreaterThan(0);
    expect(output.coverLetter.paragraphs.length).toBeGreaterThanOrEqual(3);
  });

  it("uses sales-appropriate skill labels", () => {
    const categories = output.tailoredResume.skills.map((g) => g.category);
    expect(categories.some((c) => /sales|business|core/i.test(c))).toBe(true);
  });
});

describe("Mock LLM: Marketing family", () => {
  const output = generateMockProResult(marketingCandidate, marketingJob, "resume text");

  it("produces valid ProOutput structure", () => {
    expect(output.summary).toBeTruthy();
    expect(output.coverLetter.paragraphs.length).toBeGreaterThanOrEqual(3);
  });

  it("uses marketing-appropriate skill labels", () => {
    const categories = output.tailoredResume.skills.map((g) => g.category);
    expect(categories.some((c) => /marketing|tools|platform/i.test(c))).toBe(true);
  });
});

describe("Mock LLM: Finance family", () => {
  const output = generateMockProResult(financeCandidate, financeJob, "resume text");

  it("produces valid ProOutput structure", () => {
    expect(output.summary).toBeTruthy();
    expect(output.coverLetter.paragraphs.length).toBeGreaterThanOrEqual(3);
  });

  it("uses finance-appropriate skill labels", () => {
    const categories = output.tailoredResume.skills.map((g) => g.category);
    expect(categories.some((c) => /financial|tools|compliance|core/i.test(c))).toBe(true);
  });
});

describe("Mock LLM: Business/Operations family", () => {
  const output = generateMockProResult(businessCandidate, businessJob, "resume text");

  it("produces valid ProOutput structure", () => {
    expect(output.summary).toBeTruthy();
    expect(output.coverLetter.paragraphs.length).toBeGreaterThanOrEqual(3);
  });

  it("uses business-appropriate skill labels", () => {
    const categories = output.tailoredResume.skills.map((g) => g.category);
    expect(categories.some((c) => /core|competencies|additional/i.test(c))).toBe(true);
  });
});

// ══════════════════════════════════════════════
// G) No-injection enforcement
// ══════════════════════════════════════════════

describe("No-injection enforcement", () => {
  it("mock output skills only contain candidate skills and JD terms", () => {
    const families = [
      { candidate: engineeringCandidate, job: engineeringJob },
      { candidate: salesCandidate, job: salesJob },
      { candidate: marketingCandidate, job: marketingJob },
      { candidate: financeCandidate, job: financeJob },
      { candidate: businessCandidate, job: businessJob },
    ];

    for (const { candidate, job } of families) {
      const output = generateMockProResult(candidate, job, "text");
      const allSkillItems = output.tailoredResume.skills.flatMap((g) => g.items);

      const allowedSet = new Set([
        ...candidate.skills.map((s) => s.toLowerCase()),
        ...job.requiredSkills.map((s) => s.toLowerCase()),
        ...job.preferredSkills.map((s) => s.toLowerCase()),
        ...job.keywords.map((s) => s.toLowerCase()),
      ]);

      for (const item of allSkillItems) {
        const lower = item.toLowerCase();
        const isAllowed =
          allowedSet.has(lower) ||
          [...allowedSet].some((t) => lower.includes(t) || t.includes(lower));
        expect(isAllowed).toBe(true);
      }
    }
  });
});

// ══════════════════════════════════════════════
// H) Quality gate on all families
// ══════════════════════════════════════════════

describe("Quality gate across families", () => {
  const families = [
    { name: "engineering", candidate: engineeringCandidate, job: engineeringJob },
    { name: "sales", candidate: salesCandidate, job: salesJob },
    { name: "marketing", candidate: marketingCandidate, job: marketingJob },
    { name: "finance", candidate: financeCandidate, job: financeJob },
    { name: "business", candidate: businessCandidate, job: businessJob },
  ];

  for (const { name, candidate, job } of families) {
    it(`${name}: quality gate produces no critical issues`, () => {
      const output = generateMockProResult(candidate, job, "text");
      const { issues } = runQualityGate(output);

      // No banned phrases should remain
      const bannedIssues = issues.filter((i) => i.type === "banned_phrase" && !i.autoFixed);
      expect(bannedIssues).toHaveLength(0);
    });

    it(`${name}: output contains no banned filler phrases`, () => {
      const output = generateMockProResult(candidate, job, "text");
      const { output: gated } = runQualityGate(output);

      const allText = [
        gated.summary,
        gated.tailoredResume.summary,
        ...gated.tailoredResume.experience.flatMap((e) => e.bullets),
        ...gated.coverLetter.paragraphs,
      ].join(" ");

      for (const phrase of BANNED_PHRASES) {
        expect(allText.toLowerCase()).not.toContain(phrase.toLowerCase());
      }
    });
  }
});

// ══════════════════════════════════════════════
// I) Prompt version
// ══════════════════════════════════════════════

describe("Prompt version", () => {
  it("is generic-western-v1", () => {
    expect(PROMPT_VERSION).toBe("generic-western-v1");
  });
});
