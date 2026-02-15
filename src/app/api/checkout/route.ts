import { NextResponse } from "next/server";
import Stripe from "stripe";
import { rateLimitRoute } from "@/lib/rate-limiter";

type CheckoutProduct = "pro" | "career_pass" | "apply_pack_5" | "apply_pack_10";

interface CheckoutBody {
  product?: CheckoutProduct;
}

const PRODUCT_CONFIG: Record<CheckoutProduct, { name: string; description: string; amountCents: number; successPath: string }> = {
  pro: {
    name: "ResumeMate AI — Pro",
    description: "Tailored resume rewrite, cover letter, keyword checklist, recruiter feedback, and downloadable exports.",
    amountCents: 799,
    successPath: "/results/pro",
  },
  career_pass: {
    name: "ResumeMate AI — Career Pass (30 days)",
    description: "Unlimited Pro analyses for 30 days. Perfect for active job seekers applying to multiple roles.",
    amountCents: 1900,
    successPath: "/results/pro",
  },
  apply_pack_5: {
    name: "ResumeMate AI — Apply Pack (up to 5 jobs)",
    description: "Tailored resume, cover letter, and keyword checklist for up to 5 job descriptions.",
    amountCents: 1999,
    successPath: "/results/pack",
  },
  apply_pack_10: {
    name: "ResumeMate AI — Apply Pack (6-10 jobs)",
    description: "Tailored resume, cover letter, and keyword checklist for up to 10 job descriptions.",
    amountCents: 3499,
    successPath: "/results/pack",
  },
};

export async function POST(request: Request) {
  try {
    // Rate limit
    const { response: rateLimited } = rateLimitRoute(request, "checkout");
    if (rateLimited) return rateLimited;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Parse product type from body (default to "pro")
    let product: CheckoutProduct = "pro";
    try {
      const body: CheckoutBody = await request.json();
      if (body.product && body.product in PRODUCT_CONFIG) {
        product = body.product;
      }
    } catch {
      // No body or invalid JSON — default to pro
    }

    const config = PRODUCT_CONFIG[product];

    const origin = request.headers.get("origin") || "http://localhost:3001";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
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
      ],
      success_url: `${origin}${config.successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/results?cancelled=true`,
      metadata: {
        product,
      },
    });

    console.log("[checkout] Session created:", session.id, "product:", product);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout] Error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
