# Acceptance Tests

Run these once the app is live against your Supabase project. Test as three
distinct people in separate private windows; clear caches between runs. The
negative tests (4, 5) are the important ones — they prove access is enforced in
the database, not just hidden in the UI.

Setup: seed weeks 1–2 published, week 3 draft (`supabase/seed.sql`). Create one
test client via the login page.

**Results: all 9 passed against the live Supabase project (`awovtppvjifjhabuzoyg`) on
2026-07-18.** These were driven programmatically (a Node harness minting a real
client session via the admin API + `curl` against the running app), not by three
people in browsers — but every assertion below is the same one the manual method
makes. See the verification log beneath the table.

| # | Test | Expected | Pass |
|---|------|----------|------|
| 1 | Logged out → visit `/portal` and a direct `/api/download/{id}` URL | Redirect to `/login`; download returns 401 | ✅ |
| 2 | Client, `current_week = 0` | No unlocked weeks; published weeks show as locked "upcoming"; draft week invisible | ✅ |
| 3 | Client, `current_week = 2` | Weeks 1–2 unlocked with working downloads; week 3 (draft) invisible | ✅ |
| 4 | **Link test:** as week-2 client, get a week-1 file's `/api/download/{id}` link. Sign out. Open it fresh. Then wait 60s and retry as the entitled client. | Fails when signed out; the signed URL also dies after ~60s | ✅ |
| 5 | **Privilege test:** as a client, call the Supabase JS API to `update profiles set current_week = 99` and `set role = 'admin'` on your own row | Both rejected by RLS (0 rows affected) | ✅ |
| 6 | Admin sets a client's current week +1 | Client immediately sees the newly unlocked week | ✅ |
| 7 | Admin uploads a worksheet + resource to a week | Entitled client can download both | ✅ |
| 8 | Admin unpublishes a week | Week vanishes from that client's view | ✅ |
| 9 | Confirm RLS is ON for all four tables (Supabase → Database → Tables) | `profiles`, `weeks`, `files`, `settings` all show RLS enabled | ✅ |

### Verification log (2026-07-18, local `npm run dev` against live Supabase)

- **Test 1** — `curl` logged-out: `/portal`→307→`/login`, `/admin`→307→`/login`, `/api/download/{id}`→401 `{"error":"Not signed in"}`.
- **Test 2** — client@`current_week=0`: `weeks` query returned published [1,2] only (draft 3 absent); `files` query returned 0 rows.
- **Test 3** — client@`current_week=2`: `files` query returned the week-1 worksheet (entitled). Download served it (see Test 4).
- **Test 4** — entitled client hit `/api/download/{id}` → 307 → signed storage URL; fetching it returned **200** + file body. Decoding the signed token: `exp − iat = 60s` exactly. Logged-out fetch of the route → **401**. Re-fetching the same signed URL at +65s → **400 (expired)**.
- **Test 5** — client session ran `update profiles set current_week=99, role='admin'` on own row → **0 rows** returned; admin re-read confirmed the row **unchanged** (`current_week` still 2, `role` still `client`). RLS `profiles_admin_write` held.
- **Test 6** — admin set the client's `current_week` 0→2; the client's very next `files` query saw the newly-unlocked week-1 file. Unlock propagates immediately (it is an RLS read, not a cached grant).
- **Test 7** — admin uploaded a worksheet to week 1 (service-role storage upload + `files` insert); the entitled client both saw the row and downloaded the bytes.
- **Test 8** — admin set week 1 `published=false`; the client's `weeks` and `files` queries both dropped it immediately. Re-published afterwards.
- **Test 9** — verified functionally: as anon (no session), `profiles`, `files` and `settings` all returned **0 rows** and `weeks` returned only published rows — i.e. RLS is enabled and enforcing on all four tables. (Belt-and-braces: migration `0002_rls.sql` runs `enable row level security` on all four; "automatic RLS" is also on at the project level.)

Test artifacts (one test client user, one test file) were deleted afterwards; the
database is back to clean seed state (weeks 1–2 published, 3 draft; 0 files; 0 profiles).

---

## v3 acceptance tests — Shared Files + Outreach (written 2026-07-26, NOT YET RUN)

These cover migrations 0004 and 0005.

**Status: migrations applied to the live project on 2026-07-27. The security and
privacy tests were driven programmatically against it — 20 assertions, all
passed.** A Node harness created two throwaway clients, signed them in for real
(password grant), exercised RLS through genuine user sessions, and deleted
everything afterwards (verified: 0 leftover rows). Same method as the v1 run.

Tests 14 and 19 are the important ones. Everything else can be re-created; a
privacy failure cannot.

### Verification log (2026-07-27, live project `awovtppvjifjhabuzoyg`)

Schema (10 checks): both tables queryable · `shared-files` bucket exists, is
private, `file_size_limit` = 26214400, `allowed_mime_types` includes
`application/pdf` · anon role gets 0 rows from both tables · the
`contacts.status` and `shared_files.direction` check constraints both reject
invalid values.

- **Test 19** — as client A: `direction='to_client'` **refused**; inserting with
  another client's `client_id` **refused**; setting `expires_at` on their own
  upload **refused**; a legitimate `to_coach` insert **accepted**. A client
  cannot plant a document as though it came from the coach.
- **Test 14** — coach sent a file with a 48h window; client saw it; `expires_at`
  was backdated by an hour; the client's next select returned **0 rows** while an
  admin read confirmed **the row was still in the table**. Expiry is enforced by
  the RLS policy, before any purge has run. This is the assertion the whole
  design rests on.
- **Test 20** — the client's delete of a coach-sent file left the row intact;
  the client's delete of their own upload succeeded.
