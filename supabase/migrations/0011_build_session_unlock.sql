-- Psyber Portal — how Build members move through the sessions
-- (Offer Ladder, move m05b choice A; Build terms 2.2).
--
--   - Each session opens when the member marks the one before it complete.
--   - Session 3 waits for Don: it opens only once their niche has been
--     approved at a weekly clinic (niche_approved_at, set by approve_niche).
--   - Only Build members move themselves on. Flagship clients stay
--     admin-driven exactly as before; Foundations stops at Session 1.

alter table public.profiles
  add column completed_week    int not null default 0,
  add column niche_approved_at timestamptz;

-- The member presses "Mark Session N complete". Returns what happened:
--   'opened'        the next session is now open
--   'waiting_niche' Session 2 is complete; Session 3 waits for approval
--   'last'          there is no next session
--   'not_allowed'   not a Build member, or N is not their current session
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
  if me.id is null or me.role = 'admin' or me.tier <> 'build'
     or p_week <> me.current_week or p_week < 1 then
    return 'not_allowed';
  end if;

  update public.profiles
  set completed_week = greatest(completed_week, p_week),
      last_activity_at = now()
  where id = me.id;

  if p_week >= last_week then
    return 'last';
  end if;
  if p_week + 1 = 3 and me.niche_approved_at is null then
    return 'waiting_niche';
  end if;

  update public.profiles set current_week = p_week + 1 where id = me.id;
  return 'opened';
end;
$$;

revoke all on function public.finish_session(int) from public, anon;
grant execute on function public.finish_session(int) to authenticated;

-- Don approves a member's niche (the admin button arrives in stage 6). If they
-- have already marked Session 2 complete, Session 3 opens at once.
create or replace function public.approve_niche(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  update public.profiles
  set niche_approved_at = coalesce(niche_approved_at, now()),
      current_week = case when completed_week >= 2 and current_week = 2 then 3 else current_week end
  where id = p_user;
end;
$$;

revoke all on function public.approve_niche(uuid) from public, anon;
grant execute on function public.approve_niche(uuid) to authenticated;
