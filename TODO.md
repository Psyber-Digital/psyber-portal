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

## Later (gated — see ROADMAP / ADR-0016)
- [ ] Client upload — only after DPA, privacy policy, retention rule, deletion path exist, and a client asks.

## Housekeeping / tech notes
- [ ] Consider moving local dev to **Node 22 LTS** (Supabase packages want ≥22). Until then, local
      dev must run with the WebSocket flag: `NODE_OPTIONS='--experimental-websocket' npm run dev`.
      Vercel runs Node 22, so production needs no flag.
- [ ] `next` is pinned to 14.2.35 (patched). Residual `npm audit` items only clear on Next 15/16
      (a major upgrade the brief prohibits) and don't apply to this app's surface (no image
      `remotePatterns`, no `rewrites`). Revisit if/when a deliberate major upgrade is planned.
