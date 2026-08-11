# Portal copy reduction — August 2026

## Objective
Don, 11 Aug 2026: the portal overwhelms with words. Cut word count across the
client-facing screens — remove the unnecessary, reword the wordy, present with
less overwhelm — **without losing context for the client**.

## Approach
A standing agent plus a surface-by-surface pass, in priority order. Each surface
is proposed to Don as before/after and applied only on his approval.

The bar: minimalist but effective, simple but brilliant. A cut that loses an
instruction is a defect, not minimalism. For every reduction, each instruction in
the original must still be recoverable — on the page, behind a disclosure, or on
the Working Sheet.

## Progress
- [x] **1 · The agent.** `.claude/agents/portal-minimalist.md` — read-only editor.
      Encodes the generation pipeline, the live/B divergence, and the hold list.
- [x] **2 · The List** (`/portal/outreach`). Applied to live and mirrored to B.
- [x] **3 · Per-week copy.** Approved in full and applied to `MATERIALS.md`
      (28 sections) and `build_v3.py`. Regenerated, rebuilt, staged, and **copied
      into the live working tree** — six files, type-checked and built clean.
      **Not deployed.** Vercel deploys from `main`, so the commit and push are the
      deploy and remain Don's call. The staged package and the corrected apply
      notes are at `Programme/Flagship/live-migration/APPLY-copy-reduction.md`;
      the proposed strings are in `.copy-reduction-proposed.py`.
      The seven unlock emails were deliberately NOT applied — see below.
- [ ] **4 · Shared Files, Welcome video, login.**
- [ ] **5 · Type-check, totals, staging decision.**

## Key decisions
- **`MATERIALS.md` beats `content_v3.py` for everything a client reads.**
  `Programme/Flagship/MATERIALS.md` owns `banner_intro`, `video_blurb`,
  `workbook_intro` and `note` — the four portal fields — plus the Principle Card,
  the Working Sheet and the unlock email. It is applied over `content_v3.py` at
  import (`materials_doc.apply`), so **editing the Python is silently inert**, the
  same trap `SCRIPTS.md` sets for narration. SCRIPTS.md owns narration and the
  Principle line; MATERIALS.md owns everything else a client reads; they never
  hold the same field.
- **Generated files are never hand-edited.** The standing per-week strings (the
  "answers save in this browser" caveat, the Principle Card resources blurb) are
  hardcoded inside `build_v3.py::gen_week_guide()` — not in any content file.
  Regenerate with
  `python3 -c "import build_v3; build_v3.gen_week_guide()"` — never a bare
  `build_v3.py` run, which also rewrites Working Sheets, cards, narration and
  `seed.sql`.
- **Two blocks are verbatim holds** on the List page: the one rule (Don, 8 Aug,
  and its position *before* the sweep instruction is the safeguard) and the
  privacy paragraph (matches `Compliance/DPA-portal-clients.md` §5 exactly).
  Both kept word for word; the privacy paragraph was folded behind a disclosure
  so prominence changed and wording did not.
- **Fold, don't delete.** `<details>` is the house device — `FlowNote` and the
  time budget in `ThisWeek.tsx` already use it.
- A dev server has been running in ClientPortal-B on port 3100 since 27 Jul.
  Do not `npm run build` in B while it is up.
- **`MATERIALS.md` is NOT in git.** `Programme/` is a git repo but the file is
  untracked, so `git diff` says nothing about it and there is no rollback from
  git. Snapshot it into `Programme/Flagship/_archive/` before editing — that is
  where the review tooling puts its own "before review" copies.
- **`lint_v3.py` is not a linter — it performs a full rebuild.** Running it
  regenerated every Working Sheet, Principle Card, session markdown and REVIEW
  artefact (11 Aug, 10:38). It correctly left every `(edit me)` file alone.
  Budget for that before running it, and never assume a file's mtime means
  someone else touched it.

## What changed in requirement 2
`ClientPortal/src/app/portal/outreach/page.tsx`
- Heading `Outreach · Your contact database` → `The List` (the nav was renamed in
  df6ac53; the heading and dialog title were missed, so a client met three names
  for one page).
- The "single most consequential input" paragraph and the "you're not contacting
  anyone yet" paragraph merged into one, 105 words → 51.
- The privacy paragraph folded behind a `Who can see this list` disclosure,
  wording unchanged.

