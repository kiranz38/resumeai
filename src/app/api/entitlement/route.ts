import { NextResponse } from "next/server";
import Stripe from "stripe";
import { rateLimitRoute } from "@/lib/rate-limiter";
import { generateEntitlementToken } from "@/lib/entitlement";

/**
 * Exchange a verified Stripe session ID for a short-lived entitlement token.
 * Client calls this after Stripe redirects back from checkout.
 */
export async function POST(request: Request) {
  try {
    // Reuse checkout budget for rate limiting
    const { response: rateLimited } = rateLimitRoute(request, "checkout");
    if (rateLimited) return rateLimited;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 200) {
      return NextResponse.json({ error: "Valid session ID is required." }, { status: 400 });
    }

    // Verify session with Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not verified." }, { status: 403 });
    }

    if (session.metadata?.product !== "full_tailor_pack") {
      return NextResponse.json({ error: "Invalid product." }, { status: 403 });
    }

    // Generate entitlement token
    const token = generateEntitlementToken(sessionId);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("[entitlement] Error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      { error: "Failed to verify entitlement." },
      { status: 500 }
    );
  }
}
