# Plan — Shared Files + Outreach Database (portal v3)

Started 26 Jul 2026. Supersedes the "pigeon-hole" line in TODO.md.

## What Don asked for
1. The pigeon-hole, renamed and made **two-way**: client shares their workbook with
   the coach, and receives documents from the coach. Coach→client items expire.
2. An **outreach database** — the contact database clients build later in the
   programme — as another tab in the portal.

## Decisions taken (Don, 26 Jul 2026)
| Question | Decision |
|---|---|
| Name of the file area | **Shared Files** |
| Coach→client expiry | From upload, window chosen per item (24h / 48h / 7 days), default 48h |
| Client→coach retention | Persists until the coach deletes it; age warning after 30 days |
| Email on drop | **Always** — client emailed when the coach sends a file; coach emailed when a client uploads |
| Note field | Yes — one line, shown in the portal and in the email |
| Coach visibility of contact list | **None.** The outreach database is private to the client. No admin UI, and no RLS policy grants admin read. |

## Revisions (Don, 27 Jul 2026)
| Change | Detail |
|---|---|
| List target | **250**, not 100. Shown as a circular target ring, gamified. NB the 90-Day Doctrine §4.4 sets the week-four count at 100 — 250 supersedes it here, flagged to Don. |
| The named 25 clinicians | **Removed entirely.** No `list` column, no peer/personal split anywhere. |
| Explanation | A "?" opens a pop-up carrying the session's own explanation of the database — the compile instruction, the three steps, and what each column is for. |
| Schema | Rebuilt to match the actual `Contact Database` spreadsheet (screenshots, 27 Jul): Name · Email Address · Phone Number · First Contact Date · Correspondence · Medium · Last Contact Date · Status · Notes — including its three dropdown vocabularies verbatim. Rendered as a table, not cards. |
| Kept as improvements | `relevance` (step 2 of the Outreach Strategy — the spreadsheet leaves it in the client's head), `next_followup_date`, and two extra Medium options (Video Call, Phone/Voice Note) because the strategy ranks channels warmest-first and the sheet only offers the four coldest. |
| Naming | No "Asher" in client-facing copy — "we" / "your coach" throughout. The personal sign-off on emails ("Kindest regards, Asher") is left alone; that is a signature, not a reference. |
| **Framing (corrected 27 Jul)** | The database is **not** "an evening's work". Clients **populate it from week one** and keep adding right through the programme; the **outreach itself — contacting people — starts later**, at the outreach sessions. Copy makes this explicit, including a standing "You're not contacting anyone yet" note, so nobody starts messaging in week one. |
| Tab availability | **From day one, no gate.** Aligns with 90-Day Doctrine recommendation #1 ("start the contact database in session one"), so there is a real list to work by the time outreach begins. |
| Motivation | A "+N this week" pill under the target ring — the list accretes over months, so what matters day to day is that it keeps moving, not the total alone. |

## Open recommendations (raised 27 Jul, not built)
1. **Follow-ups due filter + nav badge** — deferred by Don. With outreach running for
   months the follow-up date becomes the daily queue; the count is currently shown
   but not clickable.
2. **Two Programme documents are now stale.** Dropping the named-25 clinicians leaves
   `First-Client-Playbook.md` §4.1 (the peer referral engine, rated "High, and it
   compounds past ninety days") and the doctrine's "Two lists start" table describing
   tooling that no longer exists. Not edited — Don to decide whether the 25 is dead as
   a method or merely not a separate list in the portal.
3. **250 vs 100.** The 90-Day Doctrine §4.4 sets the week-four count at 100. 250 is
   Don's figure and is what the portal shows. Worth reconciling in the doctrine.
4. **Table rendering.** All rows render at once. Fine at 250; revisit past ~1000.

## Gate crossed, deliberately
`ROADMAP.md` / ADR-0016 parked client→coach upload behind: DPA, privacy policy,
retention period, deletion path, and a client actually asking. This build supplies
the retention period and the deletion path. **The DPA and privacy policy still do
not exist** — flagged to Don on 26 Jul; he asked for the build anyway. Record as an
ADR.

## Architecture

### Migration 0004 — shared files
Table `public.shared_files`:
- `client_id` — whose exchange this belongs to (always the client, both directions).
- `direction` — `to_client` (coach sent it) | `to_coach` (client sent it).
- `title`, `note`, `storage_path`, `size_bytes`, `mime_type`, `uploaded_by`.
- `expires_at timestamptz` — **nullable**; null means never. Real settable column,
  not computed, so expiry can be tested by backdating rather than waiting 48h.
- `downloaded_at`, `created_at`.

RLS — expiry is enforced **inside the SELECT policy**, so an expired row is
invisible even if the purge job never runs. The purge is data minimisation, not the
security control.
- select: `is_admin() OR (client_id = auth.uid() AND (expires_at IS NULL OR expires_at > now()))`
- insert (client): `client_id = auth.uid() AND direction = 'to_coach' AND uploaded_by = auth.uid() AND expires_at IS NULL`
- delete (client): own `to_coach` rows only.
- all (admin): `is_admin()`.

Bucket `shared-files`, private, **no storage policies** — same posture as 0003, so
the anon/user role cannot touch objects directly. Bytes are reachable only via a
server-signed 60-second URL after an access check.

Client uploads: the server action verifies the user, writes bytes with the service
role (needed, as the bucket has no policies), then inserts the metadata row with the
**user-scoped** client so the RLS policy is the real gate.

### Migration 0005 — contacts
Table `public.contacts`, one row per contact, owned by the client. Columns follow
`Session 8 - Outreach/Worksheets/Contact Database.xlsx` (Name, Email, Phone, First
Contact Date, Correspondence/Medium, Last Contact Date, Status, Notes) plus what the
90-Day Doctrine and Outreach Strategy add:
- `list` — `personal` | `peer` (the named-25 clinicians referral engine).
- `relevance` — `relevant` | `irrelevant` | `unsure` (irrelevant contacts are asked
  for introductions — a second funnel, not a courtesy).
- `status` — `not_contacted` | `contacted` | `replied` | `call_booked` | `client` |
  `no` | `referred`.
- `medium` — face-to-face / video / voice / message / email (the doctrine's channel
  ranking, warmest first).
- `next_followup_date` — the doctrine's 3-and-7-day follow-up discipline.

RLS: `owner_id = auth.uid()` for ALL operations. **No admin policy** — deliberate,
per Don's decision. Note honestly: the service-role key still bypasses RLS, so this
is "no UI and no API path exposes it", not a cryptographic guarantee.

### Purge
- `vercel.json` cron, hourly → `/api/cron/purge-shared-files`, guarded by
  `CRON_SECRET` (Vercel injects `Authorization: Bearer $CRON_SECRET`).
  Verified 26 Jul: Vercel **Pro** allows per-minute cron precision; Hobby is daily.
- Same sweep runs lazily on `/admin` load, so it self-heals if cron is misconfigured.
- Deletes storage objects first, then rows. Deleting only the DB row would leave the
  bytes in storage.

### Portal navigation
The portal is currently a single page. Adding:
- `/portal` — this week (unchanged)
- `/portal/shared` — Shared Files
- `/portal/outreach` — Outreach database
with a nav in `Header.tsx`. Admin gets a "Shared Files" tab in the existing
`AdminDashboard` tab strip.

### Bug fixed along the way
`deleteClient` deletes the auth user (cascading the rows) but never removes their
storage objects — it would leak bytes. Patched to the `deleteWeek` shape: select
paths, `storage.remove`, then delete.

## Build order
1. Migrations 0004 + 0005 (SQL only — NOT pushed until Don approves).
2. Types.
3. Shared Files: server actions, download route, admin tab, client page, emails.
4. Purge route + vercel.json + lazy sweep.
5. Outreach: server actions, client page, CSV import/export, counts.
6. `deleteClient` storage patch.
7. Build + typecheck clean, local test against the live Supabase project using a
   throwaway test client, then acceptance tests written into TESTING.md.
8. Show Don the SQL; get go-ahead for `db push` and for the deploy.

## Live-system constraints
- There is no dev Supabase project. `supabase db push` hits the live project
  `awovtppvjifjhabuzoyg` — needs Don's explicit go-ahead.
- Pushing to `main` auto-deploys to Vercel — needs Don's explicit go-ahead.
- Don must add `CRON_SECRET` in the Vercel dashboard himself (manual step).
- Uncommitted, unrelated work is sitting in `public/session-02/Session-2-Niche-Workbook.html`
  (a half-built "Validate pass"). Do NOT let it ride along in these commits.
