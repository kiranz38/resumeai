import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limiter";

describe("Rate Limiter", () => {
  it("should allow requests within the limit", () => {
    const id = `test-${Date.now()}-${Math.random()}`;
    const result = checkRateLimit(id, { maxRequests: 5, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should block requests over the limit", () => {
    const id = `test-block-${Date.now()}-${Math.random()}`;
    const config = { maxRequests: 3, windowMs: 60_000 };

    checkRateLimit(id, config); // 1
    checkRateLimit(id, config); // 2
    checkRateLimit(id, config); // 3

    const result = checkRateLimit(id, config); // 4 - should be blocked
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should track remaining count correctly", () => {
    const id = `test-count-${Date.now()}-${Math.random()}`;
    const config = { maxRequests: 5, windowMs: 60_000 };

    const r1 = checkRateLimit(id, config);
    expect(r1.remaining).toBe(4);

    const r2 = checkRateLimit(id, config);
    expect(r2.remaining).toBe(3);

    const r3 = checkRateLimit(id, config);
    expect(r3.remaining).toBe(2);
  });

  it("should return a reset timestamp", () => {
    const id = `test-reset-${Date.now()}-${Math.random()}`;
    const result = checkRateLimit(id, { maxRequests: 5, windowMs: 60_000 });
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });
});
