import { describe, it, expect } from "vitest";
import { sanitizeText, validatePayloadSize } from "@/lib/sanitizer";

describe("sanitizeText", () => {
  it("should strip null bytes", () => {
    expect(sanitizeText("hello\0world")).toBe("helloworld");
  });

  it("should strip control characters but keep newlines and tabs", () => {
    expect(sanitizeText("hello\x01\x02world\n\ttab")).toBe("helloworld\n tab");
  });

  it("should collapse whitespace runs", () => {
    expect(sanitizeText("hello    world")).toBe("hello world");
  });

  it("should collapse excessive newlines", () => {
    expect(sanitizeText("hello\n\n\n\n\nworld")).toBe("hello\n\nworld");
  });

  it("should trim leading/trailing whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("should handle empty string", () => {
    expect(sanitizeText("")).toBe("");
  });
});

describe("validatePayloadSize", () => {
  it("should return null for valid size", () => {
    expect(validatePayloadSize("small", "analyze")).toBeNull();
  });

  it("should return error for oversized payload", () => {
    const big = "x".repeat(300_000);
    const result = validatePayloadSize(big, "analyze");
    expect(result).toContain("too large");
  });

  it("should return null for unknown route", () => {
    expect(validatePayloadSize("anything", "unknown-route")).toBeNull();
  });
});
