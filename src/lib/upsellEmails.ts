import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailShellHtml, escHtml, paragraphsHtml, portalUrl } from "@/lib/email";
import { sendOnce, type Kind, type Rendered } from "@/lib/buildEmails";
import { buildOnSale } from "@/lib/sale";

// Upsell emails to Foundations members. Wording approved by Don on board card
// m03, 5 Nov 2026: Offer-Ladder/build/FOUNDATIONS-UPSELL-draft.md. Change the
// words there first, get his approval, then here.
//
// Two tracks, chosen by the sign-up question:
//   "Yes, tell me more"  A, B, C (one-on-one), then the Build emails from day 14
//   "Not right now"      1 to 7 (Build)
// Email 8 goes to either track when the free list fills.
// Nobody gets these once they join Build, unsubscribe, or have a call booked.
// People who used to pay for Build get none of them.
//
// Unlike the Build member emails, these are marketing, so each one carries an
// unsubscribe link and a postal address.

export const STRATEGY_CALL_URL = "https://calendly.com/psyberdigital/coaching-application";
const POSTAL_ADDRESS = "EdInfinitum Ltd, trading as Psyber Digital, 71-75 Shelton Street, London, WC2H 9JQ";
const ET = "America/New_York";
const DAY = 24 * 60 * 60 * 1000;

const OFFER_TERMS =
  "$99 for your first month, then $149 a month. Renews automatically until you cancel. Cancel online any time.";

export type UpsellKind = Extract<Kind, `upsell_${string}`>;

// The profile fields that decide what a member gets.
export type UpsellPerson = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  wants_one_on_one: boolean | null;
  session1_finished_at: string | null;
  offer_started_at: string | null;
  offer_ends_at: string | null;
  list_full_at: string | null;
};
const FIELDS =
  "id, email, full_name, created_at, wants_one_on_one, session1_finished_at, offer_started_at, offer_ends_at, list_full_at";

// The calendar date in Eastern time, as yyyy-mm-dd.
function etDate(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: ET });
}

// The offer ends at midnight, so the date people read is the day before.
export function deadlineDay(endsAt: string) {
  return new Date(new Date(endsAt).getTime() - 60_000).toLocaleDateString("en-US", {
    timeZone: ET,
    month: "long",
    day: "numeric",
  });
}

export function offerOpen(p: { offer_ends_at: string | null }, now = new Date()) {
  return Boolean(p.offer_ends_at && now.getTime() < new Date(p.offer_ends_at).getTime());
}

// What this person is due today, or "start_offer" if their clock must start
// first. Pure, so every path can be tested without a database. Emails already
// sent are skipped by the log, so a due email that has gone is simply not resent.
export function dueEmail(p: UpsellPerson, now = new Date()): UpsellKind | "start_offer" | null {
  const t = now.getTime();
  const days = (t - new Date(p.created_at).getTime()) / DAY;
  const yes = p.wants_one_on_one === true;

  if (yes && days < 14) {
    if (days >= 7) return "upsell_c";
    if (days >= 3) return "upsell_b";
    return "upsell_a";
  }

  if (!p.session1_finished_at) {
    const start = yes ? 14 : 2;
    if (days >= start + 5) return "upsell_2";
    if (days >= start) return "upsell_1";
    return null;
  }

  if (!p.offer_started_at || !p.offer_ends_at) return "start_offer";

  if (offerOpen(p, now)) {
    const last = new Date(new Date(p.offer_ends_at).getTime() - 60_000);
    if (etDate(now) === etDate(last)) return "upsell_6";
    if (etDate(new Date(t + DAY)) === etDate(last)) return "upsell_5";
    if (t - new Date(p.offer_started_at).getTime() >= 3 * DAY) return "upsell_4";
    return "upsell_3";
  }

  if (t - new Date(p.session1_finished_at).getTime() >= 21 * DAY) return "upsell_7";
  return null;
}

// Unsubscribe links are signed, so nobody can unsubscribe someone else.
export function unsubscribeToken(userId: string) {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error("UNSUBSCRIBE_SECRET is not set");
  return createHmac("sha256", secret).update(`unsubscribe:${userId}`).digest("hex");
}
export function unsubscribeTokenOk(userId: string, token: string) {
  const want = Buffer.from(unsubscribeToken(userId));
  const got = Buffer.from(token);
  return want.length === got.length && timingSafeEqual(want, got);
}
export function unsubscribeUrl(userId: string) {
  return portalUrl(`/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`);
}

