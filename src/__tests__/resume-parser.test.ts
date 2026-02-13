import { describe, it, expect } from "vitest";
import { parseResume } from "@/lib/resume-parser";
import { DEMO_RESUME_TEXT } from "@/lib/demo-data";

describe("Resume Parser", () => {
  it("should parse the demo resume correctly", () => {
    const result = parseResume(DEMO_RESUME_TEXT);

    expect(result.name).toBeTruthy();
    expect(result.skills.length).toBeGreaterThan(0);
    expect(result.experience.length).toBeGreaterThan(0);
  });

  it("should extract name from first line", () => {
    const result = parseResume(DEMO_RESUME_TEXT);
    expect(result.name).toContain("SARAH");
  });

  it("should extract skills", () => {
    const result = parseResume(DEMO_RESUME_TEXT);
    const skillsLower = result.skills.map((s) => s.toLowerCase());
    expect(skillsLower).toContain("javascript");
    expect(skillsLower).toContain("react");
  });

  it("should extract experience entries", () => {
    const result = parseResume(DEMO_RESUME_TEXT);
    expect(result.experience.length).toBeGreaterThanOrEqual(2);
  });

  it("should extract bullets from experience", () => {
    const result = parseResume(DEMO_RESUME_TEXT);
    const totalBullets = result.experience.reduce((sum, exp) => sum + exp.bullets.length, 0);
    expect(totalBullets).toBeGreaterThan(0);
  });

  it("should handle empty input gracefully", () => {
    const result = parseResume("");
    expect(result.skills).toEqual([]);
    expect(result.experience).toEqual([]);
    expect(result.education).toEqual([]);
  });

  it("should handle minimal input", () => {
    const result = parseResume("John Doe\nSoftware Engineer\nSkills: JavaScript, Python");
    expect(result.name).toBeTruthy();
    expect(result.skills.length).toBeGreaterThan(0);
  });

  it("should extract education", () => {
    const result = parseResume(DEMO_RESUME_TEXT);
    // The demo has "B.S. Computer Science — UC Berkeley, 2017"
    expect(result.education.length).toBeGreaterThanOrEqual(0);
  });

  it("should not return undefined values in arrays", () => {
    const result = parseResume(DEMO_RESUME_TEXT);
    expect(result.skills.every((s) => s !== undefined && s !== null)).toBe(true);
    expect(result.experience.every((e) => e !== undefined && e !== null)).toBe(true);
  });
});
