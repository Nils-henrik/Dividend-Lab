-- Private chat permission model, canonical 1:1 uniqueness, and message-request flow.
-- Reuses public.conversations / conversation_participants / messages.
-- Does not touch DivBrain tables.

alter table public.conversations
  add column if not exists status text,
  add column if not exists initiated_by uuid references auth.users(id) on delete set null,
  add column if not exists pair_user_low uuid,
  add column if not exists pair_user_high uuid,
  add column if not exists responded_at timestamptz;

-- Backfill existing conversations as active DMs where a unique pair can be resolved.
with pair_candidates as (
  select
    cp.conversation_id,
    min(cp.user_id) as pair_low,
    max(cp.user_id) as pair_high,
    count(*)::int as participant_count
  from public.conversation_participants cp
  group by cp.conversation_id
),
ranked_pairs as (
  select
    pc.*,
    row_number() over (
      partition by pc.pair_low, pc.pair_high
      order by c.created_at asc, c.id asc
    ) as pair_rank
  from pair_candidates pc
  join public.conversations c on c.id = pc.conversation_id
  where pc.participant_count = 2
)
update public.conversations c
set
  status = coalesce(c.status, 'active'),
  pair_user_low = rp.pair_low,
  pair_user_high = rp.pair_high,
  initiated_by = coalesce(
    c.initiated_by,
    (
      select m.sender_id
      from public.messages m
      where m.conversation_id = c.id
      order by m.created_at asc, m.id asc
      limit 1
    )
  )
from ranked_pairs rp
where c.id = rp.conversation_id
  and rp.pair_rank = 1;

update public.conversations
set status = 'active'
where status is null;

alter table public.conversations
  alter column status set default 'active';

