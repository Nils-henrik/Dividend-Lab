-- DivBrain attachments: avoid per-row auth.uid() re-evaluation in owner SELECT policy.
-- Follow-up to 20260811120000_create_divbrain_attachments.sql.

drop policy if exists "Owners can select their divbrain attachments"
  on public.divbrain_attachments;

create policy "Owners can select their divbrain attachments"
  on public.divbrain_attachments
  for select
  to authenticated
  using (user_id = (select auth.uid()));
