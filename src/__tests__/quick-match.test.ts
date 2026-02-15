import { describe, it, expect } from "vitest";
import { quickMatchScore, matchScoreDisplay, LOW_MATCH_THRESHOLD } from "@/lib/quick-match";

describe("quickMatchScore", () => {
  it("returns 0 for empty inputs", () => {
    expect(quickMatchScore("", "some job description")).toBe(0);
    expect(quickMatchScore("some resume", "")).toBe(0);
    expect(quickMatchScore("", "")).toBe(0);
  });

  it("returns 50 when JD has no significant words", () => {
    // All words are short (<3 chars) or stop words
    expect(quickMatchScore("anything", "the and for")).toBe(50);
  });

  // ── Word boundary matching ──

  it("does NOT match 'java' inside 'javascript' (word boundary)", () => {
    const resume = "I am proficient in javascript and typescript";
    const jd = "Looking for a java developer with spring boot experience";
    const score = quickMatchScore(resume, jd);
    // "java" should NOT match because "javascript" is a different token
    // Only "developer" might partially match — score should be low
    expect(score).toBeLessThan(50);
  });

  it("matches 'java' when resume contains 'java' as a standalone word", () => {
    const resume = "I am proficient in java and spring boot";
    const jd = "Looking for a java developer with spring boot experience";
    const score = quickMatchScore(resume, jd);
    // "java", "spring", "boot" all match → should be reasonably high
    expect(score).toBeGreaterThan(40);
  });

  it("does NOT match 'react' inside 'reactive'", () => {
    const resume = "Built reactive systems using RxJava and event-driven architecture";
    const jd = "Senior React developer needed for frontend work";
    const score = quickMatchScore(resume, jd);
    // "react" is NOT in resume as standalone token
    expect(score).toBeLessThan(50);
  });

  it("matches exact skill words", () => {
    const resume = "python sql docker kubernetes aws terraform";
    const jd = "Required: python, sql, docker, kubernetes, aws";
    const score = quickMatchScore(resume, jd);
    expect(score).toBeGreaterThan(70);
  });

  // ── Bigram (phrase) matching ──

  it("scores higher when compound phrases match", () => {
    const resume = "Experience with machine learning and data science projects";
    const jdWithPhrases = "Looking for machine learning and data science expertise";
    const jdWithoutPhrases = "Looking for machine and data expertise in learning science";

    const scoreWithPhrases = quickMatchScore(resume, jdWithPhrases);
    const scoreWithoutPhrases = quickMatchScore(resume, jdWithoutPhrases);

    // Both share the same individual words, but phrased JD should score
    // at least as high (bigram bonus)
    expect(scoreWithPhrases).toBeGreaterThanOrEqual(scoreWithoutPhrases);
  });

  it("handles hyphenated compound skills", () => {
    const resume = "full stack developer with react and node";
    const jd = "full stack developer react node";
    const score = quickMatchScore(resume, jd);
    expect(score).toBeGreaterThan(60);
  });

  // ── Edge cases ──

  it("handles single-word resume", () => {
    const resume = "python";
    const jd = "python developer needed for backend work";
    const score = quickMatchScore(resume, jd);
    expect(score).toBeGreaterThan(0);
  });

  it("is case insensitive", () => {
    const resume = "Python Django REST API";
    const jd = "python django rest api development";
    const score = quickMatchScore(resume, jd);
    expect(score).toBeGreaterThan(50);
  });

  it("handles special characters in text", () => {
    const resume = "C++ developer, .NET framework, node.js";
    const jd = "C++ and .NET experience required";
    // Should not crash
    const score = quickMatchScore(resume, jd);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns a score between 0 and 100", () => {
    const resume = "software engineer with 5 years of experience in python and javascript frameworks";
    const jd = "senior software engineer python javascript react node postgresql";
    const score = quickMatchScore(resume, jd);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("matchScoreDisplay", () => {
  it("returns Strong for score >= 70", () => {
    expect(matchScoreDisplay(70).label).toBe("Strong");
    expect(matchScoreDisplay(100).label).toBe("Strong");
  });

  it("returns Good for score 45-69", () => {
    expect(matchScoreDisplay(45).label).toBe("Good");
    expect(matchScoreDisplay(69).label).toBe("Good");
  });

  it("returns Fair for score 25-44", () => {
    expect(matchScoreDisplay(25).label).toBe("Fair");
    expect(matchScoreDisplay(44).label).toBe("Fair");
  });

  it("returns Low for score < 25", () => {
    expect(matchScoreDisplay(0).label).toBe("Low");
    expect(matchScoreDisplay(24).label).toBe("Low");
  });
});

describe("LOW_MATCH_THRESHOLD", () => {
  it("is 25", () => {
    expect(LOW_MATCH_THRESHOLD).toBe(25);
  });
});
