/**
 * Next.js Middleware — origin validation for API routes.
 *
 * Blocks cross-origin POST/PUT/PATCH/DELETE to /api/* routes
 * to prevent CSRF and unauthorized access from other domains.
 * GET requests are allowed (public reads).
 * Webhook routes are excluded (Stripe uses its own signature verification).
 */

import { NextResponse, type NextRequest } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Routes that bypass origin check (external webhooks verify via signatures) */
const EXEMPT_PATHS = new Set(["/api/webhook/stripe"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only check API routes with mutating methods
  if (!pathname.startsWith("/api/") || !MUTATING_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  // Skip exempt paths (webhooks)
  if (EXEMPT_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // In development, allow all origins
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // Validate Origin or Referer header
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (!host) {
    return new NextResponse(
      JSON.stringify({ error: "Request rejected." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const allowedOrigins = new Set([
    `https://${host}`,
    `http://${host}`, // for non-HTTPS deployments
  ]);

  // Check origin first (preferred), fall back to referer
  if (origin) {
    if (!allowedOrigins.has(origin)) {
      console.warn(`[middleware] Blocked cross-origin ${request.method} ${pathname} from ${origin}`);
      return new NextResponse(
        JSON.stringify({ error: "Request rejected." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  } else if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!allowedOrigins.has(refererOrigin)) {
        console.warn(`[middleware] Blocked cross-origin ${request.method} ${pathname} from referer ${refererOrigin}`);
        return new NextResponse(
          JSON.stringify({ error: "Request rejected." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch {
      // Malformed referer — block
      return new NextResponse(
        JSON.stringify({ error: "Request rejected." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  } else {
    // No origin or referer on a mutating API request — block
    console.warn(`[middleware] Blocked ${request.method} ${pathname} — no origin/referer`);
    return new NextResponse(
      JSON.stringify({ error: "Request rejected." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

/** Security headers applied to all API responses */
function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

export const config = {
  matcher: "/api/:path*",
};
