import { createClient } from "@/lib/supabase/server";
import { sendDueUpsell } from "@/lib/upsellEmails";
import { movesFor } from "@/lib/moves";
import { sessionGate } from "@/lib/gates";
import { createAdminClient } from "@/lib/supabase/admin";

// Finishing a session, shared by the finish button (finishActions.ts) and by
// Today, which now opens the next session by itself once every move is done
// and the list has its names (Don, card BT1 and S2, 25 Nov 2026: "Session 2
// still doesn't open"). Not a server action, so no browser can call it
// directly; both callers run as the signed-in member, and the gate is checked
// here again before the database is asked.
export async function finishCore(week: number, laneOk = false): Promise<string | null> {
  // Session 2 opens Session 3 only with the lane question ticked (Don, m08).
  if (week === 2 && !laneOk) return null;
  const supabase = createClient();

  // Every move done, and the list at this session's minimum (Don, m19).
  // Read as the member, so RLS keeps it to their own rows.
  const { data: auth0 } = await supabase.auth.getUser();
  if (!auth0.user) return null;
  const [{ data: prof }, { data: tickRows }, { count: names }] = await Promise.all([
    supabase.from("profiles").select("tier").eq("id", auth0.user.id).single(),
    supabase.from("move_ticks").select("move_id").like("move_id", `s${week}-%`).not("move_id", "like", "s1-p-%"),
    supabase.from("contacts").select("id", { count: "exact", head: true }),
  ]);
  const tier = prof?.tier;
  const gate = sessionGate(
    week,
    movesFor(week, tier),
    new Set((tickRows ?? []).map((r) => r.move_id)),
    names ?? 0,
    tier === "foundations" ? 50 : undefined,
  );
  if (!gate.ok) return null;

  const { data, error } = await supabase.rpc("finish_session", { p_week: week });
  if (error) console.error("finish_session failed:", error.message);

  // finish_session (0016) still starts the old seven-day $99 clock in the
  // database. The yearly launch ladder (lib/ladder.ts) replaced that offer, so
  // undo it always, on sale or not (research check, 25 Nov 2026). Left running,
  // it would hide a one-on-one chooser's "Book a call" card after Session 1.
  if (data === "finished_free") {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { error: undoErr } = await createAdminClient()
        .from("profiles")
        .update({ offer_started_at: null, offer_ends_at: null })
        .eq("id", auth.user.id)
        .eq("tier", "foundations");
      if (undoErr) console.error("undo offer clock failed:", undoErr.message);
    }
  }

  // A Foundations member just finished Session 1: their offer email goes now.
  if (data === "finished_free") {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) await sendDueUpsell(auth.user.id);
  }

  return typeof data === "string" ? data : null;
}
