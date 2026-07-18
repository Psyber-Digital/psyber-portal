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

### Test 5 — how to run it

In the browser console on `/portal` while signed in as a client:

```js
const { createClient } = supabase; // or use the app's client
// Attempt escalation — must fail:
await sb.from('profiles').update({ current_week: 99, role: 'admin' }).eq('id', MY_ID);
// Expect: data null / 0 rows, blocked by profiles_admin_write policy.
```

If either column changes, RLS is misconfigured — stop and fix before going live.
