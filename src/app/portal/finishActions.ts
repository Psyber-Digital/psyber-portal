"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Build members mark their current session complete (Build terms 2.2). The
// database decides what opens next (finish_session, 0011); this only passes
// the session number on and refreshes the page.
export async function finishSession(formData: FormData) {
  const week = parseInt(String(formData.get("week") ?? ""), 10);
  if (!Number.isInteger(week)) return;

  const supabase = createClient();
  const { error } = await supabase.rpc("finish_session", { p_week: week });
  if (error) console.error("finish_session failed:", error.message);

  revalidatePath("/portal");
}
