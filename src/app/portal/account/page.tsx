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

  return (
    <main className="relative z-10 mx-auto mt-[6vh] w-full max-w-[430px] px-5">
      <SetPasswordForm />
      <p className="mt-5 text-center text-sm text-slate">
        <Link href="/portal" className="font-semibold text-blue">
          ← Back to the portal
        </Link>
      </p>
    </main>
  );
}
