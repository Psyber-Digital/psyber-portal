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
- [ ] **Pigeon-hole** — admin uploads per-client docs; client downloads own only. **Auto-expire + delete after 48 hours.** New table + admin UI + RLS + storage lifecycle. (Admin→client direction; distinct from the gated client→admin upload below.)
- [ ] **Auto-email on week unlock** — when a client's `current_week` is bumped, send a "what to do this week" email (Resend). Originally requested; ties to the per-week framing note.
- [ ] **Video hosting (item 4)** — stop serving the mp4 from Vercel/Supabase; host on Vimeo unlisted / Cloudflare Stream / Mux and embed. NEEDS Don's host choice + account. Draft video is currently 4m30s (script targets 9–10m — portal length copy may need updating on final render).

## Later (gated — see ROADMAP / ADR-0016)
- [ ] Client upload — only after DPA, privacy policy, retention rule, deletion path exist, and a client asks.

## Housekeeping / tech notes
- [ ] Consider moving local dev to **Node 22 LTS** (Supabase packages want ≥22). Until then, local
      dev must run with the WebSocket flag: `NODE_OPTIONS='--experimental-websocket' npm run dev`.
      Vercel runs Node 22, so production needs no flag.
- [ ] `next` is pinned to 14.2.35 (patched). Residual `npm audit` items only clear on Next 15/16
      (a major upgrade the brief prohibits) and don't apply to this app's surface (no image
      `remotePatterns`, no `rewrites`). Revisit if/when a deliberate major upgrade is planned.

- **Every session must ship black-and-white, print-ready versions of its resources** (`WEEK_PRINT_RESOURCES[n]`), like weeks 1–2. Generate with `Programme/<session>/assets/make-print-bw*.py`.
