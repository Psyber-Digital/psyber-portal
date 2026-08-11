# Per-week portal copy — before / after

**Requirement 3 of 5.** Nothing here is applied yet. Type your verdict into each
**Feedback:** slot — "yes", "no", or a rewrite — and I'll apply what you approve.

**1,552 words → 1,137 across the seven sessions (−415, or 27%).** Of the words
that actually change, it is a third: 1,377 → 962. The Working Sheet caveat
accounts for the rest and is deliberately left alone — see B below.

**Where these edits go:** `Programme/Flagship/MATERIALS.md`, sections
`[MNN-INTRO]` (banner), `[MNN-BLURB]` (video), `[MNN-NOTE]` (coach note) and
`[MNN-SHEETINTRO]` (workbook). That file owns all four fields and overrides
`content_v3.py` at import — editing the Python would have looked right and
changed nothing on the portal. The two standing strings in section A below are
the exception: they are hardcoded in `build_v3.py::gen_week_guide()`.

---

## ⚠ First — something wrong on the live portal right now, independent of all this

Live's Week 1 coach note currently ends:

> *"...add people whenever they come to mind, and keep adding. **Anyone counts.**"*

`MATERIALS.md` — the source of truth — ends the same paragraph:

> *"...add people whenever they come to mind, and keep adding. **One rule: your
> current therapy clients don't go on it.**"*

So the portal is telling your client **"anyone counts"** on the contact list, on
the same portal whose List page tells her current therapy clients must not go on
it. Two client-facing surfaces, contradicting each other, on the one point
CLAUDE.md calls non-negotiable. The correction has been sitting in the source
unstaged.

This is its own decision — it needs fixing whether you approve a single word of
the reduction below.

**Feedback:**

---

## The pattern behind every cut

The coach's note sits at the top of each week and **narrates the steps directly
beneath it**. The steps then repeat themselves. On Week 1, *"the video walks the
sheet with you"* is said three times — in the note, in the video step, and again
in the workbook step. *"Bring it rough"* is also said three times: the note, the
workbook blurb, and the standing `✎ A loose first pass` chip.

One rule fixes all seven weeks:

> **The note says what only the coach can say. The steps say what they are.**
> "Watch the video first" is what a numbered step kickered **Watch first** already
> says. The note stops announcing the page and starts adding to it.

Nothing is deleted outright — every instruction moves to the one place it belongs.

---

## Standing text, repeated seven times

**A · The resources blurb — remove (weeks 2–7), shorten (week 1).**

> Now, on every week: *"The Principle Card is the one to pin up. Everything else
> here is optional depth."*

Weeks 2–7 offer **exactly one resource** — the Principle Card. So the sentence
tells her which of one thing to pick, and then calls the nothing that remains
"optional depth". Week 1 is the only week where the steer is real (it has five).

> Proposed, week 1 only: *"Start with the Principle Card; the rest is optional depth."*
> Proposed, weeks 2–7: nothing. The card's own label already reads "One page · pin it up".

**Nothing lost:** "pin it up" is printed on the resource card itself.
**Saves:** 105 words → 9.

**Feedback:**

**B · The Working Sheet caveat — I recommend leaving this alone.**

> *"Your answers save in this browser only. Use Download / print to keep a copy,
> and send it to me 24 hours before we speak."* (25 words × 7)

It repeats seven times, so it looks like fat. It isn't. It is the one instruction
on the page that **fails silently** — if she misses it she loses her work and you
get nothing before the call, and you added the "send it back" half deliberately on
8 Aug. I can save two words by cutting "Your". Not worth the risk. Left verbatim.

**Feedback:**

---

## Week 1 · Foundations — 208 → 139 words

**Banner** — unchanged.

**The note.** Now four paragraphs (125 words). ¶1 restates the banner and ¶2
announces the step directly below it. ¶1 keeps its second half — the reason —
because that is the coach speaking and it is said nowhere else.

> Now:
> 1. *"This session answers one question: what could derail you on the way to becoming a successful coach? We name those things now, before they arrive, because they are far easier to handle when you have seen them coming."*
> 2. *"Watch the video first. It walks through the Working Sheet with you, block by block, so nothing on the sheet is a surprise."*
> 3. *"Then fill the sheet roughly. Half-formed answers and question marks are welcome — you are not meant to finish it alone. We finish it together on the call."*
> 4. *"And start your contact list. It runs for the next few weeks rather than one evening: add people whenever they come to mind, and keep adding. One rule: your current therapy clients don't go on it."*

