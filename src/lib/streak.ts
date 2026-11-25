import { easternToday } from "./dueMoves";

// The daily streak (Don, card AD, 25 Nov 2026): days in a row, Eastern time,
// with at least one move the member ticked themselves. Points and badges are
// kept as ticks by the page itself, so they don't count. A streak stays alive
// until the end of the day after the last move, so nobody loses it at breakfast,
// and one missed day between moves is forgiven.
const AUTO = /^s1-p-|badge/;

function dayBefore(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function streakOf(ticks: { move_id: string; done_at: string }[], today = easternToday()) {
  const days = new Set(ticks.filter((t) => !AUTO.test(t.move_id)).map((t) => easternToday(new Date(t.done_at))));
  const doneToday = days.has(today);
  let day = doneToday ? today : dayBefore(today);
  // Missed yesterday only: still alive, counting from the day before.
  if (!doneToday && !days.has(day)) day = dayBefore(day);
  // Forgiving (research check, 25 Nov 2026): one missed day in a row is let
  // off, so a busy clinic day never wipes a streak. Two in a row ends it.
  let count = 0;
  while (days.has(day) || (count > 0 && days.has(dayBefore(day)))) {
    if (!days.has(day)) day = dayBefore(day);
    count += 1;
    day = dayBefore(day);
  }
  return { days: count, doneToday };
}
