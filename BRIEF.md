# BRIEF: Ship the Client Portal (for Claude Code in HQ)

**For:** Claude Code running in `/Users/asher/HQ`
**Suggested location:** `Projects/1-PsyberDigital/ClientPortal/BRIEF.md`
**Status:** The codebase already exists. Your job is to verify, wire up, test, and deploy it — not to rebuild it. This brief is self-contained; you do not need any prior conversation.

---

## 0. Situation

A working client portal has already been built (Next.js + Supabase + Tailwind) and delivered as `psyber-portal.zip`. It was authored in an environment with **no package registry access**, so it has NOT yet been compiled, type-checked, or run. Everything downstream of "does it actually build" is unverified. That's the first thing you do.

The founder (Asher) must be present for the account/credential steps (§3) — you cannot create his Supabase/Vercel/GitHub accounts or choose his data region for him. Do those steps *with* him, not around him.

**What the portal does:** clients sign in (magic link, no passwords) and see this week's worksheet + resources plus every previous week's — never future weeks. Access is granted manually by Asher, one client at a time. The whole access model is a single integer per client, `current_week`; a week is visible iff `published AND number <= current_week`. Do not "improve" this model.

---

## 1. Ingest

1. Ask Asher for `psyber-portal.zip` (it's in his Cowork outputs folder). Unzip its contents into `Projects/1-PsyberDigital/ClientPortal/`.
2. Read `README.md` and `TESTING.md` at the root of the unzipped project — they are the spec. This brief and those two files should agree; if they don't, flag it, don't guess.
3. Skim the tree so you know the shape:
   ```
   supabase/migrations/  0001 schema · 0002 RLS · 0003 storage bucket
   src/lib/supabase/     client (browser) · server (RLS) · admin (service role)
   src/middleware.ts     session refresh + route gate
   src/app/login         magic-link auth
   src/app/portal        client view + components
   src/app/admin         dashboard + server actions
   src/app/api/download   secure signed-URL download
   ```

---

## 2. Verify the build (this is the real test — do it first)

The code passed only a static check (imports resolve, braces balance, no service-role key leak). It has never been compiled. Expect possibly a small number of type/import fixes.

```bash
cd Projects/1-PsyberDigital/ClientPortal
npm install
npm run typecheck      # tsc --noEmit
npm run build          # next build
```

- Fix whatever these surface. Likely candidates if anything: a React 18 vs 19 `useFormState`/`useActionState` naming difference (this targets Next 14 / React 18 — keep it there unless you deliberately upgrade), a Tailwind arbitrary-value string, or an async-cookies signature. Keep fixes minimal and conventional.
- **Do not upgrade Next/React major versions** to "modernise." Legibility and stability matter more than currency here; Asher intends to extend this with AI help, so keep it boring.
- If you change anything, note it in your final report.

Stop and get a clean `npm run build` before touching accounts.

---

## 3. Accounts & config (with Asher — credential-gated)

Work through `README.md` §1–3 together. The load-bearing points:

1. **Supabase project region is permanent and cannot be changed later** (moving means a full data migration). Decide on **jurisdiction, not latency** — where Psyber Digital is *established*, not where clients are. Default to **London (`eu-west-2`)** when in doubt; the market is UK/US-undecided and the stricter jurisdiction is the safe default. This is Asher's call — surface it explicitly, don't pick silently.
2. `cp .env.local.example .env.local` and fill the three Supabase values + `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
3. **Security invariant to preserve:** `SUPABASE_SERVICE_ROLE_KEY` is server-only, never prefixed `NEXT_PUBLIC_`, and imported only by `src/lib/supabase/admin.ts` (used by the download route and admin actions). Do not widen this.

---

## 4. Database

```bash
npx supabase link --project-ref <REF>     # needs the DB password Asher saved
npx supabase db push                       # applies 0001, 0002, 0003
```

This creates the four tables, all RLS policies, the profile-on-signup trigger, and the private `worksheets` bucket. Optionally load `supabase/seed.sql` (weeks 1–2 published, week 3 draft) via the Supabase SQL editor for testing.

Then have Asher sign in once at `/login`, and promote him:
```sql
update public.profiles set role = 'admin' where email = '<ASHER_EMAIL>';
```
Do not hardcode an admin email anywhere in the code.

---

## 5. Test (do not skip the negative tests)

Run `npm run dev` and work through **all of `TESTING.md`** as three separate people in private windows, clearing caches between runs. The two that actually prove security:

- **Test 4 (link test):** a locked week's `/api/download/{id}` link must fail when signed out, and the signed URL must die after ~60s even for an entitled client.
- **Test 5 (privilege test):** a client calling the API to set their own `current_week` or `role` must be rejected by RLS (0 rows).

If either fails, the access model is broken — fix before going further. Record pass/fail back into `TESTING.md`.

---

## 6. Deploy

1. Push to a **private** GitHub repo (`psyber-portal`).
2. Import into **Vercel — Pro plan** (Hobby prohibits commercial use; a paid-programme portal is commercial). Add the same env vars in the Vercel dashboard; set `NEXT_PUBLIC_SITE_URL` to the deployed URL.
3. In **Supabase → Auth → URL Configuration**, add the deployed URL to allowed redirect URLs (magic links break otherwise).
4. Re-run the §5 acceptance tests against the *deployed* URL, not just local.

---

## 7. Scope fence — do NOT build these

Each is real work with real cost, and premature complexity is what makes a codebase un-extendable. If a need for one appears, flag it and stop.

- ❌ Client uploads / submitting completed work. **Coming later**, and gated behind data-protection work (DPA, privacy policy, retention, deletion path). The schema already has a nullable `files.owner_id` so it can be added without a rewrite — but do not build the feature now.
- ❌ Payments, multi-practitioner/orgs/roles beyond client/admin, notifications, analytics, password auth.

---

## 8. When done — HQ conventions

Per the Codex rules (Codex is the single source of truth; log decisions as ADRs):

1. Write **ADRs** for the load-bearing decisions so a future cold session can't accidentally undo them: (a) stack chosen for AI-extensibility; (b) "access is a position, not a set"; (c) magic-link / no-password auth; (d) private bucket + pre-checked signed-URL downloads.
2. Record in the Codex that **client upload is the next scope increment**, gated behind data-protection work — not a casual add.
3. Update `TODO.md` / `ROADMAP.md` with what shipped and what's deferred.

**Report back with:** the clean build result and any fixes you made; the deployed URL; the completed `TESTING.md`; and anything in the delivered code you think is wrong — flagged, not silently changed.
```
