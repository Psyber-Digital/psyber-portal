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
          <strong>A loose first pass is exactly right</strong> — half-formed answers, question marks,{" "}
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
          <strong>A loose first pass</strong> — we finish it together on the call.
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
        "Pin these up as you work. They're your reference for the whole program — return to them as you build.",
    },
  },
  2: {
    bannerIntro:
      "Your niche — the who, and the what. This session is about generating options, not landing the answer: we score and choose together on the call. Work through it top to bottom, then book your call.",
    note: {
      fromLabel: "A Note From Your Coach",
      initial: "D",
      body: (
        <>
          Before this session, skim the <strong>Playbook</strong> and the three idea menus — they
          lay out why a niche matters and get your thinking moving. Then open the{" "}
          <strong>Niche Ideas Workbook</strong> and have a first go: a few transformations you&rsquo;d
          love to deliver, a few audiences that pull at you, and some rough &ldquo;I help&hellip;&rdquo;
          lines. <strong>A loose first pass is exactly right — and bring plenty.</strong> This is the
          generate half; we widen the field and choose together on the call. And keep every idea in
          the coaching lane — moving people from <em>well to better</em>, never treating a problem.
        </>
      ),
    },
    budget: {
      total: "50 minutes",
      parts: [
        { value: "skim", label: "the menus first" },
        { value: "50 min", label: "on the workbook" },
      ],
    },
    workbookStep: {
      mins: "approx 50 min",
      title: "Your Niche Ideas Workbook",
      blurb: (
        <>
          Three generative sections — the transformations you&rsquo;d love to deliver, the audiences
          you&rsquo;re best placed to help (especially the populations you know from clinical work),
          and the &ldquo;I help [audience] achieve [transformation]&rdquo; lines that fall out of
          them. Draft widely; more candidates, less polish, is exactly what we want. A fourth
          section — <em>Score &amp; Select</em> — is for our next session, so leave it for now.
        </>
      ),
      caveat: (
        <>
          ⚠ Your answers are saved in <strong>this browser only</strong> — they won&rsquo;t follow
          you to another device, and clearing your history erases them. When you&rsquo;re done, use{" "}
          <strong>Save as PDF</strong> inside the workbook to keep a permanent copy.
        </>
      ),
    },
    resourcesStep: {
      blurb:
        "The Playbook carries the thinking; the three menus are idea prompts (not exhaustive — add your own); the examples set the bar for specificity. The Selection Framework shows all eleven steps.",
    },
  },
};

export const weekGuide = (n: number): WeekGuide | undefined => WEEK_GUIDE[n];
