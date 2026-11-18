// "Your next move": each session split into small moves, shown one at a time.
// Source: Next-Move/MOVES-DRAFT.md (draft 2, 18 Nov 2026), after lane, voice
// and method checks. War Room run psyber/2026-11-18-next-move.
//
// The videos, Working Sheets and resources are unchanged. A move only points
// at one of them. Wording here follows the map; change the map first.
//
// {meet} becomes "the drop-in" for Build members and "our next call" for
// one-on-one clients.

import type { Tier } from "./types";

export type MoveOpens =
  | "video"
  | "sheet"
  | "card"
  | "list"
  | "shared"
  | "none";

export type Move = {
  /** Stable id, saved in move_ticks. Never renumber: s<session>-<slug>. */
  id: string;
  title: string;
  why: string;
  mins?: string;
  opens: MoveOpens;
  /** Shown beside the button, e.g. "block 1". */
  where?: string;
  /** The session's closing move: the existing "Mark Session N complete". */
  finish?: boolean;
  /** Only these tiers see the move. Unset = everyone. */
  only?: Tier[];
};

const ONE_ON_ONE: Tier[] = ["flagship", "pending"];
const SELF_SERVE: Tier[] = ["build", "foundations"];

export const MOVES: Record<number, Move[]> = {
  1: [
    { id: "s1-video", title: "Watch the Foundations video", mins: "9 min", opens: "video",
      why: "It walks you through your sheet, block by block." },
    { id: "s1-beliefs", title: "Name two beliefs that could slow you down", mins: "10 min", opens: "sheet", where: "block 1",
      why: "Once you've named a belief, it's much easier to move past." },
    { id: "s1-circumstances", title: "Name two circumstances, and your 90-second plan for each", mins: "10 min", opens: "sheet", where: "block 2",
      why: "You decide now what you'll do when one arrives, while it costs nothing." },
    { id: "s1-commitment", title: "Write your commitment, and read it out loud", mins: "5 min", opens: "sheet", where: "block 3",
      why: "One outcome, one weekly action, one dated first step. Saying it aloud makes it yours." },
    { id: "s1-list", title: "Start your list", opens: "list",
      why: "Your first clients will almost certainly come from this list. No current therapy clients on it. Former clients go on as connectors only: ask who they know, and never coach them yourself." },
    { id: "s1-finish", title: "Mark Session 1 complete", opens: "none", finish: true, only: SELF_SERVE,
      why: "Session 2 opens." },
  ],
  2: [
    { id: "s2-video", title: "Watch the Niche video", mins: "7 min", opens: "video",
      why: "What a niche does for you, and the three stages ahead." },
    { id: "s2-generate", title: "Generate every transformation and audience you can think of", mins: "25 min", opens: "sheet", where: "stage 1",
      why: "Write more than feels sensible. Judge none of it yet." },
    { id: "s2-narrow", title: "Narrow it down: pair them, run the lane test, score them", mins: "20 min", opens: "sheet", where: "stage 2",
      why: "Sleep on your list first. Fresh eyes pick out the strongest ideas. The lane test: are you moving someone from well to better, never treating something?" },
    { id: "s2-research", title: "Research your top three: four quick checks, about 15 minutes per niche", mins: "45 min", opens: "sheet", where: "stage 3",
      why: "Search the way a client would: “how do I get promoted”, never “anxiety”. Other coaches already there means people pay for this." },
    { id: "s2-list", title: "Add names to your list", opens: "list",
      why: "Keep adding as people come to mind. Your announcement goes to them in Session 4." },
    // Build: choosing the niche IS finishing Session 2 (Don, r11, 29 Oct).
    { id: "s2-finish", title: "Choose your niche", opens: "none", finish: true, only: ["build"],
      why: "Pick the one you're happiest with. Not sure? Bring all three to the drop-in, and we choose together." },
    // One-on-one: board card m03 (pick A, awaiting Don).
    { id: "s2-niche-call", title: "Bring your top three to our next call", opens: "none", only: ONE_ON_ONE,
      why: "We choose your niche together, out loud, on the call." },
  ],
  3: [
    { id: "s3-video", title: "Watch the Message video", mins: "7 min", opens: "video",
      why: "Your client is the hero and you are the guide." },
    { id: "s3-statement", title: "Write your coaching statement, and how it differs from therapy", mins: "15 min", opens: "sheet", where: "section 1",
      why: "The one sentence you use when somebody asks what you do." },
    { id: "s3-true", title: "Write what is true for them, ten lines under each heading", mins: "25 min", opens: "sheet", where: "section 2",
      why: "Read a few forums first. Your therapy clients are not a source. Put everything down before you judge any of it." },
    { id: "s3-story", title: "Write the story", mins: "10 min", opens: "sheet", where: "section 3",
      why: "This is where everything above comes together, in your client's words." },
    { id: "s3-announcement", title: "Draft your announcement and two follow-ups", mins: "10 min", opens: "sheet", where: "section 4",
      why: "Write them while the words are fresh, so when it's time, you just press send." },
    { id: "s3-finish", title: "Mark Session 3 complete", opens: "none", finish: true, only: ["build"],
      why: "Session 4 opens." },
  ],
  4: [
    { id: "s4-video", title: "Watch the Structure video", mins: "5 min", opens: "video",
      why: "Thirteen steps, from your program's big promise down to each week." },
    { id: "s4-sitting1", title: "Sitting 1: the shape, steps 1 to 5", mins: "45 min", opens: "sheet", where: "steps 1–5",
      why: "Your transformation as a question, then your modules." },
    { id: "s4-sitting2", title: "Sitting 2: inside each module, steps 6 to 9", mins: "45 min", opens: "sheet", where: "steps 6–9",
      why: "Leave a night after sitting 1." },
    { id: "s4-sitting3", title: "Sitting 3: key ideas, resources and weeks, steps 10 to 13", mins: "40 min", opens: "sheet", where: "steps 10–13",
      why: "Eight to twelve weeks in total. Choose the shortest length that does the job." },
    { id: "s4-send", title: "Send your sheet in, or bring it to {meet}", opens: "shared",
      why: "At least 24 hours before {meet}, so we can read it first." },
    { id: "s4-finish-announcement", title: "Finish your announcement on The List", opens: "list",
      why: "It has to sound like you." },
    { id: "s4-announce", title: "Send your announcement", opens: "list",
      why: "Today people hear you're coaching. Share it as news, and end with a question anyone can answer." },
    { id: "s4-finish", title: "Mark Session 4 complete", opens: "none", finish: true, only: ["build"],
      why: "Session 5 opens." },
  ],
  5: [
    { id: "s5-video", title: "Watch the Creation video", mins: "7 min", opens: "video",
      why: "The simplest version of your program that works, built one session at a time." },
    { id: "s5-sitting1", title: "Sitting 1: your journey, your first session's slides and your speaking points", mins: "60 min", opens: "sheet", where: "steps 1–3",
      why: "Your first session only. The rest waits until you've delivered it." },
    { id: "s5-out-loud", title: "Run your first session out loud once", mins: "10 min", opens: "sheet", where: "step 3",
      why: "Saying it once makes the real session feel familiar. A few words under each slide, never a script." },
    { id: "s5-floor", title: "Check your first session has the essentials", opens: "card",
      why: "One objective, three to five key points, one exercise, one action. If it has those, you can stop here. That's all it needs." },
    { id: "s5-sitting2", title: "Sitting 2, if you have time: your client's worksheet and Principle Card", mins: "45 min", opens: "sheet", where: "steps 4–5",
      why: "One page they fill in, and one page they keep." },
    { id: "s5-send", title: "Send what you have, or bring it to {meet}", opens: "shared",
      why: "At least 24 hours before {meet}. Whatever you have is enough." },
    { id: "s5-finish", title: "Mark Session 5 complete", opens: "none", finish: true, only: ["build"],
      why: "Session 6 opens." },
  ],
  6: [
    { id: "s6-video", title: "Watch the Offer and Conversation video", mins: "7 min", opens: "video",
      why: "Your offer and your price, then the discovery call, step by step." },
    { id: "s6-offer", title: "Write your offer, and give it a name", mins: "20 min", opens: "sheet", where: "step 1",
      why: "What changes for them, what's included and what isn't, in a name you can say out loud." },
    { id: "s6-price", title: "Set your price", mins: "25 min", opens: "sheet", where: "steps 2–3",
      why: "Price the result, never your hours. Your first three clients pay at least $1,500. Quote $500 above that, and take it off for a decision within 48 hours." },
    { id: "s6-guide", title: "Make your call guide", mins: "about 40 min, or 80 with call slides", opens: "sheet", where: "steps 4–5",
      why: "The whole conversation on one page, with the coaching-not-therapy note at the top. Send that note with every invitation." },
    { id: "s6-concerns", title: "Plan your answers to the concerns you'll hear", mins: "20 min", opens: "sheet", where: "step 6",
      why: "Ask what they mean. Acknowledge it. Help them find their own answer. Bring it back to the result they want. If it sounds clinical, use your referral answer." },
    { id: "s6-out-loud", title: "Say the whole call out loud once", mins: "15 min", opens: "sheet", where: "step 7",
      why: "Say your price, then hold the silence and count." },
    { id: "s6-before-calls", title: "Before your first discovery call: check your state board's rules, and set up payment and a coaching calendar", opens: "sheet", where: "step 4",
      why: "So the first yes has somewhere to go." },
    { id: "s6-send", title: "Send your sheet and call guide, or bring them to {meet}", opens: "shared",
      why: "At least 24 hours before {meet}." },
    { id: "s6-finish", title: "Mark Session 6 complete", opens: "none", finish: true, only: ["build"],
      why: "Session 7 opens." },
  ],
  7: [
    { id: "s7-video", title: "Watch the Launch video", mins: "5 min", opens: "video",
      why: "Who you reach next, how a reply becomes a discovery call, and the rhythm that keeps it going." },
    { id: "s7-sitting1", title: "Sitting 1: your numbers, your list to 250 names, your connectors", mins: "30 min", opens: "sheet", where: "steps 1–3",
      why: "Go back to the edges: your phone, every job, every group. No current therapy clients. Therapy colleagues can hear your news, but don't ask them who they know. Never pay for a referral, or accept payment for one." },
    { id: "s7-sitting2", title: "Sitting 2: your first lines, your reply and your rhythm", mins: "30 min", opens: "sheet", where: "steps 4–6",
      why: "One line at the top that only that person could get. If a former therapy client says it sounds like them, thank them and ask who they know. Never offer coaching to a therapy client." },
    { id: "s7-calendar", title: "Put your four outreach days, and the time, in your calendar", mins: "2 min", opens: "sheet", where: "step 6",
      why: "Ten messages a day, four days a week, about twenty minutes each time." },
    { id: "s7-first-ten", title: "Send your first ten", opens: "list",
      why: "Start with the people you're most comfortable with." },
    { id: "s7-send", title: "Send your sheet, or bring your numbers to {meet}", opens: "shared",
      why: "At least 24 hours before {meet}." },
    { id: "s7-finish", title: "Mark Session 7 complete", opens: "none", finish: true, only: ["build"],
      why: "Your daily rhythm takes over from here." },
  ],
};

/** The moves this member sees for one session, with {meet} filled in. */
export function movesFor(session: number, tier: Tier | undefined): Move[] {
  const t: Tier = tier ?? "pending";
  const meet = t === "build" || t === "foundations" ? "the drop-in" : "our next call";
  return (MOVES[session] ?? [])
    .filter((m) => !m.only || m.only.includes(t))
    .map((m) => {
      const fill = (s: string) => s.split("{meet}").join(meet);
      let why = fill(m.why);
      // Foundations: the free list holds 50 names (ADR-0027 addendum 3).
      if (t === "foundations" && m.id === "s1-list") why += " Your free list holds up to 50 names.";
      // Foundations finish opens nothing (0016).
      if (t === "foundations" && m.finish) why = "This marks your free session as done.";
      return { ...m, title: fill(m.title), why };
    });
}

/** Every move id that exists, for validating a tick before it is saved. */
export const ALL_MOVE_IDS = new Set(
  Object.values(MOVES).flatMap((list) => list.map((m) => m.id)),
);
