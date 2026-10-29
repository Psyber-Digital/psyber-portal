"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUILD_PRICES, stripe, type BuildPlan } from "@/lib/stripe";

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
    .select("tier, role, full_name, email")
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
  const plan = String(formData.get("plan") ?? "") as BuildPlan;
  if (!(plan in BUILD_PRICES)) redirect("/portal/billing");

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

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: prices[0].id, quantity: 1 }],
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${siteUrl()}/portal/billing?joined=1`,
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
