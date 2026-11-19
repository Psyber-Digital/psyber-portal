// "Your next move" as a story (Don, board m17 note and m18 "yes", 19 Nov 2026;
// Codex ADR-0031 addendum 3). The member is the hero and Asher is the guide.
// Each session is a chapter on one road, with one villain: the obstacle most
// likely to stop that session, in the member's own words, and how to beat it
// from the session's own materials.
//
// Wording follows Next-Move/MOVES-DRAFT.md ("Draft 4 addition"). Change the map
// first, then this file.

export type Chapter = {
  /** The session's recorded name, kept visible beside the chapter name. */
  recorded: string;
  title: string;
  recap: string;
  question: string;
  villain: string;
  says: string;
  beat: string;
  /** Shown on the chapter finish. */
  done: string;
};

export const CHAPTERS: Record<number, Chapter> = {
  1: {
    recorded: "Foundations",
    title: "Clear the road",
    recap: "This chapter, you clear the road: name what could slow you down, plan for it, and set your first step.",
    question: "What could derail me on the way to becoming a successful coach?",
    villain: "The Doubter",
    says: "Who am I to charge for this?",
    beat: "You've spent years helping people change. It's in your training, your expertise and your experience.",
    done: "The road is clear. You've planned for what could slow you down, and your first step has a date.",
  },
  2: {
    recorded: "Niche",
    title: "Choose your niche",
    recap: "Last chapter, you cleared the road and made your commitment. This chapter, you choose your niche.",
    question: "Who will I coach, and what change will I help them make?",
    villain: "The Wide Net",
    says: "I can help all sorts of people with all sorts of things.",
    beat: "Pick one niche to test. Depth reads as authority in a way breadth never does.",
    done: "You've chosen your niche. Everything from here builds on it.",
  },
  3: {
    recorded: "Message",
    title: "Find your words",
    recap: "Last chapter, you chose your niche. This chapter, you find the words for it.",
    question: "What do I say when someone asks what I do, and how do I tell the people on my list?",
    villain: "The Spotlight",
    says: "Let me tell them about my fifteen years.",
    beat: "In everything you write, your coaching client is the hero and you are their guide.",
    done: "You have the words, and your announcement is drafted.",
  },
  4: {
    recorded: "Structure",
    title: "Shape your program",
    recap: "Last chapter, you found your words. This chapter, you shape your program and tell people you're coaching.",
    question: "If I were [my niche], how would I [my transformation]?",
    villain: "The Everything Program",
    says: "I need to teach them everything I know.",
    beat: "Build a clear, simple structure that works. Refine it later.",
    done: "Your program has its shape, and people know you're coaching.",
  },
  5: {
    recorded: "Creation",
    title: "Build your first session",
    recap: "Last chapter, you shaped your program. This chapter, you build your first session.",
    question: "What's the simplest first session I can run next week?",
    villain: "The Never-Ready",
    says: "It isn't ready yet. One more pass.",
    beat: "Clear the floor, then stop: one objective, three to five key points, one exercise, one action.",
    done: "Your first session is ready to deliver.",
  },
  6: {
    recorded: "Offer and Conversation",
    title: "Make the offer, have the conversation",
    recap: "Last chapter, you built your first session. This chapter, you name and price your offer, and rehearse the call.",
    question: "What will I offer, at what price, and how will I ask “Would you like to do this?”",
    villain: "The Discount",
    says: "I'll start low and raise it later.",
    beat: "Price from the value of the result. Hold your price.",
    done: "Your offer has a name and a price, and you've run the whole call out loud.",
  },
  7: {
    recorded: "Launch",
    title: "Reach your whole list",
    recap: "Last chapter, you priced your offer. This chapter, you reach your whole list.",
    question: "Who are the next ten people I'll message?",
    villain: "The Off Week",
    says: "I'm not feeling it this week. Maybe this isn't for me.",
    beat: "Motivation isn't data. Ten a day, four days a week, one conversation at a time.",
    done: "Your first ten are sent, and your outreach days are in the calendar. You're open for coaching clients.",
  },
};

export const chapterOf = (n: number): Chapter | undefined => CHAPTERS[n];
