-- Offer Ladder, sign-up gate changes from Don's notes, 28 Oct 2026:
--   * retired therapists are welcome ("they might be retired as a therapist
--     (which is also fine)") -> license 'retired' passes like 'independent'.
--   * "they might not know their niche yet", then "don't need them to put their
--     niche - the check options are enough" -> the written Q2 answer is gone.
--     Both Q2 tick boxes are still required.
--   * "Under 18 bit can go" -> the under-18 question and refusal D are removed.
--     Parental consent stays a rule in the Build terms 1.3 (Don chose this, r05 A).
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
    when coalesce((a->>'tick_not_treatment')::boolean, false) is not true then 'B1'
    when coalesce((a->>'tick_outside_caseload')::boolean, false) is not true then 'B2'
    when coalesce((a->>'coaches_therapy_clients')::boolean, true) then 'C'
    else null
  end;
$$;
