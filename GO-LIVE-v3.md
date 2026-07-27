# Go-live runbook — Portal v3 (Shared Files + Outreach)

Written 26 Jul 2026. **Nothing in this list has been done yet.**

Do these **one step at a time**. Stop at each checkpoint and check the result
before moving on. Where a step says TERMINAL, type it into your terminal; where
it says BROWSER, do it in a web page.

---

## Step 1 — BROWSER. Validate the SQL without applying it

This runs both new migrations against the real database inside a transaction and
then throws the changes away. It proves the SQL is correct before anything
permanent happens. Nothing is saved.

Go to the Supabase dashboard → your project → **SQL Editor** → New query.

Paste this, then the full contents of `supabase/migrations/0004_shared_files.sql`,
then the full contents of `supabase/migrations/0005_contacts.sql`, then the final
line:

```sql
begin;

-- (paste 0004 here)
-- (paste 0005 here)

rollback;
```

Press Run.

**Success looks like:** "Success. No rows returned." and no red error text.
**Failure looks like:** a short red error naming a line or a column. If you see
one, stop and send it to me — do not proceed.

Because the last line is `rollback`, nothing was kept either way.

---

## Step 2 — TERMINAL. Apply the migrations for real

Only after Step 1 came back clean.

```
cd /Users/asher/HQ/Projects/1-PsyberDigital/ClientPortal
```

Then, as a separate step:

```
npx supabase db push
```

**Success looks like:** a short list showing `0004_shared_files.sql` and
`0005_contacts.sql` applied. It may ask for your database password — that is the
one you hold, not the API keys.

**This is the first irreversible step.** It changes the live database. It only
adds two new tables and one new storage bucket; it does not touch anything that
already exists.

---

## Step 3 — BROWSER. Add the cron secret to Vercel

Do this **before** the deploy, or the hourly job will fail with a 401 every hour
until you do (harmless, but it will fill the log with errors).

Vercel dashboard → the `psyber-portal` project → **Settings** → **Environment
Variables** → Add New.

- Name: `CRON_SECRET`
- Value: a long random string. Generate one in your TERMINAL with:

```
openssl rand -hex 32
```

- Environments: tick **Production**.

Save.

---

## Step 4 — Deploy

Push to `main`. Vercel deploys automatically. `vercel.json` registers the hourly
purge on that deploy.

---

## Step 5 — BROWSER. Dry-run the purge before trusting it

Signed in as admin, visit:

```
https://psyber-portal.vercel.app/api/cron/purge-shared-files?dry=1
```

**Success looks like** a small block of JSON with `"dryRun": true` and
`"rowsDeleted": 0`. If `wouldDelete` lists anything, read it — those are the
files the real run would remove. Nothing is deleted by this.

Only once that list looks right should the real hourly run be trusted. It will
start on its own; you do not need to trigger it.

---

## Step 6 — Run the acceptance tests

Tests 10–28 in `TESTING.md`. The three that matter most:

- **14** — expiry works without the purge (proves RLS is the gate).
- **19** — a client cannot plant a file as though it came from you.
- **25** — you cannot read a client's contact database.

---

## Still outstanding after all this

- **The DPA and the privacy policy do not exist.** Clients can now upload
  reflective personal material, and their contact database names third parties
  who never agreed to be in Psyber's system. ADR-0016 named these as the gate for
  client uploads; the gate was crossed deliberately on 26 Jul at your request.
  They are now overdue, not optional.
- No retention rule on client→coach uploads beyond "until you delete it" — there
  is a 30-day age warning in the admin UI, nothing more.
