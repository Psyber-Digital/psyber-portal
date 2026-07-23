// Transactional email via Resend's REST API — no SDK dependency, just fetch.
// Server-only: this file reads RESEND_API_KEY and must never be imported into a
// client component. It's used from admin server actions.

import { pad, stripWeekPrefix } from "@/lib/week";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
// Verified sending identity (same domain as the Supabase auth mail).
const FROM = "Psyber Digital <noreply@psyberdigital.com>";
// Replies go to Asher's inbox, not the unmonitored noreply address.
const REPLY_TO = "asher@psyberdigital.com";

function portalUrl(path = "/portal") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://psyber-portal.vercel.app").replace(
    /\/$/,
    "",
  );
  return `${base}${path}`;
}

// Low-level send. Throws on missing key or a non-2xx Resend response, so callers
// can treat email as best-effort (try/catch) without it ever masking a failure.
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, reply_to: REPLY_TO, to, subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  }
}

// "Week NN is open" delivery email, sent when a client's week is unlocked.
// Voice mirrors the portal's own copy so email and portal read as one hand.
export async function sendWeekUnlockEmail({
  to,
  name,
  weekNumber,
  weekTitle,
}: {
  to: string;
  name?: string | null;
  weekNumber: number;
  weekTitle: string;
}): Promise<void> {
  const first = (name ?? "").trim().split(/\s+/)[0] || "there";
  const wk = pad(weekNumber);
  const title = stripWeekPrefix(weekTitle);
  const subject = `Week ${wk} is open — ${title}`;
  const url = portalUrl("/portal");

  const text = `Hi ${first},

Week ${wk} — ${title} is now open in your portal.

When you have a focused half-hour: watch the short pre-work video first, then open the workbook and have a first go. Bring it rough — half-formed answers are exactly right; we finish it together on our call. Keep the resources to hand as you work.

Open your portal: ${url}

See you in the room,
Asher · Psyber Digital`;

  const html = weekUnlockHtml({ first, wk, title, url });
  await sendEmail({ to, subject, html, text });
}

// Self-contained, inline-styled HTML for broad email-client support. Light
// background, navy text, a single blue action button (the "path forward"
// colour). No external images or fonts, so nothing to block or fail to load.
function weekUnlockHtml({
  first,
  wk,
  title,
  url,
}: {
  first: string;
  wk: string;
  title: string;
  url: string;
}): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f4f7fb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border:1px solid #e3e9f2;border-radius:16px;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif;">
          <tr>
            <td style="height:4px;background:#1E90FF;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:30px 34px 8px 34px;">
              <div style="font-size:12px;letter-spacing:3px;color:#5a6784;text-transform:uppercase;font-weight:700;">Psyber&nbsp;&middot;&nbsp;Digital</div>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 34px 0 34px;">
              <div style="font-size:12px;letter-spacing:2px;color:#1E90FF;text-transform:uppercase;font-weight:700;">Your program</div>
              <h1 style="margin:8px 0 2px 0;font-size:23px;line-height:1.25;color:#0B1220;font-weight:700;">Week ${esc(wk)} is open</h1>
              <div style="font-size:16px;color:#465066;">${esc(title)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 34px 0 34px;">
              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#28324a;">Hi ${esc(first)},</p>
              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#28324a;">Week ${esc(wk)} — ${esc(title)} is now open in your portal.</p>
              <p style="margin:0 0 22px 0;font-size:15px;line-height:1.6;color:#28324a;">When you have a focused half-hour: watch the short pre-work video first, then open the workbook and have a first go. Bring it rough — half-formed answers are exactly right; we finish it together on our call. Keep the resources to hand as you work.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:2px 34px 6px 34px;">
              <a href="${esc(url)}" style="display:inline-block;background:#1E90FF;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 26px;border-radius:10px;">Open your portal &rarr;</a>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 34px 30px 34px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#28324a;">See you in the room,<br><strong style="color:#0B1220;">Asher</strong> &middot; Psyber Digital</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 34px;border-top:1px solid #eef2f8;">
              <p style="margin:0;font-size:12px;color:#8894a8;">Psyber Digital &middot; <a href="https://psyberdigital.com" style="color:#5a6784;">psyberdigital.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
