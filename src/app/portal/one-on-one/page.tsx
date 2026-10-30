import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "../components/Header";
import { PortalNav } from "../components/PortalNav";
import { SectionHead } from "../components/SectionHead";

export const dynamic = "force-dynamic";

// Moving from Foundations or Build to the one-on-one program (Build terms 6).
// Reached from the "One-on-one support" button on every member page (Don, r33,
// 30 Oct). The call is the sales call: one-on-one is offered there at its full
// price (ADR-0027), so no price is shown here.
// WORDING: from the approved Build email (call-script proposal §3), for Don's
// review on board card r33.
const CALL_URL = "https://calendly.com/psyberdigital/coaching-application";
const CREDIT_CAP_CENTS = 100_000;

function dollars(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default async function OneOnOnePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: sub }, { count: uncollected }] = await Promise.all([
    supabase.from("profiles").select("full_name, role, tier").eq("id", user.id).single(),
    supabase
      .from("subscriptions")
      .select("status, amount_paid_cents")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("shared_files")
      .select("id", { count: "exact", head: true })
      .eq("direction", "to_client")
      .is("downloaded_at", null),
  ]);

  if (profile?.role === "admin") redirect("/admin");
  // Flagship clients already have one-on-one support.
  if (profile?.tier !== "foundations" && profile?.tier !== "build") redirect("/portal");

  const build = profile.tier === "build";
  const credit = Math.min(sub?.amount_paid_cents ?? 0, CREDIT_CAP_CENTS);

  return (
    <div className="relative z-10 mx-auto max-w-[1060px] px-4 pb-16 pt-6 sm:px-5 sm:pb-24 sm:pt-7">
      <Header name={profile.full_name || "Member"} role="client" />
      <PortalNav badge={uncollected ?? 0} clinic={build} oneOnOne />

      <SectionHead>One-on-one support</SectionHead>
      {/* Two columns on desktop: the case on the left, the credit and the
          call on the right, so it reads as part of the portal (Don, r33). */}
      <div className="psy-card grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_280px] md:gap-10">
        <div>
          <p className="text-[15px] leading-relaxed text-off">
            With one-on-one support, Asher works with you through every session,
            until you have your first paying coaching client. The guarantee
            covers you if you do the work. He takes on a small number of
            one-on-one clients at a time.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate">
            It starts with a call with Asher, to see where you are and whether
            one-on-one is the right next step.
          </p>
        </div>

        <div className="flex flex-col justify-between gap-5 rounded-[12px] border border-line bg-white/[0.02] p-5">
          {build ? (
            <div>
              <div className="psy-eyebrow text-blue">Your Build credit</div>
              <div className="mt-1 font-disp text-3xl font-semibold text-off">
                {dollars(credit)}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                What you’ve paid for Build comes off the one-on-one fee, up to
                $1,000. The credit ends when your Build membership does.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate">
                It can’t be combined with other discounts. If another discount
                is bigger, you get that one instead.
              </p>
            </div>
          ) : (
            <div>
              <div className="psy-eyebrow text-blue">Start with a call</div>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                Pick a time that suits you.
              </p>
            </div>
          )}
          <a
            href={CALL_URL}
            target="_blank"
            rel="noopener"
            className="psy-btn inline-flex w-full justify-center"
          >
            Book a call
          </a>
        </div>
      </div>
    </div>
  );
}
