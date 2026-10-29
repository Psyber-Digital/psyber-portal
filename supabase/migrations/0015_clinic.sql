-- Psyber Portal — the weekly group clinic for Build members (Offer Ladder
-- stage 5; Build terms 2.3 and 7). Clinic: Wednesdays 12pm Eastern (Don, m12).
--
--   - clinic_settings: the standing Zoom link (one recurring meeting) and a
--     notice for a cancellation or change, shown on the clinic page until Don
--     clears it (terms 2.3: "we tell you in the portal"). Its own table, not
--     public.settings, because every signed-in member can read settings and
--     the Zoom link is for Build members only.
--   - clinic_recordings: one row per recording, a private domain-locked Vimeo
--     video. Members see recordings for 90 days after the clinic (RLS below);
--     after that the admin clinic page flags it for Don to delete on Vimeo (terms 7.2).

create table public.clinic_settings (
  id         boolean primary key default true check (id),
  zoom_url   text not null default '' check (zoom_url = '' or zoom_url ~ '^https://([a-z0-9-]+\.)?zoom\.us/'),
  notice     text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.clinic_settings (id) values (true) on conflict do nothing;

alter table public.clinic_settings enable row level security;

create policy clinic_settings_read on public.clinic_settings
  for select using (
    public.is_admin()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'build')
  );

create policy clinic_settings_admin_write on public.clinic_settings
  for all using (public.is_admin()) with check (public.is_admin());

create table public.clinic_recordings (
  id           uuid primary key default gen_random_uuid(),
  clinic_date  date not null,
  title        text not null default '',
  vimeo_id     text not null check (vimeo_id ~ '^[0-9]+$'),
  vimeo_hash   text not null default '' check (vimeo_hash ~ '^[0-9a-f]*$'),
  created_at   timestamptz not null default now()
);

alter table public.clinic_recordings enable row level security;

-- Current Build members see recordings from the last 90 days; admin sees all.
create policy clinic_recordings_read on public.clinic_recordings
  for select using (
    public.is_admin() or (
      clinic_date > current_date - 90
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.tier = 'build')
    )
  );

create policy clinic_recordings_admin_write on public.clinic_recordings
  for all using (public.is_admin()) with check (public.is_admin());
