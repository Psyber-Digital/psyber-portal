// Where sign-up and sign-in emails send people back to.
//
// The private test copy sits behind Vercel's login. A link opened from an
// email has no Vercel pass, so it stopped at the Vercel login page (Don's
// phone test, 30 Oct). On the test copy only, the link carries the pass
// Vercel already provides to the deployment. Never set TEST_SITE_EMAIL_BYPASS
// on the live project.
// `next` is where to land after the link is confirmed, e.g. the Build payment
// page for someone who signed up from a "Join Build" button.
export function confirmUrl(siteUrl: string, next?: string): string {
  const query = new URLSearchParams();
  if (next) query.set("next", next);
  const pass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (process.env.TEST_SITE_EMAIL_BYPASS === "1" && pass) {
    query.set("x-vercel-protection-bypass", pass);
    query.set("x-vercel-set-bypass-cookie", "true");
    console.log("email link: test-site pass added");
  }
  const q = query.toString();
  return `${siteUrl}/auth/confirm${q ? `?${q}` : ""}`;
}
