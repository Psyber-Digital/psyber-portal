-- "Offer made" on The List. Session 6 tells clients to mark each price they say as an offer
-- made; Session 7 asks them to count them. Don, 25–27 Oct 2026 (War Room audit m10f: "Add it").
--
-- Widens the status check by one value. Nothing is moved or dropped: every existing row stays
-- valid, and the portal behaves as before for any row that never uses the new value.
-- To undo: re-add the old check, after setting any 'offer_made' rows back to 'interested'.

alter table public.contacts drop constraint if exists contacts_status_check;
alter table public.contacts add constraint contacts_status_check
  check (status in ('not_contacted','contacted','replied','interested','offer_made',
                    'not_interested','follow_up_required','converted'));
