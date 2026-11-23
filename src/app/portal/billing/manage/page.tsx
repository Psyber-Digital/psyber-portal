import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { openBillingPortal } from "../actions";
import { Brand } from "../../components/Brand";

export const dynamic = "force-dynamic";

// The page before Stripe's own billing page (Build terms 4.1, 4.2, 4.3, 4.4, 8.2, 9.3).
// States every member right in full; emails may be selective, this page may not
// (Don, 29 Oct, PREFERENCES selective-persuasion rule, choice A).
// It says what cancelling does before anyone reaches the cancel button.
// WORDING: passed lane-guard and voice-guard; shown to Don on board card r11.
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
          <li>You keep <Brand name="Build" tm /> until the end of the month or year you’ve paid for.</li>
          <li>Then you move to <Brand name="Foundations" tm />. You keep Session 1 and your contact list, which you can export at any time.</li>
          <li>Your place in the program is kept for one month after <Brand name="Build" /> ends. Rejoin after that and you start again from Session 1.</li>
          <li>Anything you’ve written stays yours.</li>
          <li>Yearly plan: a full refund if you ask within 14 days of paying.</li>
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
