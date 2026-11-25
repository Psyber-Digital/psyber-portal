// "Your next move" milestones and momentum (Don, board card r01, 18 Nov 2026:
// "add simple gamification and badges (that would resonate with therapists)").
//
// Everything is worked out from real progress: sessions finished, moves
// ticked, and the member's own list. Nothing rewards logging in, and nothing
// counts down, so nobody is shown as behind.

import type { Tier } from "./types";
import { ALL_MOVE_IDS } from "./moves";

export type BadgeIcon =
  | "found" | "compass" | "quote" | "map" | "mega" | "build"
  | "tag" | "send" | "chat" | "star" | "people" | "steady" | "flag";

export type Badge = {
  key: string;
  name: string;
  how: string;
  icon: BadgeIcon;
  tone: "orange" | "blue";
  earned: boolean;
  /** How far towards it, for badges you can count (card IM = A, 25 Nov 2026). */
  progress?: { have: number; need: number; unit: string };
};

export type Momentum = { movesDone: number; weeksInMotion: number; names: number };

type ListRow = { status: string; correspondence: string; first_contact_date: string | null };

function isoWeekKey(iso: string): string {
  const d = new Date(iso);
  d.setUTCHours(12, 0, 0, 0);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow + 3);
  const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d.getTime() - firstThu.getTime()) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-${week}`;
}

export function momentumOf(ticks: { move_id: string; done_at: string }[], listSize: number): Momentum {
  return {
    // Session moves only; the dated cards' dismissals are not "moves done".
    movesDone: ticks.filter((t) => ALL_MOVE_IDS.has(t.move_id)).length,
    // A week counts when a move was finished in it. "Not an outreach day"
    // dismissals of today's ten are not moves, so they don't count. Nor are
    // kept badges or kept points (s1-p-), which are saved when Today is viewed.
    weeksInMotion: new Set(
      ticks.filter((t) => !/^s\d-ten-|^s\d-badge-|^s1-p-/.test(t.move_id)).map((t) => isoWeekKey(t.done_at)),
    ).size,
    names: listSize,
  };
}

/** Has the member finished session n? Each tier records it differently. */
function finished(
  n: number,
  p: { tier?: Tier; completed_week?: number; current_week?: number; session1_finished_at?: string | null },
): boolean {
  if (p.tier === "build") return (p.completed_week ?? 0) >= n;
  if (p.tier === "foundations") return n === 1 && Boolean(p.session1_finished_at) || (p.completed_week ?? 0) >= n;
  // One-on-one: the coach moves them on, so being past a session means it's done.
  return (p.current_week ?? 0) > n;
}

/** Tick id that keeps a badge once earned (lane check, 18 Nov: removing a
 *  name from the list must never cost a member anything). */
export const badgeTickId = (key: string) => `s1-badge-${key}`;

export function badgesOf(
  profile: { tier?: Tier; completed_week?: number; current_week?: number; session1_finished_at?: string | null },
  list: ListRow[],
  momentum: Momentum,
  kept: Set<string> = new Set(),
): Badge[] {
  const contacted = list.filter((c) => c.status !== "not_contacted" || c.first_contact_date).length;
  const announced = list.some((c) => c.correspondence !== "" || c.first_contact_date);
  const conversation = list.some((c) => ["call_booked", "offer_made", "converted"].includes(c.status));
  const client = list.some((c) => c.status === "converted");
  const b = (
    key: string, name: string, how: string, icon: BadgeIcon, tone: Badge["tone"], earned: boolean,
    progress?: Badge["progress"],
  ): Badge => ({ key, name, how, icon, tone, earned: earned || kept.has(badgeTickId(key)), progress });
  return [
    b("s1", "Foundations Laid", "Finish Session 1", "found", "orange", finished(1, profile)),
    b("s2", "Niche Chosen", "Finish Session 2", "compass", "orange", finished(2, profile)),
    b("s3", "Your Words", "Finish Session 3", "quote", "orange", finished(3, profile)),
    b("s4", "Program Mapped", "Finish Session 4", "map", "orange", finished(4, profile)),
    b("announced", "Announced", "Send your announcement", "mega", "blue", announced),
    b("s5", "First Coaching Session Built", "Finish Session 5", "build", "orange", finished(5, profile)),
    b("s6", "Offer Priced", "Finish Session 6", "tag", "orange", finished(6, profile)),
    b("ten", "First Ten", "Ten people from your list contacted", "send", "blue", contacted >= 10, { have: contacted, need: 10, unit: "contacted" }),
    b("conversation", "First Conversation", "First discovery call booked", "chat", "blue", conversation),
    b("client", "First Coaching Client", "Your first paying client signed", "star", "orange", client),
    b("fifty", "Fifty Names", "50 names on your list", "people", "blue", momentum.names >= 50, { have: momentum.names, need: 50, unit: "names" }),
    b("s7", "Launched", "Finish Session 7", "flag", "orange", finished(7, profile)),
    b("steady", "Steady Hand", "A move done in any four weeks", "steady", "blue", momentum.weeksInMotion >= 4, { have: momentum.weeksInMotion, need: 4, unit: "weeks" }),
  ];
}
