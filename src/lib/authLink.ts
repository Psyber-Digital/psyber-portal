// Where sign-up and sign-in emails send people back to.
//
// The private test copy sits behind Vercel's login. A link opened from an
// email has no Vercel pass, so it stopped at the Vercel login page (Don's
// phone test, 30 Oct). On the test copy only, the link carries the pass
// Vercel already provides to the deployment. Never set TEST_SITE_EMAIL_BYPASS
// on the live project.
export function confirmUrl(siteUrl: string): string {
  const url = `${siteUrl}/auth/confirm`;
  const pass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (process.env.TEST_SITE_EMAIL_BYPASS !== "1" || !pass) return url;
  const query = new URLSearchParams({
    "x-vercel-protection-bypass": pass,
    "x-vercel-set-bypass-cookie": "true",
  });
  console.log("email link: test-site pass added");
  return `${url}?${query}`;
}
