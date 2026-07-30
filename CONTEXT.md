# CONTEXT — Client Portal build

## Objective
Verify, wire up, test, and deploy the pre-built Psyber client portal (Next.js + Supabase + Tailwind) per `BRIEF.md`. Do NOT rebuild it.

## Progress
- [x] §1 Ingest — already unzipped into this folder; README/TESTING agree with BRIEF.
- [x] §2 Build verified — `npm install`, `typecheck`, `build` all clean (9 routes).
- [x] §3 Accounts & config — Supabase project `awovtppvjifjhabuzoyg`, region London eu-west-2. `.env.local` filled (3 Supabase values + site URL).
- [x] §4 Database — linked + `db push` applied 0001/0002/0003; seed loaded (weeks 1–2 published, 3 draft); private `worksheets` bucket live.
- [x] §5 Testing — ALL 9 acceptance tests passed (headless harness + curl). Results recorded in TESTING.md. Test artifacts cleaned; DB back to clean seed.
- [x] §6 Deploy — DONE. Private repo github.com/Psyber-Digital/psyber-portal → Vercel Pro at https://psyber-portal.vercel.app (Node 22) → deployed URL in Supabase redirect URLs → acceptance tests re-run against prod (all pass) → Asher promoted to admin.
- [x] §8 ADRs (0012–0016) + ROADMAP.md + TODO.md written. Client-upload-next recorded as ADR-0016.

## Email / SMTP (added post-brief — was a real go-live blocker)
- Custom SMTP via **Resend**, sending from `noreply@psyberdigital.com`. Domain verified by DNS (DKIM/SPF/MX on `send.` + `resend._domainkey`, added in SiteGround). Supabase Auth → custom SMTP enabled; email rate limit raised to 100/hr.
- **Email templates fixed:** default Supabase templates use a link style this app doesn't handle → login redirect loop. "Magic Link" and "Confirm signup" templates edited to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`. Verified end-to-end in prod (session set, `/` → `/admin`). Documented in README §6.

## Git
Local repo initialised in this folder, one commit on `main`. `.env.local` git-ignored (verified). Ready to push once the GitHub repo exists.

## Supabase project
Ref `awovtppvjifjhabuzoyg` · region London (eu-west-2) · Data API on · auto-expose tables on · automatic RLS on. Personal access token used for CLI (`sbp_…`, revocable). DB password held by Asher.

## Fixes made to delivered code
1. `src/lib/supabase/server.ts` + `src/middleware.ts` — typed the `setAll(cookiesToSet)`
   callback (`Parameters<SetAllCookies>[0]`) to clear implicit-`any` TS errors. Minimal.
2. `package.json` — bumped `next` 14.2.15 → **14.2.35** (latest 14.x patch). Closes
   CVE-2025-29927 (middleware auth-bypass — critical, and this app's route gate IS
   middleware). Stays within Next 14 per the brief's no-major-upgrade rule.

## Residual known issues (flagged, not fixed — require prohibited major upgrade)
- npm audit: 1 high + 1 moderate remain on 14.2.35 (only fixed by Next 15/16).
  The highs (image-optimizer DoS via remotePatterns, smuggling via rewrites) are
  NOT applicable to this app's surface (no remotePatterns, no rewrites). postcss
  moderate is build-time only. Acceptable to ship on 14.2.35.

## Code review verdict
Load-bearing security code read in full (RLS 0002, download route, admin actions,
admin.ts, portal page, auth). No bugs. Access model correct. Service-role key
isolated to admin.ts, never NEXT_PUBLIC_, .gitignore excludes .env*.local.

## Next step
~~Get Asher's Supabase region decision~~ — done. See "Portal v3" at the bottom for
the live state; everything above this line is history.

## Post-build client-portal changes (22 Jul 2026)
Three portal tweaks requested by Don, all done + `npm run build` clean:
1. **Programme stepper shows the whole programme.** `portal/page.tsx` now reads the
   full week outline (all sessions incl. unpublished) via the service-role client
   (server-only; selects only id/number/title/published — no draft content reaches
   the browser) and feeds it to `Stepper`. Remaining/unpublished sessions render
   greyed. NB: the stepper shows whatever weeks exist in the DB — to show all 10
   sessions, the remaining ones must exist as *draft* weeks in the admin
   "Weeks & Content" tab (title only is enough). New type `WeekOutline` in types.ts.
