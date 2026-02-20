import { NextResponse } from "next/server";
import Stripe from "stripe";
import { rateLimitRoute } from "@/lib/rate-limiter";
import {
  mintEntitlement,
  hashDeviceFingerprint,
  canPurchaseTrial,
  recordTrialPurchase,
  type Plan,
} from "@/lib/entitlement";
import { trackServerEvent } from "@/lib/analytics-server";

const PLAN_STRIPE_CONFIG: Record<Plan, {
  name: string;
  description: string;
  amountCents: number;
  successPath: string;
  envPriceKey: string;
}> = {
  trial: {
    name: "ResumeMate AI — Career Trial",
    description: "Full tailored resume, cover letter, and recruiter insights for one role. TXT export included.",
    amountCents: 150,
    successPath: "/results/pro",
    envPriceKey: "STRIPE_PRICE_ID_TRIAL",
  },
  pro: {
    name: "ResumeMate AI — Pro (Single Job)",
    description: "Tailored resume rewrite, cover letter, keyword checklist, recruiter feedback, and downloadable exports for one role.",
    amountCents: 500,
    successPath: "/results/pro",
    envPriceKey: "STRIPE_PRICE_ID_PRO",
  },
  pass: {
    name: "ResumeMate AI — Career Pass (30 days)",
    description: "Optimize multiple roles for 30 days. Tailored resume, cover letter, and exports for every application.",
    amountCents: 1000,
    successPath: "/career/welcome",
    envPriceKey: "STRIPE_PRICE_ID_PASS",
  },
};

function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  try {
    const { response: rateLimited } = rateLimitRoute(request, "checkout");
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => ({}));
    const planRaw = body.plan;
    const plan: Plan = planRaw === "pass" ? "pass" : planRaw === "trial" ? "trial" : "pro";
    const config = PLAN_STRIPE_CONFIG[plan];

    // ── Trial abuse prevention: one per device + IP ──
    if (plan === "trial") {
      const deviceId = body.deviceId || "no-device";
      const ip = getClientIP(request);
      const deviceHash = hashDeviceFingerprint(deviceId, ip);

      if (!canPurchaseTrial(deviceHash)) {
        return NextResponse.json(
          { error: "Career Trial can only be purchased once. Upgrade to Pro for full access.", code: "TRIAL_ALREADY_USED" },
          { status: 409 },
        );
      }
    }

    // ── Dev mode: skip Stripe, mint token directly ──
    if (process.env.NODE_ENV === "development" || !process.env.STRIPE_SECRET_KEY) {
      const devSessionId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const token = mintEntitlement(devSessionId, plan);

      // Record trial purchase for device binding
      if (plan === "trial") {
        const deviceId = body.deviceId || "no-device";
        const ip = getClientIP(request);
        recordTrialPurchase(hashDeviceFingerprint(deviceId, ip));
      }

      trackServerEvent("checkout_completed", { plan, mode: "dev" });
      console.log(`[billing/checkout] Dev mode: minted ${plan} entitlement`);

      return NextResponse.json({
        url: `/success?dev_token=${encodeURIComponent(token)}&plan=${plan}&redirect=${encodeURIComponent(config.successPath)}`,
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

    // Enable card + wallets (Apple Pay, Google Pay) + Stripe Link (1-click checkout)
    // Note: Apple Pay requires domain verification in Stripe Dashboard → Settings → Payments → Apple Pay
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "link"],
      line_items: lineItems,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&redirect=${encodeURIComponent(config.successPath)}`,
      cancel_url: `${origin}/pricing?cancelled=true`,
      metadata: {
        product: plan === "pass" ? "career_pass" : plan === "trial" ? "career_trial" : "pro",
        plan,
      },
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
