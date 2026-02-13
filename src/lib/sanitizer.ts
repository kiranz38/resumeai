/**
 * Input sanitizer: strip dangerous characters, validate payloads,
 * and provide Zod schemas for all API route request bodies.
 */

import { z } from "zod";

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
  analyze: 200_000,       // ~200KB
  "generate-pro": 200_000,
  checkout: 1_000,        // tiny
  "email-pro": 500_000,   // includes ProOutput JSON
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
    .max(50_000, "Resume text is too long. Please limit to 50,000 characters."),
  jobDescriptionText: z
    .string()
    .min(1, "Job description text is required.")
    .max(30_000, "Job description is too long. Please limit to 30,000 characters."),
});

export const GenerateProRequestSchema = z.object({
  resumeText: z
    .string()
    .min(1, "Resume text is required.")
    .max(50_000, "Resume text is too long."),
  jobDescriptionText: z
    .string()
    .min(1, "Job description text is required.")
    .max(30_000, "Job description is too long."),
});

export const CheckoutRequestSchema = z.object({}).passthrough();

export const EmailProRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .max(320, "Email is too long.")
    .email("Valid email address is required."),
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
