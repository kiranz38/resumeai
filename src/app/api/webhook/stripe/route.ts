import { NextResponse } from "next/server";
import Stripe from "stripe";
import { markSessionProcessed, mintEntitlement, type Plan } from "@/lib/entitlement";
import { trackServerEvent } from "@/lib/analytics-server";

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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Idempotency
      const isNew = markSessionProcessed(session.id);
      if (!isNew) {
        console.log("[webhook/stripe] Duplicate event for session:", session.id);
        return NextResponse.json({ received: true });
      }

      if (session.payment_status !== "paid") {
        console.warn("[webhook/stripe] Session not paid:", session.id);
        break;
      }

      // Determine plan from metadata
      const metaPlan = session.metadata?.plan;
      const metaProduct = session.metadata?.product;
      let plan: Plan = "pro";
      if (metaPlan === "trial" || metaProduct === "career_trial") {
        plan = "trial";
      } else if (metaPlan === "pass" || metaProduct === "career_pass") {
        plan = "pass";
      }

      // Mint entitlement token (will be exchanged by client via /api/entitlement)
      const token = mintEntitlement(session.id, plan);
      console.log(`[webhook/stripe] Payment confirmed: session=${session.id} plan=${plan}`);
      trackServerEvent("checkout_completed", { plan });

      // Token is stored server-side for retrieval by /api/entitlement
      // The client exchanges session_id for the token
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
