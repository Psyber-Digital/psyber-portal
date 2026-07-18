-- Psyber Portal — Row Level Security
-- RLS is the real access boundary. Assume the UI can be bypassed; the database
-- must still refuse. Every table below has RLS enabled and explicit policies.

alter table public.profiles enable row level security;
alter table public.weeks    enable row level security;
alter table public.files    enable row level security;
alter table public.settings enable row level security;

-- PROFILES ------------------------------------------------------------------
-- A user reads their own row; admin reads all.
create policy profiles_read_self on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- Only admin may write profiles. This is the ONLY write path to current_week
-- and role — a client can never escalate themselves.
create policy profiles_admin_write on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- WEEKS ---------------------------------------------------------------------
-- Any authenticated user reads published weeks (needed to render "upcoming"
-- tiles); admin reads all. Only admin writes.
create policy weeks_read on public.weeks
  for select using (published = true or public.is_admin());

create policy weeks_admin_write on public.weeks
  for all using (public.is_admin()) with check (public.is_admin());

-- FILES ---------------------------------------------------------------------
-- THE access gate. A client may read a file row only if its week is published
-- and its number is within the client's current_week. Admin reads/writes all.
create policy files_client_read on public.files
  for select using (
    public.is_admin() or exists (
      select 1
      from public.weeks w
      join public.profiles p on p.id = auth.uid()
      where w.id = files.week_id
        and w.published = true
        and w.number <= p.current_week
    )
  );

create policy files_admin_write on public.files
  for all using (public.is_admin()) with check (public.is_admin());

-- SETTINGS ------------------------------------------------------------------
create policy settings_read on public.settings
  for select using (auth.role() = 'authenticated');

create policy settings_admin_update on public.settings
  for update using (public.is_admin()) with check (public.is_admin());
