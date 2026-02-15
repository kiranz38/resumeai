/**
 * Centralized API error handling.
 * Never surfaces raw error messages to the client.
 */

import { NextResponse } from "next/server";

/** Standard user-facing error messages by category */
const SAFE_MESSAGES: Record<string, string> = {
  validation: "Invalid request data. Please check your input.",
  auth: "Authentication required. Please complete payment first.",
  forbidden: "Access denied.",
  not_found: "Resource not found.",
  rate_limit: "Too many requests. Please wait and try again.",
  payload_too_large: "Request body too large.",
  service_unavailable: "This service is temporarily unavailable. Please try again later.",
  internal: "Something went wrong. Please try again.",
};

type ErrorCategory = keyof typeof SAFE_MESSAGES;

/**
 * Return a safe JSON error response. Never leaks internal details.
 */
export function apiError(
  category: ErrorCategory,
  statusCode: number,
  internalMessage?: string,
): NextResponse {
  if (internalMessage) {
    console.error(`[api-error] ${category}: ${internalMessage}`);
  }
  return NextResponse.json(
    { error: SAFE_MESSAGES[category] || SAFE_MESSAGES.internal },
    { status: statusCode },
  );
}

/**
 * Wrap an API route handler with a catch-all that returns a safe 500.
 * Usage: export const POST = withSafeErrors(async (request) => { ... });
 */
export function withSafeErrors(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[api-error] Unhandled: ${msg}`);
      return NextResponse.json(
        { error: SAFE_MESSAGES.internal },
        { status: 500 },
      );
    }
  };
}
