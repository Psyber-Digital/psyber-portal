"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ALL_MOVE_IDS } from "@/lib/moves";

// "Your next move": the member marks a move done, or takes the tick back.
// Runs as the member, so RLS (0017) keeps every tick their own.

function moveFrom(formData: FormData): string | null {
  const id = String(formData.get("move") ?? "");
  return ALL_MOVE_IDS.has(id) ? id : null;
}

export async function tickMove(formData: FormData) {
  const move = moveFrom(formData);
  if (!move) return;
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const { error } = await supabase
    .from("move_ticks")
    .upsert({ user_id: auth.user.id, move_id: move }, { onConflict: "user_id,move_id", ignoreDuplicates: true });
  if (error) console.error("tickMove failed:", error.message);
  revalidatePath("/portal");
}

export async function untickMove(formData: FormData) {
  const move = moveFrom(formData);
  if (!move) return;
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const { error } = await supabase
    .from("move_ticks")
    .delete()
    .eq("user_id", auth.user.id)
    .eq("move_id", move);
  if (error) console.error("untickMove failed:", error.message);
  revalidatePath("/portal");
}