> Proposed (3 paragraphs, 83 words):
> 1. *"We do this first because it is far easier to handle what could derail you once you have seen it coming."*
> 2. *"Bring the sheet rough. Half-formed answers and question marks are welcome — you are not meant to finish it alone. We finish it together on the call."*
> 3. *"And start your contact list. It runs for the next few weeks rather than one evening: add people whenever they come to mind, and keep adding. One rule: your current therapy clients don't go on it."*

**Nothing lost:** the question itself is the banner, three inches above, so ¶1
keeps only the part the banner doesn't carry — the reason. The cut ¶2 is the
step's own kicker ("Watch first", numbered 1) and its blurb.

**Video blurb** — drop the half the banner already carries.

> Now: *"What could derail you, named in advance — and a walk through your Working Sheet so you know exactly what each block is asking."*
> Proposed: *"A walk through your Working Sheet, block by block, so you know exactly what each one is asking."*

**Workbook blurb** — drop the two clauses said elsewhere.

> Now: *"Four blocks, one question: what could derail you? The video walks through each block, so nothing here should be a surprise. One focused sitting, and bring it rough — we finish it together."*
> Proposed: *"Four blocks, one question: what could derail you? One focused sitting."*

**Nothing lost:** "the video walks each block" is now in the video blurb only;
"bring it rough / we finish together" is in the note and on the `✎` chip.

**Feedback:**

---

## Week 2 · Niche — 222 → 167 words

**Banner** — unchanged.

**The note.** Five paragraphs (141 words). Two of them restate the banner and the
workbook blurb: "three stages, in order" appears in all three places, and "don't
pick — we pick together" appears in all three too.

> Cut, ¶2: *"The video walks the Working Sheet with you. Three stages, in order: generate everything, narrow it down, then research the last three."*
> Cut, ¶4: *"Bring three to the session, with what you found. Do not pick — we pick together, and then we move straight on to your message."*

> Kept, in this order: the "more pre-work than most, deliberately" framing (lightly
> tightened), the separate-sittings paragraph with its reason, and "nothing goes
> out this week".

**Nothing lost:** the three stages are the banner and the workbook blurb.
"Bring all three and what you found" moves into the workbook blurb, below.

**Workbook blurb** — absorbs the instruction, loses the duplicate.

> Now: *"Three stages, in order: generate everything, narrow it down, then research your top three. Finish each stage before moving on, and do them in separate sittings if you can. Do not pick a winner — we do that together on the call."*
> Proposed: *"Three stages, in order: generate everything, narrow it down, then research your top three. Finish each stage before moving on. Don't pick a winner — bring all three and what you found, and we choose together on the call."*

**Feedback:**

---

## Week 3 · Message — 179 → 115 words

**Banner** — unchanged.

**The note.** The first paragraph (45 words) opens with "Watch the video first"
and then **enumerates the five things every message needs** — which are, exactly,
the first five blocks of the Working Sheet she is about to open (Your hero ·
Their pain points · What they want instead · What has stopped them · The cost of
staying where they are). She reads the list, then fills the list.

> Cut, ¶1: *"Watch the video first. It walks the Working Sheet with you and it covers the five things every message needs: the hero, their pain points, what they want instead, what is standing in the way, and what it costs them to stay where they are."*

> Kept (39 words): *"The most valuable material here is their language, not yours — the exact phrases you have heard from the people you are serving."* / *"By the end of our session your announcement goes out. Written together, sent the same day."*

**Nothing lost:** the five are on the sheet as its first five blocks, and the video
blurb still names them as a set.

**Video blurb** — the announcement is now said in the banner and the note; two is
enough.

> Now: *"Why your client is the hero and you are the guide, the five things every message needs, and the announcement that goes out at the end of this session."*
> Proposed: *"Why your client is the hero and you are the guide, and the five things every message needs."*

**Workbook blurb** — trimmed four words, same meaning.

**Feedback:**

---

## Week 4 · Structure & Offer — 154 → 113 words

**The note** loses two of its three paragraphs, both pure restatement.

> Cut, ¶1: *"Two things get decided here: the shape of your program, and the price. Neither should take long."* — the banner is *"The map and the number."*
> Cut, ¶3: *"The video walks the sheet with you, including the four ways to make an offer more compelling and how to set your two numbers."* — the video blurb already says "the four offer enhancers, and how to set your price".

