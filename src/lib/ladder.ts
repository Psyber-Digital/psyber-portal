// Build's prices and launch ladder (Don, 21 Nov 2026, Codex ADR-0027 addendum 6):
// $997 a year, yearly only (Don, 23 Nov 2026; monthly at $97 was dropped). The yearly plan is cheaper the sooner someone
// upgrades, counted from their free sign-up: $300 off in week 1, $200 off in
// week 2, $100 off in week 3, then the full $997. There is no monthly plan, so no
// discount. Every deadline is real and decided here, on the server.
//
// Each saving is a once-only Stripe coupon with the same id in test and live.
//
// When the clock starts (Don, card D2 = A, 21 Nov 2026): at sign-up, or on the
// day Build goes on sale if they signed up before then, so nobody loses saving
// days while they can't buy. BUILD_SALE_STARTS_AT holds that moment (an ISO
// date-time). With it unset, nobody's clock runs and the free version says the
// saving starts when Build opens. Terms 3.7 says the same.

export const PRICE = { yearly: 997 } as const;

const DAY = 24 * 60 * 60 * 1000;

export const LADDER = [
  { untilDay: 7, off: 300, coupon: "build_year_300" },
  { untilDay: 14, off: 200, coupon: "build_year_200" },
  { untilDay: 21, off: 100, coupon: "build_year_100" },
] as const;

export type Step = { off: number; coupon: string; endsAt: Date; next?: { off: number } };

type Person = { created_at: string; lapsed_at?: string | null };

/** The moment Build went (or goes) on sale, or null if not set. */
export function saleStartsAt(): Date | null {
  const t = Date.parse(process.env.BUILD_SALE_STARTS_AT ?? "");
  return Number.isNaN(t) ? null : new Date(t);
}

/** When this person's saving clock starts, or null while there is no sale date. */
export function ladderStart(p: Person): Date | null {
  const sale = saleStartsAt();
  if (!sale) return null;
  return new Date(Math.max(new Date(p.created_at).getTime(), sale.getTime()));
}

/** True for someone whose saving hasn't started yet because Build isn't on
 *  sale: they see "your saving starts when Build opens", never a countdown. */
export function savingWaiting(p: Person, now = new Date()): boolean {
  if (p.lapsed_at) return false;
  const start = ladderStart(p);
  return !start || now.getTime() < start.getTime();
}

/** The yearly saving open to this person now, or null. Anyone who has paid
 *  for Build before gets no ladder: it is a welcome, once. */
export function currentStep(p: Person, now = new Date()): Step | null {
  if (p.lapsed_at) return null;
  const from = ladderStart(p);
  if (!from || now.getTime() < from.getTime()) return null;
  const start = from.getTime();
  for (let i = 0; i < LADDER.length; i++) {
    const endsAt = new Date(start + LADDER[i].untilDay * DAY);
    if (now.getTime() < endsAt.getTime()) {
      const n = LADDER[i + 1];
      return { off: LADDER[i].off, coupon: LADDER[i].coupon, endsAt, next: n ? { off: n.off } : undefined };
    }
  }
  return null;
}