`ClientPortal/src/app/portal/outreach/OutreachView.tsx`
- Ring blurb 41 → 20 words; empty state 42 → 18; guide dialog opening 32 → 19;
  paste panel 36 → 13; import panel 50 → 44 (column list kept — it is the only
  place the recognised CSV headers are stated).
- Guide dialog title and the `?` button's aria-label renamed to "The List".

`ClientPortal-B` — brought into line. B was behind in two ways that mattered:
the rule sat *after* the sweep instruction, and the privacy line still read
"we can't see it from our side of the portal", the claim the DPA refuses. Both
fixed. Nav label `Outreach` → `The List`.

## OPEN · Session 01's Working Sheet is two different documents

Held back from the 11 Aug deploy, deliberately. Don has not ruled on it.

Live serves the **six-block** sheet. `MATERIALS.md` builds a **four-block** one —
"The moment behind each one" folded into block 01 as inline fields, "The sentence
you would actually believe" removed entirely, and the commitment block reduced
from five fields to two decisions plus a start date. The sheet's own intro says
"Four blocks", so live's copy already contradicts itself.

Two reasons it did not go out with the copy reduction:

1. **It is a structural redesign of a client-facing worksheet**, not a copy cut,
   and it was never proposed or approved.
2. **A client's saved answers could be stranded.** Answers save to browser storage
   keyed by field id. Fields `f14` and `f36`–`f40` do not exist in the new sheet,
   so anything typed into them stops rendering. Session 01's *workbook* link still
   points at Liljana's original Foundations workbook (deliberate — she completed
   it), but the new sheet is offered to her as "The updated Working Sheet", so she
   may have used it.

Live's session 01 sheet also lacks improvements sessions 02–07 already have: the
print mirror (without it, printing silently truncates any answer longer than its
box — a client lost roughly a third of her written answers to this), the
`display:block` fix for the run-on shift rows, and the Shared Files bar link.
**Those are worth having and are independent of the restructure.**

Recommended next step: port the three fixes onto the six-block sheet without
changing its blocks, and put the restructure to Don separately.

Only the approved one-line intro change was applied to live's session 01 sheet.

## The unlock emails — do not stage them

All seven staged emails differ from live, and applying them would be a downgrade.
**Live's emails are personalised to Liljana** ("It was a real pleasure meeting
you…", "Congratulations on choosing your niche… on evidence rather than a hunch");
the generated ones are the generic template. They also describe the check-in
machinery — weekly nudges, three clinics, a ten-day auto-booking — which exists in
ClientPortal-B and **not** on live.

The generated week-01 email does add the contact-list rule, which is worth having.
If it is wanted, hand-merge that paragraph into the personalised email rather than
swapping the file.

## What went to live's working tree, 11 Aug 2026

Six files, on top of the two from requirement 2:

| File | Change |
|---|---|
| `src/lib/weekGuide.tsx` | The whole per-week reduction. 1,180 visible words → 873. Carries the "Anyone counts" → one-rule fix |
| `public/session-01..03/Session-0N-Working-Sheet.html` | The intro line at the top of each sheet |
| `public/session-01/Session-01-Principle-Card.html` | **Gains** the "YOUR LIST — THE ONE RULE" block. Pre-existing, never staged |
| `public/session-07/Session-07-Principle-Card.html` | `neighbour` → `neighbor` |

`resources.ts` was byte-identical to live and was not copied, so no new asset is
referenced and nothing can 404. The SQL was not needed — no `banner_intro` changed,
so no week row changed.

## Key files
| | |
|---|---|
| `.claude/agents/portal-minimalist.md` | The standing agent |
| `Programme/Flagship/build/content_v3.py` | Per-week portal words |
| `Programme/Flagship/build/build_v3.py` | `gen_week_guide()` — the standing words |
| `ClientPortal/src/app/portal/outreach/` | The List (live) |
| `Compliance/DPA-portal-clients.md` §5 | The privacy wording that must not change |

## Next steps
Requirement 3: the per-week copy. `bannerIntro` restates the first line of the
coach's note on several weeks, and two standing paragraphs are repeated
identically across all seven sessions.

## State
Nothing committed, nothing deployed. Live's working tree carries the requirement-2
edits; `git diff` in `ClientPortal` shows exactly what changed.
