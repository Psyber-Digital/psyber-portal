// Build's prices and launch ladder (Don, 21 Nov 2026, Codex ADR-0027 addendum 6):
// $97 a month or $997 a year. The yearly plan is cheaper the sooner someone
// upgrades, counted from their free sign-up: $300 off in week 1, $200 off in
// week 2, $100 off in week 3, then the full $997. The monthly plan has no
// discount. Every deadline is real and decided here, on the server.
//
// Each saving is a once-only Stripe coupon with the same id in test and live.

export const PRICE = { monthly: 97, yearly: 997 } as const;

const DAY = 24 * 60 * 60 * 1000;

export const LADDER = [
  { untilDay: 7, off: 300, coupon: "build_year_300" },
  { untilDay: 14, off: 200, coupon: "build_year_200" },
  { untilDay: 21, off: 100, coupon: "build_year_100" },
] as const;

export type Step = { off: number; coupon: string; endsAt: Date; next?: { off: number } };

/** The yearly saving open to this person now, or null. Anyone who has paid
 *  for Build before gets no ladder: it is a welcome, once. */
export function currentStep(
  p: { created_at: string; lapsed_at?: string | null },
  now = new Date(),
): Step | null {
  if (p.lapsed_at) return null;
  const start = new Date(p.created_at).getTime();
  for (let i = 0; i < LADDER.length; i++) {
    const endsAt = new Date(start + LADDER[i].untilDay * DAY);
    if (now.getTime() < endsAt.getTime()) {
      const n = LADDER[i + 1];
      return { off: LADDER[i].off, coupon: LADDER[i].coupon, endsAt, next: n ? { off: n.off } : undefined };
    }
  }
  return null;
}
