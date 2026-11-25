"use server";

import { revalidatePath } from "next/cache";
import { finishCore } from "@/lib/finishCore";

// Build members mark their current session complete (Build terms 2.2). The
// database decides what opens next (finish_session, 0011); the shared logic
// lives in lib/finishCore.ts.
export async function finishSession(formData: FormData) {
  const week = parseInt(String(formData.get("week") ?? ""), 10);
  if (!Number.isInteger(week)) return;
  // Session 2 opens Session 3 only with the lane question ticked (Don, m08).
  if (week === 2 && formData.get("lane_ok") !== "yes") return;
  await finishCore(week, true);
  revalidatePath("/portal");
}
