import { createAdminClient } from "@/lib/supabase/admin";
import { emailShellHtml, portalUrl, sendEmail } from "@/lib/email";
import { stripe } from "@/lib/stripe";

// Build member emails (Offer Ladder m17). Wording approved by Don on board card
// r18, 29 Oct 2026: Offer-Ladder/build/BUILD-EMAILS-draft.md. Change the words
// there first, get his approval, then here.
//
// Server-only. Every send is logged in email_log (0014) and checked first, so a
// repeated webhook or a second cron run never sends the same email twice.
// With EMAIL_DRY_RUN=1, or no email key set, nothing is sent: the email is
// returned (and logged to the console) so it can be checked.

export type Kind = "cancel" | "place_7d" | "place_1d" | "renewal_yearly";
export type Rendered = { to: string; subject: string; text: string; html: string };

const CLOSING_TEXT = `If anything comes up or you'd like a hand, just reply to this email - it comes straight to me.

Kind regards,
Asher`;
const CLOSING_HTML = [
  "If anything comes up or you&rsquo;d like a hand, just reply to this email - it comes straight to me.",
  'Kind regards,<br><strong style="color:#0B1220;">Asher</strong>',
];

const DAY = 24 * 60 * 60 * 1000;

export function day(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// One month after the paid period ended, matching 0013 (interval '1 month').
export function placeDate(lapsedAt: Date) {
  const d = new Date(lapsedAt);
  d.setMonth(d.getMonth() + 1);
  return d;
}

function render(
  to: string,
  name: string | null,
  subject: string,
  eyebrow: string,
  paragraphs: string[],
  cta: { label: string; path: string },
): Rendered {
  const first = (name ?? "").trim().split(/\s+/)[0];
  const greeting = first ? `Hi ${first},` : "Hi,";
  const url = portalUrl(cta.path);
  const text = `${greeting}\n\n${paragraphs.join("\n\n")}\n\n${cta.label}: ${url}\n\n${CLOSING_TEXT}`;
  const html = emailShellHtml({
    eyebrow,
    greeting,
    paragraphs,
    ctaLabel: `${cta.label} &rarr;`,
    url,
    closingHtml: CLOSING_HTML,
  });
  return { to, subject, text, html };
}

// 1. When a member cancels.
export function cancelEmail(p: {
  to: string;
  name: string | null;
  endDate: Date;
  session: number;
  refund?: { paidOn: Date; deadline: Date };
}): Rendered {
  const end = day(p.endDate);
  const paras = [
    `Your Build membership is canceled. You keep everything until ${end}.`,
    "After that you move to Foundations. Session 1 and your contact list stay with you.",
    `We'll hold your place in the program until ${day(placeDate(p.endDate))}. Rejoin by then and you carry on from Session ${p.session}.`,
    "Changed your mind? You can renew from Manage billing on your account page, and you carry straight on.",
  ];
  if (p.refund)
    paras.push(
      `You paid on ${day(p.refund.paidOn)}. If you'd like a full refund, reply to this email by ${day(p.refund.deadline)}.`,
    );
  paras.push(`Until ${end}, the weekly clinic is still yours. Bring whatever you're working on.`);
  return render(p.to, p.name, `Your Build membership ends on ${end}`, "Your Build membership", paras, {
    label: "Manage billing",
    path: "/portal/billing",
  });
}

// 2. A week before their place runs out.
export function place7dEmail(p: {
  to: string;
  name: string | null;
  placeDate: Date;
  session: number;
  sessionTitle: string;
  completed: number;
}): Rendered {
  const pd = day(p.placeDate);
  return render(
    p.to,
    p.name,
    `Your place at Session ${p.session} is released on ${pd}`,
    "Your place in the program",
    [
      `You've already put in the work. ${p.completed} sessions done.`,
      `Your place at Session ${p.session}, ${p.sessionTitle}, is held for you until ${pd}.`,
      "After that, it's released. Your progress resets, and you'd start again at Session 1, walking every session you've finished all over again.",
      `Rejoin before ${pd} and you pick up exactly where you stopped, with the weekly clinic behind you for the next step.`,
      "You started this to build your coaching program. The quickest way to finish it is from where you are now.",
    ],
    { label: "Rejoin and keep my place", path: "/portal/billing" },
  );
}

// 2b. The day before their place runs out.
export function place1dEmail(p: {
  to: string;
  name: string | null;
  session: number;
  sessionTitle: string;
  completed: number;
}): Rendered {
  return render(
    p.to,
    p.name,
    `Last day to keep your place at Session ${p.session}`,
    "Your place in the program",
    [
      "Tomorrow, your place in the program is released.",
      `Your progress goes with it: ${p.completed} sessions finished, and your place at Session ${p.session}, ${p.sessionTitle}.`,
      "Come back after today and you start again at Session 1.",
      "Rejoin today and you keep all of it.",
    ],
    { label: "Rejoin and keep my place", path: "/portal/billing" },
  );
}

// 3. Yearly renewal reminder.
export function renewalEmail(p: {
  to: string;
  name: string | null;
  renewalDate: Date;
  amountCents: number;
}): Rendered {
  const rd = day(p.renewalDate);
  const amount = `$${(p.amountCents / 100).toLocaleString("en-US", {
    minimumFractionDigits: p.amountCents % 100 ? 2 : 0,
  })}`;
  return render(
    p.to,
    p.name,
    `Your Build membership renews on ${rd}`,
    "Your Build membership",
    [
      `Your yearly Build membership renews on ${rd}, and then each year until you cancel. Your card will be charged ${amount}.`,
      "Staying? It renews on its own and you carry straight on.",
      `To cancel, go to Manage billing on your account page before ${rd}. You keep Build until then.`,
      "Changed your mind after it renews? You can ask for a full refund within 14 days of the payment.",
      "The weekly clinic is the best place to bring what you're working on next.",
    ],
    { label: "Manage billing", path: "/portal/billing" },
  );
}

// Sends once per (user, kind, ref). Returns what happened, for the cron report.
export async function sendOnce(
  userId: string,
  kind: Kind,
  ref: string,
  email: Rendered,
): Promise<"sent" | "dry" | "already" | "failed"> {
  const admin = createAdminClient();
  const { data: seen } = await admin
    .from("email_log")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("ref", ref)
    .maybeSingle();
  if (seen) return "already";

  if (process.env.EMAIL_DRY_RUN === "1" || !process.env.RESEND_API_KEY) {
    console.log(`build email (dry run) ${kind} to ${email.to}: ${email.subject}\n${email.text}`);
    return "dry";
  }

  try {
    await sendEmail(email);
  } catch (e) {
    console.error(`build email ${kind} failed:`, e);
    return "failed";
  }
  await admin.from("email_log").insert({ user_id: userId, kind, ref });
  return "sent";
}

// "Session 04 — Structure" -> "Structure"
function sessionName(title: string | undefined, n: number) {
  const name = (title ?? "").split(/—|-/).slice(1).join("-").trim();
  return name || `Session ${n}`;
}

// The cancel email, called from the subscription sync when a member has just
// set their subscription to end. Yearly members within 14 days of paying also
// get the refund line (terms 4.3).
export async function maybeSendCancelEmail(userId: string, sub: {
  id: string;
  cancel_at_period_end: boolean;
  status: string;
  interval: string | null;
  periodEnd: number | null;
}) {
  if (!sub.cancel_at_period_end || sub.status !== "active" || !sub.periodEnd) return;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name, current_week, tier")
    .eq("id", userId)
    .single();
  if (!profile?.email || profile.tier !== "build") return;

  let refund: { paidOn: Date; deadline: Date } | undefined;
  if (sub.interval === "year") {
    const { data } = await stripe().invoices.list({ subscription: sub.id, status: "paid", limit: 1 });
    const paidAt = data[0]?.status_transitions?.paid_at;
    if (paidAt) {
      const paidOn = new Date(paidAt * 1000);
      const deadline = new Date(paidOn.getTime() + 14 * DAY);
      if (Date.now() < deadline.getTime()) refund = { paidOn, deadline };
    }
  }

  const email = cancelEmail({
    to: profile.email,
    name: profile.full_name,
    endDate: new Date(sub.periodEnd * 1000),
    session: Math.max(profile.current_week ?? 1, 1),
    refund,
  });
  return sendOnce(userId, "cancel", sub.id, email);
}

// The daily run: place reminders and yearly renewal reminders.
export async function runDailyBuildEmails() {
  const admin = createAdminClient();
  const now = Date.now();
  const report: { kind: Kind; to: string; result: string; due?: string }[] = [];

  const { data: weeks } = await admin.from("weeks").select("number, title");
  const titleOf = (n: number) => sessionName(weeks?.find((w) => w.number === n)?.title, n);

  // Lapsed members whose place is still held.
  const { data: lapsed } = await admin
    .from("profiles")
    .select("id, email, full_name, current_week, completed_week, lapsed_at")
    .eq("tier", "foundations")
    .not("lapsed_at", "is", null);
  for (const p of lapsed ?? []) {
    if (!p.email || !p.lapsed_at) continue;
    const pd = placeDate(new Date(p.lapsed_at));
    const left = pd.getTime() - now;
    // Nothing to lose if they hadn't got past Session 1.
    if (left <= 0 || (p.current_week ?? 1) <= 1) continue;
    const base = {
      to: p.email,
      name: p.full_name,
      session: p.current_week,
      sessionTitle: titleOf(p.current_week),
      completed: p.completed_week ?? 0,
    };
    if (left <= DAY) {
      report.push({ kind: "place_1d", to: p.email, due: pd.toISOString(), result: await sendOnce(p.id, "place_1d", p.lapsed_at, place1dEmail(base)) });
    } else if (left <= 7 * DAY) {
      report.push({ kind: "place_7d", to: p.email, due: pd.toISOString(), result: await sendOnce(p.id, "place_7d", p.lapsed_at, place7dEmail({ ...base, placeDate: pd })) });
    }
  }

  // Yearly members renewing in 21 days or fewer (terms 3.3 promise 15 to 30).
  const { data: subs } = await admin
    .from("subscriptions")
    .select("user_id, stripe_subscription_id, current_period_end, billing_interval, status, cancel_at_period_end")
    .eq("billing_interval", "year")
    .eq("status", "active")
    .eq("cancel_at_period_end", false);
  for (const s of subs ?? []) {
    if (!s.current_period_end || !s.stripe_subscription_id) continue;
    const renews = new Date(s.current_period_end);
    const left = renews.getTime() - now;
    if (left <= 0 || left > 21 * DAY) continue;
    const { data: p } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", s.user_id)
      .single();
    if (!p?.email) continue;
    // The amount comes from Stripe's next invoice, so a price change can't make it wrong.
    const preview = await stripe().invoices.createPreview({ subscription: s.stripe_subscription_id });
    const email = renewalEmail({ to: p.email, name: p.full_name, renewalDate: renews, amountCents: preview.amount_due });
    report.push({
      kind: "renewal_yearly",
      to: p.email,
      result: await sendOnce(s.user_id, "renewal_yearly", s.current_period_end, email),
    });
  }

  return report;
}
