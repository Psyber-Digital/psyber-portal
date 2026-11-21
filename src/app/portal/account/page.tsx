import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "./SetPasswordForm";
import { CloseAccountForm } from "./CloseAccountForm";
import { setWorkStyle } from "./actions";

export const dynamic = "force-dynamic";

// Signed-in users set or change their password here. Middleware already gates
// /portal/*, but we re-check so the page never renders without a user.
export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Self-serve members manage Build from here (Build terms 4.1).
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, wants_one_on_one")
    .eq("id", user.id)
    .single();
  const selfServe = profile?.tier === "foundations" || profile?.tier === "build";
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  const paying = ["active", "trialing", "past_due"].includes(sub?.status ?? "");

  return (
    <main className="relative z-10 mx-auto mt-[6vh] w-full max-w-[430px] px-5">
      <SetPasswordForm />
      {selfServe && (
        <form action={setWorkStyle} className="psy-card mt-5 p-5">
          <h2 className="font-disp text-[15px] font-semibold text-off">How you'd like to work</h2>
          <label className="mt-3 flex items-center gap-2 text-sm text-sec">
            <input type="radio" name="work" value="own" defaultChecked={profile?.wants_one_on_one !== true} />
            On my own, with weekly drop-ins
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm text-sec">
            <input type="radio" name="work" value="one_on_one" defaultChecked={profile?.wants_one_on_one === true} />
            One-on-one, with a coach
          </label>
          <button type="submit" className="psy-btn-ghost mt-4 w-full">Save</button>
        </form>
      )}
      {selfServe && (
        <Link href="/portal/billing" className="psy-btn mt-5 block w-full text-center">
          {profile?.tier === "build" ? "Manage billing" : "Join Build"}
        </Link>
      )}
      {selfServe && <CloseAccountForm paying={paying} />}
      <p className="mt-5 text-center text-sm text-slate">
        <Link href="/portal" className="font-semibold text-blue">
          ← Back to the portal
        </Link>
      </p>
    </main>
  );
}
