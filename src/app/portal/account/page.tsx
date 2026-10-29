import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "./SetPasswordForm";

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
    .select("tier")
    .eq("id", user.id)
    .single();
  const selfServe = profile?.tier === "foundations" || profile?.tier === "build";

  return (
    <main className="relative z-10 mx-auto mt-[6vh] w-full max-w-[430px] px-5">
      <SetPasswordForm />
      {selfServe && (
        <Link href="/portal/billing" className="psy-btn mt-5 block w-full text-center">
          {profile?.tier === "build" ? "Manage billing" : "Join Build"}
        </Link>
      )}
      <p className="mt-5 text-center text-sm text-slate">
        <Link href="/portal" className="font-semibold text-blue">
          ← Back to the portal
        </Link>
      </p>
    </main>
  );
}