2. **Coach note icon.** `ThisWeek.tsx` FramingNote — the "D" initial replaced with a
   `CompassIcon` (inline SVG) in the orange disc. `note.initial` in weekGuide is now
   unused but left in place.
3. **Print-ready versions.** New `WEEK_PRINT_RESOURCES` in resources.ts +
   `weekPrintResources()`; StepResources renders a "Print-ready versions" sub-section.
   Three B&W PDFs added to `public/session-01/` (`*-Print-BW.pdf`): Playbook (pre-existing
   from Programme assets), Mindset Reminders + Snapshot generated from the dark-themed
   source HTML via `Programme/.../assets/make-print-bw.py` (white-page + ink palette
   override, rendered with headless Chrome). Canonical copies live in the Programme
   Session-1 assets folder.

Changes are LOCAL only (ClientPortal git repo, uncommitted) — not pushed to the live
Vercel portal. Awaiting Don's go-ahead to deploy.

## Node note
Local Node is v21.6.2; some Supabase sub-packages want ≥22 (warnings only, build fine).

## Shipped since this file was last updated (19–23 Jul 2026)
All on `main` and live. CONTEXT.md had gone stale; recording them here.
- Password login alongside magic links, and a `/portal/account` page to set one.
- Bespoke per-week unlock emails, with the copy held in editable `/emails/*.txt`
  files rather than in code. Reply-to set to asher@psyberdigital.com.
- Clickable program stepper (open any unlocked week via `?week=N`).
- Add Client takes first name + surname; the email greets by first name.
- Delete-client control in `/admin`.
- Session 2 content, its Vimeo pre-work video, and B&W print-ready resources.
- US spelling throughout customer-facing copy ("program", not "programme").

## Portal v3 — Shared Files + Outreach (26 Jul 2026) — BUILT, NOT DEPLOYED
Full design and decisions: `PLAN-shared-files-and-outreach.md`.

**Shared Files** (renamed from "pigeon-hole", now two-way):
- `0004_shared_files.sql` — one table, both directions. Coach→client items expire
  on a per-item window (24h/48h/7d, default 48h); client→coach uploads never
  expire and persist until Asher deletes them.
- **Expiry is enforced inside the RLS SELECT policy**, so an expired file is
  invisible even if the purge never runs. The cron is data minimisation, not
  access control.
- Private `shared-files` bucket with `file_size_limit` (25 MB) and
  `allowed_mime_types` set at the bucket — this is the first upload path a
  non-admin can reach, so the limits are enforced by Supabase, not by app code.
- Emails both ways via Resend: client notified on send (always — a 48-hour window
  nobody is told about is a trap), Asher notified on client upload.
- Purge: hourly Vercel cron (`vercel.json`, Pro allows per-minute) plus a lazy
  sweep on `/admin` load. Has a `?dry=1` mode; run that first.

**Outreach** — the client's own contact database (revised 27 Jul):
- `0005_contacts.sql`. A direct port of the programme's own
  `Session 8 - Outreach/Worksheets/Contact Database.xlsx` — same nine columns,
  same three dropdown vocabularies (Correspondence: Message 1 / Follow Up 1 /
  Follow Up 2 · Medium: Face-To-Face / DM / Instant Message / Email · Status:
  Not Contacted → Converted to Client). Rendered as an editable table, not cards.
