-- Optional seed data for local testing. Run after migrations.
-- Weeks 1–2 published, week 3 draft — mirrors the acceptance-test setup.

insert into public.weeks (number, title, description, published) values
  (1, 'Foundations — Mapping Your Baseline',
      'Establish where you are before we change anything. The opening session worksheet.', true),
  (2, 'Patterns — Naming What Recurs',
      'Identify the loops that run without your permission.', true),
  (3, 'Leverage — The Vital Few',
      'Not yet released. Publish when the session is delivered.', false)
on conflict (number) do nothing;
