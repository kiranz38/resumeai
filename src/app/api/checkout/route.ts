import { NextResponse } from "next/server";
import Stripe from "stripe";
import { rateLimitRoute } from "@/lib/rate-limiter";

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

    const priceAmount = parseInt(process.env.NEXT_PUBLIC_PRICE_VARIANT || "5", 10) * 100; // cents
    // Enforce server-side price floor to prevent manipulation
    if (priceAmount < 100 || priceAmount > 10000) {
      console.error("[checkout] Invalid price amount:", priceAmount);
      return NextResponse.json(
        { error: "Invalid price configuration." },
        { status: 500 }
      );
    }

    const origin = request.headers.get("origin") || "http://localhost:3001";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "ResumeMate AI — Full Tailor Pack",
              description:
                "Tailored resume rewrite, cover letter, keyword checklist, recruiter feedback, and downloadable exports.",
            },
            unit_amount: priceAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/results/pro?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/results?cancelled=true`,
      metadata: {
        product: "full_tailor_pack",
      },
    });

    console.log("[checkout] Session created:", session.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout] Error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
