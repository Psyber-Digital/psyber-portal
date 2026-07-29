# Client Portal — TODO

## Go-live — DONE (2026-07-18/19)
- [x] Private GitHub repo: github.com/Psyber-Digital/psyber-portal.
- [x] Vercel Pro, Node 22, live at https://psyber-portal.vercel.app.
- [x] Four env vars set in Vercel; `NEXT_PUBLIC_SITE_URL` = deployed URL.
- [x] Deployed URL added to Supabase redirect URLs.
- [x] Acceptance tests re-run against the deployed URL (all pass).
- [x] Asher promoted to admin (done via service role, no hardcoded email).
- [x] Custom SMTP (Resend, `noreply@psyberdigital.com`) + email templates fixed + rate limit raised. See README §6.

## Content
- [ ] Replace the three seed weeks (placeholder titles) with real programme weeks, or edit them in `/admin`.
- [ ] Replace the three seed weeks (placeholder titles) with real programme weeks, or edit them in `/admin`.
- [ ] Upload real worksheets/resources per week via `/admin`.

## Portal v2 redesign (in progress — started 22 Jul)
Design mockup: `design-mockups/client-portal-v2.html` (static, open by file://). Approved look then port into React components.
Look/UI changes (in mockup, awaiting sign-off):
- [ ] More orange as primary accent; lifted low-contrast greys for clarity.
- [ ] Per-week structure: framing note → video (step 1) → workbook (step 2, prominent) → resources (step 3).
- [ ] "A note from Don" framing note + accurate time budget (≈25 min = 5 watch + 20 workbook).
- [ ] Workbook save caveat (localStorage is per-browser; prompt to download PDF).
- [ ] Booking moved to bottom of page.
- [ ] Mobile-friendly pass.
Backend features to build after look sign-off:
- [x] ~~**Pigeon-hole**~~ — superseded and delivered as **Shared Files** (26 Jul): two-way,
      renamed, coach→client expires on a per-item window, client→coach persists.
      Built and building clean; **not yet migrated or deployed**. See `PLAN-shared-files-and-outreach.md`.
- [x] **Auto-email on week unlock** — done, with bespoke per-week copy in `/emails/*.txt`.
- [ ] **Video hosting (item 4)** — stop serving the mp4 from Vercel/Supabase; host on Vimeo unlisted / Cloudflare Stream / Mux and embed. NEEDS Don's host choice + account. Draft video is currently 4m30s (script targets 9–10m — portal length copy may need updating on final render).

## Portal v3 — go-live steps (blocked on Don)
- [ ] Approve and apply `supabase db push` (0004 + 0005) — **live project, no dev copy**.
- [ ] Add `CRON_SECRET` in the Vercel dashboard (Settings → Environment Variables).
- [ ] Run the v3 acceptance tests 10–28 in TESTING.md, especially 14 (expiry without purge),
      19 (a client can't plant a file as the coach) and 25 (admin can't read contacts).
- [ ] Run the purge **dry** (`/api/cron/purge-shared-files?dry=1`) before enabling it for real.
- [ ] Deploy (push to `main` auto-deploys).

## Later (gated — see ROADMAP / ADR-0016)
- [x] Client upload — **gate crossed deliberately on 26 Jul** as part of Shared Files.
      Retention rule and deletion path now exist. **DPA and privacy policy still do not.**
- [ ] **Write the DPA and privacy policy.** Now overdue: clients can upload reflective
      personal material, and their contact database names third parties who never consented.
- [x] ~~Decide a retention rule for client→coach uploads~~ — **DECIDED 28 Jul 2026: 90 days from
      upload, then delete.** Recorded in `Compliance/retention-schedule.md` R2 and published in the
      privacy policy. **The build is now outstanding** ↓
- [ ] **BUILD: implement the 90-day rule for `to_coach` uploads.** Today they never expire —
      `expires_at` is null by design and the hourly purge only sweeps rows where it is non-null
      (`shared_files_expiry_idx` is a partial index that excludes them). Two routes, and they are
      **not** equivalent:
      - Set `expires_at = now() + 90 days` on insert → simplest, but the RLS SELECT policy treats a
        non-null expiry as an access gate, so the file would also become **invisible to the client**
        at 90 days.
      - Add a separate age-based sweep that deletes `to_coach` rows on `created_at` → changes
        retention without changing what the client can see. **Take this one.**
      Live schema change: needs a proper reviewed build, not a quick edit. Keep the admin UI's
      existing 30-day age warning either way.

## Housekeeping / tech notes
- [ ] Consider moving local dev to **Node 22 LTS** (Supabase packages want ≥22). Until then, local
      dev must run with the WebSocket flag: `NODE_OPTIONS='--experimental-websocket' npm run dev`.
      Vercel runs Node 22, so production needs no flag.
- [ ] `next` is pinned to 14.2.35 (patched). Residual `npm audit` items only clear on Next 15/16
      (a major upgrade the brief prohibits) and don't apply to this app's surface (no image
      `remotePatterns`, no `rewrites`). Revisit if/when a deliberate major upgrade is planned.

- **Every session must ship black-and-white, print-ready versions of its resources** (`WEEK_PRINT_RESOURCES[n]`), like weeks 1–2. Generate with `Programme/<session>/assets/make-print-bw*.py`.
