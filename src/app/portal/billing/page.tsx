import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe, syncSubscription } from "@/lib/stripe";
import { startCheckout } from "./actions";

export const dynamic = "force-dynamic";

// Build billing (Offer Ladder stage 4). What a self-serve member sees:
//   Foundations → the two plans and a button to Stripe's payment page.
//   Just paid   → we ask Stripe about their checkout directly (below), so
//                 they don't depend on the webhook arriving first.
//   Build       → their plan, the next date, and "Manage billing".
// Flagship clients and admins never reach this page.
// WORDING: passed lane-guard and voice-guard; shown to Don on board card r11.

const PLAN_NAME: Record<string, string> = { month: "Monthly", year: "Yearly" };

function day(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: { joined?: string; session_id?: string; t?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Back from Stripe's payment page. Read the checkout from Stripe with our
  // secret key (never trust the browser), and only if it belongs to this
  // person, sync its subscription: the same path the webhook takes.
  const sessionId = searchParams?.session_id;
  if (sessionId && /^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    try {
      const cs = await stripe().checkout.sessions.retrieve(sessionId);
      const subId = typeof cs.subscription === "string" ? cs.subscription : cs.subscription?.id;
      if (cs.client_reference_id === user.id && subId) await syncSubscription(subId);
    } catch (e) {
      console.error("billing: checkout check failed:", e);
    }
  }

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("tier, role").eq("id", user.id).single(),
    supabase
      .from("subscriptions")
      .select("status, billing_interval, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!profile || profile.role === "admin" || !["foundations", "build"].includes(profile.tier)) {
    redirect("/portal");
  }

  const back = (
    <p className="mt-5 text-center text-sm text-slate">
      <Link href="/portal" className="font-semibold text-blue">
        ← Back to the portal
      </Link>
    </p>
  );

  // Paid, but Stripe hasn't confirmed it yet. Usually seconds. The page
  // checks again every 3 seconds, ten times, then stops.
  if (profile.tier === "foundations" && searchParams?.joined) {
    const tries = Math.max(0, parseInt(searchParams.t ?? "0", 10) || 0);
    const again = `/portal/billing?joined=1&t=${tries + 1}${
      sessionId ? `&session_id=${encodeURIComponent(sessionId)}` : ""
    }`;
    return (
      <main className="relative z-10 mx-auto mt-[6vh] w-full max-w-[430px] px-5">
        {tries < 10 && <meta httpEquiv="refresh" content={`3;url=${again}`} />}
        <div className="psy-card p-8 text-center">
          <h1 className="font-disp text-xl font-semibold">Confirming your payment…</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            {tries < 10
              ? "This usually takes a few seconds. The page will update by itself."
              : "This is taking longer than usual. Refresh this page in a minute."}
          </p>
        </div>
        {back}
      </main>
    );
  }

  if (profile.tier === "build") {
    const ending = sub?.cancel_at_period_end;
    const pastDue = sub?.status === "past_due";
    return (
      <main className="relative z-10 mx-auto mt-[6vh] w-full max-w-[430px] px-5">
        <div className="psy-card p-8">
          <h1 className="font-disp text-xl font-semibold">Your Build membership</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            {PLAN_NAME[sub?.billing_interval ?? ""] ?? "Build"} plan.{" "}
            {/* While a payment is overdue Stripe has already moved the date on,
                so "renews on" would be wrong. The warning below says it all. */}
            {pastDue
              ? null
              : ending
                ? `It ends on ${day(sub?.current_period_end ?? null)}. Then you move to Foundations.`
                : `It renews on ${day(sub?.current_period_end ?? null)}.`}
          </p>
          {pastDue && (
            <p className="mt-4 rounded-[9px] border border-bad/30 bg-bad/10 px-3 py-2.5 text-sm text-[#f0a99f]">
              Your last payment didn’t go through. Update your card to keep Build.
            </p>
          )}
          <Link href="/portal/billing/manage" className="psy-btn mt-5 block w-full text-center">
            Manage billing
          </Link>
        </div>
        {back}
      </main>
    );
  }

  // Foundations: offer Build.
  return (
    <main className="relative z-10 mx-auto mt-[6vh] w-full max-w-[430px] px-5">
      <div className="psy-card p-8">
        <h1 className="font-disp text-xl font-semibold">Join Build</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          All seven sessions, each opening as you complete the one before, plus
          the weekly group clinic. Session 3 opens once your niche is approved
          at a clinic.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Your membership renews automatically until you cancel: $149 a month on
          the monthly plan, or $1,197 a year on the yearly plan. Cancel any time
          from Manage billing on your account page.
        </p>
        <form action={startCheckout}>
          {/* Separate renewal consent, apart from the terms (adviser Q2,
              approved by Don in m06). Checked again on the server. */}
          <label className="mt-5 flex items-start gap-2.5 text-sm leading-relaxed text-slate">
            <input type="checkbox" name="accept_renewal" required className="mt-1" />
            <span>I agree my Build membership renews automatically until I cancel.</span>
          </label>
          {/* Refund position on the sign-up page (adviser Q13, terms 4.3-4.4). */}
          <p className="mt-3 text-xs leading-relaxed text-slate">
            Yearly plan: a full refund within 14 days of paying. Monthly plan: no
            refunds.
          </p>
          <button name="plan" value="monthly" className="psy-btn mt-5 w-full">
            Monthly · $149 a month
          </button>
          <button name="plan" value="yearly" className="psy-btn mt-3 w-full">
            Yearly · $1,197 a year
          </button>
        </form>
        <p className="mt-4 text-xs leading-relaxed text-slate">
          Stripe takes the payment. We never see your card details.
        </p>
      </div>
      {back}
    </main>
  );
}
