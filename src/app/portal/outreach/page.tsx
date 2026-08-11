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

      {/* One name for one thing. The nav tab was renamed to "The List" (df6ac53) but
          this heading and the guide dialog still said "your contact database", so a
          client met three names for the same page. Don, 11 Aug 2026. */}
      <SectionHead>The List</SectionHead>
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
      {/* Two paragraphs merged into one, 11 Aug 2026. They said the same thing from
          two angles — 105 words to establish "start now, everyone counts, don't send
          anything yet". The dropped clause ("runs alongside everything else... by the
          time you reach the outreach sessions") is not lost: it is stated in full in
          the ? guide below, step 1. */}
      <p className="mx-0.5 mb-5 max-w-[74ch] text-[13.5px] leading-relaxed text-mut">
        <b className="text-off">Start it now and keep adding.</b> This is the
        single most consequential input to landing your first client. Every name
        is either a possible client or a possible connector, so put them all down
        first and categorise later.{" "}
        <b className="text-off">You are not contacting anyone yet</b> — that comes
        later in the program.
      </p>
      {/* Stated to match `Compliance/DPA-portal-clients.md` §5 exactly. The old
          line — "we can't see it from our side of the portal" — is the claim the
          DPA deliberately refuses: it is a commitment plus an architectural
          control, not technical incapability. Changed 8 Aug 2026 on Don's word.

          Folded behind a disclosure 11 Aug 2026 — the WORDING IS UNCHANGED and must
          stay that way. It is a reassurance, wanted the moment a client wonders who
          can see her contacts and not before, so it no longer sits between her and
          the list. */}
      <details className="mx-0.5 mb-6 max-w-[74ch] group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-[12.5px] text-mut marker:hidden hover:text-sec">
          Who can see this list
          <span className="text-[10px] transition group-open:rotate-90">›</span>
        </summary>
        <p className="mt-2 text-[12.5px] leading-relaxed text-mut">
          No part of the portal gives us a route to this list — the contacts table
          has no administrator policy and no screen that reads it. Like any hosted
          system we hold a database key that could bypass that, and we have
          committed not to use it. Bring the list to a session if you want a second
          pair of eyes on it.
        </p>
      </details>

      <OutreachView
        contacts={(data ?? []) as Contact[]}
        serverToday={new Date().toISOString().slice(0, 10)}
        weekCutoff={new Date(Date.now() - 7 * 86_400_000).toISOString()}
      />
    </div>
  );
}
