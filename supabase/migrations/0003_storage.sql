-- Psyber Portal — private Storage bucket for worksheets and resources.
-- The bucket is private: no public read. Downloads are served only via
-- short-lived signed URLs generated server-side AFTER an access check
-- (see src/app/api/download/[fileId]/route.ts). No Storage RLS policies are
-- added, so the anon/user role cannot read objects directly at all — only the
-- server (service role, post-check) can sign a URL. This is intentional.

insert into storage.buckets (id, name, public)
values ('worksheets', 'worksheets', false)
on conflict (id) do nothing;
