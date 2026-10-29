import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { openBillingPortal } from "../actions";

export const dynamic = "force-dynamic";

// The page before Stripe's own billing page (Build terms 4.1, 4.2, 4.3, 8.2).
// It says what cancelling does before anyone reaches the cancel button.
// WORDING: draft, waiting for Don's approval (board card, 29 Oct).
export default async function ManageBillingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  if (profile?.tier !== "build") redirect("/portal/billing");

  return (
    <main className="relative z-10 mx-auto mt-[6vh] w-full max-w-[430px] px-5">
      <div className="psy-card p-8">
        <h1 className="font-disp text-xl font-semibold">Manage billing</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          On the next page you can change your card, see your invoices or cancel.
        </p>
        <h2 className="mt-5 font-disp text-base font-semibold">If you cancel</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate">
          <li>You keep Build until the end of the month or year you’ve paid for.</li>
          <li>Then you move to Foundations. You keep Session 1 and your contact list.</li>
          <li>Anything you’ve written stays yours.</li>
          <li>Yearly plan: a full refund if you ask within 14 days of paying.</li>
          <li>Monthly plan: no refunds.</li>
        </ul>
        <form action={openBillingPortal}>
          <button type="submit" className="psy-btn mt-6 w-full">
            Continue to billing
          </button>
        </form>
      </div>
      <p className="mt-5 text-center text-sm text-slate">
        <Link href="/portal/billing" className="font-semibold text-blue">
          ← Back
        </Link>
      </p>
    </main>
  );
}
