create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_read_at timestamptz,
  unique (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint messages_body_length check (
    char_length(btrim(body)) between 1 and 2000
  )
);

create index if not exists conversation_participants_user_id_idx
  on public.conversation_participants(user_id);

create index if not exists conversation_participants_conversation_id_idx
  on public.conversation_participants(conversation_id);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages(conversation_id, created_at);

drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
  before update on public.conversations
  for each row
  execute function public.set_updated_at();

create or replace function public.touch_conversation_after_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = new.created_at
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists touch_conversation_after_message on public.messages;
create trigger touch_conversation_after_message
  after insert on public.messages
  for each row
  execute function public.touch_conversation_after_message();

create or replace function public.is_conversation_participant(
  check_conversation_id uuid,
  check_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants
    where conversation_id = check_conversation_id
      and user_id = check_user_id
  );
$$;

create or replace function public.get_or_create_private_conversation(
  p_target_user_id uuid,
  p_initial_body text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  requesting_user_id uuid := auth.uid();
  conversation_id uuid;
  normalized_body text := nullif(btrim(coalesce(p_initial_body, '')), '');
begin
  if requesting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_target_user_id is null then
    raise exception 'Target user is required.';
  end if;

  if p_target_user_id = requesting_user_id then
    raise exception 'You cannot message yourself.';
  end if;

  if not exists (select 1 from public.profiles where id = p_target_user_id) then
    raise exception 'Target user was not found.';
  end if;

  if normalized_body is not null and char_length(normalized_body) > 2000 then
    raise exception 'Message is too long.';
  end if;

  select first_participant.conversation_id
  into conversation_id
  from public.conversation_participants first_participant
  join public.conversation_participants second_participant
    on second_participant.conversation_id = first_participant.conversation_id
  where first_participant.user_id = requesting_user_id
    and second_participant.user_id = p_target_user_id
    and (
      select count(*)
      from public.conversation_participants participant_count
      where participant_count.conversation_id = first_participant.conversation_id
    ) = 2
  limit 1;

  if conversation_id is null then
    insert into public.conversations default values
    returning id into conversation_id;

    insert into public.conversation_participants (conversation_id, user_id)
    values
      (conversation_id, requesting_user_id),
      (conversation_id, p_target_user_id);
  end if;

  if normalized_body is not null then
    insert into public.messages (conversation_id, sender_id, body)
    values (conversation_id, requesting_user_id, normalized_body);
  end if;

  return conversation_id;
end;
$$;

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Users can read their conversations" on public.conversations;
create policy "Users can read their conversations"
  on public.conversations
  for select
  to authenticated
  using (public.is_conversation_participant(id, auth.uid()));

drop policy if exists "Users can read participants in their conversations" on public.conversation_participants;
create policy "Users can read participants in their conversations"
  on public.conversation_participants
  for select
  to authenticated
  using (public.is_conversation_participant(conversation_id, auth.uid()));

drop policy if exists "Users can update their own participant state" on public.conversation_participants;
create policy "Users can update their own participant state"
  on public.conversation_participants
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke update on public.conversation_participants from anon, authenticated;
grant update (last_read_at) on public.conversation_participants to authenticated;

drop policy if exists "Users can read messages in their conversations" on public.messages;
create policy "Users can read messages in their conversations"
  on public.messages
  for select
  to authenticated
  using (public.is_conversation_participant(conversation_id, auth.uid()));

drop policy if exists "Users can send messages in their conversations" on public.messages;
create policy "Users can send messages in their conversations"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id, auth.uid())
  );

revoke all on function public.get_or_create_private_conversation(uuid, text) from public;
grant execute on function public.get_or_create_private_conversation(uuid, text) to authenticated;

revoke all on function public.is_conversation_participant(uuid, uuid) from public;
grant execute on function public.is_conversation_participant(uuid, uuid) to authenticated;
