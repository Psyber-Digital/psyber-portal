// "Your next move": the moves that come back on a date (board card m05, built
// at Don's yes, 18 Nov 2026; map section "The moves that come back").
//
// Worked out from the member's own list, read under their own login (contacts
// are owner-only, 0005). Nothing here is stored except the member's own ticks
// for the few cards they dismiss with Done.
//
// "Today" is Eastern time, the same clock the Build offer uses. Members are
// US-based, and a UTC day would roll over mid-evening for all of them.

import type { ContactStatus, ContactCorrespondence, Tier } from "./types";
import type { MoveOpens } from "./moves";

export type DueContact = {
  id: string;
  status: ContactStatus;
  correspondence: ContactCorrespondence;
  first_contact_date: string | null;
  last_contact_date: string | null;
  next_followup_date: string | null;
  created_at: string;
  /** Shown on the one card that must name the person (never my therapy client). */
  name?: string;
};

export type DueMove = {
  key: string;
  title: string;
  why: string;
  opens: Exclude<MoveOpens, "none" | "video">;
  /** Overrides the session's own link, for a card about an earlier sheet. */
  href?: string;
  /** Ticks saved when the member presses Done. Empty = no Done button: the
   *  card goes when The List changes. */
  tickIds: string[];
  /** The Done button's words, when "Done" would be the wrong word. */
  doneLabel?: string;
  /** A second answer that also clears the card. */
  alt?: { label: string; tickIds: string[] };
};

