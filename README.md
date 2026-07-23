# Psyber Portal

A login-gated client portal: clients see this week's worksheet and resources
plus every previous week's, never future weeks. Access is granted manually by
the practitioner, one client at a time. Built with Next.js + Supabase + Tailwind.

**Core idea — access is a position, not a set.** Each client has a single
integer `current_week`. A week is visible iff `published AND number <= current_week`.
That one number is the whole access model.

---

## What you need to do (the parts that need your accounts)

I built the code. These five steps need your credentials, so they're yours:

### 1. Create a Supabase project
See `psyber-portal-infrastructure-setup.md`. **The region is permanent — decide
on jurisdiction, default to London.** Copy the URL, anon key, and service-role
key from Project Settings → API.

### 2. Configure environment
```bash
cp .env.local.example .env.local
# fill in the three Supabase values + NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Install and run migrations
```bash
npm install
# link the project (needs your project ref + the DB password you saved):
npx supabase link --project-ref YOUR_REF
npx supabase db push          # applies migrations in supabase/migrations/
# optional test data:
# run supabase/seed.sql in the Supabase SQL editor
```
This creates the four tables, all RLS policies, the profile-on-signup trigger,
and the private `worksheets` storage bucket.

### 4. Run it
```bash
npm run dev            # http://localhost:3000
```
Sign in with your email (magic link). Then **promote yourself to admin** — in the
Supabase SQL editor:
```sql
update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';
```
Refresh; you'll land on `/admin`.

### 5. Deploy (when ready)
Push to your private GitHub repo, import into **Vercel (Pro — Hobby forbids
commercial use)**, add the same env vars in the Vercel dashboard, set
`NEXT_PUBLIC_SITE_URL` to the deployed URL. In Supabase → Auth → URL
Configuration, add your deployed URL to the allowed redirect URLs.

### 6. Email / magic links — REQUIRED before real clients (easy to miss)
Two things must be configured in Supabase or logins break:

1. **Custom SMTP.** Supabase's built-in email is rate-limited to a few messages
   per hour and is not for production — clients will hit "email rate limit
   exceeded". Wire in a transactional provider (we use **Resend**): verify your
   sending domain via DNS, then Supabase → Auth → SMTP Settings → enable custom
   SMTP with the provider's host/port/user/API-key and a sender on the verified
   domain. Then raise Auth → Rate Limits → emails/hour.

2. **Email templates MUST use the token-hash link.** This app verifies logins at
   `/auth/confirm` via `verifyOtp({ token_hash })`. Supabase's *default* email
   templates send a different link style that this app does not handle, causing a
   redirect **loop** back to `/login`. In Supabase → Auth → Email Templates, edit
   **both** "Magic Link" and "Confirm signup" so the link is:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
   (The `pkce_`-prefixed token that this produces IS accepted by `verifyOtp` —
   verified in production. The loop is caused only by the default template, not by
   PKCE.)

---

## How it works

- **Auth:** Supabase Auth. Password sign-in is the primary method; a magic link
  is always available as a fallback (and doubles as password recovery — sign in
  by link, then set/reset a password at `/portal/account`). Passwords are stored
  hashed by Supabase; this app never stores or handles raw passwords. The
  token-hash email template above is still required — magic links, registration
  and link-based recovery all depend on it.
- **Client view (`/portal`):** programme stepper, booking panel, unlocked week
  cards (worksheet + resources split), locked "upcoming" tiles.
- **Admin (`/admin`):** set each client's current week (the weekly ritual);
  create/publish weeks; upload files; edit the booking link.
- **Downloads:** private bucket + `/api/download/[fileId]`. The route checks the
  file is visible to the signed-in user (RLS) *before* signing a 60-second URL.
  A shared link is useless to anyone not entitled and expires fast.

## Security notes

- `SUPABASE_SERVICE_ROLE_KEY` is server-only. It's never prefixed `NEXT_PUBLIC_`
  and is imported only by the download route and admin actions, always after an
  admin/access check.
- RLS is enabled on all tables; a client cannot read another client's files or
  change their own `current_week`/`role`. See `TESTING.md`.

## Not in v1 (deliberately)

Client uploads, payments, multi-practitioner/orgs, notifications, custom domains
beyond basic setup. The `files.owner_id` column exists so client uploads can be
added later without a schema rewrite — but the feature is gated behind
data-protection work (DPA, privacy policy, retention, deletion path).

## Project map

```
supabase/migrations/   0001 schema · 0002 RLS · 0003 storage bucket
src/lib/supabase/      client (browser) · server (RLS) · admin (service role)
src/middleware.ts      session refresh + route gate
src/app/login          magic-link auth
src/app/portal         client view + components
src/app/admin          dashboard + server actions
src/app/api/download   secure signed-URL download
```
