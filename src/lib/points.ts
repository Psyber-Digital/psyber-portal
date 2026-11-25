// Points for "Your next move" (Don, board m18 "yes", 19 Nov 2026; Codex
// ADR-0031 addendum 3). Weighted to the actions that win clients, not to
// watching and reading. Count up only.
//
// Every point is kept as a tick in move_ticks the moment Today first sees it
// earned, under the member's own login (RLS, 0017). So deleting a name, or a
// later follow-up overwriting a contact's dates, never takes points away. The
// ids all start "s1-p-", which momentum ignores, so recording points is never
// counted as a week in motion.
//
// No points for a paying client: the "First Coaching Client" badge marks it.

import { MOVES, type Move } from "./moves";
import { easternToday, type DueContact } from "./dueMoves";

export const POINTS = { video: 5, sheet: 20, name: 10, message: 15, tenDay: 25, call: 50, sprint: 10 } as const;
/** Sprints that earn points per day (card IM, 25 Nov 2026). */
export const SPRINTS_PER_DAY = 2;
export const POINT_TICK = /^s1-p-/;
const MESSAGES_PER_DAY = 10;
const TEN_DAYS_PER_WEEK = 4;
const CALL_POINTS_ON = true;

const short = (id: string) => id.replace(/-/g, "").slice(0, 12);

const MOVE_BY_ID = new Map<string, Move>(
  Object.values(MOVES).flatMap((list) => list.map((m) => [m.id, m] as const)),
);

/** What a move earns when it is done. Finishing a chapter is its level-up, not points. */
export function movePoints(m: Pick<Move, "opens" | "finish">): number {
  if (m.finish) return 0;
  if (m.opens === "video" || m.opens === "card") return POINTS.video;
  if (m.opens === "sheet") return POINTS.sheet;
  return 0;
}

function tickPoints(id: string): number {
  const move = MOVE_BY_ID.get(id);
  if (move) return movePoints(move);
  if (id.startsWith("s1-p-n-")) return POINTS.name;
  if (id.startsWith("s1-p-m-") || id.startsWith("s1-p-r-")) return POINTS.message;
  if (id.startsWith("s1-p-d-")) return POINTS.tenDay;
  if (id.startsWith("s1-p-c-")) return POINTS.call;
  if (id.startsWith("s1-p-s-")) return POINTS.sprint;
  return 0;
}

export function pointsTotal(ticks: { move_id: string }[]): number {
  return ticks.reduce((sum, t) => sum + tickPoints(t.move_id), 0);
}

/**
 * The streak bonus (Don, card IM = A, 25 Nov 2026): points earned on a day
 * when the member's streak had reached 3 days or more count double. Worked
 * out from the dates of real moves, with the same forgiving rule as
 * lib/streak.ts (one missed day between moves is let off).
 */
export function streakBonus(ticks: { move_id: string; done_at: string }[]): number {
  const AUTO = /^s1-p-|badge/;
  const active = [...new Set(ticks.filter((t) => !AUTO.test(t.move_id)).map((t) => easternDay(t.done_at)))].sort();
  const run = new Map<string, number>();
  let prev = "";
  let count = 0;
  for (const day of active) {
    const gap = prev ? Math.round((Date.parse(`${day}T12:00:00Z`) - Date.parse(`${prev}T12:00:00Z`)) / 86400000) : 99;
    count = gap <= 2 ? count + 1 : 1;
    run.set(day, count);
    prev = day;
  }
  return ticks.reduce((sum, t) => ((run.get(easternDay(t.done_at)) ?? 0) >= 3 ? sum + tickPoints(t.move_id) : sum), 0);
}

const STAGE: Record<string, number> = { "": 0, message_1: 1, follow_up_1: 2, follow_up_2: 3 };
const REPLIED = new Set(["replied", "interested", "not_interested", "call_booked", "offer_made", "converted"]);
const CALL = new Set(["call_booked", "offer_made", "converted"]);

