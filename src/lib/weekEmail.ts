// Per-week unlock email — each one written by hand, NOT a fill-in template.
// Sent when a client is bumped forward to that (published) week. Each email
// encourages the client, references the session just completed, previews the
// week now opening, and gives advice specific to that week. The greeting, the
// portal button, the offer of help and the sign-off are added by the composer
// in email.ts — everything here is the bespoke middle.
//
// A week with no entry here sends NO email (we never send generic filler).
// Add a new entry as each session's content is produced.
//
// Copy is US-spelled (client audience is US therapists — see codex-voice
// VOICE-20260723-4).

export type WeekEmail = {
  /** Bespoke subject line for this week. */
  subject: string;
  /** Bespoke body paragraphs, in order. */
  paragraphs: string[];
};

export const WEEK_EMAIL: Record<number, WeekEmail> = {
  1: {
    subject: "Week 01 is open — building your foundations",
    paragraphs: [
      "It was a real pleasure meeting you on our onboarding call. You came in with genuine clarity about why you’re doing this — that’s the best possible start, and I’m looking forward to the work ahead.",
      "Week 01 — Foundations is now open in your portal. This first week does two things: it gives you a clear view of the whole road ahead, and it brings some honest awareness to the mindset patterns and limiting beliefs that can quietly hold a therapist back from building a coaching business.",
      "My advice for this one: don’t rush the workbook. The reflective sections — the mindset shifts, the beliefs worth examining, how you steady yourself under pressure — reward honesty over polish. A few true, specific answers will do far more for our first session than a page of tidy ones.",
    ],
  },
  2: {
    subject: "Week 02 is open — finding your niche",
    paragraphs: [
      "Really good work in our first session. You’ve got the model shift clear now, and your foundations are in place — which is exactly the ground we needed before this next step.",
      "Week 02 — Niche is now open in your portal. This week is about the who and the what: the transformation you want to deliver, and the audience you’re best placed to serve. It’s the generate half, so we’re after plenty of ideas rather than the final answer — we widen the field and choose together on our call.",
      "A little advice for this one: go wide before you go narrow. Draft more niche ideas than feels sensible, and keep every one in the coaching lane — moving people from well to better, never treating a problem. Lean on the audiences you already know from your clinical years; that’s an advantage most coaches simply don’t have. And leave the scoring section for now — that’s for our next session together.",
    ],
  },
};

export const weekEmail = (n: number): WeekEmail | undefined => WEEK_EMAIL[n];
