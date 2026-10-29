import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, syncSubscription } from "@/lib/stripe";

// Stripe calls this when a subscription starts, renews, fails or ends.
// This is the ONLY place Build access is granted or removed; the checkout
// success page never grants anything.
//
// 1. Check the signature against the raw body, so only Stripe can call it.
// 2. Find the subscription the event is about.
// 3. Sync it fresh from Stripe (src/lib/stripe.ts), which sets the tier.
export const dynamic = "force-dynamic";

function subscriptionOf(event: Stripe.Event): string | null {
  const obj = event.data.object as unknown as Record<string, unknown>;
  switch (event.type) {
    case "checkout.session.completed": {
      const s = (obj as unknown as Stripe.Checkout.Session).subscription;
      return typeof s === "string" ? s : s?.id ?? null;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      return (obj as unknown as Stripe.Subscription).id;
    case "invoice.paid":
    case "invoice.payment_failed": {
      const s = (obj as unknown as Stripe.Invoice).parent?.subscription_details
        ?.subscription;
      return typeof s === "string" ? s : s?.id ?? null;
    }
    default:
      return null;
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  const subscriptionId = subscriptionOf(event);
  if (!subscriptionId) return NextResponse.json({ received: true });

  try {
    await syncSubscription(subscriptionId);
  } catch (e) {
    // A 500 makes Stripe retry later, which is what we want for a database
    // or network hiccup.
    console.error("stripe webhook:", event.type, event.id, e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
