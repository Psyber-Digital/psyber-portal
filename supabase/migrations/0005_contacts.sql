-- Psyber Portal — Outreach contact database.
--
-- This is the client's own contact database: the list they build from email,
-- social media and mobile, categorise, and work through. In the method it is the
-- single most consequential input to whether they land a client.
--
-- It is NOT a one-off task. It is picked up when the client reaches the outreach
-- part of the programme and then runs in parallel with everything else to the
-- end — names keep occurring to them, and each one gets added. The schema
-- reflects that: rows accrete continuously, nothing is scoped to a week, and
-- there is no "completed" state.
--
-- The columns are a direct port of the programme's own spreadsheet
-- (Session 8 - Outreach/Worksheets/Contact Database.xlsx), including its three
-- dropdown vocabularies, so a client who has already started in Sheets sees the
-- same fields here:
--   Name · Email Address · Phone Number · First Contact Date · Correspondence ·
--   Medium · Last Contact Date · Status · Notes
--
-- Two additions beyond the spreadsheet, both drawn from the Outreach Strategy:
--   · relevance — Part 1 step 2 is "categorise contacts": is the program relevant
--     to this person, or is the objective a referral? An irrelevant contact is
--     not a dead end, they are a route into another network. The spreadsheet
--     leaves this in the client's head; here it is a field.
--   · next_followup_date — the follow-up discipline, which the spreadsheet's two
--     date columns cannot express.

create table public.contacts (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references auth.users(id) on delete cascade,
  name               text not null,
  email              text not null default '',
  phone              text not null default '',
  -- "Everyone is either a lead or access to another network."
  relevance          text not null default 'unsure'
                       check (relevance in ('relevant','irrelevant','unsure')),
  -- Which message in the sequence they are on. Spreadsheet dropdown, verbatim.
  correspondence     text not null default ''
                       check (correspondence in ('','message_1','follow_up_1','follow_up_2')),
  -- Channel. The spreadsheet offers Email / DM / Instant Message / Face-To-Face;
  -- video and voice are added because the strategy ranks channels warmest-first
  -- (face-to-face beats video beats voice beats instant message beats email) and
  -- the first wave is supposed to use the top of that ranking.
  medium             text not null default ''
                       check (medium in ('','face_to_face','video','voice','instant_message','dm','email')),
  status             text not null default 'not_contacted'
                       check (status in ('not_contacted','contacted','replied','interested',
                                         'not_interested','follow_up_required','converted')),
  first_contact_date date,
  last_contact_date  date,
  next_followup_date date,
  notes              text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index contacts_owner_idx on public.contacts (owner_id, created_at desc);
-- Serves the "who is due a follow-up" view.
create index contacts_followup_idx on public.contacts (owner_id, next_followup_date)
  where next_followup_date is not null;

alter table public.contacts enable row level security;

-- ACCESS --------------------------------------------------------------------
-- A single owner-only policy, and DELIBERATELY no admin policy — unlike every
-- other table in this schema, `public.is_admin()` does not appear here.
--
-- This list is the client's own, and it names third parties (former colleagues,
-- supervision groups, friends) who never consented to appear in Psyber's system.
-- The coach has no read path to it through the API or the UI, by design
-- (Don's decision, 26 Jul 2026).
--
-- Stated honestly: the service-role key still bypasses RLS, as it does on every
-- table. This policy means "no admin UI and no admin API path can reach it", not
-- "the operator is cryptographically excluded".
create policy contacts_owner_all on public.contacts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Stated explicitly rather than relying on Supabase's default privileges. The
-- client owns this table outright, so they get the full set — bounded to their
-- own rows by the policy above.
grant select, insert, update, delete on public.contacts to authenticated;
