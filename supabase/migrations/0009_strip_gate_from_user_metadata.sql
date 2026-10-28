-- Offer Ladder, sign-up privacy fix (28 Oct 2026).
-- The /join page sends the gate answers (license number included) as sign-up
-- metadata. Supabase keeps that metadata on the login record and puts it in
-- every session token, where the person's own browser can read it. Once the
-- trigger has copied the answers into signup_gate, it now removes them from
-- the login record. Everything else is the same as 0007's handle_new_user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a      jsonb := new.raw_user_meta_data->'gate';
  refusal text;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));

  if a is not null and jsonb_typeof(a) = 'object' then
    refusal := public.lane_gate_refusal(a);
    insert into public.signup_gate (user_id, answers, first_answers, passed, flagged_words)
    values (
      new.id,
      a - 'first',
      coalesce(a->'first', '{}'::jsonb),
      refusal is null,
      public.lane_gate_flags(a->>'program_for')
    );
    if refusal is null then
      update public.profiles set tier = 'foundations', current_week = 1
      where id = new.id;
    end if;

    -- A failure here must never block a sign-up, so it only warns.
    begin
      update auth.users
      set raw_user_meta_data = raw_user_meta_data - 'gate'
      where id = new.id;
    exception when others then
      raise warning 'handle_new_user: could not strip gate metadata: %', sqlerrm;
    end;
  end if;

  return new;
end;
$$;
