// Server-side check of a Cloudflare Turnstile token (see join/Turnstile.tsx).
//
// TURNSTILE_SECRET_KEY unset means the check is off and every sign-up passes,
// with a warning in the logs. That keeps sign-up working until the keys are
// added (go-live runbook, block C). The test site uses Cloudflare's public
// practice keys, which always pass.
export async function turnstileOk(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("turnstile: no secret key set, check skipped");
    return true;
  }
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      cache: "no-store",
    });
    const out = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!out.success) console.warn("turnstile: failed", out["error-codes"]);
    return out.success === true;
  } catch (e) {
    console.error("turnstile: siteverify unreachable", e);
    return false;
  }
}
