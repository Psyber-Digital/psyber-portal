# Client Portal — TODO

## Remaining to go live (needs Asher — credential-gated)
- [ ] Push this folder to a **private** GitHub repo named `psyber-portal`.
- [ ] Import into **Vercel (Pro plan** — Hobby forbids commercial use); set Node version to **22.x**.
- [ ] Add the four env vars in Vercel (same as `.env.local`), with `NEXT_PUBLIC_SITE_URL` = the deployed URL.
- [ ] In Supabase → Auth → URL Configuration, add the deployed URL to allowed redirect URLs (magic links break otherwise).
- [ ] Re-run the acceptance tests against the **deployed** URL, not just local.
- [ ] Sign in once as Asher, then promote to admin in the Supabase SQL editor:
      `update public.profiles set role = 'admin' where email = '<asher-email>';`

## Content
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
