-- Psyber Portal — Shared Files (two-way document exchange)
--
-- One table carries both directions of the exchange between the coach and a
-- single client:
--   'to_client' — the coach sends a document down. These EXPIRE. The window is
--                 chosen per item (24h / 48h / 7 days, default 48h) and the
--                 expiry is enforced in the SELECT policy below, not in app code.
--   'to_coach'  — the client sends work up (typically a downloaded workbook PDF).
--                 These do NOT expire; the coach has to be able to read them
--                 before the next session. The coach deletes them when done.
--
-- client_id is ALWAYS the client, in both directions — it is whose exchange this
-- belongs to, not who sent it. uploaded_by records the actual sender.

create table public.shared_files (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references auth.users(id) on delete cascade,
  direction    text not null check (direction in ('to_client','to_coach')),
  title        text not null,
  note         text not null default '',
  storage_path text not null,
  size_bytes   bigint,
  mime_type    text,
  uploaded_by  uuid references auth.users(id) on delete set null,
  -- Nullable on purpose: NULL means "never expires" (every to_coach upload).
  -- A real, settable column rather than a computed one, so expiry can be tested
  -- by backdating a row instead of waiting 48 hours.
  expires_at   timestamptz,
  downloaded_at timestamptz,
  created_at   timestamptz not null default now()
);

-- Serves the client's list (newest first) and the admin's per-client grouping.
create index shared_files_client_idx on public.shared_files (client_id, created_at desc);
-- Serves the purge scan. Partial: to_coach rows have a NULL expiry and are never
-- swept, so they are excluded from the index entirely.
create index shared_files_expiry_idx on public.shared_files (expires_at)
  where expires_at is not null;

alter table public.shared_files enable row level security;

-- READ ----------------------------------------------------------------------
-- THE gate. A client sees only their own rows, and an expired to_client row is
-- invisible the moment it expires — regardless of whether the purge job has run.
-- This is deliberate: the hourly purge is data minimisation (removing the bytes),
-- NOT the access control. A cron failure must never become a data leak.
-- Admin sees everything, including expired rows still awaiting purge.
create policy shared_files_read on public.shared_files
  for select using (
    public.is_admin() or (
      client_id = auth.uid()
      and (expires_at is null or expires_at > now())
    )
  );

-- CLIENT WRITE --------------------------------------------------------------
-- A client may only ever create a row that is: theirs, addressed upward to the
-- coach, stamped with themselves as sender, and non-expiring. They cannot post
-- to another client, cannot fabricate a 'to_client' row (which would let them
-- plant a document as if it came from the coach), and cannot set an expiry.
create policy shared_files_client_insert on public.shared_files
  for insert with check (
    client_id = auth.uid()
    and direction = 'to_coach'
    and uploaded_by = auth.uid()
    and expires_at is null
  );

-- A client may withdraw their own upload (wrong file, changed their mind). They
-- can never delete something the coach sent them.
create policy shared_files_client_delete on public.shared_files
  for delete using (
    client_id = auth.uid() and direction = 'to_coach'
  );

-- ADMIN WRITE ---------------------------------------------------------------
create policy shared_files_admin_write on public.shared_files
  for all using (public.is_admin()) with check (public.is_admin());

-- GRANTS --------------------------------------------------------------------
-- Stated explicitly rather than relying on Supabase's default privileges. This
-- is the first table in the schema a non-admin WRITES to, so the table-level
-- grant matters as well as the policy. RLS still decides which rows: a grant
-- without a matching policy gets you nothing. No UPDATE is granted to clients —
-- they can add a file and withdraw it, never edit one after the fact.
grant select, insert, delete on public.shared_files to authenticated;

-- STORAGE -------------------------------------------------------------------
-- Private bucket, and — exactly as in 0003 — NO storage policies are created, so
-- the anon/authenticated role cannot read or write objects directly at all. Bytes
-- move only through the server: uploads are written with the service role after
-- an access check, downloads are 60-second signed URLs issued after an RLS check.
--
-- The size and MIME limits are set on the bucket rather than in app code because
-- this is the first upload path in the portal a NON-ADMIN can reach. Supabase
-- enforces them server-side, so they hold even if the app-level check is wrong.
-- 25 MB covers a scanned workbook comfortably; the type list covers what a client
-- would realistically send (a PDF, a Word document, or a photo of handwritten
-- notes — including HEIC, which is what an iPhone produces by default).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shared-files',
  'shared-files',
  false,
  26214400,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/heic',
    'image/heif',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
  set file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
