/**
 * Input sanitizer: strip dangerous characters, validate payloads,
 * and provide Zod schemas for all API route request bodies.
 */

import { z } from "zod";

// ── Client-safe input validators (also usable in components) ──

/** Token format: base64url characters with dots, max 2KB */
const TOKEN_RE = /^[A-Za-z0-9._-]+$/;
const MAX_TOKEN_LEN = 2048;

/** Validate that a string looks like a valid entitlement token (safe to store) */
export function isValidTokenFormat(token: string): boolean {
  return (
    typeof token === "string" &&
    token.length > 0 &&
    token.length <= MAX_TOKEN_LEN &&
    TOKEN_RE.test(token)
  );
}

/** Validate a plan string against allowed values */
export function isValidPlan(plan: string): boolean {
  return plan === "trial" || plan === "pro" || plan === "pass";
}

/** Strip control characters from a URL search param value */
export function sanitizeParam(value: string): string {
  return value.replace(/[\x00-\x1f\x7f]/g, "").trim();
}

// ── Text sanitization ──

/**
 * Sanitize user-provided text input:
 * - Strip null bytes
 * - Strip non-printable control chars (keep \n, \r, \t)
 * - Collapse runs of whitespace (except newlines)
 * - Trim leading/trailing whitespace
 */
export function sanitizeText(input: string): string {
  return input
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove non-printable control chars except \n \r \t
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Collapse runs of spaces/tabs (keep newlines intact)
    .replace(/[^\S\n]+/g, " ")
    // Collapse 3+ consecutive newlines into 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Payload size validation ──

const MAX_PAYLOAD_BYTES: Record<string, number> = {
  analyze: 100_000,        // ~100KB (25k resume + 15k JD + overhead)
  "generate-pro": 100_000,
  "generate-pack": 400_000, // resume + up to 10 JDs
  checkout: 1_000,          // tiny
  "email-pro": 500_000,     // includes ProOutput JSON
  "send-report": 200_000,
};

/**
 * Validate raw request body size. Returns error message or null if OK.
 */
export function validatePayloadSize(
  rawBody: string,
  routeName: string
): string | null {
  const max = MAX_PAYLOAD_BYTES[routeName];
  if (!max) return null; // unknown route, skip
  if (rawBody.length > max) {
    return `Request body too large (${rawBody.length} chars, max ${max}).`;
  }
  return null;
}

// ── Zod request schemas for API routes ──

export const AnalyzeRequestSchema = z.object({
  resumeText: z
    .string()
    .min(1, "Resume text is required.")
    .max(25_000, "Resume text is too long. Please limit to 25,000 characters."),
  jobDescriptionText: z
    .string()
    .min(1, "Job description text is required.")
    .max(15_000, "Job description is too long. Please limit to 15,000 characters."),
});

export const GenerateProRequestSchema = z.object({
  resumeText: z
    .string()
    .min(1, "Resume text is required.")
    .max(25_000, "Resume text is too long. Please limit to 25,000 characters."),
  jobDescriptionText: z
    .string()
    .min(1, "Job description text is required.")
    .max(15_000, "Job description is too long. Please limit to 15,000 characters."),
});

export const GeneratePackRequestSchema = z.object({
  resumeText: z
    .string()
    .min(1, "Resume text is required.")
    .max(25_000, "Resume text is too long. Please limit to 25,000 characters."),
  jobs: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        jd: z.string().min(30, "Job description must be at least 30 characters.").max(15_000),
      })
    )
    .min(1, "At least one job is required.")
    .max(10, "Maximum 10 jobs allowed."),
});

export const CheckoutRequestSchema = z.object({}).passthrough();

export const EmailProRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .max(320, "Email is too long.")
    .email("Valid email address is required.")
    .refine((v) => !/[\x00-\x1f\x7f]/.test(v), "Email contains invalid characters."),
  proOutput: z.record(z.string(), z.unknown()), // Validated separately with ProOutputSchema
  stripeSessionId: z.string().optional(),
});

// ── Validation helper ──

/**
 * Parse and sanitize a JSON request body against a Zod schema.
 * Returns the validated data or an error Response.
 */
export async function parseAndValidate<T>(
  request: Request,
  schema: z.ZodType<T>,
  routeName: string
): Promise<{ data: T; error: null } | { data: null; error: Response }> {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return {
      data: null,
      error: new Response(
        JSON.stringify({ error: "Failed to read request body." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  // Payload size check
  const sizeError = validatePayloadSize(rawBody, routeName);
  if (sizeError) {
    return {
      data: null,
      error: new Response(
        JSON.stringify({ error: sizeError }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return {
      data: null,
      error: new Response(
        JSON.stringify({ error: "Invalid JSON in request body." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  // Sanitize string fields recursively
  if (typeof parsed === "object" && parsed !== null) {
    sanitizeObjectStrings(parsed as Record<string, unknown>);
  }

  // Zod validation
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const message = firstIssue?.message || "Invalid request data.";
    return {
      data: null,
      error: new Response(
        JSON.stringify({ error: message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  return { data: result.data, error: null };
}

/**
 * Recursively sanitize all string values in an object (in-place).
 */
function sanitizeObjectStrings(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") {
      obj[key] = sanitizeText(val);
    } else if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        if (typeof val[i] === "string") {
          val[i] = sanitizeText(val[i]);
        } else if (typeof val[i] === "object" && val[i] !== null) {
          sanitizeObjectStrings(val[i] as Record<string, unknown>);
        }
      }
    } else if (typeof val === "object" && val !== null) {
      sanitizeObjectStrings(val as Record<string, unknown>);
    }
  }
}
