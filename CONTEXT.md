# CONTEXT — Client Portal build

## Objective
Verify, wire up, test, and deploy the pre-built Psyber client portal (Next.js + Supabase + Tailwind) per `BRIEF.md`. Do NOT rebuild it.

## Progress
- [x] §1 Ingest — already unzipped into this folder; README/TESTING agree with BRIEF.
- [x] §2 Build verified — `npm install`, `typecheck`, `build` all clean (9 routes).
- [ ] §3 Accounts & config — CREDENTIAL-GATED, needs Asher. **Region decision pending.**
- [ ] §4 Database — supabase link + db push.
- [ ] §5 Testing — work through TESTING.md (esp. negative tests 4 & 5).
- [ ] §6 Deploy — private GitHub repo → Vercel Pro → Supabase redirect URL.
- [ ] §8 ADRs + Codex + TODO/ROADMAP.

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