- Added on top: `relevance` (the Outreach Strategy's relevant/connector split,
  which the spreadsheet leaves in the client's head), `next_followup_date`, and
  two extra Medium options (Video Call, Phone/Voice Note) because the strategy
  ranks channels warmest-first and the sheet only lists the colder four.
- **Target is 250 names**, shown as a circular target ring. NB the 90-Day
  Doctrine §4.4 sets the week-four count at 100; 250 is Don's figure and
  supersedes it in the portal.
- The named-25-clinicians list was **removed entirely** (Don, 27 Jul) — no
  personal/peer split anywhere.
- A "?" opens a pop-up with the session's own explanation: the compile
  instruction, the three steps (build → categorise → communicate), and what each
  column is for.
- **Framing (corrected 27 Jul, Don):** the database is NOT an evening's work.
  Clients populate it from week one and keep adding right through the programme;
  the outreach itself — actually contacting people — starts later, at the
  outreach sessions. The tab is available from day one with no gate, and a
  standing note tells the client they are not contacting anyone yet. Do not
  reinstate the "an evening and a spreadsheet" framing.
- A "+N this week" pill under the ring, because the list accretes over months.
- **Owner-only RLS with no admin policy at all** — Asher has no read path to a
  client's contact list. Deliberate (Don, 26 Jul): it names third parties who
  never consented to be in Psyber's system.
- CSV import (RFC 4180 — quoted commas, embedded newlines, CRLF, Excel BOM; 16
  parser tests pass) and export (formula-injection guarded).

**Structural:** the portal is no longer one page. `/portal`, `/portal/shared`,
`/portal/outreach`, with `PortalNav` in the header (client only; the admin keeps
its own tab strip).

**Copy:** no "Asher" in client-facing text — "we" / "your coach" throughout. The
personal email sign-off ("Kindest regards, Asher") is deliberately left as-is;
that is a signature, not a reference.

**Also fixed:** `deleteClient` removed the auth user but left their storage bytes
orphaned. Now removes the objects first, and refuses to delete the user if that
fails.

**State (27 Jul, 01:45):** migrations 0004 + 0005 **applied to the live project**
(`supabase db push`, both recorded remotely). Schema verified — 10 checks — and
the security/privacy acceptance tests driven against the live project through
real client sessions: **20 assertions, all passed**, test artifacts deleted with
zero leftovers. See the verification log in TESTING.md. `npm run build` and
`tsc --noEmit` clean.

**DEPLOYED 27 Jul 01:55.** Pushed `b705eca..0bad502` to `main`; Vercel built and
shipped. Verified in production: `/api/outreach/export`, `/api/shared/[id]` and
`/api/cron/purge-shared-files` all return 401 (they exist and demand auth); the
cron route refuses a wrong bearer token (TESTING.md test 17 ✅); `/login` 200 and
`/portal` + `/admin` still redirect correctly — the pre-existing portal is
unaffected.

**Git note:** the push initially failed with 403. The saved credential was the
`QuranFam` account, which has read but not write access to
`Psyber-Digital/psyber-portal`. Fixed by `gh auth login` as Psyber-Digital plus
`gh auth setup-git --hostname github.com`, which sets a github.com-specific
credential helper that takes precedence over the stale macOS keychain entry.
Both accounts remain logged in; QuranFam is untouched.

**`CRON_SECRET` is set** (Don, 27 Jul 02:06) and a rebuild was pushed so the
running deployment picks it up. Confirmed in production: the purge dry run
authenticates and reports correctly, a wrong bearer token gets 401, and no token
gets 401 (TESTING.md tests 15 and 17 ✅). The hourly cron is live.

Still unexercised: the browser-level tests (upload/download round trip, the
Resend emails, the size/MIME rejections, the CSV round trip) — tests 10–13,
15–18, 21–24, 27 in TESTING.md.

Unrelated uncommitted work is sitting in
`public/session-02/Session-2-Niche-Workbook.html` (a half-built "Validate pass")
— must NOT ride along in the v3 commits.


## State — 29 July 2026 (live portal)

Verified in `/admin` against the live deployment, not inferred from the repo.

- **Seven weeks in the live database**, weeks 1–2 published, 3–7 draft.
- The live client (LK-202607) is on **week 2**, and week 2 serves the current
  Niche pre-work. No gap between what she was told and what she sees.

**`supabase/seed.sql` was stale and has been replaced.** It still described the
original three placeholder weeks ("Foundations — Mapping Your Baseline", …) long
after the live database moved to the seven flagship sessions, because
`build_v3.py` writes its generated seed to `ClientPortal-B` and this copy never
received one. Harmless in place — it used `on conflict do nothing` — but it would
have quietly seeded the wrong programme into a fresh project, and it did mislead
a reading of live state on 29 Jul. Now a copy of the generated seed.

> **Refresh it whenever session content changes.** It is generated output living
> in a hand-maintained repo, which is exactly the drift this codebase removed
> everywhere else (`DESCRIPTIONS`, `WEEK_TITLES`, the time budgets). The durable
> fix is a second output target in `build_v3.py`; not done, because that would
> make every content build write into the live repo and that deserves a decision
> rather than a side effect.

### Shipped 29 Jul, 02:00–02:12 — verified in production

The ADR-0021 completion machinery is **live and tested end to end**:
`0006_check_in.sql` applied to the remote database (confirmed via
`supabase migration list --linked`, local *and* remote now show 0006) ·
`emails/check-in.txt` · `sendCheckInEmail` · `loadNamedEmail` · `sendCheckIn`
and `markHeard` · the admin quiet strip · two optional `Profile` fields ·
**`src/lib/activity.ts`**, new to both repos, stamping `last_activity_at` on
real client movement rather than only on the coach's own button.

Three commits — `3817359` tidy-up, `fa2fa83` seed + context, `5ec8522` the
machinery — kept separate so the machinery can be reverted alone. Deployed via
push to `main`; a live test send was confirmed received.

Also committed in the same pass: the deletion of `PreviousWeek.tsx` (no
remaining references), `VIMEO-SETUP.md`, and `design-mockups/`.

## Working sheets: rows are now open-ended (30 Jul 2026)

Liljana wrote in: the generating tables run out of rows. She brainstorms 50–80
niche ideas to get to three, and the sheet prints six. Every table on every
Working Sheet that asks the client to generate a list now carries a **+ Add row**
button with no ceiling, and each added row a **×** to remove it.

- **Fixed in the generator** — `build_v3.py` (`WB_CSS`, `WB_JS`, `gen_workbook`).
  A table gets the button when it has no `prefill`; a prefilled table is a fixed
  checklist (the four research checks) where one more row means nothing.
- **The live sheets were patched, not regenerated.** `content_v3.py` has drifted
  from live Session 01 in wording *and* field count (f37–f40 live, f37 in
  content), so a regeneration would have carried a content change into the live
  portal and renumbered fields a client has already filled in. The patcher
  applies the same three edits and nothing else; it was proved by running it on
  the live sheets for weeks 02–07 and comparing byte-for-byte with the
  generator's own output for those weeks — identical in all six.
- **Added fields live in their own id namespace**, `x<table>_<row>_<col>`. The
  printed rows keep `f1..fN` untouched, so a sheet filled in before this change
  reloads exactly as it was left. Row numbers are never renumbered, so removing
  row 2 of 4 leaves rows 1, 3 and 4 holding their own answers.
- **The field list is now read from the DOM on every save/load** rather than
  captured once at startup — the previous `var els = …` would have silently
  discarded everything typed into an added row.
- Row caps also removed from the two hand-written workbooks:
  `Session-1-Foundations-Workbook.html` (`MAXROWS=5`) and
  `Session-2-Niche-Workbook.html` (`MAXROWS={trans:6,auds:6,props:10}`), in both
  `/public` and their `Programme/Session-*/assets` originals.

**Verified in headless Chrome against the real files**, not by inspection: 25
checks on the week-02 sheet (legacy data restored, 75 rows added with no ceiling,
added rows surviving reload, removal not shifting neighbours, Clear wiping added
rows), 7 on week 01 including the shift checkboxes, a 30-rows-per-table sweep
across all seven weeks, and 14 on the two workbooks at 60 rows a section. All
pass. Field ids, on-page copy and the `psyberB-wkN` storage keys are unchanged on
all seven sheets — checked programmatically against the pre-change files.
`tsc --noEmit` and `npm run build` clean.

**Practical gotcha, cost about half an hour:** local previews of this portal need
**password** sign-in. Magic links redirect to the Supabase Site URL, which is
production, so they always take you off localhost. And check what is on port
3000 first — `ClientPortal-B` runs there with `NEXT_PUBLIC_PREVIEW=1`, which
short-circuits the auth gate in middleware and serves fixtures, so it looks like
a working portal while checking nothing.
