-- Psyber Portal: a "Call Booked" status on The List (board card m05, 18 Nov
-- 2026). The next-move card reminds a member to send the coaching-not-therapy
-- note before each booked discovery call (ADR-0029).

alter table public.contacts drop constraint if exists contacts_status_check;
alter table public.contacts add constraint contacts_status_check
  check (status in ('not_contacted','contacted','replied','interested','call_booked',
                    'offer_made','not_interested','follow_up_required','converted'));
