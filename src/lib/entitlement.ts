/**
 * Entitlement system for Pro and Career Pass plans.
 *
 * Uses HMAC-signed JSON tokens (stored as httpOnly cookies in production,
 * or in sessionStorage in dev mode). Tokens carry:
 * - plan: "pro" | "pass"
 * - quotaRemaining: number of LLM jobs left
 * - expiresAt: unix ms
 * - issuedAt: unix ms
 * - id: stable hash of Stripe session ID
 *
 * No database required — all state lives in the token.
 * Quota is decremented by re-issuing the token after each successful generation.
 */

import { createHmac, createHash } from "crypto";

// ── Plan configs ──

export type Plan = "trial" | "pro" | "pass";

export interface PlanConfig {
  label: string;
  quotaTotal: number;
  ttlMs: number;
  /** Max LLM jobs per 10 minutes per entitlement */
  burstLimit: number;
  burstWindowMs: number;
}

export const PLAN_CONFIGS: Record<Plan, PlanConfig> = {
  trial: {
    label: "Career Trial",
    quotaTotal: 1,         // 1 generation, no regenerations
    ttlMs: 48 * 60 * 60 * 1000, // 48 hours
    burstLimit: 1,
    burstWindowMs: 10 * 60 * 1000,
  },
  pro: {
    label: "Pro (Single Job)",
    quotaTotal: 3,         // 1 generation + 2 regenerations
    ttlMs: 180 * 24 * 60 * 60 * 1000, // 180 days
    burstLimit: 3,
    burstWindowMs: 10 * 60 * 1000,    // 10 minutes
  },
  pass: {
    label: "Career Pass (30 days)",
    quotaTotal: 50,
    ttlMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    burstLimit: 3,
    burstWindowMs: 10 * 60 * 1000,
  },
};

// ── Token structure ──

export interface EntitlementClaims {
  plan: Plan;
  quotaRemaining: number;
  quotaTotal: number;
  expiresAt: number;
  issuedAt: number;
  id: string; // stable hash of Stripe session
}

// ── Secret management ──

function getSecret(): string {
  const secret = process.env.HMAC_SECRET || process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("No HMAC signing secret available (set HMAC_SECRET or STRIPE_SECRET_KEY).");
  return secret;
}

// ── Token operations ──

/**
 * Mint a new entitlement token for a completed payment.
 */
export function mintEntitlement(stripeSessionId: string, plan: Plan): string {
  const config = PLAN_CONFIGS[plan];
  const claims: EntitlementClaims = {
    plan,
    quotaRemaining: config.quotaTotal,
    quotaTotal: config.quotaTotal,
    expiresAt: Date.now() + config.ttlMs,
    issuedAt: Date.now(),
    id: createHash("sha256").update(stripeSessionId).digest("hex").slice(0, 16),
  };
  return signClaims(claims);
}

/**
 * Verify and decode an entitlement token.
 * Returns null if invalid, expired, or tampered.
 */
export function verifyEntitlement(token: string): EntitlementClaims | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, sig] = parts;
  const expectedSig = createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
  if (sig !== expectedSig) return null;

  try {
    const claims: EntitlementClaims = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (!claims.plan || !claims.expiresAt || claims.quotaRemaining === undefined) return null;
    if (Date.now() > claims.expiresAt) return null;
    return claims;
  } catch {
    return null;
  }
}

/**
 * Decrement quota and re-sign the token.
 * Returns the new token string, or null if quota is exhausted.
 */
export function decrementQuota(token: string): { newToken: string; claims: EntitlementClaims } | null {
  const claims = verifyEntitlement(token);
  if (!claims) return null;
  if (claims.quotaRemaining <= 0) return null;

  const updated: EntitlementClaims = {
    ...claims,
    quotaRemaining: claims.quotaRemaining - 1,
  };
  return { newToken: signClaims(updated), claims: updated };
}

/**
 * Upgrade a Pro token to a Career Pass.
 * Mints a fresh pass token (doesn't carry over pro quota).
 */
export function upgradeToPass(stripeSessionId: string): string {
  return mintEntitlement(stripeSessionId, "pass");
}

// ── Internal helpers ──

function signClaims(claims: EntitlementClaims): string {
  const payloadB64 = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

// ── Per-entitlement burst rate limiting ──

const burstWindows = new Map<string, number[]>();

/**
 * Check per-entitlement burst rate limit (3 jobs per 10 min).
 * Returns true if allowed.
 */
export function checkEntitlementBurst(entitlementId: string, plan: Plan): boolean {
  const config = PLAN_CONFIGS[plan];
  const now = Date.now();
  const timestamps = burstWindows.get(entitlementId) || [];
  const recent = timestamps.filter((t) => now - t < config.burstWindowMs);

  if (recent.length >= config.burstLimit) return false;

  recent.push(now);
  burstWindows.set(entitlementId, recent);
  return true;
}

// ── Idempotency store for processed Stripe sessions ──

const processedSessions = new Map<string, number>();
const SESSION_STORE_TTL = 48 * 60 * 60 * 1000;

export function markSessionProcessed(sessionId: string): boolean {
  cleanupSessions();
  if (processedSessions.has(sessionId)) return false;
  processedSessions.set(sessionId, Date.now());
  return true;
}

export function isSessionProcessed(sessionId: string): boolean {
  return processedSessions.has(sessionId);
}

function cleanupSessions() {
  const now = Date.now();
  for (const [id, ts] of processedSessions) {
    if (now - ts > SESSION_STORE_TTL) processedSessions.delete(id);
  }
}

// ── Trial abuse prevention (device + IP binding) ──

const trialDeviceMap = new Map<string, number>(); // deviceHash → timestamp
const TRIAL_DEVICE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

/**
 * Generate a stable device fingerprint hash from deviceId + IP.
 * Used to enforce one-trial-per-device/IP policy.
 */
export function hashDeviceFingerprint(deviceId: string, ip: string): string {
  return createHash("sha256").update(`${deviceId}|${ip}`).digest("hex").slice(0, 24);
}

/**
 * Check if a trial has already been used for this device+IP combo.
 * Returns true if allowed (no previous trial), false if blocked.
 */
export function canPurchaseTrial(deviceHash: string): boolean {
  cleanupTrialDevices();
  return !trialDeviceMap.has(deviceHash);
}

/**
 * Record a trial purchase for this device+IP combo.
 */
export function recordTrialPurchase(deviceHash: string): void {
  trialDeviceMap.set(deviceHash, Date.now());
}

function cleanupTrialDevices() {
  const now = Date.now();
  for (const [hash, ts] of trialDeviceMap) {
    if (now - ts > TRIAL_DEVICE_TTL) trialDeviceMap.delete(hash);
  }
}

// ── Backward compatibility ──

/** @deprecated Use mintEntitlement instead */
export function generateEntitlementToken(stripeSessionId: string, product: "pro" | "career_pass" = "pro"): string {
  return mintEntitlement(stripeSessionId, product === "career_pass" ? "pass" : "pro");
}

/** @deprecated Use verifyEntitlement instead */
export function verifyEntitlementToken(token: string): { sessionId: string; product: "pro" | "career_pass" } | null {
  const claims = verifyEntitlement(token);
  if (!claims) return null;
  return { sessionId: claims.id, product: claims.plan === "pass" ? "career_pass" : "pro" };
}

export type EntitlementProduct = "pro" | "career_pass";
