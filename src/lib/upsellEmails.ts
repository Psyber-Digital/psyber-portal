import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailShellHtml, escHtml, paragraphsHtml, portalUrl } from "@/lib/email";
import { sendOnce, type Kind, type Rendered } from "@/lib/buildEmails";
import { currentStep, ladderStart, PRICE, type Step } from "@/lib/ladder";
import { buildOnSale } from "@/lib/sale";

// Upgrade emails to Build Free members (the tier is still "foundations" in
// code). Wording: Offer-Ladder/build/FOUNDATIONS-UPSELL-ladder-draft.md (v3,
// yearly only), approved for the $300 launch week on card EM (25 Nov 2026).
// The one-on-one emails A, B and C keep the wording Don approved on card m03
// (5 Nov 2026). Change the words in the drafts first, get his approval, then here.
// Every email as it renders: Offer-Ladder/build/UPGRADE-EMAILS-READY.md.
//
// Two tracks, chosen by the sign-up question:
//   "Yes, tell me more"  A, B, C (one-on-one) in the 14 days after sign-up,
//                        then the Build emails below
//   "Not right now"      the Build emails below
// The Build emails follow the launch ladder (lib/ladder.ts), counted from
// ladderStart: sign-up, or the day Build went on sale for anyone who joined
// before. Every price and deadline comes from currentStep, so it is always the
// real one. The numbers are the draft's:
//   1 Session 1 is ready          ladder days 2 to 4, Session 1 not finished
//   2 The weekly drop-in          ladder days 5 to 6
//   3, 4, 5 Last day of $300, $200, $100 off: the final 24 hours of that step
//   6 Your niche                  from ladder day 28, at full price
//   7 Session 1 done              once Session 1 is finished: the moment it is,
//                                 or on sale day for anyone who finished before
//   8 Your list is full           once the list holds 50 names
// Nobody gets these once they join Build, unsubscribe, or have a call booked.
// People who used to pay for Build get none of them.
// The old $99 first-month clock (0016) is retired: nothing here starts it,
// and finishCore undoes it.
//
// Unlike the Build member emails, these are marketing, so each one carries an
// unsubscribe link and a postal address.

export const STRATEGY_CALL_URL = "https://calendly.com/psyberdigital/coaching-application";
const POSTAL_ADDRESS = "EdInfinitum Ltd, trading as Psyber Digital, 71-75 Shelton Street, London, WC2H 9JQ";
const ET = "America/New_York";
const DAY = 24 * 60 * 60 * 1000;

// The ladder emails log under their own ref, so nothing sent under the old
// $99 wording (ref "1") can stop the new email with the same kind going out.
const LADDER_REF = "ladder";
const ONE_ON_ONE: UpsellKind[] = ["upsell_a", "upsell_b", "upsell_c"];

export type UpsellKind = Extract<Kind, `upsell_${string}`>;

// The profile fields that decide what a member gets.
export type UpsellPerson = {
  id: string;
  email: string | null;
  full_name: string | null;
  tier: string | null;
  lapsed_at: string | null;
  created_at: string;
  wants_one_on_one: boolean | null;
  session1_finished_at: string | null;
  list_full_at: string | null;
};
const FIELDS =
  "id, email, full_name, tier, lapsed_at, created_at, wants_one_on_one, session1_finished_at, list_full_at";

// The old $99 first-month offer's helpers. No email uses them now. The portal
// pages still import them, so they stay as they were.
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

// ---- Deadlines, always read from the real step end -------------------------

// The calendar date in Eastern time, as yyyy-mm-dd.
function etDate(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: ET });
}
function etDay(d: Date) {
  return d.toLocaleDateString("en-US", { timeZone: ET, month: "long", day: "numeric" });
}
// "3:14pm", "9am", or "midnight". Minutes are cut, never rounded up, so the
// time we print is never later than the real end.
function etClock(d: Date) {
  const s = d.toLocaleTimeString("en-US", { timeZone: ET, hour: "numeric", minute: "2-digit", hour12: true });
  if (/^12:00[\s ]*AM$/i.test(s)) return "midnight";
  return s.replace(/[\s ]*(AM|PM)$/i, (_, m: string) => m.toLowerCase()).replace(/:00(?=[ap]m)/, "");
}
function isEtMidnight(d: Date) {
  return etClock(d) === "midnight";
}

