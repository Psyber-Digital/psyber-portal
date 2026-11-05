"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendDueUpsell } from "@/lib/upsellEmails";

// Build members mark their current session complete (Build terms 2.2). The
// database decides what opens next (finish_session, 0011); this only passes
// the session number on and refreshes the page.
export async function finishSession(formData: FormData) {
  const week = parseInt(String(formData.get("week") ?? ""), 10);
  if (!Number.isInteger(week)) return;

  const supabase = createClient();
  const { data, error } = await supabase.rpc("finish_session", { p_week: week });
  if (error) console.error("finish_session failed:", error.message);

  // A Foundations member just finished Session 1: their offer email goes now.
  if (data === "finished_free") {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) await sendDueUpsell(auth.user.id);
  }

  revalidatePath("/portal");
}
