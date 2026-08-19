begin;

update public.legal_document_versions
set is_active = false
where document_key in ('terms', 'privacy')
  and is_active = true;

insert into public.legal_document_versions (
  document_key,
  version,
  effective_date,
  is_active
)
values
  ('terms', '1.1', '2026-08-19', true),
  ('privacy', '1.1', '2026-08-19', true)
on conflict (document_key, version)
do update set
  effective_date = excluded.effective_date,
  is_active = excluded.is_active;

commit;
