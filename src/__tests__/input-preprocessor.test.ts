import { describe, it, expect } from "vitest";
import {
  normalizeText,
  smartTruncate,
  extractResumeSections,
  preprocessResume,
} from "@/lib/input-preprocessor";

describe("normalizeText", () => {
  it("should remove null bytes", () => {
    expect(normalizeText("hello\0world")).toBe("helloworld");
  });

  it("should normalize line endings", () => {
    expect(normalizeText("hello\r\nworld\rfoo")).toBe("hello\nworld\nfoo");
  });

  it("should collapse whitespace", () => {
    expect(normalizeText("hello   world")).toBe("hello world");
  });
});

describe("smartTruncate", () => {
  it("should return text unchanged if under limit", () => {
    expect(smartTruncate("short text", 100)).toBe("short text");
  });

  it("should truncate at paragraph boundary when possible", () => {
    const text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph that is long.";
    const result = smartTruncate(text, 40);
    expect(result).toContain("First paragraph.");
    expect(result.length).toBeLessThanOrEqual(40);
  });

  it("should truncate at sentence boundary when possible", () => {
    const text = "First sentence. Second sentence. Third sentence is much longer than the limit.";
    const result = smartTruncate(text, 50);
    // Should cut at a reasonable boundary
    expect(result.length).toBeLessThanOrEqual(50);
  });
});

describe("extractResumeSections", () => {
  it("should extract named sections from resume text", () => {
    const text = `John Doe
Software Engineer

Experience
- Worked at Company A
- Built stuff

Skills
JavaScript, TypeScript, React

Education
BS Computer Science`;

    const { sections } = extractResumeSections(text);
    expect(sections.has("experience")).toBe(true);
    expect(sections.has("skills")).toBe(true);
    expect(sections.has("education")).toBe(true);
  });
});

describe("preprocessResume", () => {
  it("should normalize and truncate", () => {
    const text = "hello\0world\r\n" + "x".repeat(60000);
    const result = preprocessResume(text, 50000);
    expect(result.length).toBeLessThanOrEqual(50000);
    expect(result).not.toContain("\0");
  });
});
