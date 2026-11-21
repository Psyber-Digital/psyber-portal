"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendDueUpsell } from "@/lib/upsellEmails";
import { movesFor } from "@/lib/moves";
import { sessionGate } from "@/lib/gates";
import { buildOnSale } from "@/lib/sale";
import { createAdminClient } from "@/lib/supabase/admin";

// Build members mark their current session complete (Build terms 2.2). The
// database decides what opens next (finish_session, 0011); this only passes
// the session number on and refreshes the page.
export async function finishSession(formData: FormData) {
  const week = parseInt(String(formData.get("week") ?? ""), 10);
  if (!Number.isInteger(week)) return;
  // Session 2 opens Session 3 only with the lane question ticked (Don, m08).
  if (week === 2 && formData.get("lane_ok") !== "yes") return;

  const supabase = createClient();

  // Every move done, and the list at this session's minimum (Don, m19).
  // Read as the member, so RLS keeps it to their own rows.
  const { data: auth0 } = await supabase.auth.getUser();
  if (!auth0.user) return;
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
  if (!gate.ok) {
    revalidatePath("/portal");
    return;
  }

  const { data, error } = await supabase.rpc("finish_session", { p_week: week });
  if (error) console.error("finish_session failed:", error.message);

  // Build not on sale yet (Don, 21 Nov 2026): finish_session (0016) starts the
  // seven-day $99 clock in the database. Undo it for this member only, so the
  // clock starts fresh, with its emails, on the day Build goes on sale.
  if (data === "finished_free" && !buildOnSale()) {
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

  revalidatePath("/portal");
}
