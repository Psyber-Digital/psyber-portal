-- Completion machinery (ADR-0020). Drift is the documented failure mechanism:
-- sessions slip, a few weeks pass, momentum goes, the client fizzles. Two of
-- eight past clients finished. This is the instrumentation that lets a stall be
-- seen and answered before it becomes a fizzle.
--
-- Deliberately additive: two nullable columns on an existing table. No data is
-- moved, nothing is dropped, and the portal behaves identically if they are null.

alter table public.profiles
  add column if not exists last_activity_at timestamptz,
  add column if not exists last_nudge_at    timestamptz;

comment on column public.profiles.last_activity_at is
  'Last time this client was seen to move — week advanced, or the coach marked that they heard back. Drives the quiet-days flag in /admin.';
comment on column public.profiles.last_nudge_at is
  'Last time a check-in email was sent to this client. Stops the same nudge going twice in a day.';

-- Existing clients start from now rather than appearing 10 years quiet.
update public.profiles set last_activity_at = coalesce(last_activity_at, created_at, now());
