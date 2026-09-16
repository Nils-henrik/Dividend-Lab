-- Preserve the casing chosen during registration while keeping username
-- equality and uniqueness case-insensitive. Existing username values are not
-- rewritten. Usernames remain ASCII-only so citext's locale behavior cannot
-- introduce ambiguous non-ASCII case mappings.

create extension if not exists citext with schema extensions;

do $$
begin
  if exists (
    select lower(btrim(username::text))
    from public.profiles
    group by lower(btrim(username::text))
    having count(*) > 1
  ) then
    raise exception 'username_case_collision'
      using hint = 'Resolve case-insensitive username duplicates before applying this migration.';
  end if;
end
$$;

alter table public.profiles
  drop constraint if exists profiles_username_format;

drop trigger if exists enforce_profile_username_policy on public.profiles;

alter table public.profiles
  alter column username type extensions.citext
  using btrim(username::text)::extensions.citext;

alter table public.profiles
  add constraint profiles_username_format check (
    username::text ~ '^[A-Za-z0-9_]{3,20}$'
  );

-- The explicit normalized index documents and enforces the intended invariant
-- even if the historical exact-value UNIQUE constraint differs by environment.
create unique index if not exists profiles_username_normalized_unique
  on public.profiles (lower(btrim(username::text)));

create or replace function public.enforce_profile_username_policy()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.username is null or btrim(new.username::text) = '' then
    raise exception 'username_required'
      using errcode = '23514', hint = 'A profile username is required.';
  end if;

  new.username := btrim(new.username::text)::extensions.citext;

  if new.username::text !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'username_invalid'
      using errcode = '23514', hint = 'Username must be 3-20 ASCII letters, digits or underscore.';
  end if;

  if lower(new.username::text) in (
    'divlab',
    'divlab_mod',
    'dividendlab',
    'admin',
    'administrator',
    'admins',
    'moderator',
    'moderators',
    'mod',
    'support',
    'help',
    'system',
    'official',
    'team',
    'staff',
    'root',
    'api',
    'security',
    'medlem',
    'anvandare'
  ) then
    if tg_op = 'INSERT' then
      raise exception 'username_reserved'
        using errcode = '23514', hint = 'Username is reserved.';
    elsif new.username::text is distinct from old.username::text then
      raise exception 'username_reserved'
        using errcode = '23514', hint = 'Username is reserved.';
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_profile_username_policy
  before insert or update of username on public.profiles
  for each row
  execute function public.enforce_profile_username_policy();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  terms_version_id uuid;
  privacy_version_id uuid;
  requested_username text;
  candidate text;
  attempts int;
begin
  if not (
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
      @> '{"legal_acceptance_confirmed": true}'::jsonb
  ) then
    raise exception 'legal_acceptance_required'
      using hint = 'Registration requires explicit legal acceptance confirmation.';
  end if;

  requested_username := btrim(coalesce(new.raw_user_meta_data->>'username', ''));

  if requested_username <> '' then
    if requested_username !~ '^[A-Za-z0-9_]{3,20}$' then
      raise exception 'username_invalid'
        using hint = 'Username must be 3-20 ASCII letters, digits or underscore.';
    end if;

    if lower(requested_username) in (
      'divlab',
      'divlab_mod',
      'dividendlab',
      'admin',
      'administrator',
      'admins',
      'moderator',
      'moderators',
      'mod',
      'support',
      'help',
      'system',
      'official',
      'team',
      'staff',
      'root',
      'api',
      'security',
      'medlem',
      'anvandare'
    ) then
      raise exception 'username_reserved'
        using hint = 'Username is reserved.';
    end if;
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

  if requested_username <> '' then
    begin
      insert into public.profiles (id, username)
      values (new.id, requested_username);
    exception
      when unique_violation then
        raise exception 'username_taken'
          using hint = 'Username is already taken.';
    end;
  else
    attempts := 0;
    loop
      attempts := attempts + 1;
      candidate := 'u_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
      begin
        insert into public.profiles (id, username)
        values (new.id, candidate);
        exit;
      exception
        when unique_violation then
          if attempts >= 20 then
            raise;
          end if;
      end;
    end loop;
  end if;

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
