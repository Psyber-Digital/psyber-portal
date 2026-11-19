// Before a session can be finished (Don, board m19, 19 Nov 2026): every move
// in it is done, and the contact list has reached that session's minimum.
// Checked on the page AND in finishSession, so a stale page can't skip it.
//
// The minimums build towards the method's checkpoint of 100 names by week
// four (90-Day-First-Client-Doctrine §4.4) and the 250 target. Session 7 has
// no minimum: reaching 250 is that session's work, not its entry fee.

import type { Move } from "./moves";

export const NAMES_MIN: Record<number, number> = { 1: 10, 2: 25, 3: 50, 4: 100, 5: 125, 6: 150 };

export type Gate = { ok: boolean; movesLeft: Move[]; namesNeeded: number; namesMin: number };

export function sessionGate(session: number, moves: Move[], ticked: Set<string>, names: number, cap?: number): Gate {
  const movesLeft = moves.filter((m) => !m.finish && !ticked.has(m.id));
  // The free list holds 50 names, so its minimum can never be above that.
  const namesMin = Math.min(NAMES_MIN[session] ?? 0, cap ?? Infinity);
  const namesNeeded = Math.max(0, namesMin - names);
  return { ok: movesLeft.length === 0 && namesNeeded === 0, movesLeft, namesNeeded, namesMin };
}
