-- Psyber Portal — Build billing (Offer Ladder stage 4, ADR-0027).
--
-- What changes for a person:
--   - Paying for Build (Stripe) moves a Foundations member to 'build'.
--   - When the subscription ends, they move back to 'foundations'. Their place
--     in the program is kept, so it comes back if they rejoin.
--   - Flagship clients, admins and 'pending' accounts are never touched by
--     billing. Only foundations <-> build moves here.
--
-- Stripe is the record of the subscription. The webhook route
-- (src/app/api/stripe/webhook) fetches each subscription fresh from Stripe and
-- writes it here with the server-only admin client. Nothing in the browser can
-- write to this table or call apply_build_access.

-- 1. One access rule, in one place. current_week is how far someone has got;
-- access_week is how far they may see. Foundations is capped at Session 1 and
-- 'pending' sees nothing, whatever current_week says. Every reader that gates
-- content (files RLS, middleware, the portal page) reads access_week.
alter table public.profiles
  add column access_week int generated always as (
    case tier
      when 'pending'     then 0
      when 'foundations' then least(current_week, 1)
      else current_week
    end
  ) stored;

drop policy files_client_read on public.files;
create policy files_client_read on public.files
  for select using (
    public.is_admin() or exists (
      select 1
      from public.weeks w
      join public.profiles p on p.id = auth.uid()
      where w.id = files.week_id
        and w.published = true
        and w.number <= p.access_week
    )
  );

-- 2. The subscription, one row per person. The row is made at checkout, when
-- the Stripe customer is created, so status is empty until Stripe confirms.
create table public.subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id     text not null unique,
  stripe_subscription_id text unique,
  price_id               text,
  billing_interval       text check (billing_interval in ('month','year')),
  status                 text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  -- Total paid on this subscription, in cents. Recounted from Stripe's paid
  -- invoices on every payment, so a repeated event can't double it. Used for
  -- the one-on-one upgrade credit (Build terms 6.1, capped at $1,000 there).
  amount_paid_cents      bigint not null default 0,
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy subscriptions_read on public.subscriptions
  for select using (user_id = auth.uid() or public.is_admin());

-- 3. Statuses that keep Build open. past_due is the grace period while Stripe
-- retries a failed card. When Stripe gives up it moves the subscription to
-- canceled or unpaid, and access returns to Foundations.
create or replace function public.build_status_active(s text)
returns boolean
language sql
immutable
as $$
  select coalesce(s in ('active','trialing','past_due'), false);
$$;

-- 4. The only way billing changes a tier. Returns the tier the person ends up
-- with, or null if they are not a self-serve member (flagship, admin, pending,
-- or no profile), in which case nothing is changed.
create or replace function public.apply_build_access(p_user uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  st     text;
  result text;
begin
  select status into st from public.subscriptions where user_id = p_user;

  update public.profiles
  set tier = case when public.build_status_active(st) then 'build' else 'foundations' end,
      current_week = greatest(current_week, 1)
  where id = p_user
    and role <> 'admin'
    and tier in ('foundations','build')
  returning tier into result;

  return result;
end;
$$;

revoke all on function public.apply_build_access(uuid) from public, anon, authenticated;
grant execute on function public.apply_build_access(uuid) to service_role;
