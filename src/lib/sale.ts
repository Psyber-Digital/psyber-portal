// Is Build on sale? (Don, 21 Nov 2026: free Session 1 goes live Mon 23 Nov;
// Build goes on sale later, target Fri 27 Nov.) Off unless the server setting
// BUILD_ON_SALE is exactly "true". While it is off:
//   - nobody can reach a payment: the billing page and checkout say Build opens soon
//   - no Build-selling email sends, and nobody's launch saving runs: the
//     ladder (lib/ladder.ts) starts at BUILD_SALE_STARTS_AT for anyone who
//     joined before it (Don, card D2 = A). Set both on sale day.
//   - the old $99 first-month clock (0016) is reset by finishCore every time,
//     on sale or not; the ladder replaced it. The upgrade emails must drop
//     their 'start_offer' step before UPSELL_BUILD_EMAILS is turned on.
//   - the one-on-one track's call invitations (emails A, B, C) still send
// Turn it on in the live project's settings on the day Build goes on sale.
// On sale only when the sale date is set too, so a page can never promise a
// saving the ladder can't give (lane-guard, 22 Nov 2026).
// The sale opens by itself at BUILD_SALE_STARTS_AT, so both settings can be
// put in place the day before (Friday sale setup, 26 Nov 2026). Every page
// that asks is rendered per request, so no redeploy is needed at the hour.
export const buildOnSale = (now: number = Date.now()): boolean => {
  if (process.env.BUILD_ON_SALE !== "true") return false;
  const start = Date.parse(process.env.BUILD_SALE_STARTS_AT ?? "");
  return !Number.isNaN(start) && now >= start;
};

export const OPENS_SOON =
  "Build™ opens soon! Until then, Session 1 and a preview of Session 2 are yours, free. Dive in!";

// For a free member whose launch saving hasn't started yet (card D2 = A).
export const SAVING_WAITS =
  "Build™ opens soon! When it does, you unlock $300 off your first year for 7 days. Until then, Session 1 and a preview of Session 2 are yours, free. Dive in!";
