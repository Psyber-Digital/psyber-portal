-- Psyber Portal — Build member emails sent, so none is ever sent twice
-- (Offer Ladder m17; wording approved by Don on board card r18, 29 Oct 2026).
--
-- kind: 'cancel' | 'place_7d' | 'place_1d' | 'renewal_yearly'
-- ref:  what the email is about, so a new cancel or a new renewal year gets its
--       own email: the subscription id, the lapse time, or the renewal date.
-- Only the server (admin client) reads or writes this table.

create table public.email_log (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  kind     text not null check (kind in ('cancel','place_7d','place_1d','renewal_yearly')),
  ref      text not null,
  sent_at  timestamptz not null default now(),
  unique (user_id, kind, ref)
);

alter table public.email_log enable row level security;

create policy email_log_admin_read on public.email_log
  for select using (public.is_admin());
