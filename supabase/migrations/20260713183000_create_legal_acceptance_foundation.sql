-- Legal document version registry
create table if not exists public.legal_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_key text not null,
  version text not null,
  effective_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint legal_document_versions_document_key_check
    check (document_key in ('terms', 'privacy')),
  unique (document_key, version)
);

create unique index if not exists legal_document_versions_one_active_per_key_idx
  on public.legal_document_versions (document_key)
  where is_active = true;

insert into public.legal_document_versions (document_key, version, effective_date, is_active)
values
  ('terms', '1.0', '2026-07-13', true),
  ('privacy', '1.0', '2026-07-13', true)
on conflict (document_key, version) do nothing;

alter table public.legal_document_versions enable row level security;

drop policy if exists "Legal document versions are publicly readable"
  on public.legal_document_versions;
create policy "Legal document versions are publicly readable"
  on public.legal_document_versions
  for select
  using (true);

revoke all on public.legal_document_versions from anon, authenticated;
grant select on public.legal_document_versions to anon, authenticated;

-- Append-only user acceptance history.
-- user_id ON DELETE CASCADE: deleting auth.users removes acceptance history.
-- Retention implications should be reviewed before self-service account deletion.
create table if not exists public.user_legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  legal_document_version_id uuid not null
    references public.legal_document_versions(id) on delete restrict,
  acceptance_type text not null,
  source text not null,
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint user_legal_acceptances_acceptance_type_check
    check (acceptance_type in ('accepted', 'acknowledged')),
  constraint user_legal_acceptances_source_check
    check (source in ('registration')),
  unique (user_id, legal_document_version_id, acceptance_type)
);

create index if not exists user_legal_acceptances_user_id_idx
  on public.user_legal_acceptances(user_id);

create index if not exists user_legal_acceptances_version_id_idx
  on public.user_legal_acceptances(legal_document_version_id);

alter table public.user_legal_acceptances enable row level security;

drop policy if exists "Users can read their own legal acceptances"
  on public.user_legal_acceptances;
create policy "Users can read their own legal acceptances"
  on public.user_legal_acceptances
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on public.user_legal_acceptances from anon, authenticated;
grant select on public.user_legal_acceptances to authenticated;

-- Consolidated auth.users trigger: profile + legal acceptance enforcement.
-- legal_document_versions must stay aligned with lib/legal/acceptance.ts and legal page content.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  terms_version_id uuid;
  privacy_version_id uuid;
begin
  if not (
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
      @> '{"legal_acceptance_confirmed": true}'::jsonb
  ) then
    raise exception 'legal_acceptance_required'
      using hint = 'Registration requires explicit legal acceptance confirmation.';
  end if;

  select id
  into terms_version_id
  from public.legal_document_versions
  where document_key = 'terms'
    and is_active = true;

  if terms_version_id is null then
    raise exception 'no_active_terms_version'
      using hint = 'No active terms version is configured.';
  end if;

  select id
  into privacy_version_id
  from public.legal_document_versions
  where document_key = 'privacy'
    and is_active = true;

  if privacy_version_id is null then
    raise exception 'no_active_privacy_version'
      using hint = 'No active privacy version is configured.';
  end if;

  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.user_legal_acceptances (
    user_id,
    legal_document_version_id,
    acceptance_type,
    source
  )
  values
    (new.id, terms_version_id, 'accepted', 'registration'),
    (new.id, privacy_version_id, 'acknowledged', 'registration');

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists create_profile_for_new_auth_user on auth.users;
drop function if exists public.handle_new_auth_user_profile();

create trigger create_profile_for_new_auth_user
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();