function isoWeek(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow + 3);
  const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d.getTime() - firstThu.getTime()) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}w${week}`;
}

const easternDay = (iso: string) => easternToday(new Date(iso));

/**
 * The point ticks the member has earned but that are not yet kept.
 * Messages: one per step a contact has reached (announcement, follow-up 1,
 * follow-up 2) and one for a reply, at most ten newly kept per day.
 * Ten-a-day: a day on which ten names show it as their last contact, at most
 * four per week. It is counted when Today sees it, so a day can be missed
 * (a later follow-up moves a name's date on), but never counted twice.
 * Calls: once the coaching-not-therapy note (ADR-0029) and "never my therapy client" are both ticked for that person.
 */
export function pointTicksToKeep(
  contacts: DueContact[],
  ticks: { move_id: string; done_at: string }[],
  /** Name points stop at the list target (250, or 50 on the free tier), so
   *  padding the list or adding and deleting earns nothing extra (lane check). */
  nameCap = 250,
  today = easternToday(),
): string[] {
  const have = new Set(ticks.map((t) => t.move_id));
  const out: string[] = [];
  const add = (id: string) => {
    if (!have.has(id)) {
      have.add(id);
      out.push(id);
    }
  };

  let names = [...have].filter((id) => id.startsWith("s1-p-n-")).length;
  for (const c of contacts) {
    if (names >= nameCap) break;
    const id = `s1-p-n-${short(c.id)}`;
    if (!have.has(id)) {
      add(id);
      names++;
    }
  }

  let messagesToday = ticks.filter(
    (t) => /^s1-p-[mr]-/.test(t.move_id) && easternDay(t.done_at) === today,
  ).length;
  for (const c of contacts) {
    const s = short(c.id);
    const steps = Math.max(STAGE[c.correspondence] ?? 0, c.first_contact_date ? 1 : 0);
    const ids = [1, 2, 3].filter((n) => n <= steps).map((n) => `s1-p-m-${s}-${n}`);
    if (REPLIED.has(c.status)) ids.push(`s1-p-r-${s}`);
    for (const id of ids) {
      if (have.has(id)) continue;
      if (messagesToday >= MESSAGES_PER_DAY) break;
      add(id);
      messagesToday++;
    }
  }

  const perDay = new Map<string, number>();
  for (const c of contacts) {
    if (c.last_contact_date) perDay.set(c.last_contact_date, (perDay.get(c.last_contact_date) ?? 0) + 1);
  }
  const keptDays = [...have].filter((id) => id.startsWith("s1-p-d-")).map((id) => id.slice(7));
  for (const [day, n] of [...perDay].sort()) {
    if (n < 10) continue;
    const ymd = day.replace(/-/g, "");
    if (have.has(`s1-p-d-${ymd}`)) continue;
    const week = isoWeek(day);
    const sameWeek = keptDays.filter(
      (k) => isoWeek(`${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`) === week,
    ).length;
    if (sameWeek >= TEN_DAYS_PER_WEEK) continue;
    add(`s1-p-d-${ymd}`);
    keptDays.push(ymd);
  }

  // Calls: only once the member has ticked both the coaching-not-therapy note
  // and "never my therapy client" for that person (lane check; Don, m20 "4.
  // Yes", 19 Nov). The biggest reward must not pay for a dual relationship.
  if (CALL_POINTS_ON) {
    for (const c of contacts) {
      const s = short(c.id);
      if (CALL.has(c.status) && have.has(`s6-note-${s}`) && have.has(`s6-ok-${s}`)) add(`s1-p-c-${s}`);
    }
  }

  return out;
}

/** Names added this week (Monday to Sunday, Eastern). */
export function namesThisWeek(contacts: { created_at: string }[], today = easternToday()): number {
  const week = isoWeek(today);
  return contacts.filter((c) => isoWeek(easternDay(c.created_at)) === week).length;
}
