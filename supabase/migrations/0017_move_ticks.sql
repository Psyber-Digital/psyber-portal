-- Psyber Portal: "Your next move" (War Room run psyber/2026-11-18-next-move).
--
-- Each session is split into small moves (Next-Move/MOVES-DRAFT.md). The
-- member presses Done on a move; this table remembers which ones. Working
-- Sheet answers stay in the member's own browser, so a tick is the member's
-- own word that the move is done. Nothing here names anyone else.
--
-- Owner-only for now. Whether Don can see ticks on his members page is board
-- card m06; if he says yes, a later migration adds an admin read policy.

create table public.move_ticks (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  move_id  text not null check (move_id ~ '^s[1-7]-[a-z0-9-]{1,40}$'),
  done_at  timestamptz not null default now(),
  primary key (user_id, move_id)
);

alter table public.move_ticks enable row level security;

create policy move_ticks_owner_select on public.move_ticks
  for select using (user_id = auth.uid());

create policy move_ticks_owner_insert on public.move_ticks
  for insert with check (user_id = auth.uid());

create policy move_ticks_owner_delete on public.move_ticks
  for delete using (user_id = auth.uid());

-- No update policy: a tick is either there or not.
