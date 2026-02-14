/**
 * HMAC-based entitlement tokens for Pro features.
 * Tokens are short-lived proofs that a user paid for Pro access.
 */

import { createHmac } from "crypto";

const PRO_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CAREER_PASS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type EntitlementProduct = "pro" | "career_pass";

/**
 * Get the HMAC signing secret. Derives from STRIPE_SECRET_KEY or falls back to HMAC_SECRET.
 */
function getSecret(): string {
  const secret = process.env.HMAC_SECRET || process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("No HMAC signing secret available (set HMAC_SECRET or STRIPE_SECRET_KEY).");
  return secret;
}

/**
 * Generate an entitlement token for a paid Stripe session.
 * Career Pass tokens have a 30-day TTL; Pro tokens have 24-hour TTL.
 */
export function generateEntitlementToken(stripeSessionId: string, product: EntitlementProduct = "pro"): string {
  const ttl = product === "career_pass" ? CAREER_PASS_TTL_MS : PRO_TOKEN_TTL_MS;
  const payload = {
    sid: stripeSessionId,
    product,
    iat: Date.now(),
    exp: Date.now() + ttl,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

/**
 * Verify an entitlement token. Returns the Stripe session ID and product if valid, null otherwise.
 */
export function verifyEntitlementToken(token: string): { sessionId: string; product: EntitlementProduct } | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, sig] = parts;

  // Verify signature
  const expectedSig = createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
  if (sig !== expectedSig) return null;

  // Decode payload
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (!payload.sid || !payload.exp) return null;

    // Check expiry
    if (Date.now() > payload.exp) return null;

    return { sessionId: payload.sid, product: payload.product || "pro" };
  } catch {
    return null;
  }
}

// ── Idempotency store for processed Stripe sessions ──

const processedSessions = new Map<string, number>(); // sessionId → timestamp
const SESSION_STORE_TTL = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Mark a Stripe session as processed. Returns false if already processed (idempotent).
 */
export function markSessionProcessed(sessionId: string): boolean {
  cleanupSessions();
  if (processedSessions.has(sessionId)) return false;
  processedSessions.set(sessionId, Date.now());
  return true;
}

/**
 * Check if a session has been processed.
 */
export function isSessionProcessed(sessionId: string): boolean {
  return processedSessions.has(sessionId);
}

function cleanupSessions() {
  const now = Date.now();
  for (const [id, ts] of processedSessions) {
    if (now - ts > SESSION_STORE_TTL) {
      processedSessions.delete(id);
    }
  }
}