type Block = string | { quote: string } | { list: string[] };
type Link = { before: string; href: string; after?: string };
type Draft = {
  subject: string;
  preheader: string;
  eyebrow: string;
  body: Block[];
  cta: { label: string; href: string };
  after?: string[]; // Under the button, above the sign-off.
  ps?: { link?: Link; text?: string };
};

const OPEN_SESSION = { label: "Open Session 1", href: portalUrl("/portal") };
const BOOK = { label: "Book a call", href: STRATEGY_CALL_URL };
const CLAIM = { label: "Claim my $99 first month", href: portalUrl("/portal/billing") };
const JOIN = portalUrl("/portal/billing");
const GUARANTEE =
  "We stay with you until your first paying coaching client signs, as long as you do the work and keep at it. That's our 90-Day Guarantee.";

export function draftFor(kind: UpsellKind, p: Pick<UpsellPerson, "offer_ends_at" | "wants_one_on_one">, now = new Date()): Draft {
  const open = offerOpen(p, now);
  const deadline = p.offer_ends_at ? deadlineDay(p.offer_ends_at) : "";
  const session1 = OPEN_SESSION.href;

  switch (kind) {
    case "upsell_a":
      return {
        subject: "You asked about one-on-one support",
        preheader: "Start with a call. We'll look at where you are and how we'd build your program together.",
        eyebrow: "One-on-one support",
        body: [
          "When you signed up, you said you'd like personalized one-on-one support. Here's how to get it.",
          { quote: "Launch your coaching program with us beside you." },
          "Here's what you get:",
          {
            list: [
              "Seven one-on-one sessions and three clinics to build your program",
              "Personal feedback on your niche, message, offer and program",
              GUARANTEE,
            ],
          },
          "It starts with a call. We'll look at where you are and how we'd build your program together. Pick a time that suits you.",
        ],
        cta: BOOK,
        ps: {
          link: { before: "Book your call here:", href: STRATEGY_CALL_URL, after: "." },
          text: "We take on a small number of one-on-one clients at a time.",
        },
      };
    case "upsell_b":
      return {
        subject: "What one-on-one includes",
        preheader: "Seven sessions, three clinics and personal feedback on your work.",
        eyebrow: "One-on-one support",
        body: [
          "You asked about one-on-one support, so here's exactly what it includes.",
          { quote: "Seven one-on-one sessions and three clinics, with personal feedback on your work." },
          "We go through your program with you, decision by decision:",
          {
            list: [
              "Your niche: who it's for",
              "Your message: how you talk about it",
              "Your offer: what it includes and what it costs",
              "Your launch: who you talk to first",
            ],
          },
          "You build it with us. By the end, you're a coach, with a program you own.",
        ],
        cta: BOOK,
        ps: {
          link: { before: "Book your call here:", href: STRATEGY_CALL_URL, after: "." },
          text: "Questions first? Reply, and it comes straight to me.",
        },
      };
    case "upsell_c":
      return {
        subject: "What happens on your call",
        preheader: "What we'll cover in 45 minutes, including the price.",
        eyebrow: "One-on-one support",
        body: [
          "Here's how we'll spend your call.",
          { quote: "In 45 minutes, you'll know if it's a fit, how it would work and what it costs." },
          "On the call, we'll:",
          {
            list: [
              "Hear what your week looks like now",
              "Talk about what you want coaching to bring you, in hours and in income",
              "Tell you honestly whether it's a fit",
              "If it is, map your route from that week to your first coaching client, and tell you what it costs, so you can decide",
            ],
          },
          "Every week you wait is another week your program isn't for sale.",
        ],
        cta: { label: "Pick a time", href: STRATEGY_CALL_URL },
        ps: { link: { before: "Pick a time for your call here:", href: STRATEGY_CALL_URL, after: "." } },
      };
    case "upsell_1":
      return {
        subject: "Session 1 is ready for you",
        preheader: "Your first tangible step. Finish it, and your first month of Build is $99.",
        eyebrow: "Your first step",
        body: [
          "Your Foundations account is open, and Session 1 is ready.",
          { quote: "This is your first tangible step. Take it tonight." },
          "In one evening, you'll:",
          {
            list: [
              "Watch the session video",
              "Make a plan for what could knock you off course, like a packed week at the practice",
              "Start your contact list, where the method looks for your first clients",
            ],
          },
          "Finish Session 1 and there's a reward. Your first month of Build is $99 instead of $149, and you'll have 7 days to claim it.",
        ],
        cta: OPEN_SESSION,
        ps: {
          link: { before: "Session 1 is waiting:", href: session1, after: "." },
          text: "Questions first? Reply, and it comes straight to me.",
        },
      };
    case "upsell_2":
      return {
        subject: "You're one evening from starting your coaching program",
        preheader: "Finish Session 1 and your first month of Build is $99.",
        eyebrow: "Your first step",
        body: [
          "A short one. You opened your account a week ago. That was the commitment. Session 1 is what turns it into a start.",
          { quote: "One evening. One video. One Working Sheet." },
          "When you mark it complete, your 7-day Build offer begins: your first month for $99 instead of $149.",
          "Every week you wait is another week your income stays tied to your therapy hours.",
        ],
        cta: OPEN_SESSION,
      };
    case "upsell_3":
      return {
        subject: "Session 1 done. Your Build offer is open",
        preheader: `Your first month for $99 instead of $149. It ends on ${deadline}.`,
        eyebrow: "Your offer",
        body: [
          "You finished Session 1. You have a plan for what could knock you off course, and your contact list is started. Everything ahead builds on it.",
          "Next is Session 2: your niche. It opens in Build.",
          { quote: `Your first month of Build for $99 instead of $149. Until ${deadline}.` },
          "Launch your coaching program at your own pace, with all the resources you need, plus a live drop-in every week.",
          "We designed Build for people who want to go it alone, because they don't need constant support, and who want to avoid the pitfalls. Too much information. Second-guessing every decision. Months spent on the wrong thing. Here's how Build tackles them:",
          {
            list: [
              "Every session in order, each with its video, Working Sheet and Principle Card",
              "Only what matters next: each session opens as you finish the one before",
              "A live drop-in on video every week, for help before a wrong turn costs you weeks",
              "Recordings of the drop-ins, so you can catch up after a busy week",
              "No limit on your contact list. Foundations holds 50 names, and the method works toward 250",
            ],
          },
          "Work through the program, and you'll have a coaching program you own: who it's for, what it offers, what it costs, and who you'll talk to first.",
          `After ${deadline}, the first month goes back to $149. This offer doesn't come back.`,
          ...(p.wants_one_on_one ? ["If you'd still like one-on-one support, you can book a call from your account."] : []),
        ],
        cta: CLAIM,
        after: [OFFER_TERMS],
        ps: {
          link: { before: `Claim your $99 first month by ${deadline}:`, href: JOIN, after: "." },
          text: "Session 2 opens the moment you join.",
        },
      };
    case "upsell_4":
      return {
        subject: "Your next question doesn't have to wait",
        preheader: `A live answer every week, with Build. Your $99 first month ends on ${deadline}.`,
        eyebrow: "Your offer",
        body: [
          "One pitfall of going it alone is months spent on the wrong thing, because one question went unanswered.",
          { quote: "Bring your next decision to Wednesday's drop-in. Get help with your next move." },
          "In Build, there's a live drop-in on video every Wednesday at 12pm Eastern. Bring any question about your program, like:",
          {
            list: [
              "The two niches you're torn between",
              "The price you're not sure about",
              "The first message you're about to send",
            ],
          },
          "Can't make it live? Drop-ins are recorded, so you can catch up on the members' site.",
          `Your first month is $99 instead of $149 until ${deadline}.`,
        ],
        cta: CLAIM,
        after: [OFFER_TERMS],
        ps: {
          link: { before: `Join by ${deadline} and bring your first question to the next drop-in:`, href: JOIN, after: "." },
        },
      };
    case "upsell_5":
      return {
        subject: "Your $50 saving ends tomorrow",
        preheader: `After ${deadline}, your first month of Build goes back to $149.`,
        eyebrow: "Your offer",
        body: [
          "Tomorrow, your Build offer ends.",
          { quote: `After ${deadline}, your first month costs $149, not $99. This offer doesn't come back.` },
          "Here's where you stand. You've finished Session 1. Session 2, your niche, is next, and it's closed until you join.",
          "Join by tomorrow and you keep the $50, with every session, every resource and a live drop-in every week.",
        ],
        cta: CLAIM,
        after: [OFFER_TERMS],
      };
    case "upsell_6":
      return {
        subject: "Last day: your first month of Build for $99",
        preheader: "It ends at midnight Eastern tonight.",
        eyebrow: "Your offer",
        body: [
          "Your $99 first month ends at midnight Eastern tonight.",
          { quote: "At midnight, $99 becomes $149. This offer doesn't come back." },
          "Session 2 opens the moment you join.",
        ],
        cta: CLAIM,
        after: [OFFER_TERMS],
      };
    case "upsell_7":
      return {
        subject: "Your next decision: your niche",
        preheader: "Everything after Session 2 depends on that decision.",
        eyebrow: "Your next step",
        body: [
          "You finished Session 1 three weeks ago. Your next move is Session 2: your niche.",
          { quote: "Every week you wait is another week your program isn't for sale." },
          "The sessions ahead take it the whole way:",
          {
            list: [
              "Session 2: your niche",
              "Session 3: your message",
              "Session 4: your program's structure",
              "Session 5: the first session of your program",
              "Session 6: your offer and the conversation",
              "Session 7: launch",
            ],
          },
          "We designed Build for people who want to go it alone and avoid the pitfalls. You get every session, all the resources, and a live drop-in every week.",
          "It's $149 a month. Cancel online any time before your next payment. Or go yearly for $1,197, with a 14-day full refund. Both plans renew automatically until you cancel.",
        ],
        cta: { label: "Join Build", href: JOIN },
        ps: {
          link: { before: "Join Build and open Session 2 tonight:", href: JOIN, after: "." },
          text: "Have a question first? Reply, and it comes straight to me.",
        },
        after: [],
      };
    case "upsell_8":
      return {
        subject: "Your list is full: 50 names",
        preheader: "The method works toward 250. Build has no limit.",
        eyebrow: "Your contact list",
        body: [
          "You've put 50 names on your list. That's real work.",
          { quote: "Foundations holds 50 names. The method works toward 250." },
          "Your list is where the method looks for your first clients, so this is no time to stop adding to it. To add more, join Build.",
          "We designed Build for people who want to go it alone and avoid the pitfalls. You get every session, all the resources, and a live drop-in every week.",
          open
            ? `Your first month is $99 instead of $149 until ${deadline}. Then it's $149 a month, renewing automatically until you cancel. Cancel online any time.`
            : "It's $149 a month, and you can cancel online any time. It renews automatically until you cancel.",
        ],
        cta: { label: "Join Build and keep adding", href: JOIN },
      };
  }
}

