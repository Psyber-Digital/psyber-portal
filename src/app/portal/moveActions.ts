"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ALL_MOVE_IDS, PARK_COOKIE } from "@/lib/moves";
import { DUE_TICK_PATTERN, easternToday } from "@/lib/dueMoves";
import { SPRINTS_PER_DAY } from "@/lib/points";

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

/** "Yes, I want my saving" before Build opens (card PU, 25 Nov 2026). */
const SAID_YES = "s1-badge-said-yes";
export async function sayYesToBuild() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const { error } = await supabase
    .from("move_ticks")
    .upsert({ user_id: auth.user.id, move_id: SAID_YES }, { onConflict: "user_id,move_id", ignoreDuplicates: true });
  if (error) console.error("sayYesToBuild failed:", error.message);
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

// "Not now": park the move for this browser. The card shows the next one, and
// parked moves come back once the rest of the session is done. A per-browser
// convenience, like the War Room's park; nothing is stored in the database.

export async function parkMove(formData: FormData) {
  const move = moveFrom(formData);
  if (!move) return;
  const jar = cookies();
  const current = (jar.get(PARK_COOKIE)?.value ?? "").split(",").filter((id) => ALL_MOVE_IDS.has(id));
  const next = [...current.filter((id) => id !== move), move].slice(-40);
  jar.set(PARK_COOKIE, next.join(","), { path: "/portal", maxAge: 60 * 60 * 24 * 60, sameSite: "lax", httpOnly: true });
  revalidatePath("/portal");
}

// A finished focus sprint (Don, card IM = A, 25 Nov 2026): kept as a point
// tick, at most SPRINTS_PER_DAY a day, so the timer can't be farmed.
export async function keepSprint(): Promise<boolean> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const day = easternToday().replace(/-/g, "");
  for (let k = 1; k <= SPRINTS_PER_DAY; k++) {
    const { data, error } = await supabase
      .from("move_ticks")
      .upsert({ user_id: auth.user.id, move_id: `s1-p-s-${day}-${k}` }, { onConflict: "user_id,move_id", ignoreDuplicates: true })
      .select("move_id");
    if (error) {
      console.error("keepSprint failed:", error.message);
      return false;
    }
    if (data && data.length > 0) {
      revalidatePath("/portal");
      return true; // this slot was new: one sprint kept
    }
  }
  return false;
}
