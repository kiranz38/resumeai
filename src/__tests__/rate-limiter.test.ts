import { describe, it, expect } from "vitest";
import { checkRateLimit, type RouteBudget } from "@/lib/rate-limiter";

const testBudget: RouteBudget = {
  capacity: 5,
  refillRate: 0.08,
  windowMs: 60_000,
  windowMax: 5,
};

describe("Rate Limiter", () => {
  it("should allow requests within the limit", () => {
    const id = `test-${Date.now()}-${Math.random()}`;
    const result = checkRateLimit(id, testBudget);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("should block requests over the limit", () => {
    const id = `test-block-${Date.now()}-${Math.random()}`;
    const budget: RouteBudget = { capacity: 3, refillRate: 0.05, windowMs: 60_000, windowMax: 3 };

    checkRateLimit(id, budget); // 1
    checkRateLimit(id, budget); // 2
    checkRateLimit(id, budget); // 3

    const result = checkRateLimit(id, budget); // 4 - should be blocked
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should track remaining count decreasing", () => {
    const id = `test-count-${Date.now()}-${Math.random()}`;

    const r1 = checkRateLimit(id, testBudget);
    const r2 = checkRateLimit(id, testBudget);
    const r3 = checkRateLimit(id, testBudget);

    expect(r1.remaining).toBeGreaterThan(r2.remaining);
    expect(r2.remaining).toBeGreaterThan(r3.remaining);
  });

  it("should return retryAfterMs when blocked", () => {
    const id = `test-retry-${Date.now()}-${Math.random()}`;
    const budget: RouteBudget = { capacity: 1, refillRate: 0.01, windowMs: 60_000, windowMax: 1 };

    checkRateLimit(id, budget); // consume the one token

    const result = checkRateLimit(id, budget);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });
});
