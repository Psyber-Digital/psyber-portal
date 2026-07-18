# Client Portal — Roadmap

## Shipped (v1 — 2026-07-18)
A login-gated client portal. Clients sign in by magic link (no passwords) and see
this week's worksheet + resources plus every previous week's — never a future week.
Access is one integer per client (`current_week`), set manually by the practitioner.

- Stack: Next.js 14 (App Router) + Supabase (Postgres/Auth/Storage/RLS) + Tailwind. See [ADR-0012].
- Access model: "a position, not a set" — `published AND number <= current_week`, enforced by RLS. See [ADR-0013].
- Auth: Supabase magic links, no passwords. See [ADR-0014].
- Downloads: private bucket + `/api/download/[fileId]` that checks entitlement as the
  user, then signs a 60-second URL with the service role. See [ADR-0015].
- Build verified (Next 14.2.35), all 9 acceptance tests passed against the live project.

## Next increment (deferred, gated — do NOT build casually)
- **Client upload / submitting completed work.** Schema is ready (`files.owner_id` is
  nullable and unused). Gated behind data-protection work: DPA, privacy policy,
  retention period, deletion path. See [ADR-0016] and [ADR-0009]. Needs a named
  trigger (a client/graduate actually asking) before it proceeds.

## Explicitly out of scope (v1 scope fence)
Payments, multi-practitioner / orgs / roles beyond client+admin, notifications,
analytics, password auth. Build for one practitioner until there are two.

[ADR-0009]: ../Codex/codex-decisions.md
[ADR-0012]: ../Codex/codex-decisions.md
[ADR-0013]: ../Codex/codex-decisions.md
[ADR-0014]: ../Codex/codex-decisions.md
[ADR-0015]: ../Codex/codex-decisions.md
[ADR-0016]: ../Codex/codex-decisions.md