alter table public.conversations
  alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_status_check'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_status_check
      check (status in ('message_request', 'active', 'ignored', 'declined'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_normalized_pair_check'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_normalized_pair_check
      check (
        (pair_user_low is null and pair_user_high is null)
        or (
          pair_user_low is not null
          and pair_user_high is not null
          and pair_user_low < pair_user_high
        )
      );
  end if;
end $$;

create unique index if not exists conversations_dm_pair_uidx
  on public.conversations (pair_user_low, pair_user_high)
  where pair_user_low is not null
    and pair_user_high is not null;

create index if not exists conversations_status_updated_at_idx
  on public.conversations (status, updated_at desc);

create index if not exists conversations_initiated_by_status_idx
  on public.conversations (initiated_by, status);

create or replace function public.can_send_private_message(
  p_conversation_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  conversation_row public.conversations;
  message_count bigint;
begin
  if p_conversation_id is null or p_user_id is null then
    return false;
  end if;

  if not public.is_conversation_participant(p_conversation_id, p_user_id) then
    return false;
  end if;

  select *
  into conversation_row
  from public.conversations
  where id = p_conversation_id;

  if not found then
    return false;
  end if;

  if conversation_row.status = 'active' then
    return true;
  end if;

  if conversation_row.status = 'message_request' then
    if conversation_row.initiated_by is distinct from p_user_id then
      return false;
    end if;

    select count(*)::bigint
    into message_count
    from public.messages
    where conversation_id = p_conversation_id;

    return message_count = 0;
  end if;

  return false;
end;
$$;

revoke all on function public.can_send_private_message(uuid, uuid) from public;
grant execute on function public.can_send_private_message(uuid, uuid) to authenticated;

drop policy if exists "Users can send messages in their conversations" on public.messages;
create policy "Users can send messages in their conversations"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.can_send_private_message(conversation_id, auth.uid())
  );

create or replace function public.open_or_create_private_conversation(
  p_target_user_id uuid,
  p_initial_body text default null,
  p_subject text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  pair_low uuid;
  pair_high uuid;
  conversation_id uuid;
  existing_status text;
  are_contacts boolean;
  normalized_body text := nullif(btrim(coalesce(p_initial_body, '')), '');
  normalized_subject text := nullif(btrim(coalesce(p_subject, '')), '');
  desired_status text;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_target_user_id is null then
    raise exception 'Target user is required.';
  end if;

  if p_target_user_id = acting_user_id then
    raise exception 'You cannot message yourself.';
  end if;

  if not exists (select 1 from public.profiles where id = p_target_user_id) then
    raise exception 'Target user was not found.';
  end if;

  if normalized_subject is not null and char_length(normalized_subject) > 120 then
    raise exception 'Subject is too long.';
  end if;

  if normalized_body is not null and char_length(normalized_body) > 2000 then
    raise exception 'Message is too long.';
  end if;

  pair_low := least(acting_user_id, p_target_user_id);
  pair_high := greatest(acting_user_id, p_target_user_id);
  are_contacts := public.are_accepted_contacts(acting_user_id, p_target_user_id);
  desired_status := case when are_contacts then 'active' else 'message_request' end;

  select c.id, c.status
  into conversation_id, existing_status
  from public.conversations c
  where c.pair_user_low = pair_low
    and c.pair_user_high = pair_high
  for update;

  if conversation_id is null then
    if not are_contacts and normalized_body is null then
      raise exception 'An initial message is required for message requests.';
    end if;

    begin
      insert into public.conversations (
        subject,
        status,
        initiated_by,
        pair_user_low,
        pair_user_high
      )
      values (
        normalized_subject,
        desired_status,
        acting_user_id,
        pair_low,
        pair_high
      )
      returning id into conversation_id;
    exception
      when unique_violation then
        select c.id, c.status
        into conversation_id, existing_status
        from public.conversations c
        where c.pair_user_low = pair_low
          and c.pair_user_high = pair_high
        for update;
    end;

    insert into public.conversation_participants (conversation_id, user_id)
    values
      (conversation_id, acting_user_id),
      (conversation_id, p_target_user_id)
    on conflict (conversation_id, user_id) do nothing;
  else
    if are_contacts and existing_status = 'message_request' then
      update public.conversations
      set
        status = 'active',
        responded_at = coalesce(responded_at, now()),
        updated_at = now()
      where id = conversation_id;

      existing_status := 'active';
    end if;

    if existing_status in ('ignored', 'declined') and are_contacts then
      update public.conversations
      set
        status = 'active',
        responded_at = coalesce(responded_at, now()),
        updated_at = now()
      where id = conversation_id;

      existing_status := 'active';
    end if;

    if normalized_subject is not null then
      update public.conversations
      set subject = coalesce(nullif(btrim(coalesce(subject, '')), ''), normalized_subject)
      where id = conversation_id;
    end if;
  end if;

  if normalized_body is not null then
    if not public.can_send_private_message(conversation_id, acting_user_id) then
      -- Idempotent reopen for the original requester: do not create extra messages
      -- and do not reveal ignored/declined state as a distinct outcome.
      if (
        select c.initiated_by
        from public.conversations c
        where c.id = conversation_id
      ) = acting_user_id
         and coalesce(existing_status, desired_status) in (
           'message_request',
           'ignored',
           'declined'
         ) then
        return conversation_id;
      end if;

      raise exception 'You cannot send a message in this conversation.';
    end if;

    insert into public.messages (conversation_id, sender_id, body)
    values (conversation_id, acting_user_id, normalized_body);
  end if;

  return conversation_id;
end;
$$;

revoke all on function public.open_or_create_private_conversation(uuid, text, text) from public;
grant execute on function public.open_or_create_private_conversation(uuid, text, text) to authenticated;

-- Replace legacy create RPC with canonical open-or-create behavior.
create or replace function public.create_private_conversation(
  p_target_user_id uuid,
  p_initial_body text,
  p_subject text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.open_or_create_private_conversation(
    p_target_user_id,
    p_initial_body,
    p_subject
  );
end;
$$;

revoke all on function public.create_private_conversation(uuid, text, text) from public;
grant execute on function public.create_private_conversation(uuid, text, text) to authenticated;

create or replace function public.send_private_message(
  p_conversation_id uuid,
  p_body text
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  normalized_body text := nullif(btrim(coalesce(p_body, '')), '');
  result_row public.messages;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_conversation_id is null then
    raise exception 'Conversation is required.';
  end if;

  if normalized_body is null then
    raise exception 'Message is required.';
  end if;

  if char_length(normalized_body) > 2000 then
    raise exception 'Message is too long.';
  end if;

  if not public.can_send_private_message(p_conversation_id, acting_user_id) then
    raise exception 'You cannot send a message in this conversation.';
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (p_conversation_id, acting_user_id, normalized_body)
  returning * into result_row;

  return result_row;
end;
$$;

revoke all on function public.send_private_message(uuid, text) from public;
grant execute on function public.send_private_message(uuid, text) to authenticated;

create or replace function public.accept_message_request(p_conversation_id uuid)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  existing public.conversations;
  result_row public.conversations;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select *
  into existing
  from public.conversations
  where id = p_conversation_id
  for update;

  if not found then
    raise exception 'Conversation was not found.';
  end if;

  if not public.is_conversation_participant(existing.id, acting_user_id) then
    raise exception 'Only participants can manage this conversation.';
  end if;

  if existing.initiated_by = acting_user_id then
    raise exception 'Only the recipient can accept a message request.';
  end if;

  if existing.status = 'active' then
    return existing;
  end if;

  if existing.status <> 'message_request' then
    raise exception 'Only pending message requests can be accepted.';
  end if;

  update public.conversations
  set
    status = 'active',
    responded_at = now(),
    updated_at = now()
  where id = existing.id
  returning * into result_row;

  return result_row;
end;
$$;

revoke all on function public.accept_message_request(uuid) from public;
grant execute on function public.accept_message_request(uuid) to authenticated;

create or replace function public.ignore_message_request(p_conversation_id uuid)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  existing public.conversations;
  result_row public.conversations;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select *
  into existing
  from public.conversations
  where id = p_conversation_id
  for update;

  if not found then
    raise exception 'Conversation was not found.';
  end if;

  if not public.is_conversation_participant(existing.id, acting_user_id) then
    raise exception 'Only participants can manage this conversation.';
  end if;

  if existing.initiated_by = acting_user_id then
    raise exception 'Only the recipient can ignore a message request.';
  end if;

  if existing.status = 'ignored' then
    return existing;
  end if;

  if existing.status <> 'message_request' then
    raise exception 'Only pending message requests can be ignored.';
  end if;

  update public.conversations
  set
    status = 'ignored',
    responded_at = now(),
    updated_at = now()
  where id = existing.id
  returning * into result_row;

  return result_row;
end;
$$;

revoke all on function public.ignore_message_request(uuid) from public;
grant execute on function public.ignore_message_request(uuid) to authenticated;

create or replace function public.decline_message_request(p_conversation_id uuid)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  existing public.conversations;
  result_row public.conversations;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select *
  into existing
  from public.conversations
  where id = p_conversation_id
  for update;

  if not found then
    raise exception 'Conversation was not found.';
  end if;

  if not public.is_conversation_participant(existing.id, acting_user_id) then
    raise exception 'Only participants can manage this conversation.';
  end if;

  if existing.initiated_by = acting_user_id then
    raise exception 'Only the recipient can decline a message request.';
  end if;

  if existing.status = 'declined' then
    return existing;
  end if;

  if existing.status <> 'message_request' then
    raise exception 'Only pending message requests can be declined.';
  end if;

  update public.conversations
  set
    status = 'declined',
    responded_at = now(),
    updated_at = now()
  where id = existing.id
  returning * into result_row;

  return result_row;
end;
$$;

revoke all on function public.decline_message_request(uuid) from public;
grant execute on function public.decline_message_request(uuid) to authenticated;

-- Refresh contact acceptance so pending chats activate when users become contacts.
create or replace function public.accept_contact_request(p_connection_id uuid)
returns public.user_connections
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  existing public.user_connections;
  result_row public.user_connections;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select *
  into existing
  from public.user_connections
  where id = p_connection_id
  for update;

  if not found then
    raise exception 'Contact request was not found.';
  end if;

  if existing.addressee_id <> acting_user_id then
    raise exception 'Only the recipient can accept a contact request.';
  end if;

  if existing.status = 'accepted' then
    return existing;
  end if;

  if existing.status <> 'pending' then
    raise exception 'Only pending contact requests can be accepted.';
  end if;

  update public.user_connections
  set
    status = 'accepted',
    responded_at = now(),
    updated_at = now()
  where id = existing.id
  returning * into result_row;

  update public.conversations
  set
    status = 'active',
    responded_at = coalesce(responded_at, now()),
    updated_at = now()
  where pair_user_low = existing.user_low_id
    and pair_user_high = existing.user_high_id
    and status = 'message_request';

  return result_row;
end;
$$;

revoke all on function public.accept_contact_request(uuid) from public;
grant execute on function public.accept_contact_request(uuid) to authenticated;

revoke update on table public.conversations from anon, authenticated;
grant select on table public.conversations to authenticated;
