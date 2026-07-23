import Link from "next/link";

// Shown at the top of the portal when the signed-in user has no password yet
// (no `has_password` flag in their auth metadata). Sends them to the Account
// page to set one. Disappears automatically once a password is saved.
export function SetPasswordPrompt() {
  return (
    <section className="psy-card mb-[26px] flex flex-wrap items-center justify-between gap-3 p-4 sm:gap-5 sm:p-5">
      <div className="min-w-0">
        <p className="font-disp font-semibold text-off">
          Set a password for faster sign-in
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-slate">
          Add one now and you can sign in instantly next time — no waiting for an
          email link.
        </p>
      </div>
      <Link href="/portal/account" className="psy-btn shrink-0">
        Set password
      </Link>
    </section>
  );
}
