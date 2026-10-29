import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "../../portal/components/Header";

export const dynamic = "force-dynamic";

// Don's view of self-serve members (Offer Ladder stage 6): who is on Build or
// Foundations, their sign-up answers, billing, and who has gone quiet. Read-only.
// Every query runs as the signed-in admin, so RLS (0007, 0010) is the gate.
// Flagship clients stay on the main admin dashboard.

const QUIET_DAYS = 10;
const DAY = 86_400_000;
const REASONS: Record<string, string> = {
  A1: "In training",
  A2: "Not an independently licensed clinician",
  B1: "Coaching program not separate from therapy",
  B2: "Would coach from their caseload",
  C: "Coaches their therapy clients",
  D: "Under-18s (old rule)",
};

type Gate = {
  user_id: string;
  answers: Record<string, unknown>;
  first_answers: Record<string, unknown>;
  flagged_words: string[];
  created_at: string;
};

function day(iso?: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
}
function daysSince(iso?: string | null) {
  return iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DAY) : null;
}
function money(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default async function MembersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  // Non-admins get a 404 rather than a redirect that would reveal the route.
  if (me?.role !== "admin") notFound();

  const since = new Date(Date.now() - 365 * DAY).toISOString();
  const [{ data: people }, { data: gates }, { data: subs }, { data: refusals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, tier, current_week, completed_week, niche_confirmed_at, lapsed_at, last_activity_at, created_at")
      .in("tier", ["build", "foundations", "pending"])
      .neq("role", "admin")
      .order("created_at", { ascending: false }),
    supabase.from("signup_gate").select("user_id, answers, first_answers, flagged_words, created_at"),
    supabase
      .from("subscriptions")
      .select("user_id, status, billing_interval, current_period_end, cancel_at_period_end, amount_paid_cents"),
    supabase.from("signup_refusals").select("reason, created_at").gte("created_at", since),
  ]);

  const gateOf = new Map((gates as Gate[] | null ?? []).map((g) => [g.user_id, g]));
  const subOf = new Map((subs ?? []).map((s) => [s.user_id, s]));
  const groups = [
    { tier: "build", label: "Build" },
    { tier: "foundations", label: "Foundations" },
    { tier: "pending", label: "Not yet in (no access)" },
  ];
  const refusalCounts = (refusals ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.reason] = (acc[r.reason] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="relative z-10 mx-auto max-w-[1060px] px-4 pb-16 pt-6 sm:px-5">
      <Header name={me?.full_name || "Admin"} role="admin" />
      <p className="mb-4 text-sm">
        <Link href="/admin" className="font-semibold text-blue">← Admin</Link>
      </p>
      <h1 className="font-disp text-xl font-semibold">Members</h1>
      <p className="mb-6 mt-1 text-sm text-slate">
        Self-serve members. Open a name to see their sign-up answers. Flagship clients are on the main admin page.
      </p>

      {groups.map((g) => {
        const rows = (people ?? []).filter((p) => p.tier === g.tier);
        return (
          <section key={g.tier} className="mb-8">
            <h2 className="mb-3 font-disp text-base font-semibold">
              {g.label} · {rows.length}
            </h2>
            {rows.length === 0 && <p className="text-sm text-slate">None yet.</p>}
            <div className="space-y-2">
              {rows.map((p) => {
                const s = subOf.get(p.id);
                const gate = gateOf.get(p.id);
                const quiet = daysSince(p.last_activity_at);
                const isQuiet = p.tier === "build" && quiet !== null && quiet >= QUIET_DAYS;
                const placeUntil =
                  p.tier === "foundations" && p.lapsed_at
                    ? new Date(new Date(p.lapsed_at).setMonth(new Date(p.lapsed_at).getMonth() + 1))
                    : null;
                const live = s && ["active", "trialing", "past_due"].includes(s.status ?? "");
                const a = (gate?.answers ?? {}) as Record<string, unknown>;
                const first = (gate?.first_answers ?? {}) as Record<string, unknown>;
                return (
                  <details key={p.id} className="psy-card p-4 text-sm">
                    <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="font-semibold">{p.full_name || p.email}</span>
                      <span className="text-slate">{p.email}</span>
                      {p.tier !== "pending" && (
                        <span>
                          Session {p.current_week}
                          {p.completed_week ? ` · ${p.completed_week} done` : ""}
                          {p.niche_confirmed_at ? " · niche set" : ""}
                        </span>
                      )}
                      {s?.status && (
                        <span className={s.status === "past_due" ? "font-semibold text-orange" : "text-slate"}>
                          {s.billing_interval === "year" ? "Yearly" : s.billing_interval === "month" ? "Monthly" : ""}{" "}
                          {s.status === "past_due"
                            ? "· card failing"
                            : s.cancel_at_period_end
                              ? `· ends ${day(s.current_period_end)}`
                              : live
                                ? `· renews ${day(s.current_period_end)}`
                                : `· ${s.status}`}
                        </span>
                      )}
                      {placeUntil && placeUntil.getTime() > Date.now() && (
                        <span className="text-orange">Place held until {day(placeUntil.toISOString())}</span>
                      )}
                      {isQuiet && <span className="font-semibold text-orange">Quiet {quiet} days</span>}
                      {gate && gate.flagged_words.length > 0 && (
                        <span className="font-semibold text-orange">Check: {gate.flagged_words.join(", ")}</span>
                      )}
                    </summary>
                    <div className="mt-3 grid gap-x-6 gap-y-1 border-t border-line pt-3 text-slate sm:grid-cols-2">
                      <span>Joined {day(p.created_at)}</span>
                      <span>Last active {quiet === null ? "never" : quiet === 0 ? "today" : `${quiet} days ago`}</span>
                      {s && (
                        <span>
                          Paid so far {money(s.amount_paid_cents ?? 0)}
                          {live ? ` · one-on-one credit ${money(Math.min(s.amount_paid_cents ?? 0, 100_000))}` : ""}
                        </span>
                      )}
                      {gate ? (
                        <>
                          <span>
                            License: {String(a.license ?? "")} {String(a.license_type ?? "")}, {String(a.license_state ?? "")}, no.{" "}
                            {String(a.license_number ?? "")}
                          </span>
                          <span>Not treatment: {a.tick_not_treatment ? "ticked" : "no"}</span>
                          <span>Outside caseload: {a.tick_outside_caseload ? "ticked" : "no"}</span>
                          <span>Coaches therapy clients: {a.coaches_therapy_clients ? "yes" : "no"}</span>
                          <span>Terms: {String(a.terms_version ?? "not recorded")}</span>
                          {Object.keys(first).length > 0 && (
                            <span className="text-orange sm:col-span-2">
                              Changed answers before submitting. First answers:{" "}
                              {Object.entries(first)
                                .map(([k, v]) => `${k} = ${String(v)}`)
                                .join(", ")}
                            </span>
                          )}
                        </>
                      ) : (
                        <span>No sign-up answers on record.</span>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        );
      })}

      <section>
        <h2 className="mb-3 font-disp text-base font-semibold">Refused at sign-up · last 12 months</h2>
        {Object.keys(refusalCounts).length === 0 ? (
          <p className="text-sm text-slate">None.</p>
        ) : (
          <ul className="space-y-1 text-sm text-slate">
            {Object.entries(refusalCounts).map(([r, n]) => (
              <li key={r}>
                {REASONS[r] ?? r}: {n}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
