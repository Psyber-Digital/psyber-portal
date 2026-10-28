-- Psyber Portal — tiers and the sign-up lane gate (Offer Ladder stage 3, ADR-0027).
--
-- Who gets what:
--   flagship     one-on-one clients. Every existing row. Admin creates these.
--   foundations  free self-serve. Session 1 only. Set ONLY by this file's trigger,
--                and only when the lane-gate answers pass.
--   build        paid self-serve. Set later by the Stripe webhook (stage 4).
--   pending      anyone else: a magic-link registration, or a sign-up whose
--                answers did not pass. current_week stays 0, so they see nothing.
--
-- The answers arrive as sign-up metadata, which the person controls. That is
-- fine: the gate is a self-declaration, and the checks below run in the
-- database, so skipping the form cannot buy more than honest answers would.

alter table public.profiles
  add column tier text not null default 'pending'
  check (tier in ('pending','foundations','build','flagship'));

-- Nothing changes for anyone already here.
update public.profiles set tier = 'flagship';

-- One row per sign-up that reached the account stage. "answers" is what they
-- submitted; "first_answers" is the first value of any answer they changed
-- before submitting (Don sees both in admin).
create table public.signup_gate (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  answers        jsonb not null,
  first_answers  jsonb not null default '{}'::jsonb,
  passed         boolean not null,
  flagged_words  text[] not null default '{}',
  created_at     timestamptz not null default now()
);

alter table public.signup_gate enable row level security;

-- Owner reads their own row; admin reads all. Nobody writes from the client:
-- the trigger below (security definer) is the only insert path.
create policy signup_gate_read on public.signup_gate
  for select using (user_id = auth.uid() or public.is_admin());

-- Refused attempts never become accounts. They are kept 12 months as a record
-- that the check happened (proposed retention; solicitor brief Q1), then purged.
create table public.signup_refusals (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  answers     jsonb not null,
  reason      text not null check (reason in ('A1','A2','B1','B2','C','D')),
  created_at  timestamptz not null default now()
);

alter table public.signup_refusals enable row level security;

create policy signup_refusals_admin_read on public.signup_refusals
  for select using (public.is_admin());

-- The gate itself. Returns null when the answers pass, else the refusal code
-- (the same letters as LANE-GATE-draft.md's messages). Used by the trigger and
-- by the /join server action, so the page and the database can never disagree.
create or replace function public.lane_gate_refusal(a jsonb)
returns text
language sql
immutable
as $$
  select case
    when coalesce(a->>'license','') = 'training'          then 'A1'
    when coalesce(a->>'license','') <> 'independent'      then 'A2'
    when coalesce(a->>'license_type','')   = ''
      or coalesce(a->>'license_state','')  = ''
      or coalesce(a->>'license_number','') = ''           then 'A2'
    when coalesce(trim(a->>'program_for'),'') = ''        then 'B1'
    when coalesce((a->>'tick_not_treatment')::boolean, false) is not true then 'B1'
    when coalesce((a->>'tick_outside_caseload')::boolean, false) is not true then 'B2'
    when coalesce((a->>'coaches_therapy_clients')::boolean, true) then 'C'
    when coalesce((a->>'coaches_minors')::boolean, true)
     and coalesce((a->>'minors_parent_consent')::boolean, false) is not true then 'D'
    else null
  end;
$$;

-- Flag words for Don's second look (LANE-GATE "behind the scenes"). Matched by
-- stem, case-insensitive. Flags never block.
create or replace function public.lane_gate_flags(program_for text)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(stem), '{}')
  from unnest(array['depress','anxi','trauma','ptsd','adhd','ocd','eating','grief',
    'addict','recover','hospital','postpartum','bipolar','self-harm','suicid',
    'diagnos','caseload','client','patient']) as stem
  where lower(coalesce(program_for,'')) like '%' || stem || '%';
$$;

-- Replaces 0001's trigger function. Same profile insert as before, plus: if the
-- sign-up carried gate answers, record them, and grant Foundations (Session 1)
-- only when they pass. Admin-created users carry no answers and stay 'pending'
-- until createClient sets them to 'flagship'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a      jsonb := new.raw_user_meta_data->'gate';
  refusal text;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));

  if a is not null and jsonb_typeof(a) = 'object' then
    refusal := public.lane_gate_refusal(a);
    insert into public.signup_gate (user_id, answers, first_answers, passed, flagged_words)
    values (
      new.id,
      a - 'first',
      coalesce(a->'first', '{}'::jsonb),
      refusal is null,
      public.lane_gate_flags(a->>'program_for')
    );
    if refusal is null then
      update public.profiles set tier = 'foundations', current_week = 1
      where id = new.id;
    end if;
  end if;

  return new;
end;
$$;

-- The /join page calls this when the answers do not pass, before any account
-- exists. It works the reason out itself, so a caller can't choose one, and it
-- stores nothing when the answers pass. Spam protection (Turnstile) sits in
-- front of it on the page.
create or replace function public.record_signup_refusal(p_email text, p_answers jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  refusal text := public.lane_gate_refusal(p_answers);
begin
  if refusal is not null then
    insert into public.signup_refusals (email, answers, reason)
    values (left(lower(trim(p_email)), 320), p_answers - 'first', refusal);
  end if;
  return refusal;
end;
$$;

revoke all on function public.record_signup_refusal(text, jsonb) from public;
grant execute on function public.record_signup_refusal(text, jsonb) to anon, authenticated;
