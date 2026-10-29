-- Psyber Portal — a lapsed Build member's place is kept for one month
-- (Don, board cards r13 and r14, 29 Oct 2026: "they lose their place after
-- one month - incentivise them to stay or return").
--
--   - When Build ends, lapsed_at records the moment.
--   - Rejoin within a month: they carry on from the session they'd reached.
--   - Rejoin later: they start again from Session 1.
-- Replaces 0010's apply_build_access. The flagship/admin/pending guard is
-- unchanged: billing only ever moves foundations <-> build.

alter table public.profiles add column lapsed_at timestamptz;

create or replace function public.apply_build_access(p_user uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  st     text;
  active boolean;
  result text;
begin
  select status into st from public.subscriptions where user_id = p_user;
  active := public.build_status_active(st);

  -- Inside an UPDATE, column names on the right-hand side are the OLD values.
  update public.profiles
  set tier = case when active then 'build' else 'foundations' end,
      current_week = case
        when active and tier = 'foundations' and lapsed_at < now() - interval '1 month' then 1
        else greatest(current_week, 1) end,
      completed_week = case
        when active and tier = 'foundations' and lapsed_at < now() - interval '1 month' then 0
        else completed_week end,
      niche_confirmed_at = case
        when active and tier = 'foundations' and lapsed_at < now() - interval '1 month' then null
        else niche_confirmed_at end,
      lapsed_at = case
        when active then null
        when tier = 'build' then now()
        else lapsed_at end
  where id = p_user
    and role <> 'admin'
    and tier in ('foundations','build')
  returning tier into result;

  return result;
end;
$$;

revoke all on function public.apply_build_access(uuid) from public, anon, authenticated;
grant execute on function public.apply_build_access(uuid) to service_role;
