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
Get Asher's Supabase region decision (default London eu-west-2), then do §3–6 together.

## Node note
Local Node is v21.6.2; some Supabase sub-packages want ≥22 (warnings only, build fine).
