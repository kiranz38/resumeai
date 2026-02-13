/**
 * Safe logging helper: never logs raw resume/JD content.
 * Redacts sensitive fields and truncates long strings.
 */

const SENSITIVE_KEYS = new Set([
  "resumeText", "jobDescriptionText", "resume_text", "jd_text",
  "password", "secret", "api_key", "apiKey", "token",
  "authorization", "cookie",
]);

const MAX_STRING_LENGTH = 200;

/**
 * Create a safe copy of an object for logging.
 * Redacts sensitive keys and truncates long strings.
 */
export function safeLogData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === "number" || typeof data === "boolean") return data;

  if (typeof data === "string") {
    return data.length > MAX_STRING_LENGTH
      ? `${data.slice(0, MAX_STRING_LENGTH)}... [${data.length} chars]`
      : data;
  }

  if (Array.isArray(data)) {
    if (data.length > 10) {
      return `[Array: ${data.length} items]`;
    }
    return data.map(safeLogData);
  }

  if (typeof data === "object") {
    const safe: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key)) {
        safe[key] = typeof value === "string" ? `[REDACTED: ${value.length} chars]` : "[REDACTED]";
      } else {
        safe[key] = safeLogData(value);
      }
    }
    return safe;
  }

  return String(data);
}

/**
 * Safe console.log — redacts sensitive data automatically.
 */
export function safeLog(tag: string, message: string, data?: unknown): void {
  if (data !== undefined) {
    console.log(`[${tag}] ${message}`, safeLogData(data));
  } else {
    console.log(`[${tag}] ${message}`);
  }
}

/**
 * Safe console.error — redacts sensitive data automatically.
 */
export function safeError(tag: string, message: string, error?: unknown): void {
  const errMsg = error instanceof Error ? error.message : error !== undefined ? String(error) : "";
  console.error(`[${tag}] ${message}`, errMsg);
}