const tm = (s: string) =>
  s.replace(/\bBuild\b(?!™)/g, "Build™").replace(/\bFoundations\b(?!™)/, "Foundations™");
// Build: bold orange with ™ every time. Foundations: orange, ™ on first mention.
function brandHtml(escaped: string, seen: { foundations: boolean }) {
  return escaped
    .replace(/\bBuild\b/g, '<strong style="color:#F08328;">Build™</strong>')
    .replace(/\bFoundations\b/g, () => {
      const mark = seen.foundations ? "" : "™";
      seen.foundations = true;
      return `<span style="color:#F08328;">Foundations${mark}</span>`;
    });
}

export function renderUpsell(
  kind: UpsellKind,
  p: Pick<UpsellPerson, "id" | "email" | "full_name" | "offer_ends_at" | "wants_one_on_one">,
  now = new Date(),
): Rendered {
  const d = draftFor(kind, p, now);
  const first = (p.full_name ?? "").trim().split(/\s+/)[0];
  const greeting = first ? `Hi ${first},` : "Hi,";
  const unsub = unsubscribeUrl(p.id);
  const seen = { foundations: false };
  const b = (s: string) => brandHtml(escHtml(s), seen);

  const bodyHtml = d.body
    .map((block) => {
      if (typeof block === "string") return paragraphsHtml([b(block)]);
      if ("quote" in block)
        return `              <p style="margin:6px 0 20px 0;padding:14px 18px;border-left:3px solid #1E90FF;background:#f4f7fb;font-size:18px;line-height:1.4;font-weight:700;color:#0B1220;">${b(block.quote)}</p>`;
      return `              <ul style="margin:0 0 16px 0;padding:0 0 0 20px;font-size:15px;line-height:1.6;color:#28324a;">${block.list
        .map((i) => `<li style="margin:0 0 6px 0;">${b(i)}</li>`)
        .join("")}</ul>`;
    })
    .join("\n");

  const afterHtml = (d.after ?? []).map(
    (s) => `<span style="font-size:13px;color:#5a6784;">${b(s)}</span>`,
  );
  const psHtml = d.ps
    ? `P.S. ${
        d.ps.link
          ? `${b(d.ps.link.before)} <a href="${escHtml(d.ps.link.href)}" style="color:#1E90FF;">${escHtml(d.ps.link.href.replace(/^https?:\/\//, ""))}</a>${d.ps.link.after ?? ""}`
          : ""
      }${d.ps.text ? ` ${b(d.ps.text)}` : ""}`
    : null;

  const footerHtml = `You're getting this because you have a Psyber Digital account. <a href="${escHtml(unsub)}" style="color:#5a6784;">Unsubscribe</a> from these emails.<br>${escHtml(POSTAL_ADDRESS)}`;

  const html = emailShellHtml({
    eyebrow: escHtml(tm(d.eyebrow)),
    greeting,
    paragraphs: [],
    bodyHtml,
    preheader: tm(d.preheader),
    ctaLabel: `${escHtml(tm(d.cta.label))} &rarr;`,
    url: d.cta.href,
    closingHtml: [...afterHtml, '— <strong style="color:#0B1220;">Asher</strong>', ...(psHtml ? [psHtml] : [])],
    footerHtml,
  });

  const textBody = d.body
    .map((block) => {
      if (typeof block === "string") return block;
      if ("quote" in block) return block.quote;
      return block.list.map((i) => `- ${i}`).join("\n");
    })
    .join("\n\n");
  const psText = d.ps
    ? `P.S. ${d.ps.link ? `${d.ps.link.before} ${d.ps.link.href}${d.ps.link.after ?? ""}` : ""}${d.ps.text ? ` ${d.ps.text}` : ""}`
    : "";
  const text = [
    greeting,
    textBody,
    `${d.cta.label}: ${d.cta.href}`,
    ...(d.after ?? []),
    "— Asher",
    ...(psText ? [psText] : []),
    `Unsubscribe from these emails: ${unsub}\n${POSTAL_ADDRESS}`,
  ]
    .join("\n\n")
    .replace(/\bBuild\b(?!™)/g, "Build™")
    .replace(/\bFoundations\b(?!™)/, "Foundations™");

  return {
    to: p.email ?? "",
    subject: tm(d.subject),
    text,
    html,
    headers: {
      "List-Unsubscribe": `<${unsub}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

// Sends whatever this one person is due now. Used by the daily job and, so the
// "the moment they..." emails aren't held until the next run, straight after
// confirming an email, finishing Session 1 and filling the list.
// Best-effort: a mail problem must never break the page that called it.
export async function sendDueUpsell(userId: string, now = new Date()) {
  const report: { kind: string; to: string; result: string }[] = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select(FIELDS)
      .eq("id", userId)
      .eq("tier", "foundations")
      .neq("role", "admin")
      .is("lapsed_at", null)
      .is("upsell_unsubscribed_at", null)
      .is("call_booked_at", null)
      .maybeSingle();
    let p = data as UpsellPerson | null;
    if (!p?.email) return report;

    // Never market to an address that hasn't been confirmed.
    const { data: auth } = await admin.auth.admin.getUserById(userId);
    if (!auth.user?.email_confirmed_at) return report;

    // Build not on sale yet: only the one-on-one call invitations go out, and
    // the $99 clock never starts (Don, 21 Nov 2026).
    // The Build-selling emails (1 to 8) still carry the old $99 offer. They stay
    // off until the new ladder wording is approved and wired in, even once
    // Build is on sale (Don, 22 Nov 2026: "all emails can be on hold until
    // this is done"). UPSELL_BUILD_EMAILS="true" turns them back on.
    const onSale = buildOnSale() && process.env.UPSELL_BUILD_EMAILS === "true";
    if (p.list_full_at && onSale) {
      const result = await sendOnce(userId, "upsell_8", "1", renderUpsell("upsell_8", p, now));
      report.push({ kind: "upsell_8", to: p.email, result });
    }

    let due = dueEmail(p, now);
    if (!onSale && due && !["upsell_a", "upsell_b", "upsell_c"].includes(due)) due = null;
    if (due === "start_offer") {
      const { data: ends } = await admin.rpc("start_first_month_offer", { p_user: userId });
      if (!ends) return report;
      p = { ...p, offer_started_at: now.toISOString(), offer_ends_at: ends as string };
      due = "upsell_3";
    }
    if (due) {
      const result = await sendOnce(userId, due, "1", renderUpsell(due, p, now));
      report.push({ kind: due, to: p.email!, result });
    }
  } catch (e) {
    console.error("upsell email failed:", e);
  }
  return report;
}

export async function runDailyUpsellEmails() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("tier", "foundations")
    .neq("role", "admin")
    .is("lapsed_at", null)
    .is("upsell_unsubscribed_at", null)
    .is("call_booked_at", null);
  const report: { kind: string; to: string; result: string }[] = [];
  for (const { id } of data ?? []) report.push(...(await sendDueUpsell(id)));
  return report;
}
