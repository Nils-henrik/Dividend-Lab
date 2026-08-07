-- Require unique usernames for all profiles.
-- Backfill null usernames with collision-resistant temporary handles,
-- then enforce NOT NULL + reserved-name checks at the database level.
-- Signup metadata username is applied by handle_new_auth_user.

-- Rename any existing reserved usernames so the reserved check can be added.
do $$
declare
  r record;
  candidate text;
  attempts int;
begin
  for r in
    select id, username
    from public.profiles
    where username is not null
      and lower(btrim(username)) in (
        'divlab',
        'admin',
        'moderator',
        'support',
        'system',
        'medlem',
        'anvandare'
      )
  loop
    attempts := 0;
    loop
      attempts := attempts + 1;
      candidate := 'u_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
      begin
        update public.profiles
        set username = candidate
        where id = r.id;
        exit;
      exception
        when unique_violation then
          if attempts >= 20 then
            raise;
          end if;
      end;
    end loop;
  end loop;
end
$$;

-- Backfill null / blank usernames with non-sequential temporary handles.
do $$
declare
  r record;
  candidate text;
  attempts int;
begin
  for r in
    select id
    from public.profiles
    where username is null
       or btrim(username) = ''
  loop
    attempts := 0;
    loop
      attempts := attempts + 1;
      candidate := 'u_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
      begin
        update public.profiles
        set username = candidate
        where id = r.id;
        exit;
      exception
        when unique_violation then
          if attempts >= 20 then
            raise;
          end if;
      end;
    end loop;
  end loop;
end
$$;

alter table public.profiles
  alter column username set not null;

alter table public.profiles
  drop constraint if exists profiles_username_not_blank;

alter table public.profiles
  add constraint profiles_username_not_blank check (
    btrim(username) <> ''
  );

alter table public.profiles
  drop constraint if exists profiles_username_reserved;

alter table public.profiles
  add constraint profiles_username_reserved check (
    lower(btrim(username)) not in (
      'divlab',
      'admin',
      'moderator',
      'support',
      'system',
      'medlem',
      'anvandare'
    )
  );

-- Signup path: require validated username from auth metadata and store it on profile create.
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
begin
  if not (
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
      @> '{"legal_acceptance_confirmed": true}'::jsonb
  ) then
    raise exception 'legal_acceptance_required'
      using hint = 'Registration requires explicit legal acceptance confirmation.';
  end if;

  requested_username := lower(btrim(coalesce(new.raw_user_meta_data->>'username', '')));

  if requested_username = '' then
    raise exception 'username_required'
      using hint = 'Registration requires a username.';
  end if;

  if requested_username !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'username_invalid'
      using hint = 'Username must be 3-20 chars of a-z, 0-9 or underscore.';
  end if;

  if requested_username in (
    'divlab',
    'admin',
    'moderator',
    'support',
    'system',
    'medlem',
    'anvandare'
  ) then
    raise exception 'username_reserved'
      using hint = 'Username is reserved.';
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

  begin
    insert into public.profiles (id, username)
    values (new.id, requested_username);
  exception
    when unique_violation then
      raise exception 'username_taken'
        using hint = 'Username is already taken.';
  end;

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

-- Remove synthetic @medlem actor handles from notification payloads.
create or replace function public.notify_on_contact_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_username text;
  should_notify boolean := false;
  dedupe text;
begin
  if tg_op = 'INSERT' then
    should_notify := new.status = 'pending';
  elsif tg_op = 'UPDATE' then
    should_notify :=
      new.status = 'pending'
      and old.status is distinct from 'pending';
  end if;

  if should_notify then
    select nullif(btrim(username), '')
    into actor_username
    from public.profiles
    where id = new.requester_id;

    dedupe :=
      'contact_request:'
      || new.id::text
      || ':'
      || floor(extract(epoch from new.updated_at) * 1000)::bigint::text;

    perform public._insert_user_notification(
      new.addressee_id,
      new.requester_id,
      'contact_request',
      new.id,
      '/contacts?tab=incoming&request=' || new.id::text,
      jsonb_build_object(
        'connectionId', new.id,
        'actorUsername', actor_username
      ),
      dedupe
    );
  end if;

  if tg_op = 'UPDATE'
     and old.status = 'pending'
     and new.status is distinct from 'pending' then
    update public.user_notifications
    set read_at = coalesce(read_at, now())
    where recipient_id = new.addressee_id
      and type = 'contact_request'
      and entity_id = new.id
      and read_at is null;
  end if;

  return new;
end;
$$;

create or replace function public.notify_on_forum_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  thread_row public.forum_threads;
  actor_username text;
begin
  select *
  into thread_row
  from public.forum_threads
  where id = new.thread_id;

  if not found then
    return new;
  end if;

  if thread_row.author_id = new.author_id then
    return new;
  end if;

  select nullif(btrim(username), '')
  into actor_username
  from public.profiles
  where id = new.author_id;

  perform public._insert_user_notification(
    thread_row.author_id,
    new.author_id,
    'forum_reply',
    new.id,
    '/forum/' || thread_row.slug || '#reply-' || new.id::text,
    jsonb_build_object(
      'replyId', new.id,
      'threadId', thread_row.id,
      'threadSlug', thread_row.slug,
      'threadTitle', thread_row.title,
      'actorUsername', actor_username,
      'kind', 'thread'
    ),
    'forum_reply:' || new.id::text || ':' || thread_row.author_id::text
  );

  return new;
end;
$$;
