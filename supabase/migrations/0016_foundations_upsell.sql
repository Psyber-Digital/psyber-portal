-- Psyber Portal: reasons for a free member to upgrade (Don, War Room run
-- psyber/2026-11-05-foundations-upsell, 5 Nov 2026; wording in
-- Offer-Ladder/build/FOUNDATIONS-UPSELL-draft.md).
--
--   - Sign-up asks whether they'd like one-on-one support.
--   - Foundations members can mark Session 1 complete. It opens nothing.
--   - Finishing starts a once-only first-month offer on Build: $99, ending at
--     midnight Eastern on the seventh day after it starts.
--   - The free contact list holds 50 names. Nothing is ever deleted.
--   - Upsell emails can be unsubscribed from, and stop when a call is booked.
--
-- Members can read their own profile but not write it (0002), so nobody can
-- set their own offer dates. Every change below goes through a definer function,
-- an admin, or the server.

alter table public.profiles
  add column wants_one_on_one       boolean,
  add column session1_finished_at   timestamptz,
  add column offer_started_at       timestamptz,
  add column offer_ends_at          timestamptz,
  add column offer_taken_at         timestamptz,
  add column call_booked_at         timestamptz,
  add column list_full_at           timestamptz,
  add column upsell_unsubscribed_at timestamptz;

-- 1. The email log learns the new emails.
alter table public.email_log drop constraint email_log_kind_check;
alter table public.email_log add constraint email_log_kind_check check (kind in (
  'cancel','place_7d','place_1d','renewal_yearly',
  'upsell_a','upsell_b','upsell_c',
  'upsell_1','upsell_2','upsell_3','upsell_4','upsell_5','upsell_6','upsell_7','upsell_8'
));

-- 2. The sign-up answer. Otherwise the same as 0009's handle_new_user.
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
      update public.profiles
      set tier = 'foundations',
          current_week = 1,
          wants_one_on_one = case when jsonb_typeof(a->'one_on_one') = 'boolean'
                                  then (a->>'one_on_one')::boolean end
      where id = new.id;
    end if;

    -- A failure here must never block a sign-up, so it only warns.
    begin
      update auth.users
      set raw_user_meta_data = raw_user_meta_data - 'gate'
      where id = new.id;
    exception when others then
      raise warning 'handle_new_user: could not strip gate metadata: %', sqlerrm;
    end;
  end if;

  return new;
end;
$$;

-- 3. The offer. Once per person, and the date never resets. Only someone who has
-- never had a Build subscription qualifies, so cancelling and coming back can't
-- earn a discount. Returns the end time, or null if they don't qualify.
create or replace function public.start_first_month_offer(p_user uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  ends timestamptz;
begin
  update public.profiles
  set offer_started_at = now(),
      -- Midnight at the end of the seventh day after today, Eastern.
      offer_ends_at = (((now() at time zone 'America/New_York')::date + 8)::timestamp)
                      at time zone 'America/New_York'
  where id = p_user
    and role <> 'admin'
    and tier = 'foundations'
    and lapsed_at is null
    and offer_started_at is null
    and call_booked_at is null
    and not exists (
      select 1 from public.subscriptions s
      where s.user_id = p_user and s.stripe_subscription_id is not null
    )
  returning offer_ends_at into ends;
  return ends;
end;
$$;

revoke all on function public.start_first_month_offer(uuid) from public, anon, authenticated;
grant execute on function public.start_first_month_offer(uuid) to service_role;

-- 4. Finishing a session. Foundations members may finish Session 1, which opens
-- nothing. A member who asked about one-on-one gets 14 days of call invitations
-- first, so their offer starts then (the daily job does it). Build is unchanged
-- from 0012.
create or replace function public.finish_session(p_week int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me   public.profiles%rowtype;
  last_week int := (select coalesce(max(number), 0) from public.weeks);
begin
  select * into me from public.profiles where id = auth.uid();

  if me.id is not null and me.role <> 'admin' and me.tier = 'foundations'
     and p_week = 1 and me.lapsed_at is null then
    update public.profiles
    set completed_week = greatest(completed_week, 1),
        session1_finished_at = coalesce(session1_finished_at, now()),
        last_activity_at = now()
    where id = me.id;
    if me.wants_one_on_one is not true or me.created_at <= now() - interval '14 days' then
      perform public.start_first_month_offer(me.id);
    end if;
    return 'finished_free';
  end if;

  if me.id is null or me.role = 'admin' or me.tier <> 'build'
     or p_week <> me.current_week or p_week < 1 then
    return 'not_allowed';
  end if;

  update public.profiles
  set completed_week = greatest(completed_week, p_week),
      niche_confirmed_at = case when p_week = 2 then coalesce(niche_confirmed_at, now())
                                else niche_confirmed_at end,
      last_activity_at = now()
  where id = me.id;

  if p_week >= last_week then
    return 'last';
  end if;

  update public.profiles set current_week = p_week + 1 where id = me.id;
  return 'opened';
end;
$$;

-- 5. The free list cap, enforced here so every way of adding a name obeys it.
-- The lock stops two adds at once slipping past 50. list_full_at lets the server
-- know to send the "list is full" email without ever reading anyone's list.
-- Editing, deleting and exporting are untouched, and so is anyone already over
-- 50: they keep every name, they just can't add another.
create or replace function public.enforce_free_list_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t text;
  n int;
begin
  select tier into t from public.profiles where id = new.owner_id;
  if t is distinct from 'foundations' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('free-list:' || new.owner_id::text, 0));
  select count(*) into n from public.contacts where owner_id = new.owner_id;
  if n >= 50 then
    raise exception 'FREE_LIST_FULL' using errcode = 'P0001';
  end if;
  if n = 49 then
    update public.profiles set list_full_at = coalesce(list_full_at, now())
    where id = new.owner_id;
  end if;
  return new;
end;
$$;

create trigger contacts_free_list_cap
  before insert on public.contacts
  for each row execute function public.enforce_free_list_cap();
