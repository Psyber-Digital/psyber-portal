// Is Build on sale? (Don, 21 Nov 2026: free Session 1 goes live Mon 23 Nov;
// Build goes on sale later, target Fri 27 Nov.) Off unless the server setting
// BUILD_ON_SALE is exactly "true". While it is off:
//   - nobody can reach a payment: the billing page and checkout say Build opens soon
//   - no Build-selling email sends, and the $99 first-month clock, which the
//     database starts when Session 1 is finished (0016), is reset by
//     finishSession so it starts fresh on sale day
//   - the one-on-one track's call invitations (emails A, B, C) still send
// Turn it on in the live project's settings on the day Build goes on sale.
export const buildOnSale = (): boolean => process.env.BUILD_ON_SALE === "true";

export const OPENS_SOON =
  "Build™ opens soon. Until then, Session 1 is yours, free.";