export function easternToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ISO week, so "this week" turns over on Monday.
function isoWeek(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow + 3);
  const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d.getTime() - firstThu.getTime()) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}w${String(week).padStart(2, "0")}`;
}

const short = (id: string) => id.replace(/-/g, "").slice(0, 12);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Ids the dated cards may tick. Checked before a tick is saved. */
export const DUE_TICK_PATTERN =
  /^s[1-7]-(names-\d{4}w\d{2}|ten-\d{8}|note-[0-9a-f]{12}|ok-[0-9a-f]{12}|was-[0-9a-f]{12}|won-[0-9a-f]{12}|price-\d{1,2})$/;

export function dueMoves({
  contacts,
  session,
  tier,
  ticked,
  today = easternToday(),
  listMoveOpen = false,
}: {
  contacts: DueContact[];
  session: number;
  tier: Tier | undefined;
  ticked: Set<string>;
  today?: string;
  /** The session's own "add names" move is still open, so the weekly card would repeat it. */
  listMoveOpen?: boolean;
}): DueMove[] {
  const out: DueMove[] = [];
  const s = `s${Math.min(Math.max(session, 1), 7)}`;
  const live = (c: DueContact) => !["converted", "not_interested"].includes(c.status);

  // Follow-up 1: three days after the announcement went to them.
  const fu1 = contacts.filter(
    (c) =>
      c.correspondence === "message_1" &&
      c.status === "contacted" &&
      (c.last_contact_date ?? c.first_contact_date ?? "9999") <= addDays(today, -3),
  );
  if (fu1.length)
    out.push({
      key: "fu1",
      title: `Send follow-up 1 to ${plural(fu1.length, "person", "people")}`,
      why: "“Did anyone come to mind?” It’s the easiest one to skip, and it gives them a second chance to reply.",
      opens: "list",
      tickIds: [],
    });

  // Follow-up 2: ten days after the announcement. The last one.
  const fu2 = contacts.filter(
    (c) =>
      c.correspondence === "follow_up_1" &&
      c.status === "contacted" &&
      (c.first_contact_date
        ? c.first_contact_date <= addDays(today, -10)
        : (c.last_contact_date ?? "9999") <= addDays(today, -7)),
  );
  if (fu2.length)
    out.push({
      key: "fu2",
      title: `Send follow-up 2, the last one, to ${plural(fu2.length, "person", "people")}`,
      why: "Keep it light, and leave the next step with them.",
      opens: "list",
      tickIds: [],
    });

  // Follow-up dates the member set by hand on The List.
  const counted = new Set([...fu1, ...fu2].map((c) => c.id));
  const manual = contacts.filter(
    (c) => live(c) && !counted.has(c.id) && !!c.next_followup_date && c.next_followup_date <= today,
  );
  if (manual.length)
    out.push({
      key: "due",
      title: `${plural(manual.length, "follow-up you set is", "follow-ups you set are")} due`,
      why: "The List shows who, and when you said you'd get back to them.",
      opens: "list",
      tickIds: [],
    });

  // A discovery call is booked: the coaching-not-therapy note goes first (ADR-0029).
  const booked = contacts.filter((c) => c.status === "call_booked" && !ticked.has(`s6-note-${short(c.id)}`));
  if (booked.length)
    out.push({
      key: "note",
      title: `Send your coaching-not-therapy note to ${plural(booked.length, "person", "people")} with a call booked`,
      why: "Send it before each discovery call. It’s at the top of your call guide.",
      opens: "list",
      tickIds: booked.map((c) => `s6-note-${short(c.id)}`),
    });

  // And each person with a call booked was never the member's therapy client
  // (Don, board m20 "4. Yes", 19 Nov 2026; lane check). A discovery call earns
  // its points only once this and the note are both ticked.
  // One card per person, by name, so one tap never vouches for someone else.
  // Asked from the call onwards, including anyone moved straight to an offer
  // or a sale on The List (lane check, 19 Nov).
  const talking = contacts.filter(
    (c) =>
      ["call_booked", "offer_made", "converted"].includes(c.status) &&
      !ticked.has(`s6-ok-${short(c.id)}`) &&
      !ticked.has(`s6-was-${short(c.id)}`),
  );
  for (const c of talking)
    out.push({
      key: `ok-${c.id}`,
      title: `Confirm ${c.name?.trim() || "this person"} has never been your therapy client`,
      why: "Never offer coaching to a current or former therapy client. If they have been, cancel the call kindly and don't offer coaching. You can still thank them and ask who they know.",
      opens: "list",
      tickIds: [`s6-ok-${short(c.id)}`],
      doneLabel: "Never my therapy client",
      // The honest other answer clears the card too, and earns nothing (member test, 19 Nov).
      alt: { label: "They were. I've cancelled", tickIds: [`s6-was-${short(c.id)}`] },
    });

  // An offer is made and they're still deciding.
  const deciding = contacts.filter((c) => c.status === "offer_made");
  if (deciding.length)
    out.push({
      key: "offer",
      title: `${plural(deciding.length, "person is", "people are")} deciding on your offer`,
      why: "Have the short call you booked, before the 48 hours are up.",
      opens: "list",
      tickIds: [],
    });

  // A new client.
  const converted = contacts.filter((c) => c.status === "converted");
  const newWins = converted.filter((c) => !ticked.has(`s7-won-${short(c.id)}`));
  if (newWins.length)
    out.push({
      key: "won",
      title: newWins.length === 1 ? "A new client. Congratulations." : `${newWins.length} new clients. Congratulations.`,
      why: "Deliver your first session, then build session two from how it went.",
      opens: "sheet",
      href: "/session-05/Session-05-Working-Sheet.html",
      tickIds: newWins.map((c) => `s7-won-${short(c.id)}`),
    });

  // After every three clients, the price goes up by $1,000 (ADR-0028).
  for (let k = 1; k <= Math.floor(converted.length / 3) && k <= 99; k++) {
    if (ticked.has(`s7-price-${k}`)) continue;
    out.push({
      key: `price-${k}`,
      title: "Raise your price by $1,000",
      why: `You’ve signed ${k * 3} clients. Every three, your price goes up.`,
      opens: "sheet",
      href: "/session-06/Session-06-Working-Sheet.html",
      tickIds: [`s7-price-${k}`],
    });
    break; // one at a time
  }

  // Today's ten, from Session 7 on.
  if (session >= 7) {
    const tenId = `s7-ten-${today.replace(/-/g, "")}`;
    const sentToday = contacts.filter((c) => c.last_contact_date === today).length;
    if (sentToday < 10 && !ticked.has(tenId))
      out.push({
        key: "ten",
        title: sentToday ? `Today’s ten: ${sentToday} sent so far` : "Today’s ten",
        why: "New names, follow-ups and replies all count. Not an outreach day? Press Done to clear it.",
        opens: "list",
        tickIds: [tenId],
      });
  }

  // Add names, once a week, Sessions 1 to 6.
  if (session <= 6 && !listMoveOpen && !(tier === "foundations" && contacts.length >= 50)) {
    const wk = `${s}-names-${isoWeek(today)}`;
    if (!ticked.has(wk)) {
      const weekStart = addDays(today, -6);
      const added = contacts.filter((c) => c.created_at.slice(0, 10) >= weekStart).length;
      out.push({
        key: "names",
        title: "Add names to your list",
        why: added
          ? `You’ve added ${added} this week. Keep going as people come to mind.`
          : "Anyone who comes to mind this week. Not your current therapy clients. Former therapy clients can go on, only to ask who they know.",
        opens: "list",
        tickIds: [wk],
      });
    }
  }

  return out;
}
