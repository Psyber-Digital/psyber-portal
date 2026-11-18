-- Psyber Portal: Don sees which move each member is on (board card m06,
-- "Yes to the ticks", 18 Nov 2026). Read-only. Ticks name nobody but the
-- member; contacts stay owner-only with no admin path (0005).

create policy move_ticks_admin_select on public.move_ticks
  for select using (public.is_admin());
