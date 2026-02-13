import { NextResponse } from "next/server";
import Stripe from "stripe";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiter";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    // Rate limit
    const ip = getClientIP(request);
    const { allowed } = checkRateLimit(ip, { maxRequests: 5, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured." },
        { status: 503 }
      );
    }

    const priceAmount = parseInt(process.env.NEXT_PUBLIC_PRICE_VARIANT || "5", 10) * 100; // cents
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
