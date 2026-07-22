import type { ReactNode } from "react";

// Rich, per-week copy for the "this week" experience: the coach's framing note,
// the time budget, and the blurb for each of the three steps. Only weeks with
// real content have a guide; others fall back to generic copy in the components.
// Append a new numbered entry as each session's content is produced.

export type BudgetPart = { value: string; label: string };

export type WeekGuide = {
  /** Welcome-banner intro paragraph (falls back to week.description). */
  bannerIntro?: string;
  /** Framing note from the coach. */
  note?: { fromLabel: string; initial: string; body: ReactNode };
  /** Time budget shown under the note. */
  budget?: { total: string; parts: BudgetPart[] };
  /** Per-step copy. */
  videoStep?: { mins: string; title: string; blurb: ReactNode };
  workbookStep?: {
    mins: string;
    title: string;
    blurb: ReactNode;
    caveat: ReactNode;
  };
  resourcesStep?: { blurb: string };
};

export const WEEK_GUIDE: Record<number, WeekGuide> = {
  1: {
    bannerIntro:
      "Mapping your baseline, and the shift from therapist to coach. Everything you need for this session is below — work through it top to bottom, then book your live call.",
    note: {
      fromLabel: "A Note From Your Coach",
      initial: "D",
      body: (
        <>
          Before our first session, watch the short video and skim the Playbook — together they lay
          out the whole picture, so we can spend our actual time together on <em>you</em>, not on
          slides. Then open the Foundations Workbook and have a first go.{" "}
          <strong>Bring it rough</strong> — half-formed answers, question marks,{" "}
          &ldquo;I&rsquo;m not sure&rdquo;, all welcome. You&rsquo;re not meant to finish it alone;
          we finish it together on the call.
        </>
      ),
    },
    budget: {
      total: "55 minutes",
      parts: [
        { value: "4½ min", label: "to watch" },
        { value: "50 min", label: "for the workbook" },
      ],
    },
    videoStep: {
      mins: "approx 4½ min",
      title: "Pre-work video — the model shift",
      blurb: (
        <>
          The whole picture in a few minutes: the lens flip from therapist to coach, the four
          pillars, the offer ladder and the five-stage build. Watch this before you open the
          workbook — it carries all the teaching, so our live hour is spent on <em>you</em>.
        </>
      ),
    },
    workbookStep: {
      mins: "approx 50 min",
      title: "Your Foundations Workbook",
      blurb: (
        <>
          Four short reflective sections — mindset shifts, limiting beliefs, regulating emotions,
          and your commitment. Built for depth, not volume: a few honest, specific answers beat
          every box filled. Open it in your browser and have a first go.{" "}
          <strong>Bring it rough</strong> — we finish it together on the call.
        </>
      ),
      caveat: (
        <>
          ⚠ Your answers are saved in <strong>this browser only</strong> — they won&rsquo;t follow
          you to another device, and clearing your history erases them. When you&rsquo;re done, use{" "}
          <strong>Download PDF</strong> inside the workbook to keep a permanent copy.
        </>
      ),
    },
    resourcesStep: {
      blurb:
        "Pin these up as you work. They're your reference for the whole programme — return to them as you build.",
    },
  },
};

export const weekGuide = (n: number): WeekGuide | undefined => WEEK_GUIDE[n];
