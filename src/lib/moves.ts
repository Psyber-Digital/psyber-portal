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
  /** The question the card leads with; the title becomes the task under it
   *  (board m18, 19 Nov 2026). */
  q: string;
  /** A short note from the guide, on the moves where people stall. */
  guide?: string;
  /** "If you have time": the session can finish without it (m19 gate). */
  optional?: boolean;
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
    { id: "s1-video", q: "How do I clear the road before I start?", title: "Watch the Foundations video", mins: "9 min", opens: "video",
      why: "It walks you through your sheet, block by block." },
    { id: "s1-card", q: "Which idea here will I use first?", title: "Read the Principle Card, and note what stands out", mins: "5 min", opens: "card",
      why: "This session\u2019s key ideas on one page. Jot down what strikes you, and keep the card handy." },
    { id: "s1-beliefs", q: "What do I tell myself on a hard day?", guide: "Name each belief now, while it costs nothing.", title: "Name two beliefs that could slow you down", mins: "10 min", opens: "sheet", where: "block 1",
      why: "Once you've named a belief, it's much easier to move past." },
    { id: "s1-circumstances", q: "What will I do when life gets in the way?", title: "Name two things that could knock you off course, and a 90-second response to each", mins: "10 min", opens: "sheet", where: "block 2",
      why: "Decide now what you'll do when a busy week or a setback comes. Keep it small, like blocking time in your calendar." },
    { id: "s1-commitment", q: "What am I committing to, and when do I start?", title: "Write your commitment, and read it out loud", mins: "5 min", opens: "sheet", where: "block 3",
      why: "One outcome, one weekly action, one dated first step. Saying it aloud makes it yours." },
    { id: "s1-list", q: "Who do I know?", title: "Start your list", opens: "list",
      why: "Your first clients will almost certainly come from this list. Leave off your current therapy clients. Former therapy clients can be on it, but only so you can ask who they know. Never coach them yourself." },
    { id: "s1-finish", q: "Ready for the next chapter?", title: "Finish Session 1", opens: "none", finish: true, only: SELF_SERVE,
      why: "Session 2 opens." },
  ],
  2: [
    { id: "s2-video", q: "What will a niche do for me?", title: "Watch the Niche video", mins: "7 min", opens: "video",
      why: "What a niche does for you, and the three stages ahead." },
    { id: "s2-card", q: "Which idea here will I use first?", title: "Read the Principle Card, and note what stands out", mins: "5 min", opens: "card",
      why: "This session\u2019s key ideas on one page. Jot down what strikes you, and keep the card handy." },
    { id: "s2-generate", q: "Who could I help, and what change could I help them make?", title: "Generate every transformation and audience you can think of", mins: "25 min", opens: "sheet", where: "stage 1",
      why: "Write more than feels sensible. Judge none of it yet." },
    { id: "s2-narrow", q: "Which of my niche ideas is strongest?", guide: "Give this the full twenty minutes. It's what turns a niche you guessed into one you chose.", title: "Narrow your ideas down to your top three, using the lane test", mins: "20 min", opens: "sheet", where: "stage 2",
      why: "Come back a day after stage 1, with fresh eyes. Pair each audience with a change you could help them make. Then run the lane test: keep only pairs that take people from well to better, and drop any that would mean treating a problem. Score what's left." },
    { id: "s2-research", q: "Do people already pay coaches for my top three?", title: "Research your top three: four quick checks, about 15 minutes per niche", mins: "45 min", opens: "sheet", where: "stage 3",
      why: "Search online the way a future client would, for example \u201chow do I get promoted\u201d, not \u201canxiety\u201d. If other coaches already sell to this group, that's good news. It's a sign people already pay for help with this." },
    { id: "s2-list", q: "Who else comes to mind?", title: "Add names to your list", opens: "list",
      why: "Keep adding as people come to mind. In Session 4 you'll tell them all you're coaching now." },
    // Build: choosing the niche IS finishing Session 2 (Don, r11, 29 Oct).
    { id: "s2-finish", q: "Which niche will I test first?", title: "Choose your niche", opens: "none", finish: true, only: ["build"],
      why: "Pick the one you're happiest with. Not sure? Bring all three to the drop-in, and we\u2019ll choose together." },
    // One-on-one clients choose too, with the call there if unsure (Don, m03 = B, 18 Nov).
    { id: "s2-choose", q: "Which niche will I test first?", title: "Choose your niche", opens: "none", only: ONE_ON_ONE,
      why: "Pick the one you're happiest with. Not sure? Bring all three to our next call, and we\u2019ll choose together." },
  ],
  3: [
    { id: "s3-video", q: "Who is the hero of my message?", title: "Watch the Message video", mins: "7 min", opens: "video",
      why: "Your client is the hero and you are the guide." },
    { id: "s3-card", q: "Which idea here will I use first?", title: "Read the Principle Card, and note what stands out", mins: "5 min", opens: "card",
      why: "This session\u2019s key ideas on one page. Jot down what strikes you, and keep the card handy." },
    { id: "s3-statement", q: "What do I do as a coach, and how is it different from therapy?", title: "Write your coaching statement, and how it differs from therapy", mins: "15 min", opens: "sheet", where: "section 1",
      why: "The one sentence you use when somebody asks what you do." },
    { id: "s3-true", q: "What is really going on for the people in my niche?", title: "Write down their days, their worries and what they want, in their own words", mins: "25 min", opens: "sheet", where: "section 2",
      why: "Read a few online forums where they talk. Write ten lines under each heading on the sheet. Don't draw on your therapy clients. Write everything down first, then judge it." },
    { id: "s3-story", q: "What's my client's story?", title: "Write the story", mins: "10 min", opens: "sheet", where: "section 3",
      why: "Turn what you wrote into a short story, told the way your client would tell it." },
    { id: "s3-announcement", q: "How will I tell people I'm coaching now?", title: "Draft your announcement and two follow-ups", mins: "10 min", opens: "sheet", where: "section 4",
      why: "Write them while the words are fresh, so when it's time, you just press send." },
    { id: "s3-finish", q: "Ready for the next chapter?", title: "Finish Session 3", opens: "none", finish: true, only: ["build"],
      why: "Session 4 opens." },
  ],
  4: [
    { id: "s4-video", q: "How does a program take shape?", title: "Watch the Structure video", mins: "5 min", opens: "video",
      why: "Thirteen steps, from your program's big promise down to each week." },
    { id: "s4-card", q: "Which idea here will I use first?", title: "Read the Principle Card, and note what stands out", mins: "5 min", opens: "card",
      why: "This session\u2019s key ideas on one page. Jot down what strikes you, and keep the card handy." },
    { id: "s4-sitting1", q: "What's my program's big promise, and what are its modules?", guide: "Aim for clear and simple. You'll refine it once you've run it.", title: "Sitting 1: steps 1 to 5 on your sheet", mins: "45 min", opens: "sheet", where: "steps 1–5",
      why: "Turn your coaching statement into one question: \u201cIf I were [your niche], how would I [the change you help with]?\u201d Then split the answer into modules." },
    { id: "s4-sitting2", q: "What will my client learn and do in each module?", title: "Sitting 2: what goes inside each module (steps 6 to 9)", mins: "45 min", opens: "sheet", where: "steps 6–9",
      why: "Do this the day after sitting 1." },
    { id: "s4-sitting3", q: "What fills each week, and how many weeks?", title: "Sitting 3: key ideas, resources and your program's length (steps 10 to 13)", mins: "40 min", opens: "sheet", where: "steps 10–13",
      why: "Eight to twelve weeks in total. Choose the shortest length that does the job." },
    { id: "s4-send", q: "Which part of my program do I want feedback on?", title: "Send your sheet in, or bring it to {meet}", opens: "shared",
      why: "At least 24 hours before {meet}, so we can read it first." },
    { id: "s4-finish-announcement", q: "Would a friend know I wrote my announcement?", title: "Finish your announcement on The List", opens: "list",
      why: "It has to sound like you." },
    { id: "s4-announce", q: "Who hears my news today?", title: "Send your announcement", opens: "list",
      why: "Today people hear you're coaching. Share it as news, and end with a question anyone can answer." },
    { id: "s4-finish", q: "Ready for the next chapter?", title: "Finish Session 4", opens: "none", finish: true, only: ["build"],
      why: "Session 5 opens." },
  ],
  5: [
    { id: "s5-video", q: "Why start with just one session?", title: "Watch the Creation video", mins: "7 min", opens: "video",
      why: "The simplest version of your program that works, built one session at a time." },
    { id: "s5-card", q: "Which idea here will I use first?", title: "Read the Principle Card, and note what stands out", mins: "5 min", opens: "card",
      why: "This session\u2019s key ideas on one page. Jot down what strikes you, and keep the card handy." },
    { id: "s5-sitting1", q: "What happens in my first session?", guide: "Once it has the essentials, stop adding to it.", title: "Sitting 1: your client's journey, the slides and what you'll say (steps 1 to 3)", mins: "60 min", opens: "sheet", where: "steps 1–3",
      why: "Your first session only. The rest waits until you've delivered it." },
    { id: "s5-out-loud", q: "Can I run my first session without a script?", title: "Run your first session out loud once", mins: "10 min", opens: "sheet", where: "step 3",
      why: "Saying it once makes the real session feel familiar. Keep just a few words under each slide, never a script." },
    { id: "s5-floor", q: "Is my first session ready to run?", title: "Check your first session has the essentials", opens: "card",
      why: "One objective, three to five key points, one exercise, one action. If it has those, you can stop here. That's all it needs." },
    { id: "s5-sitting2", optional: true, q: "What does my client take home?", title: "Sitting 2, if you have time: a worksheet and a Principle Card for your client", mins: "45 min", opens: "sheet", where: "steps 4–5",
      why: "One page they fill in, and one page they keep." },
    { id: "s5-send", q: "Which part of my first session do I want feedback on?", title: "Send what you have, or bring it to {meet}", opens: "shared",
      why: "At least 24 hours before {meet}. Whatever you have is enough." },
    { id: "s5-finish", q: "Ready for the next chapter?", title: "Finish Session 5", opens: "none", finish: true, only: ["build"],
      why: "Session 6 opens." },
  ],
  6: [
    { id: "s6-video", q: "How does a conversation become a paying coaching client?", title: "Watch the Offer and Conversation video", mins: "7 min", opens: "video",
      why: "Your offer and your price, then the discovery call, step by step." },
    { id: "s6-card", q: "Which idea here will I use first?", title: "Read the Principle Card, and note what stands out", mins: "5 min", opens: "card",
      why: "This session\u2019s key ideas on one page. Jot down what strikes you, and keep the card handy." },
    { id: "s6-offer", q: "What am I offering, and what is it called?", title: "Write your offer, and give it a name", mins: "20 min", opens: "sheet", where: "step 1",
      why: "What changes for them, what's included and what isn't, in a name you can say out loud." },
    { id: "s6-price", q: "What's the result worth to my client?", title: "Set your price", mins: "25 min", opens: "sheet", where: "steps 2–3",
      why: "Price the result, never your hours. Your first three clients pay at least $1,500. Quote $500 more, and take the $500 off if they say yes within 48 hours." },
    { id: "s6-guide", q: "How will my discovery call go, start to finish?", title: "Make your call guide", mins: "about 40 min, or 80 with call slides", opens: "sheet", where: "steps 4–5",
      why: "Put the whole call on one page. Start it with your note saying coaching is not therapy, and send that note with every call invitation." },
    { id: "s6-concerns", q: "What will people say before they say yes, and how will I answer?", title: "Plan your answers to the concerns you'll hear", mins: "20 min", opens: "sheet", where: "step 6",
      why: "Ask what they mean. Acknowledge it. Help them find their own answer. Bring it back to the result they want. If what they describe sounds like a clinical problem, give your referral answer instead." },
    { id: "s6-out-loud", q: "Does my call sound like me, all the way to the price?", title: "Say the whole call out loud once", mins: "15 min", opens: "sheet", where: "step 7",
      why: "Say your price, then stop talking and count silently while you wait." },
    { id: "s6-before-calls", q: "Have I checked my state board, and is everything ready for the first yes?", title: "Before your first discovery call: check your state board's rules, and set up payment and a coaching calendar", opens: "sheet", where: "step 4",
      why: "So when your first client says yes, they can pay and book right away." },
    { id: "s6-send", q: "Which part of my offer or call do I want feedback on?", title: "Send your sheet and call guide, or bring them to {meet}", opens: "shared",
      why: "At least 24 hours before {meet}." },
    { id: "s6-finish", q: "Ready for the next chapter?", title: "Finish Session 6", opens: "none", finish: true, only: ["build"],
      why: "Session 7 opens." },
  ],
  7: [
    { id: "s7-video", q: "What does my outreach week look like?", title: "Watch the Launch video", mins: "5 min", opens: "video",
      why: "Who you reach next, how a reply becomes a discovery call, and the rhythm that keeps it going." },
    { id: "s7-card", q: "Which idea here will I use first?", title: "Read the Principle Card, and note what stands out", mins: "5 min", opens: "card",
      why: "This session\u2019s key ideas on one page. Jot down what strikes you, and keep the card handy." },
    { id: "s7-sitting1", q: "Who else belongs on my list?", title: "Sitting 1: your outreach numbers, your list up to 250 names, and who can introduce you", mins: "30 min", opens: "sheet", where: "steps 1–3",
      why: "Look further for names: your phone, past jobs, groups you belong to. No current therapy clients. Therapy colleagues can introduce you to people, but never ask them for their own therapy clients. Never pay for a referral, or accept payment for one." },
    { id: "s7-sitting2", q: "What will my first line say?", title: "Sitting 2: your opening lines, your replies and your weekly rhythm", mins: "30 min", opens: "sheet", where: "steps 4–6",
      why: "Start each message with one line written just for that person. If a former therapy client says your program sounds like them, thank them and ask who they know. Never offer coaching to a current or former therapy client." },
    { id: "s7-calendar", q: "When are my four outreach days?", title: "Put your four outreach days, and the time, in your calendar", mins: "2 min", opens: "sheet", where: "step 6",
      why: "Ten messages a day, four days a week, about twenty minutes each time." },
    { id: "s7-first-ten", q: "Who are my first ten?", guide: "Ten messages is about twenty minutes. Send them in one sitting.", title: "Send your first ten", opens: "list",
      why: "Start with the people you're most comfortable with." },
    { id: "s7-send", q: "Which of my numbers do I want to talk through?", title: "Send your sheet, or bring your numbers to {meet}", opens: "shared",
      why: "At least 24 hours before {meet}." },
    { id: "s7-finish", q: "Ready to keep the rhythm going?", title: "Finish Session 7", opens: "none", finish: true, only: ["build"],
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

/** Where a member is: their next move in a session, and its place in the list. */
export function nextMoveOf(
  session: number,
  tier: Tier | undefined,
  ticked: Set<string>,
  sessionFinished: boolean,
): { move: Move | undefined; index: number; total: number } {
  const moves = movesFor(session, tier);
  const i = moves.findIndex((m) => (m.finish ? !sessionFinished : !ticked.has(m.id)));
  return { move: i >= 0 ? moves[i] : undefined, index: i >= 0 ? i + 1 : moves.length, total: moves.length };
}

/** Cookie holding the moves a member pressed "Not now" on (per browser). */
export const PARK_COOKIE = "psy-parked";
