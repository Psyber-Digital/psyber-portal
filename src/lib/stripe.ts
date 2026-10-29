import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { maybeSendCancelEmail } from "@/lib/buildEmails";

// Build billing (Offer Ladder stage 4, ADR-0027). Server-only: the secret key
// is read from a non-public env var, so this module can never reach the
// browser bundle. Import it only from Route Handlers and Server Actions.

let client: Stripe | null = null;

export function stripe() {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return client;
}

// The two Build prices, found by lookup key so test and live use the same code.
export const BUILD_PRICES = {
  monthly: "build_monthly",
  yearly: "build_yearly",
} as const;
export type BuildPlan = keyof typeof BUILD_PRICES;

// Writes one subscription's current state to the database, then lets the
// database decide the person's tier (apply_build_access, 0010).
//
// It always fetches the subscription fresh from Stripe rather than trusting an
// event's body. Stripe can send events twice or out of order; reading the
// current state each time makes every call give the same, latest answer.
export async function syncSubscription(subscriptionId: string) {
  const sub = await stripe().subscriptions.retrieve(subscriptionId);
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const admin = createAdminClient();

  // Who it belongs to: set by our own checkout action on the server, never by
  // the browser. Fall back to the customer we stored at checkout.
  let userId = sub.metadata?.user_id || null;
  if (!userId) {
    const { data } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    userId = data?.user_id ?? null;
  }
  if (!userId) {
    console.error("stripe sync: no user for subscription", sub.id);
    return null;
  }

  // A person has one row. A newer subscription replaces an ended one, but an
  // old subscription's late event never overwrites a newer live one.
  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, status")
    .eq("user_id", userId)
    .maybeSingle();
  const ACTIVE = ["active", "trialing", "past_due"];
  if (
    existing?.stripe_subscription_id &&
    existing.stripe_subscription_id !== sub.id &&
    ACTIVE.includes(existing.status ?? "") &&
    !ACTIVE.includes(sub.status)
  ) {
    return null;
  }

  const item = sub.items.data[0];
  const interval = item?.price.recurring?.interval;

  // Total paid on this subscription, recounted from Stripe each time so a
  // repeated event can't double it. Feeds the upgrade credit (terms 6.1).
  let paid = 0;
  for await (const inv of stripe().invoices.list({
    subscription: sub.id,
    status: "paid",
    limit: 100,
  })) {
    paid += inv.amount_paid;
  }

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      price_id: item?.price.id ?? null,
      billing_interval: interval === "month" || interval === "year" ? interval : null,
      status: sub.status,
      current_period_end: item?.current_period_end
        ? new Date(item.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      amount_paid_cents: paid,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`stripe sync: write failed: ${error.message}`);

  const { data: tier, error: rpcError } = await admin.rpc("apply_build_access", {
    p_user: userId,
  });
  if (rpcError) throw new Error(`stripe sync: access failed: ${rpcError.message}`);

  // Just cancelled? Send the approved cancel email, once per subscription.
  // Best-effort: an email problem must never undo or repeat the sync.
  try {
    await maybeSendCancelEmail(userId, {
      id: sub.id,
      cancel_at_period_end: sub.cancel_at_period_end,
      status: sub.status,
      interval: interval ?? null,
      periodEnd: item?.current_period_end ?? null,
    });
  } catch (e) {
    console.error("stripe sync: cancel email failed:", e);
  }

  return tier as string | null;
}