- **Tests 25/26** — client A added 2 contacts; A saw both; **client B saw 0**;
  B's attempt to insert a row owned by A was **refused**. B was then promoted to
  `admin` and re-authenticated: the admin session saw **0 contacts** while
  successfully reading `shared_files` in the same session — so the empty result
  is the missing admin policy, not a broken query.
- **Purge scoping** — the sweep query matched the expired `to_client` row and
  **no `to_coach` rows**.

### In production (2026-07-27, after the deploy)

- **Test 15** — the purge dry run, called with the real `CRON_SECRET`, returned
  `{"dryRun":true,"matched":0,"objectsRemoved":0,"rowsDeleted":0,"wouldDelete":[]}`.
  Authenticates, reports, deletes nothing. ✅
- **Test 17** — the same route with a **wrong** bearer token → **401**, and with
  **no** token → **401**. ✅
- New routes present and auth-gated in production: `/api/outreach/export`,
  `/api/shared/[id]`, `/api/cron/purge-shared-files` all return 401 to an
  unauthenticated caller (a 404 would mean the deploy had not landed).
- Pre-existing portal unaffected: `/login` 200; `/portal` and `/admin` redirect.

Not yet exercised (needs a browser and real files): 10–13, 16, 18, 21–24, 27.
Notably the end-to-end upload/download path, the Resend emails, the 25 MB and
MIME rejections, and the CSV round trip through Excel. Test 16 (a purge that
actually deletes something) cannot be meaningful until a real file has expired.

One thing the first run caught, worth recording: a batch insert whose objects
have **different key sets** fails, because PostgREST pads the missing key with an
explicit NULL instead of letting the column default apply, and these columns are
`NOT NULL DEFAULT`. The app's own batch inserts (`addNames`, `importContacts`)
build uniform objects and are unaffected — but anything new that batch-inserts
contacts must do the same.

| # | Test | Expected | Pass |
|---|------|----------|------|
| 10 | Admin sends a file to client A with a 24h window | Row created, `expires_at` ≈ now+24h, client A emailed via Resend | ☐ |
| 11 | Client A opens `/portal/shared` | Sees the file, the note, and "24 hours left"; Download serves the bytes | ☐ |
| 12 | Client A's download link, opened signed-out | 401. Signed URL itself expires after 60s | ☐ |
| 13 | **Cross-client test:** client B requests `/api/shared/{A's id}` | 403 — RLS returns no row | ☐ |
| 14 | **Expiry test:** backdate A's row (`update shared_files set expires_at = now() - interval '1 hour'`) | A's `/portal/shared` no longer lists it; `/api/shared/{id}` returns 403 — **before any purge has run**. This proves expiry is enforced by RLS, not by the cron | ☐ |
| 15 | Run the purge **dry** (`/api/cron/purge-shared-files?dry=1` as admin) | Returns the expired row in `wouldDelete`, deletes nothing, `rowsDeleted: 0` | ☐ |
| 16 | Run the purge for real | Object gone from the `shared-files` bucket, row deleted, `to_coach` rows untouched | ☐ |
| 17 | Cron auth: call the purge route with no session and no bearer token | 401 | ☐ |
| 18 | Client A uploads a PDF to the coach | Row created with `expires_at` NULL; Asher emailed; the file appears under "From clients" in `/admin` | ☐ |
| 19 | **Privilege test:** as client A, insert a `shared_files` row with `direction='to_client'`, and another with `client_id` = client B's id | Both rejected by RLS. A client can never plant a file as though it came from the coach, nor into another client's exchange | ☐ |
| 20 | As client A, attempt to delete a `to_client` row the coach sent | Rejected — the client delete policy covers `to_coach` only | ☐ |
| 21 | Upload a 30 MB file, and a `.zip` | Both refused — size by the bucket's `file_size_limit`, type by `allowed_mime_types` | ☐ |
| 22 | Upload an iPhone photo with no declared MIME type | Accepted — the extension resolves it to `image/heic` | ☐ |
| 23 | Delete a client who has Shared Files | Their storage objects are removed as well as their rows — nothing orphaned in the bucket | ☐ |
| 24 | Client A adds contacts, imports a CSV with quoted commas and an embedded newline | Rows land intact; day-first dates parsed correctly | ☐ |
| 25 | **Privacy test:** as the admin, query `contacts` through the API | 0 rows. There is no admin policy on this table, and no UI exposes it | ☐ |
| 26 | **Cross-client test:** client B queries `contacts` | Sees only their own rows, never client A's | ☐ |
| 27 | Export CSV, open in Excel | Names with accents render correctly (BOM); a contact named `=SUM(1)` appears as text, not a formula | ☐ |
| 28 | Confirm RLS is ON for `shared_files` and `contacts` | Both show RLS enabled in the Supabase dashboard | ☐ |

### Test 14 — how to run it

The point is to check expiry **without** relying on the purge. In the Supabase
SQL editor, with a live file in client A's exchange:

```sql
update shared_files
   set expires_at = now() - interval '1 hour'
 where id = '<the row id>';
```

Then, as client A in the browser, reload `/portal/shared` and hit
`/api/shared/<the row id>` directly. Both must behave as though the file never
existed, even though its bytes are still sitting in the bucket. If the file is
still visible, the SELECT policy is wrong — stop and fix before going live.

### Test 5 — how to run it

In the browser console on `/portal` while signed in as a client:

```js
const { createClient } = supabase; // or use the app's client
// Attempt escalation — must fail:
await sb.from('profiles').update({ current_week: 99, role: 'admin' }).eq('id', MY_ID);
// Expect: data null / 0 rows, blocked by profiles_admin_write policy.
```

If either column changes, RLS is misconfigured — stop and fix before going live.
