import { NextResponse } from "next/server";
import Stripe from "stripe";
import { rateLimitRoute } from "@/lib/rate-limiter";
import { mintEntitlement, verifyEntitlement, type Plan } from "@/lib/entitlement";

/**
 * Exchange a verified Stripe session ID for an entitlement token.
 * Also accepts GET to check current entitlement status from a token.
 */
export async function POST(request: Request) {
  try {
    const { response: rateLimited } = rateLimitRoute(request, "checkout");
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 200) {
      return NextResponse.json({ error: "Valid session ID is required." }, { status: 400 });
    }

    // Dev mode: if sessionId starts with "dev_", mint directly
    if (process.env.NODE_ENV === "development" && sessionId.startsWith("dev_")) {
      const plan: Plan = body.plan === "trial" ? "trial" : body.plan === "pass" ? "pass" : "pro";
      const token = mintEntitlement(sessionId, plan);
      const claims = verifyEntitlement(token)!;
      return NextResponse.json({ token, claims });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not verified." }, { status: 403 });
    }

    // Determine plan
    const metaPlan = session.metadata?.plan;
    const metaProduct = session.metadata?.product;
    let plan: Plan = "pro";
    if (metaPlan === "trial" || metaProduct === "career_trial") {
      plan = "trial";
    } else if (metaPlan === "pass" || metaProduct === "career_pass") {
      plan = "pass";
    }

    const token = mintEntitlement(session.id, plan);
    const claims = verifyEntitlement(token)!;

    return NextResponse.json({ token, claims });
  } catch (error) {
    console.error("[entitlement] Error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      { error: "Failed to verify entitlement." },
      { status: 500 },
    );
  }
}
