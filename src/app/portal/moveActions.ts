"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ALL_MOVE_IDS } from "@/lib/moves";
import { DUE_TICK_PATTERN } from "@/lib/dueMoves";

// "Your next move": the member marks a move done, or takes the tick back.
// Runs as the member, so RLS (0017) keeps every tick their own.

function moveFrom(formData: FormData): string | null {
  const id = String(formData.get("move") ?? "");
  return ALL_MOVE_IDS.has(id) || DUE_TICK_PATTERN.test(id) ? id : null;
}

// A dated card can tick several at once (one per booked call, say).
function movesFrom(formData: FormData): string[] {
  return formData
    .getAll("move")
    .map(String)
    .filter((id) => ALL_MOVE_IDS.has(id) || DUE_TICK_PATTERN.test(id))
    .slice(0, 100);
}

export async function tickMove(formData: FormData) {
  const moves = movesFrom(formData);
  if (moves.length === 0) return;
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const uid = auth.user.id;
  const { error } = await supabase
    .from("move_ticks")
    .upsert(moves.map((move_id) => ({ user_id: uid, move_id })), {
      onConflict: "user_id,move_id",
      ignoreDuplicates: true,
    });
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