// For "until {date}". A step that ends at midnight Eastern is shown as
// "midnight Eastern at the end of December 3", so nobody reads "December 4" and
// thinks December 4 is still included, and the time printed is the real end.
export function untilText(endsAt: Date) {
  if (isEtMidnight(endsAt)) return `midnight Eastern at the end of ${etDay(new Date(endsAt.getTime() - 60_000))}`;
  return `${etDay(endsAt)} at ${etClock(endsAt)} Eastern`;
}

// For the last-day emails, which go in the final 24 hours of a step:
// "midnight Eastern tonight", "3:14pm Eastern today", "9am Eastern tomorrow".
export function endsSoon(endsAt: Date, now: Date) {
  const clock = etClock(endsAt);
  const lastMinute = new Date(endsAt.getTime() - 60_000);
  if (clock === "midnight" && etDate(lastMinute) === etDate(now))
    return { tonight: true, at: "at midnight Eastern tonight", when: "midnight Eastern tonight" };
  const word = etDate(endsAt) === etDate(now) ? "today" : etDate(endsAt) === etDate(new Date(now.getTime() + DAY)) ? "tomorrow" : `on ${etDay(endsAt)}`;
  return { tonight: false, at: `at ${clock} Eastern ${word}`, when: `${clock} Eastern ${word}` };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const priceOf = (step: Step | null) => PRICE.yearly - (step?.off ?? 0);
const nextPriceOf = (step: Step) => PRICE.yearly - (step.next?.off ?? 0);
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

// ---- Who is due what --------------------------------------------------------

const LAST_DAY: Record<number, UpsellKind> = { 300: "upsell_3", 200: "upsell_4", 100: "upsell_5" };

// Every email this person could be sent now, most important first. Pure, so
// every path can be tested without a database. The sender sends the first one
// not already in the log, so each email goes once and a sent one is never
// resent. At most one email goes per run.
export function dueEmails(p: UpsellPerson, now = new Date()): UpsellKind[] {
  // Never anyone on Build, and never anyone who has paid for it before.
  if ((p.tier && p.tier !== "foundations") || p.lapsed_at) return [];

  const t = now.getTime();
  const sinceSignup = (t - new Date(p.created_at).getTime()) / DAY;
  const start = ladderStart(p);
  const ladderOn = Boolean(start && t >= start.getTime());
  const step = ladderOn ? currentStep(p, now) : null;
  const full: UpsellKind[] = p.list_full_at && ladderOn ? ["upsell_8"] : [];

  // One-on-one choosers: the call invitations for their first 14 days after
  // sign-up, whether Build is on sale or not. Unchanged from card m03.
  if (p.wants_one_on_one === true && sinceSignup < 14) {
    const abc: UpsellKind = sinceSignup >= 7 ? "upsell_c" : sinceSignup >= 3 ? "upsell_b" : "upsell_a";
    return [abc, ...full];
  }

  if (!start || !ladderOn) return [];
  const d = (t - start.getTime()) / DAY;
  const finished = Boolean(p.session1_finished_at);
  const out: UpsellKind[] = [];

  // A real deadline inside 24 hours beats everything else.
  if (step && step.endsAt.getTime() - t <= DAY) out.push(LAST_DAY[step.off]);
  if (finished) out.push("upsell_7");
  out.push(...full);
  if (step && step.off === 300 && d >= 1 && d < 4 && !finished) out.push("upsell_1");
  if (step && d >= 4 && d < 6) out.push("upsell_2");
  if (!step && d >= 27) out.push("upsell_6");
  return out.filter(Boolean);
}

/** The first email due now, or null. */
export function dueEmail(p: UpsellPerson, now = new Date()): UpsellKind | null {
  return dueEmails(p, now)[0] ?? null;
}

// ---- Unsubscribe ------------------------------------------------------------

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

// ---- The words --------------------------------------------------------------

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
const JOIN = portalUrl("/portal/billing");
// "Do it in your own time" is a headline Build message (Codex VOICE-20261125-1).
// It is about the pace of the work, never about putting off joining.
const BUILD_OWN_TIME =
  "In Build, you keep doing it in your own time, at the pace a full caseload allows. Next Move shows you one clear step at a time, so you always know what to do next. And a live drop-in every week means you're never stuck on your own.";
const GUARANTEE =
  "We stay with you until your first paying coaching client signs, as long as you do the work and keep at it. That's our 90-Day Guarantee.";

// The line under the button. With a saving, the first year's price; then the full price.
function priceLine(step: Step | null) {
  return step
    ? `${usd(priceOf(step))} your first year, then ${usd(PRICE.yearly)} a year. Renews automatically each year until you cancel. Cancel online any time.`
    : `${usd(PRICE.yearly)} a year. Renews automatically each year until you cancel. Cancel online any time.`;
}

export type DraftPerson = Pick<UpsellPerson, "created_at" | "lapsed_at" | "wants_one_on_one" | "session1_finished_at">;

export function draftFor(kind: UpsellKind, p: DraftPerson, now = new Date()): Draft {
  const step = currentStep(p, now);
  const until = step ? untilText(step.endsAt) : "";
  const price = usd(priceOf(step));
  const finished = Boolean(p.session1_finished_at);

  // The last-day emails, 3 to 5, share one shape.
  const lastDay = (s: Step) => {
    const soon = endsSoon(s.endsAt, now);
    const next = usd(nextPriceOf(s));
    return { soon, next, now: usd(priceOf(s)) };
  };

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

    // 1. Session 1 is ready (ladder day 2).
    case "upsell_1":
      return {
        subject: "Session 1 is ready for you",
        preheader: step
          ? `Do it in your own time. And $${step.off} off your first year of Build until ${until}.`
          : "Do it in your own time. Your first tangible step is ready.",
        eyebrow: "Your first step",
        body: [
          "Session 1 is open in your portal and ready for you. Do it in your own time: no fixed schedule, no class to keep up with.",
          { quote: "This is your first tangible step. Take it tonight!" },
          "In one evening, you'll:",
          {
            list: [
              "Watch the session video",
              "Make a plan for what could knock you off course, like a packed week at the practice",
              "Start your contact list, where the method looks for your first clients",
            ],
          },
          ...(step
            ? [`Join Build by ${until} and you save $${step.off}: your first year is ${price} instead of ${usd(PRICE.yearly)}.`, BUILD_OWN_TIME]
            : [BUILD_OWN_TIME]),
        ],
        cta: OPEN_SESSION,
        ps: { text: "Questions first? Reply, and it comes straight to me." },
      };

    // 2. The weekly drop-in (ladder day 5).
    case "upsell_2":
      return {
        subject: "Your next question doesn't have to wait",
        preheader: step
          ? `Do it in your own time, with a live answer every week. ${price} for your first year until ${until}.`
          : "Do it in your own time, with a live answer every week.",
        eyebrow: "Your offer",
        body: [
          "With Build, you do it in your own time. No fixed schedule. You move at the pace a full caseload allows.",
          "Your own time, with a live answer every week. One pitfall of going it alone is months spent on the wrong thing, because one question went unanswered.",
          { quote: "Bring your next decision to the weekly drop-in. Get help with your next move." },
          "In Build, there's a live drop-in on video every week. The time is in your portal. Bring any question about your program, like:",
          {
            list: [
              "The two niches you're torn between",
              "The price you're not sure about",
              "The first message you're about to send",
            ],
          },
          "Can't make it live? Drop-ins are recorded, so you can catch up in the portal.",
          ...(step
            ? [`Your first year of Build is ${price} instead of ${usd(PRICE.yearly)} until ${until}. After that, your first year is ${usd(nextPriceOf(step))}.`]
            : []),
        ],
        cta: { label: "Join Build", href: JOIN },
        after: [priceLine(step)],
      };

    // 3. Last day: $300 off (the final 24 hours of week 1).
    case "upsell_3": {
      if (!step) return draftFor("upsell_6", p, now);
      const { soon, next, now: today } = lastDay(step);
      return {
        subject: `${soon.tonight ? "Last day" : "Final 24 hours"}: $${step.off} off your first year of Build`,
        preheader: `${cap(soon.at)}, your first year goes up to ${next}.`,
        eyebrow: "Your offer",
        body: [
          `Your $${step.off} saving ends ${soon.at}.`,
          { quote: soon.tonight ? `Tonight: ${today} for your first year. Tomorrow: ${next}.` : `Until ${soon.when}: ${today} for your first year. After that: ${next}.` },
          "Do it in your own time, with Next Move showing you one clear step at a time, plus every session, all the resources, and a live drop-in every week.",
          finished
            ? "Choosing your niche opens the moment you join."
            : "Join, finish Session 1, and choosing your niche opens right after.",
          "Change your mind within 14 days of paying? Ask, and you get a full refund.",
        ],
        cta: { label: `Join Build for ${today}`, href: JOIN },
        after: [priceLine(step)],
      };
    }

    // 4. Last day: $200 off (the final 24 hours of week 2).
    case "upsell_4": {
      if (!step) return draftFor("upsell_6", p, now);
      const { soon, next, now: today } = lastDay(step);
      return {
        subject: `${soon.tonight ? "Last day" : "Final 24 hours"}: $${step.off} off your first year of Build`,
        preheader: `${cap(soon.at)}, your first year goes up to ${next}.`,
        eyebrow: "Your offer",
        body: [
          `Your $${step.off} saving ends ${soon.at}.`,
          { quote: soon.tonight ? `Tonight: ${today} for your first year. Tomorrow: ${next}.` : `Until ${soon.when}: ${today} for your first year. After that: ${next}.` },
          `${soon.tonight ? "Tonight" : `Until ${soon.when}`}, ${today} opens every session, every resource and a live drop-in every week. Do it in your own time, and never lose a month to the wrong thing. ${soon.tonight ? "Tomorrow" : "After that"}, the same year costs ${usd(nextPriceOf(step) - priceOf(step))} more.`,
        ],
        cta: { label: `Join Build for ${today}`, href: JOIN },
        after: [priceLine(step)],
      };
    }

    // 5. Last chance: $100 off (the final 24 hours of week 3).
    case "upsell_5": {
      if (!step) return draftFor("upsell_6", p, now);
      const { soon, next, now: today } = lastDay(step);
      return {
        subject: `${soon.tonight ? "Last chance" : "Final 24 hours"}: $${step.off} off your first year of Build`,
        preheader: `After ${soon.when}, Build is ${next} a year.`,
        eyebrow: "Your offer",
        body: [
          `Your last $${step.off} off ends ${soon.at}.`,
          { quote: soon.tonight ? `Tonight: ${today} for your first year. After tonight, it's ${next}.` : `Until ${soon.when}: ${today} for your first year. After that, it's ${next}.` },
          `This is your last launch saving, and each person gets it once. ${soon.tonight ? "After tonight" : `After ${soon.when}`}, Build is full price. Launch your coaching program in your own time, with Next Move showing you one clear step at a time.`,
        ],
        cta: { label: `Join Build for ${today}`, href: JOIN },
        after: [priceLine(step)],
      };
    }

    // 6. Your niche (ladder day 28, full price, no countdown).
    case "upsell_6":
      return {
        subject: "Your next decision: your niche",
        preheader: "Everything after Session 2 depends on that decision.",
        eyebrow: "Your next step",
        body: [
          finished
            ? "Your niche is the decision everything else is built on: your message, your price, your first conversation. You've finished Session 1. Next is Session 2, where you make it."
            : "Your niche is the decision everything else is built on: your message, your price, your first conversation. Your next move is Session 1, then Session 2, where you make it.",
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
          `It's ${usd(PRICE.yearly)} a year, under $84 a month, with a 14-day full refund. It renews automatically each year until you cancel.`,
        ],
        cta: { label: "Join Build", href: JOIN },
        ps: {
          link: {
            before: finished
              ? "Join Build tonight, and choosing your niche opens straight away:"
              : "Join Build tonight, and every session after Session 1 opens as you go:",
            href: JOIN,
            after: ".",
          },
          text: "Have a question first? Reply, and it comes straight to me.",
        },
      };

    // 7. Session 1 done (when they finish it, or on sale day if they already had).
    case "upsell_7":
      return {
        subject: "Session 1 done. Your niche is next",
        preheader: step
          ? `Your first year of Build for ${price} until ${until}.`
          : "Choosing your niche opens the moment you join.",
        eyebrow: step ? "Your offer" : "Your next step",
        body: [
          "You finished Session 1! You've got a plan for the weeks that try to knock you off course, and your contact list has started. That's real work, and it's done.",
          "Next is Session 2: your niche. You can start it now in your portal. Choosing your niche opens in Build.",
          ...(step ? [{ quote: `Your first year of Build for ${price} instead of ${usd(PRICE.yearly)}. Until ${until}.` }] : []),
          "With Build, you do it in your own time: no fixed schedule, at the pace a full caseload allows. You get all the resources you need, plus a live drop-in every week.",
          "We designed Build for people who want to go it alone, because they don't need constant support, and who want to avoid the pitfalls. Too much information. Second-guessing every decision. Months spent on the wrong thing. Here's how Build tackles them:",
          {
            list: [
              "Every session in order, each with its video, Working Sheet and Principle Card",
              "Only what matters next: each session opens as you finish the one before",
              "A live drop-in on video every week, for help before a wrong turn costs you weeks",
              "Recordings of the drop-ins, so you can catch up after a busy week",
              "No limit on your contact list. Build Free holds 50 names, and the method works toward 250",
            ],
          },
          "Work through the program, and you'll have a coaching program you own: who it's for, what it offers, what it costs, and who you'll talk to first.",
          ...(step
            ? [step.next ? `After ${until}, your first year is ${usd(nextPriceOf(step))}.` : `After ${until}, it's ${usd(PRICE.yearly)} a year.`]
            : []),
          ...(p.wants_one_on_one ? ["If you'd still like one-on-one support, you can book a call from your account."] : []),
        ],
        cta: { label: "Join Build", href: JOIN },
        after: [priceLine(step)],
        ps: {
          link: step
            ? { before: `Join by ${until} to save $${step.off}:`, href: JOIN, after: "." }
            : { before: "Join Build here:", href: JOIN, after: "." },
          text: "Choosing your niche opens the moment you join.",
        },
      };

    // 8. Your list is full (at 50 names).
    case "upsell_8":
      return {
        subject: "Your list is full: 50 names",
        preheader: "The method works toward 250. Build has no limit.",
        eyebrow: "Your contact list",
        body: [
          "You've put 50 names on your list. That's real work.",
          { quote: "Your current plan holds 50 names. The method works toward 250." },
          "Your list is where the method looks for your first clients, so this is no time to stop adding to it. To add more, join Build.",
          "We designed Build for people who want to go it alone and avoid the pitfalls. You get every session, all the resources, and a live drop-in every week.",
          step
            ? `Your first year is ${price} instead of ${usd(PRICE.yearly)} until ${until}. It renews automatically each year until you cancel. Cancel online any time.`
            : `It's ${usd(PRICE.yearly)} a year, and you can cancel online any time. It renews automatically each year until you cancel.`,
        ],
        cta: { label: "Join Build and keep adding", href: JOIN },
      };
  }
}

