# Client Portal — Roadmap

> **North star:** this portal is the intended seed of the **PsyberOS delivery surface**
> — grown incrementally on the same stack, not replaced. Bound by ADR-0009 (each
> increment needs a named trigger) and ADR-0008 (sequence). Multi-tenancy is the
> deliberate line where "Asher's portal" becomes "PsyberOS". See ADR-0017.


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

## Built, not yet deployed (v3 — 2026-07-26)
- **Shared Files.** Two-way document exchange. Coach→client items expire on a
  per-item window (24h/48h/7d); client→coach uploads persist until deleted. Expiry
  is enforced in the RLS SELECT policy, so the hourly purge is data minimisation
  rather than access control. Private bucket with size and MIME limits set at the
  bucket, because this is the first upload path a non-admin can reach.
- **Outreach contact database.** The client's own list, owner-only RLS with **no
  admin policy** — the coach has no read path to it. Columns follow the
  programme's own Contact Database worksheet plus the relevant/connector split and
  the named-25-clinicians list. CSV import and export.

## Next increment (deferred, gated — do NOT build casually)
- **Client upload / submitting completed work.** ~~Deferred~~ — **shipped as part of
  Shared Files on 26 Jul 2026**, at Don's explicit request. The retention period and
  deletion path required by [ADR-0016] now exist; **the DPA and privacy policy do
  not, and are now overdue.** This gate was crossed knowingly, not by oversight.

## Explicitly out of scope (v1 scope fence)
Payments, multi-practitioner / orgs / roles beyond client+admin, ~~notifications~~,
analytics, ~~password auth~~. Build for one practitioner until there are two.
(Notifications and password auth were both deliberately taken back in scope in
v2/v3 — transactional email is now load-bearing for week unlocks and Shared Files.)

[ADR-0009]: ../Codex/codex-decisions.md
[ADR-0012]: ../Codex/codex-decisions.md
[ADR-0013]: ../Codex/codex-decisions.md
[ADR-0014]: ../Codex/codex-decisions.md
[ADR-0015]: ../Codex/codex-decisions.md
[ADR-0016]: ../Codex/codex-decisions.md
