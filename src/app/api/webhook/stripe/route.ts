import { NextResponse } from "next/server";
import Stripe from "stripe";
import { markSessionProcessed } from "@/lib/entitlement";

/**
 * Stripe webhook endpoint.
 * Verifies webhook signature and processes checkout.session.completed events.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  let event: Stripe.Event;
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature." }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[webhook/stripe] Signature verification failed:", err instanceof Error ? err.message : "Unknown");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Handle events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Idempotency check
      const isNew = markSessionProcessed(session.id);
      if (!isNew) {
        console.log("[webhook/stripe] Duplicate event for session:", session.id);
        return NextResponse.json({ received: true });
      }

      // Verify payment
      if (session.payment_status !== "paid") {
        console.warn("[webhook/stripe] Session not paid:", session.id);
        break;
      }

      // Verify product metadata
      if (session.metadata?.product !== "full_tailor_pack") {
        console.warn("[webhook/stripe] Unknown product:", session.metadata?.product);
        break;
      }

      console.log("[webhook/stripe] Payment confirmed for session:", session.id);
      break;
    }

    default:
      // Unhandled event type — acknowledge receipt
      break;
  }

  return NextResponse.json({ received: true });
}
