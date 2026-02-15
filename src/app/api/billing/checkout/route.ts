import { NextResponse } from "next/server";
import Stripe from "stripe";
import { rateLimitRoute } from "@/lib/rate-limiter";
import { mintEntitlement, type Plan } from "@/lib/entitlement";
import { trackServerEvent } from "@/lib/analytics-server";

const PLAN_STRIPE_CONFIG: Record<Plan, {
  name: string;
  description: string;
  amountCents: number;
  successPath: string;
  envPriceKey: string;
}> = {
  pro: {
    name: "ResumeMate AI — Pro (Single Job)",
    description: "Tailored resume rewrite, cover letter, keyword checklist, recruiter feedback, and downloadable exports for one role.",
    amountCents: 799,
    successPath: "/results/pro",
    envPriceKey: "STRIPE_PRICE_ID_PRO",
  },
  pass: {
    name: "ResumeMate AI — Career Pass (30 days)",
    description: "Optimize multiple roles for 30 days. Tailored resume, cover letter, and exports for every application.",
    amountCents: 1900,
    successPath: "/career/welcome",
    envPriceKey: "STRIPE_PRICE_ID_PASS",
  },
};

export async function POST(request: Request) {
  try {
    const { response: rateLimited } = rateLimitRoute(request, "checkout");
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => ({}));
    const plan: Plan = body.plan === "pass" ? "pass" : "pro";
    const config = PLAN_STRIPE_CONFIG[plan];

    // ── Dev mode: skip Stripe, mint token directly ──
    if (process.env.NODE_ENV === "development" || !process.env.STRIPE_SECRET_KEY) {
      const devSessionId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const token = mintEntitlement(devSessionId, plan);

      trackServerEvent("checkout_completed", { plan, mode: "dev" });
      console.log(`[billing/checkout] Dev mode: minted ${plan} entitlement`);

      return NextResponse.json({
        url: `${config.successPath}?dev_token=${encodeURIComponent(token)}&plan=${plan}`,
        devMode: true,
        token,
      });
    }

    // ── Production: Stripe checkout ──
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = request.headers.get("origin") || "http://localhost:3000";

    const envPriceId = process.env[config.envPriceKey];
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = envPriceId
      ? [{ price: envPriceId, quantity: 1 }]
      : [{
          price_data: {
            currency: "usd",
            product_data: { name: config.name, description: config.description },
            unit_amount: config.amountCents,
          },
          quantity: 1,
        }];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${origin}${config.successPath}?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${origin}/pricing?cancelled=true`,
      metadata: { product: plan === "pass" ? "career_pass" : "pro", plan },
    });

    trackServerEvent("checkout_started", { plan });
    console.log("[billing/checkout] Session created:", session.id, "plan:", plan);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[billing/checkout] Error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      { error: "Unable to start checkout. Please try again." },
      { status: 500 },
    );
  }
}