// ---- Rendering --------------------------------------------------------------

// Build: ™ on every mention. The free plan shows as "Build™ Free" (Brand.tsx).
const tm = (s: string) =>
  s.replace(/\bBuild\b(?!™)/g, "Build™").replace(/\bFoundations\b(?!™)/, "Foundations™");
// Build: bold orange with ™ every time. Build Free: orange, with its Build part
// bold with ™, as in the portal. Foundations: orange, ™ on first mention.
function brandHtml(escaped: string, seen: { foundations: boolean }) {
  return escaped
    .replace(/\bBuild\b(?! Free)/g, '<strong style="color:#F08328;">Build™</strong>')
    .replace(/\bBuild Free\b/g, '<span style="color:#F08328;"><strong>Build™</strong> Free</span>')
    .replace(/\bFoundations\b/g, () => {
      const mark = seen.foundations ? "" : "™";
      seen.foundations = true;
      return `<span style="color:#F08328;">Foundations${mark}</span>`;
    });
}

export function renderUpsell(
  kind: UpsellKind,
  p: Pick<UpsellPerson, "id" | "email" | "full_name"> & DraftPerson,
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
      }${d.ps.text ? `${d.ps.link ? " " : ""}${b(d.ps.text)}` : ""}`
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
    ? `P.S. ${d.ps.link ? `${d.ps.link.before} ${d.ps.link.href}${d.ps.link.after ?? ""}` : ""}${d.ps.text ? `${d.ps.link ? " " : ""}${d.ps.text}` : ""}`
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

// ---- Sending ----------------------------------------------------------------

// Sends whatever this one person is due now: at most one email. Used by the
// daily job and, so the "the moment they..." emails aren't held until the next
// run, straight after confirming an email, finishing Session 1 and filling the
// list. Best-effort: a mail problem must never break the page that called it.
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
    const p = data as UpsellPerson | null;
    if (!p?.email) return report;

    // Never market to an address that hasn't been confirmed.
    const { data: auth } = await admin.auth.admin.getUserById(userId);
    if (!auth.user?.email_confirmed_at) return report;

    // Build not on sale yet: only the one-on-one call invitations go out
    // (Don, 21 Nov 2026). The Build-selling emails (1 to 8) also stay off
    // until UPSELL_BUILD_EMAILS is "true" (Don, 22 Nov 2026), even once Build
    // is on sale.
    const onSale = buildOnSale() && process.env.UPSELL_BUILD_EMAILS === "true";
    let due = dueEmails(p, now);
    if (!onSale) due = due.filter((k) => ONE_ON_ONE.includes(k));

    for (const kind of due) {
      const ref = ONE_ON_ONE.includes(kind) ? "1" : LADDER_REF;
      const result = await sendOnce(userId, kind, ref, renderUpsell(kind, p, now));
      report.push({ kind, to: p.email, result });
      if (result !== "already") break;
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
