// Transactional email via Resend's REST API — no SDK dependency, just fetch.
// Server-only: this file reads RESEND_API_KEY and must never be imported into a
// client component. It's used from admin server actions.

import { pad } from "@/lib/week";
import type { WeekEmail } from "@/lib/weekEmail";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
// Verified sending identity (same domain as the Supabase auth mail).
const FROM = "Psyber Digital <noreply@psyberdigital.com>";
// Replies go to Asher's inbox, not the unmonitored noreply address.
const REPLY_TO = "asher@psyberdigital.com";
// Where portal notifications addressed to the coach are delivered.
const COACH_INBOX = "asher@psyberdigital.com";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// The closing every client-facing email shares: the offer of help, then the
// sign-off. Raw HTML — developer-authored, never interpolated with user input.
const CLIENT_CLOSING_HTML = [
  "If anything comes up or you&rsquo;d like a hand, just reply to this email — it comes straight to me.",
  'Kindest regards,<br><strong style="color:#0B1220;">Asher</strong> &middot; Psyber Digital',
];

const CLIENT_CLOSING_TEXT = `If anything comes up or you'd like a hand, just reply to this email — it comes straight to me.

Kindest regards,
Asher · Psyber Digital`;

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

// Sends a week's hand-written unlock email. The bespoke subject + paragraphs come
// from weekEmail.ts; this only wraps them in the greeting, portal button, offer
// of help and sign-off that every one shares.
export async function sendWeekUnlockEmail({
  to,
  name,
  weekNumber,
  content,
}: {
  to: string;
  name?: string | null;
  weekNumber: number;
  content: WeekEmail;
}): Promise<void> {
  const first = (name ?? "").trim().split(/\s+/)[0];
  const greeting = first ? `Dear ${first},` : "Hello,";
  const wk = pad(weekNumber);
  const url = portalUrl("/portal");

  const text = `${greeting}

${content.paragraphs.join("\n\n")}

Open your portal: ${url}

${CLIENT_CLOSING_TEXT}`;

  const html = emailShellHtml({
    eyebrow: `Your program &middot; Week ${esc(wk)}`,
    greeting,
    paragraphs: content.paragraphs,
    ctaLabel: "Open your portal &rarr;",
    url,
    closingHtml: CLIENT_CLOSING_HTML,
  });
  await sendEmail({ to, subject: content.subject, html, text });
}

// The weekly check-in. Systematises the one intervention with a track record:
// the clients who finished were the ones who got a short "where are you?" every
// week. Copy lives in emails/check-in.txt so it can be edited without a deploy.
export async function sendCheckInEmail({
  to,
  name,
  content,
}: {
  to: string;
  name?: string | null;
  content: WeekEmail;
}): Promise<void> {
  const first = (name ?? "").trim().split(/\s+/)[0];
  const greeting = first ? `Dear ${first},` : "Hello,";
  const url = portalUrl("/portal");

  const text = `${greeting}

${content.paragraphs.join("\n\n")}

Open your portal: ${url}

${CLIENT_CLOSING_TEXT}`;

  const html = emailShellHtml({
    eyebrow: "Your program &middot; check-in",
    greeting,
    paragraphs: content.paragraphs,
    ctaLabel: "Open your portal &rarr;",
    url,
    closingHtml: CLIENT_CLOSING_HTML,
  });
  await sendEmail({ to, subject: content.subject, html, text });
}

// Tells a client the coach has left them a document, and — because these expire —
// how long they have to collect it. Sent every time, by design: a 48-hour window
// with no notification is a trap.
export async function sendSharedFileEmail({
  to,
  name,
  title,
  note,
  expiryLabel,
}: {
  to: string;
  name?: string | null;
  title: string;
  note: string;
  expiryLabel: string;
}): Promise<void> {
  const first = (name ?? "").trim().split(/\s+/)[0];
  const greeting = first ? `Dear ${first},` : "Hello,";
  const url = portalUrl("/portal/shared");

  const paragraphs = [
    `I've left a document for you in your portal: ${title}.`,
    ...(note ? [note] : []),
    `It's under Shared Files, and it will be available for ${expiryLabel} — after that it's removed automatically, so do grab it while it's there.`,
  ];

  const text = `${greeting}

${paragraphs.join("\n\n")}

Collect it here: ${url}

${CLIENT_CLOSING_TEXT}`;

  const html = emailShellHtml({
    eyebrow: "Shared Files &middot; A document for you",
    greeting,
    paragraphs,
    ctaLabel: "Collect your document &rarr;",
    url,
    closingHtml: CLIENT_CLOSING_HTML,
  });

  await sendEmail({
    to,
    subject: `A document for you — available for ${expiryLabel}`,
    html,
    text,
  });
}

// Tells the coach a client has sent work up. Goes to the reply-to inbox rather
// than to a client, so the closing is plainer.
export async function sendClientUploadEmail({
  clientName,
  clientEmail,
  title,
  note,
}: {
  clientName: string;
  clientEmail: string;
  title: string;
  note: string;
}): Promise<void> {
  const who = clientName || clientEmail || "A client";
  const url = portalUrl("/admin");

  const paragraphs = [
    `${who} has uploaded a document to Shared Files: ${title}.`,
    ...(note ? [`Their note: “${note}”`] : []),
    "It stays in the portal until you delete it.",
  ];

  const text = `${paragraphs.join("\n\n")}

Open the admin dashboard: ${url}`;

  const html = emailShellHtml({
    eyebrow: "Shared Files &middot; Client upload",
    greeting: "Hello,",
    paragraphs,
    ctaLabel: "Open the dashboard &rarr;",
    url,
    closingHtml: ['<strong style="color:#0B1220;">Psyber Digital</strong> &middot; portal notification'],
  });

  await sendEmail({ to: COACH_INBOX, subject: `${who} uploaded a document`, html, text });
}

// Self-contained, inline-styled HTML for broad email-client support. Light
// background, navy text, a single blue action button (the "path forward"
// colour). No external images or fonts, so nothing to block or fail to load.
//
// Every Psyber transactional email shares this shell. `paragraphs` and
// `greeting` are escaped (they can contain client-supplied text); `closingHtml`
// is raw because it is developer-authored and carries markup.
function emailShellHtml({
  eyebrow,
  greeting,
  paragraphs,
  ctaLabel,
  url,
  closingHtml,
}: {
  eyebrow: string;
  greeting: string;
  paragraphs: string[];
  ctaLabel: string;
  url: string;
  closingHtml: string[];
}): string {
  const bodyParas = paragraphs
    .map(
      (p) =>
        `              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#28324a;">${esc(
          p,
        )}</p>`,
    )
    .join("\n");
  const closing = closingHtml
    .map(
      (p, i) =>
        `              <p style="margin:${
          i === closingHtml.length - 1 ? "0" : "0 0 14px 0"
        };font-size:15px;line-height:1.6;color:#28324a;">${p}</p>`,
    )
    .join("\n");
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
            <td style="padding:28px 34px 4px 34px;">
              <div style="font-size:12px;letter-spacing:3px;color:#5a6784;text-transform:uppercase;font-weight:700;">Psyber&nbsp;&middot;&nbsp;Digital</div>
              <div style="margin-top:10px;font-size:12px;letter-spacing:2px;color:#1E90FF;text-transform:uppercase;font-weight:700;">${eyebrow}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 34px 0 34px;">
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#28324a;">${esc(greeting)}</p>
${bodyParas}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:6px 34px 6px 34px;">
              <a href="${esc(url)}" style="display:inline-block;background:#1E90FF;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 26px;border-radius:10px;">${ctaLabel}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 34px 30px 34px;">
${closing}
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
