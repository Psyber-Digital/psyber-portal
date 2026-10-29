-- Psyber Portal — Session 3 opens when the member is happy with their niche
-- (Don, board card r11, 29 Oct 2026). Replaces 0011's rule that Session 3
-- waited for Don's approval. Members who want help bring their niche to the
-- weekly clinic; nobody has to wait for a sign-off.
--
-- Pressing "Mark Session 2 complete" now means "I'm happy with my niche", so
-- it records when they confirmed it and opens Session 3 straight away.

alter table public.profiles rename column niche_approved_at to niche_confirmed_at;

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

-- No approval step any more.
drop function if exists public.approve_niche(uuid);
