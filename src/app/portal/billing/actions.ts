"use server";

import { headers } from "next/headers";
import { buildOnSale } from "@/lib/sale";
import { currentStep } from "@/lib/ladder";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUILD_PRICES, FIRST_MONTH_COUPON, stripe, type BuildPlan } from "@/lib/stripe";
import { offerOpen } from "@/lib/upsellEmails";

// Build billing (Offer Ladder stage 4). Two actions:
//   startCheckout     Foundations member → Stripe's payment page.
//   openBillingPortal Build member → Stripe's own page to change card or cancel.
// Neither grants or removes access. Only the webhook does that.

const ACTIVE = ["active", "trialing", "past_due"];

function siteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

async function signedInMember() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, role, full_name, email, lapsed_at, offer_ends_at, created_at")
    .eq("id", user.id)
    .single();
  // Only self-serve members buy Build. Flagship clients and admins never see
  // a checkout, and 'pending' has not passed the sign-up questions.
  if (!profile || profile.role === "admin" || !["foundations", "build"].includes(profile.tier)) {
    redirect("/portal");
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, profile, sub };
}

export async function startCheckout(formData: FormData) {
  // No payment until Build is on sale (Don, 21 Nov 2026).
  if (!buildOnSale()) redirect("/portal/billing");
  const plan = String(formData.get("plan") ?? "") as BuildPlan;
  if (!(plan in BUILD_PRICES)) redirect("/portal/billing");

  // The renewal tick box (adviser Q2). The browser requires it too.
  if (formData.get("accept_renewal") !== "on") redirect("/portal/billing");

  const { user, profile, sub } = await signedInMember();
  // Already paying: never sell the same person a second subscription.
  if (sub && ACTIVE.includes(sub.status ?? "")) redirect("/portal/billing");

  // One Stripe customer per person, made once and kept.
  let customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe().customers.create({
      email: user.email ?? profile.email ?? undefined,
      name: profile.full_name || undefined,
      metadata: { user_id: user.id },
    });
    const admin = createAdminClient();
    const { error } = await admin
      .from("subscriptions")
      .insert({ user_id: user.id, stripe_customer_id: customer.id });
    if (error) {
      // A double click made the row first. Use that one, drop ours.
      const { data } = await admin
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .single();
      await stripe().customers.del(customer.id);
      customerId = data!.stripe_customer_id;
    } else {
      customerId = customer.id;
    }
  }

  const { data: prices } = await stripe().prices.list({
    lookup_keys: [BUILD_PRICES[plan]],
    active: true,
    limit: 1,
  });
  if (!prices[0]) throw new Error(`No active Stripe price for ${BUILD_PRICES[plan]}`);

  // The launch ladder (ADR-0027 addendum 6), decided here on the server, never
  // by the browser. Yearly plan only. The checkout page can't outlive the step
  // by much: Stripe needs at least 30 minutes, and allows 24 hours at most.
  // A row with no status is only a customer from an unfinished checkout, not a
  // past membership, so it doesn't lose the saving.
  const step = plan === "yearly" && !sub?.status ? currentStep(profile) : null;
  const now = Date.now();
  const expiresAt = step
    ? Math.floor(Math.max(now + 31 * 60_000, Math.min(step.endsAt.getTime(), now + 23 * 3_600_000)) / 1000)
    : undefined;

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: prices[0].id, quantity: 1 }],
    ...(step ? { discounts: [{ coupon: step.coupon }], expires_at: expiresAt } : {}),
    // Kept on the subscription as the record of the renewal tick box.
    subscription_data: {
      metadata: {
        user_id: user.id,
        renewal_consent_at: new Date().toISOString(),
        ...(step ? { launch_saving: String(step.off) } : {}),
      },
    },
    success_url: `${siteUrl()}/portal/billing?joined=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/portal/billing`,
  });

  redirect(session.url!);
}

export async function openBillingPortal() {
  const { sub } = await signedInMember();
  if (!sub?.stripe_customer_id) redirect("/portal/billing");

  const session = await stripe().billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID,
    return_url: `${siteUrl()}/portal/billing`,
  });

  redirect(session.url);
}
