import { NextResponse } from "next/server";
import Stripe from "stripe";
import { rateLimitRoute } from "@/lib/rate-limiter";
import { trackServerEvent } from "@/lib/analytics-server";

type CheckoutProduct = "pro" | "career_pass" | "apply_pack_5" | "apply_pack_10";

interface CheckoutBody {
  product?: CheckoutProduct;
}

/**
 * Server-side product config. Prices are hardcoded server-side — never trusted from client.
 * If STRIPE_PRICE_ID_* env vars are set, those Stripe Price objects are used instead
 * of ad-hoc price_data (preferred for production).
 */
const PRODUCT_CONFIG: Record<CheckoutProduct, {
  name: string;
  description: string;
  amountCents: number;
  successPath: string;
  envPriceKey: string;
}> = {
  pro: {
    name: "ResumeMate AI — Pro",
    description: "Tailored resume rewrite, cover letter, keyword checklist, recruiter feedback, and downloadable exports.",
    amountCents: 799,
    successPath: "/results/pro",
    envPriceKey: "STRIPE_PRICE_ID_PRO",
  },
  career_pass: {
    name: "ResumeMate AI — Career Pass (30 days)",
    description: "Unlimited Pro analyses for 30 days. Perfect for active job seekers applying to multiple roles.",
    amountCents: 1900,
    successPath: "/results/pro",
    envPriceKey: "STRIPE_PRICE_ID_PASS",
  },
  apply_pack_5: {
    name: "ResumeMate AI — Apply Pack (up to 5 jobs)",
    description: "Tailored resume, cover letter, and keyword checklist for up to 5 job descriptions.",
    amountCents: 1999,
    successPath: "/results/pack",
    envPriceKey: "STRIPE_PRICE_ID_PACK_5",
  },
  apply_pack_10: {
    name: "ResumeMate AI — Apply Pack (6-10 jobs)",
    description: "Tailored resume, cover letter, and keyword checklist for up to 10 job descriptions.",
    amountCents: 3499,
    successPath: "/results/pack",
    envPriceKey: "STRIPE_PRICE_ID_PACK_10",
  },
};

const VALID_PRODUCTS = new Set(Object.keys(PRODUCT_CONFIG));

export async function POST(request: Request) {
  try {
    // Rate limit
    const { response: rateLimited } = rateLimitRoute(request, "checkout");
    if (rateLimited) return rateLimited;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment system is being configured. Please try again later." },
        { status: 503 },
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Parse product type from body (default to "pro")
    let product: CheckoutProduct = "pro";
    try {
      const body: CheckoutBody = await request.json();
      if (body.product && VALID_PRODUCTS.has(body.product)) {
        product = body.product;
      }
    } catch {
      // No body or invalid JSON — default to pro
    }

    const config = PRODUCT_CONFIG[product];
    const origin = request.headers.get("origin") || "http://localhost:3000";

    // Prefer pre-created Stripe Price IDs from env (production best practice)
    const envPriceId = process.env[config.envPriceKey];

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = envPriceId
      ? [{ price: envPriceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: config.name,
                description: config.description,
              },
              unit_amount: config.amountCents,
            },
            quantity: 1,
          },
        ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&plan=${product}&redirect=${encodeURIComponent(config.successPath)}`,
      cancel_url: `${origin}/results?cancelled=true`,
      metadata: { product },
    });

    trackServerEvent("checkout_started", { product });
    console.log("[checkout] Session created:", session.id, "product:", product);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout] Error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      { error: "Unable to start checkout. Please try again." },
      { status: 500 },
    );
  }
}
