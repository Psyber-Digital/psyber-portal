import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Contact } from "@/lib/types";
import { Header } from "../components/Header";
import { PortalNav } from "../components/PortalNav";
import { SectionHead } from "../components/SectionHead";
import { OutreachView } from "./OutreachView";

export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");

  // Read as the user. The contacts table has a single owner-only policy and no
  // admin policy, so this query cannot return anyone else's list.
  const { data } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  const { count: uncollected } = await supabase
    .from("shared_files")
    .select("id", { count: "exact", head: true })
    .eq("direction", "to_client")
    .is("downloaded_at", null);

  return (
    <div className="relative z-10 mx-auto max-w-[1060px] px-4 pb-16 pt-6 sm:px-5 sm:pb-24 sm:pt-7">
      <Header name={profile?.full_name || "Client"} role="client" />
      <PortalNav badge={uncollected ?? 0} />

      <SectionHead>Outreach · Your contact database</SectionHead>
      {/* The rule sits BEFORE the sweep instruction, deliberately: the filter has
          to be in place before "put them all down first" is ever read.
          Don, 8 Aug 2026 — the rule is about who you COACH, not who you talk to.
          Former clients belong on the list as connectors; they never become
          coaching clients. This supersedes the flat "not current, not former"
          in `DRAFT — the list rule (edit me).md`. */}
      <p className="mx-0.5 mb-4 max-w-[74ch] rounded-[10px] border border-orange/30 bg-orange/[0.06] px-4 py-3 text-[12.5px] leading-relaxed text-sec">
        <b className="text-off">One rule, and it is the only one:</b> your current
        therapy clients don’t go on this list. Former clients can — as connectors,
        not as clients. Ask them who they know; you never coach them yourself.
        That relationship keeps its own standing long after the last session. If
        you are unsure about someone, bring them to a session rather than deciding
        it alone.
      </p>
      <p className="mx-0.5 mb-4 max-w-[74ch] text-[13.5px] leading-relaxed text-mut">
        This is the single most consequential input to landing your first client,
        and it runs alongside everything else. Start it now and keep adding right
        through the program, every time someone new comes to mind — so that by the
        time you reach the outreach sessions there is a real list to work, not a
        blank page. Everyone else on it is either a possible client or a possible
        connector, so put them all down first and categorise afterwards.
      </p>
      <p className="mx-0.5 mb-5 max-w-[74ch] rounded-[10px] border border-blue/30 bg-blue/[0.07] px-4 py-3 text-[12.5px] leading-relaxed text-sec">
        <b className="text-off">You’re not contacting anyone yet.</b> Reaching out
        comes later in the program, and we’ll cover exactly how. For now this is
        only about getting names down.
      </p>
      {/* Stated to match `Compliance/DPA-portal-clients.md` §5 exactly. The old
          line — "we can't see it from our side of the portal" — is the claim the
          DPA deliberately refuses: it is a commitment plus an architectural
          control, not technical incapability. Changed 8 Aug 2026 on Don's word. */}
      <p className="mx-0.5 mb-6 max-w-[74ch] text-[12.5px] leading-relaxed text-mut">
        No part of the portal gives us a route to this list — the contacts table
        has no administrator policy and no screen that reads it. Like any hosted
        system we hold a database key that could bypass that, and we have
        committed not to use it. Bring the list to a session if you want a second
        pair of eyes on it.
      </p>

      <OutreachView
        contacts={(data ?? []) as Contact[]}
        serverToday={new Date().toISOString().slice(0, 10)}
        weekCutoff={new Date(Date.now() - 7 * 86_400_000).toISOString()}
      />
    </div>
  );
}
