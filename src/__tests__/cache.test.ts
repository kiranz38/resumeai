import { describe, it, expect } from "vitest";
import { hashInputs, analysisCache } from "@/lib/cache";

describe("hashInputs", () => {
  it("should produce consistent hashes", () => {
    const a = hashInputs("resume text", "job description");
    const b = hashInputs("resume text", "job description");
    expect(a).toBe(b);
  });

  it("should produce different hashes for different inputs", () => {
    const a = hashInputs("resume A", "job A");
    const b = hashInputs("resume B", "job B");
    expect(a).not.toBe(b);
  });
});

describe("TTLCache (analysisCache)", () => {
  it("should store and retrieve values", () => {
    const key = `test-${Date.now()}`;
    analysisCache.set(key, { score: 85 });
    expect(analysisCache.get(key)).toEqual({ score: 85 });
  });

  it("should return undefined for missing keys", () => {
    expect(analysisCache.get("nonexistent-key")).toBeUndefined();
  });

  it("should support has()", () => {
    const key = `test-has-${Date.now()}`;
    expect(analysisCache.has(key)).toBe(false);
    analysisCache.set(key, "value");
    expect(analysisCache.has(key)).toBe(true);
  });

  it("should support delete()", () => {
    const key = `test-del-${Date.now()}`;
    analysisCache.set(key, "value");
    analysisCache.delete(key);
    expect(analysisCache.has(key)).toBe(false);
  });
});
