"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendDueUpsell } from "@/lib/upsellEmails";
import { movesFor } from "@/lib/moves";
import { sessionGate } from "@/lib/gates";

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

  // A Foundations member just finished Session 1: their offer email goes now.
  if (data === "finished_free") {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) await sendDueUpsell(auth.user.id);
  }

  revalidatePath("/portal");
}
