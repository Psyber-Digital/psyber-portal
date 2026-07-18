-- Psyber Portal — schema
-- Access model: "access is a position, not a set." A client's reach is a single
-- integer (current_week); a week is visible iff published AND number <= current_week.

-- PROFILES: one row per auth user.
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text default '',
  role         text not null default 'client' check (role in ('client','admin')),
  current_week integer not null default 0,
  created_at   timestamptz not null default now()
);

-- WEEKS: the programme. One row per week.
create table public.weeks (
  id          uuid primary key default gen_random_uuid(),
  number      integer not null unique,
  title       text not null,
  description text default '',
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- FILES: metadata only. Bytes live in Storage; storage_path points there.
-- owner_id is nullable and null for all v1 (admin-distributed) files. It exists
-- now so client-uploaded work can be added later without a schema rewrite.
create table public.files (
  id           uuid primary key default gen_random_uuid(),
  week_id      uuid not null references public.weeks(id) on delete cascade,
  kind         text not null check (kind in ('worksheet','resource')),
  title        text not null,
  storage_path text not null,
  sort_order   integer not null default 0,
  owner_id     uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index files_week_id_idx on public.files (week_id);

-- SETTINGS: single row. Admin-editable booking config.
create table public.settings (
  id             boolean primary key default true,
  calendly_url   text not null default 'https://calendly.com/psyberdigital/60min',
  session_length text not null default '60 minutes',
  session_format text not null default '1:1 · Video',
  constraint settings_singleton check (id)
);
insert into public.settings (id) values (true) on conflict do nothing;

-- Auto-create a profile whenever an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- SECURITY DEFINER so it reads profiles without triggering RLS (and without
-- causing policy recursion when policies call it).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
