/**
 * Unified rate limiter with token bucket + sliding window,
 * per-route budgets, concurrency guard, and bot friction.
 */

// ── Token Bucket ──

interface Bucket {
  tokens: number;
  lastRefill: number;
}

interface SlidingWindowEntry {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();
const windows = new Map<string, SlidingWindowEntry>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, bucket] of buckets) {
    // Remove buckets idle for > 5 minutes
    if (now - bucket.lastRefill > 300_000) {
      buckets.delete(key);
    }
  }
  for (const [key, entry] of windows) {
    // Prune old timestamps
    entry.timestamps = entry.timestamps.filter((t) => now - t < 300_000);
    if (entry.timestamps.length === 0) {
      windows.delete(key);
    }
  }
}

export interface RouteBudget {
  /** Max tokens in the bucket (burst capacity) */
  capacity: number;
  /** Tokens added per second */
  refillRate: number;
  /** Sliding window size in ms for hard cap */
  windowMs: number;
  /** Max requests in the sliding window */
  windowMax: number;
}

/** Pre-defined budgets per route */
export const ROUTE_BUDGETS: Record<string, RouteBudget> = {
  analyze: { capacity: 20, refillRate: 0.33, windowMs: 60_000, windowMax: 20 },
  "generate-pro": { capacity: 5, refillRate: 0.08, windowMs: 60_000, windowMax: 5 },
  checkout: { capacity: 5, refillRate: 0.08, windowMs: 60_000, windowMax: 5 },
  "email-pro": { capacity: 3, refillRate: 0.05, windowMs: 60_000, windowMax: 3 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Unified rate-limit check combining token bucket (smooth) + sliding window (hard cap).
 * @param identifier  Unique key, typically `${route}:${ip}`
 * @param budget      Route-specific budget config
 */
export function checkRateLimit(
  identifier: string,
  budget: RouteBudget
): RateLimitResult {
  cleanup();
  const now = Date.now();

  // ── Token bucket ──
  let bucket = buckets.get(identifier);
  if (!bucket) {
    bucket = { tokens: budget.capacity, lastRefill: now };
    buckets.set(identifier, bucket);
  }

  // Refill tokens
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(budget.capacity, bucket.tokens + elapsed * budget.refillRate);
  bucket.lastRefill = now;

  // ── Sliding window ──
  let window = windows.get(identifier);
  if (!window) {
    window = { timestamps: [] };
    windows.set(identifier, window);
  }
  // Prune timestamps outside current window
  window.timestamps = window.timestamps.filter((t) => now - t < budget.windowMs);

  // Check sliding window hard cap
  if (window.timestamps.length >= budget.windowMax) {
    const oldest = window.timestamps[0];
    const retryAfterMs = oldest + budget.windowMs - now;
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  // Check token bucket
  if (bucket.tokens < 1) {
    const retryAfterMs = Math.ceil((1 - bucket.tokens) / budget.refillRate) * 1000;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  // Consume
  bucket.tokens -= 1;
  window.timestamps.push(now);

  return {
    allowed: true,
    remaining: Math.floor(bucket.tokens),
    retryAfterMs: 0,
  };
}

// ── Concurrency Guard for LLM calls ──

let activeLLMCalls = 0;
const MAX_CONCURRENT_LLM = 3;

export function acquireLLMSlot(): boolean {
  if (activeLLMCalls >= MAX_CONCURRENT_LLM) return false;
  activeLLMCalls++;
  return true;
}

export function releaseLLMSlot(): void {
  activeLLMCalls = Math.max(0, activeLLMCalls - 1);
}

// ── Bot friction: add delay for suspicious request patterns ──

const recentRequestCounts = new Map<string, { count: number; windowStart: number }>();

/**
 * Returns ms of delay to impose on this request. 0 means no friction.
 * Detects rapid successive requests (>10 in 10s) as potential bot behavior.
 */
export function botFriction(ip: string): number {
  const now = Date.now();
  const entry = recentRequestCounts.get(ip);

  if (!entry || now - entry.windowStart > 10_000) {
    recentRequestCounts.set(ip, { count: 1, windowStart: now });
    return 0;
  }

  entry.count++;

  // >10 requests in 10s → progressive delay
  if (entry.count > 10) {
    return Math.min(2000, (entry.count - 10) * 200);
  }
  return 0;
}

// ── Helpers ──

/**
 * Get the client IP from request headers.
 * Validates format to prevent header injection.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    return isValidIPish(ip) ? ip : "unknown";
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return isValidIPish(realIP) ? realIP : "unknown";
  }
  return "unknown";
}

/** Basic IP format validation (IPv4 or IPv6-like, no weird chars) */
function isValidIPish(ip: string): boolean {
  return /^[\d.:a-fA-F]+$/.test(ip) && ip.length <= 45;
}

/**
 * Convenience: rate limit an API route by IP.
 * Returns a 429 Response if blocked, or null if allowed.
 */
export function rateLimitRoute(
  request: Request,
  routeName: string
): { response: Response; result: RateLimitResult } | { response: null; result: RateLimitResult } {
  const ip = getClientIP(request);
  const budget = ROUTE_BUDGETS[routeName];
  if (!budget) throw new Error(`Unknown route budget: ${routeName}`);

  const result = checkRateLimit(`${routeName}:${ip}`, budget);

  if (!result.allowed) {
    const headers: Record<string, string> = {
      "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
      "X-RateLimit-Remaining": "0",
    };
    return {
      response: new Response(
        JSON.stringify({ error: "Too many requests. Please wait and try again." }),
        { status: 429, headers: { "Content-Type": "application/json", ...headers } }
      ),
      result,
    };
  }

  return { response: null, result };
}