> Kept, verbatim: the one-page map paragraph. It is the scope discipline of the
> whole session and it is said nowhere else.

Banner, video blurb and workbook blurb all unchanged.

**Feedback:**

---

## Week 5 · Creation — 206 → 173 words

**The note.** ¶1's first half is the banner; ¶2's middle is the workbook blurb.

> Now ¶1: *"This session works differently. We build the first session of your program together, live, using a slide template with the gaps already marked. You leave the call with it finished, and we send you the file afterwards."*
> Proposed: *"This session works differently: the slide template already has the gaps marked, you leave the call with it finished, and we send you the file afterwards."*

> Now ¶2: *"So the pre-work is deliberately light. Watch the video, open the template, and put a rough first thought in each box. Four scruffy lines is a good outcome. Please do not polish, and please do not open a design tool."*
> Proposed: *"So the pre-work is deliberately light. Please do not polish, and please do not open a design tool."*

> ¶3 — the floor — **kept word for word.** You call it the most important
> instruction in the program; it is not touched.

**Nothing lost:** "rough first thought in each box / four scruffy lines is a good
outcome" is already the workbook blurb, unchanged and sitting on the step itself.

**Feedback:**

---

## Week 6 · The Conversation — 165 → 132 words

**The note** loses its opening paragraph only.

> Cut, ¶1: *"Watch the video. It walks the discovery call from start to finish, in order, and the Working Sheet follows exactly the same sequence so you can write your own version of each step."*

Both halves are already on the steps below: the video blurb says *"The discovery
call in order"*, the workbook blurb says *"This sheet follows the call in order.
Write your own version of each step."*

The other three paragraphs — rehearsal, the two hardest parts, bring the
conversations that went badly — are kept verbatim. They are the coach speaking,
and nothing else on the page says any of it.

**Feedback:**

---

## Week 7 · Launch — 138 → 114 words

**The note** loses its middle paragraph.

> Cut, ¶2: *"The video is short and it explains where the target number comes from. Most of your time this week goes on the list itself."*

First half is the video blurb (*"Where the target number comes from"*). Second half
is the workbook blurb, near word for word (*"Most of your time goes on the list
rather than on this page"*).

Everything else on Week 7 is unchanged.

**Feedback:**

---

## Totals

| Session | Before | After | Δ |
|---|---:|---:|---:|
| 1 · Foundations | 208 | 139 | −69 |
| 2 · Niche | 222 | 167 | −55 |
| 3 · Message | 179 | 115 | −64 |
| 4 · Structure & Offer | 154 | 113 | −41 |
| 5 · Creation | 206 | 173 | −33 |
| 6 · The Conversation | 165 | 132 | −33 |
| 7 · Launch | 138 | 114 | −24 |
| Standing resources blurb (×7) | 105 | 9 | −96 |
| Working Sheet caveat (×7) | 175 | 175 | 0 — deliberately |
| **Total** | **1,552** | **1,137** | **−415** |

---

## What I will do at apply time, so there are no surprises

1. **Edit `MATERIALS.md`** — the `[MNN-INTRO]`, `[MNN-BLURB]`, `[MNN-NOTE]` and
   `[MNN-SHEETINTRO]` sections for the weeks you approve. Anchor codes untouched.
2. **Edit `build_v3.py::gen_week_guide()`** for the resources blurb — it is
   hardcoded there, not in any content file. `StepResources` already renders its
   blurb conditionally (`{s?.blurb && …}`), so weeks 2–7 simply stop emitting one.
   Week 1's steer comes from a single new optional key on Week 1 only — not a
   schema change across all seven.
3. **Regenerate one file only:** `python3 -c "import build_v3; build_v3.gen_week_guide()"`.
   Never a bare `build_v3.py` run, which also rewrites the Working Sheets, the
   Principle Cards, the narration and `seed.sql`.
4. **Check the shortened notes render.** Weeks 1, 3 and 7 drop to two or three
   paragraphs and **Week 4 drops to one** — a shape the note has never had. The
   generator marks the first paragraph `block` and the rest `block mt-3`, so one
   paragraph should render cleanly with no stray margin, but I will confirm it in
   a real browser rather than assume it.
5. **Type-check, then show you the rendered weeks** before anything is staged to
   live. Staging remains your call, run separately via `stage_live.py`.

**Feedback:**
