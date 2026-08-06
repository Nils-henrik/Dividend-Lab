-- Unified in-app notifications for contact requests and forum replies.
-- Private-message unread counts remain derived from conversation_participants.

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  entity_id uuid,
  destination_path text not null,
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint user_notifications_type_check check (
    type in ('contact_request', 'forum_reply')
  ),
  constraint user_notifications_no_self check (recipient_id <> actor_id),
  constraint user_notifications_destination_length check (
    char_length(btrim(destination_path)) between 1 and 500
  ),
  constraint user_notifications_dedupe_key_unique unique (dedupe_key)
);

create index if not exists user_notifications_recipient_created_at_idx
  on public.user_notifications (recipient_id, created_at desc);

create index if not exists user_notifications_recipient_unread_idx
  on public.user_notifications (recipient_id, created_at desc)
  where read_at is null;

create index if not exists user_notifications_recipient_type_idx
  on public.user_notifications (recipient_id, type);

alter table public.user_notifications enable row level security;

drop policy if exists "Users can read their own notifications"
  on public.user_notifications;
create policy "Users can read their own notifications"
  on public.user_notifications
  for select
  to authenticated
  using (recipient_id = auth.uid());

-- No direct client inserts/updates/deletes. Mutations go through RPCs / triggers.
revoke all on table public.user_notifications from anon, authenticated;
grant select on table public.user_notifications to authenticated;
revoke insert, update, delete on table public.user_notifications
  from anon, authenticated;

-- Trusted insert helper used by triggers only.
create or replace function public._insert_user_notification(
  p_recipient_id uuid,
  p_actor_id uuid,
  p_type text,
  p_entity_id uuid,
  p_destination_path text,
  p_payload jsonb,
  p_dedupe_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_recipient_id is null
     or p_actor_id is null
     or p_type is null
     or p_destination_path is null
     or p_dedupe_key is null then
    return;
  end if;

  if p_recipient_id = p_actor_id then
    return;
  end if;

  insert into public.user_notifications (
    recipient_id,
    actor_id,
    type,
    entity_id,
    destination_path,
    payload,
    dedupe_key
  )
  values (
    p_recipient_id,
    p_actor_id,
    p_type,
    p_entity_id,
    p_destination_path,
    coalesce(p_payload, '{}'::jsonb),
    p_dedupe_key
  )
  on conflict (dedupe_key) do nothing;
end;
$$;

revoke all on function public._insert_user_notification(
  uuid, uuid, text, uuid, text, jsonb, text
) from public;
revoke all on function public._insert_user_notification(
  uuid, uuid, text, uuid, text, jsonb, text
) from anon, authenticated;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns public.user_notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  result_row public.user_notifications;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_notification_id is null then
    raise exception 'Notification id is required.';
  end if;

  update public.user_notifications
  set read_at = coalesce(read_at, now())
  where id = p_notification_id
    and recipient_id = acting_user_id
  returning * into result_row;

  if not found then
    raise exception 'Notification was not found.';
  end if;

  return result_row;
end;
$$;

revoke all on function public.mark_notification_read(uuid) from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;

create or replace function public.mark_all_notifications_read()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  updated_count bigint;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  update public.user_notifications
  set read_at = now()
  where recipient_id = acting_user_id
    and read_at is null;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.mark_all_notifications_read() from public;
grant execute on function public.mark_all_notifications_read() to authenticated;

-- Contact request → notification for the addressee only.
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
        'actorUsername', coalesce(actor_username, 'medlem')
      ),
      dedupe
    );
  end if;

  -- Clear unread contact-request notifications when the request leaves pending.
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

drop trigger if exists notify_on_contact_request on public.user_connections;
create trigger notify_on_contact_request
  after insert or update of status, requester_id, addressee_id, updated_at
  on public.user_connections
  for each row
  execute function public.notify_on_contact_request();

-- Forum reply → notification for the thread author (no nested-reply model yet).
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
      'actorUsername', coalesce(actor_username, 'medlem'),
      'kind', 'thread'
    ),
    'forum_reply:' || new.id::text || ':' || thread_row.author_id::text
  );

  return new;
end;
$$;

drop trigger if exists notify_on_forum_reply on public.forum_replies;
create trigger notify_on_forum_reply
  after insert on public.forum_replies
  for each row
  execute function public.notify_on_forum_reply();

-- Realtime for authenticated recipients (RLS still applies).
do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.user_notifications;
    exception
      when duplicate_object then
        null;
    end;
  end if;
end;
$$;
