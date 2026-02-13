import { describe, it, expect } from "vitest";
import { parseJobDescription } from "@/lib/jd-parser";
import { DEMO_JD_TEXT } from "@/lib/demo-data";

describe("JD Parser", () => {
  it("should parse the demo JD correctly", () => {
    const result = parseJobDescription(DEMO_JD_TEXT);

    expect(result.title).toBeTruthy();
    expect(result.keywords.length).toBeGreaterThan(0);
  });

  it("should extract job title", () => {
    const result = parseJobDescription(DEMO_JD_TEXT);
    expect(result.title).toContain("Senior");
  });

  it("should extract company name", () => {
    const result = parseJobDescription(DEMO_JD_TEXT);
    expect(result.company).toBeTruthy();
  });

  it("should extract required skills", () => {
    const result = parseJobDescription(DEMO_JD_TEXT);
    expect(result.requiredSkills.length).toBeGreaterThan(0);
  });

  it("should extract preferred skills", () => {
    const result = parseJobDescription(DEMO_JD_TEXT);
    expect(result.preferredSkills.length).toBeGreaterThan(0);
  });

  it("should extract keywords", () => {
    const result = parseJobDescription(DEMO_JD_TEXT);
    const keywordsLower = result.keywords.map((k) => k.toLowerCase());
    expect(keywordsLower).toContain("typescript");
    expect(keywordsLower).toContain("react");
  });

  it("should detect seniority level", () => {
    const result = parseJobDescription(DEMO_JD_TEXT);
    expect(result.seniorityLevel).toBe("Senior");
  });

  it("should handle empty input gracefully", () => {
    const result = parseJobDescription("");
    expect(result.requiredSkills).toEqual([]);
    expect(result.preferredSkills).toEqual([]);
    expect(result.keywords).toEqual([]);
  });

  it("should handle minimal input", () => {
    const result = parseJobDescription("Software Engineer at Google\nRequirements:\n- 3+ years JavaScript\n- React experience");
    expect(result.requiredSkills.length).toBeGreaterThan(0);
    expect(result.keywords.length).toBeGreaterThan(0);
  });
});
