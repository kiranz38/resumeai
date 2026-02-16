import { NextResponse } from "next/server";
import Stripe from "stripe";
import { rateLimitRoute } from "@/lib/rate-limiter";

/**
 * POST /api/verify-session
 *
 * Verifies a Stripe Checkout Session and returns the actual transaction
 * details for GA4 purchase event tracking.
 *
 * Returns verified: false if the session is not paid or invalid.
 * Never exposes Stripe internals beyond what GA4 needs.
 */
export async function POST(request: Request) {
  try {
    const { response: rateLimited } = rateLimitRoute(request, "checkout");
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => ({}));
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 200) {
      return NextResponse.json(
        { verified: false, error: "Valid session ID is required." },
        { status: 400 },
      );
    }

    // ── Dev mode: return mock verification ──
    if (process.env.NODE_ENV === "development" && sessionId.startsWith("dev_")) {
      const plan = body.plan || "pro";
      const devAmounts: Record<string, number> = {
        trial: 1.50,
        pro: 5.00,
        pass: 10.00,
        apply_pack_5: 19.99,
        apply_pack_10: 34.99,
      };
      return NextResponse.json({
        verified: true,
        transaction_id: sessionId,
        value: devAmounts[plan] ?? 5.00,
        currency: "usd",
        plan,
      });
    }

    // ── Production: verify with Stripe ──
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { verified: false, error: "Stripe is not configured." },
        { status: 503 },
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      return NextResponse.json(
        { verified: false, error: "Invalid session." },
        { status: 400 },
      );
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { verified: false, error: "Payment not completed." },
        { status: 403 },
      );
    }

    // Determine plan from session metadata
    const metaPlan = session.metadata?.plan;
    const metaProduct = session.metadata?.product;
    let plan = "pro";
    if (metaPlan === "trial" || metaProduct === "career_trial") plan = "trial";
    else if (metaPlan === "pass" || metaProduct === "career_pass") plan = "pass";
    else if (metaPlan) plan = metaPlan;
    else if (metaProduct) plan = metaProduct;

    return NextResponse.json({
      verified: true,
      transaction_id: session.id,
      value: (session.amount_total ?? 0) / 100, // cents → dollars
      currency: session.currency ?? "usd",
      plan,
    });
  } catch (error) {
    console.error("[verify-session] Error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      { verified: false, error: "Verification failed." },
      { status: 500 },
    );
  }
}
