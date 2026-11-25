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
export const buildOnSale = (): boolean =>
  process.env.BUILD_ON_SALE === "true" && !Number.isNaN(Date.parse(process.env.BUILD_SALE_STARTS_AT ?? ""));

export const OPENS_SOON =
  "Build™ opens soon! Until then, Session 1 is yours, free. Dive in!";

// For a free member whose launch saving hasn't started yet (card D2 = A).
export const SAVING_WAITS =
  "Build™ opens soon! When it does, you unlock $300 off your first year for 7 days. Until then, Session 1 is yours, free. Dive in!";
