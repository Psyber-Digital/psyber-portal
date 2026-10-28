-- Offer Ladder, sign-up gate changes from Don's notes, 28 Oct 2026:
--   * retired therapists are welcome ("they might be retired as a therapist
--     (which is also fine)") -> license 'retired' passes like 'independent'.
--   * "they might not know their niche yet" -> an empty Q2 answer passes when
--     niche_unknown is true. Both Q2 tick boxes are still required.
-- Everything else is unchanged from 0007.
create or replace function public.lane_gate_refusal(a jsonb)
returns text
language sql
immutable
as $$
  select case
    when coalesce(a->>'license','') = 'training'          then 'A1'
    when coalesce(a->>'license','') not in ('independent', 'retired') then 'A2'
    when coalesce(a->>'license_type','')   = ''
      or coalesce(a->>'license_state','')  = ''
      or coalesce(a->>'license_number','') = ''           then 'A2'
    when coalesce(trim(a->>'program_for'),'') = ''
     and coalesce((a->>'niche_unknown')::boolean, false) is not true then 'B1'
    when coalesce((a->>'tick_not_treatment')::boolean, false) is not true then 'B1'
    when coalesce((a->>'tick_outside_caseload')::boolean, false) is not true then 'B2'
    when coalesce((a->>'coaches_therapy_clients')::boolean, true) then 'C'
    when coalesce((a->>'coaches_minors')::boolean, true)
     and coalesce((a->>'minors_parent_consent')::boolean, false) is not true then 'D'
    else null
  end;
$$;
