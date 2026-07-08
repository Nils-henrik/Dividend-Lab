alter table public.conversations
  add column if not exists subject text;

alter table public.conversations
  drop constraint if exists conversations_subject_length;

alter table public.conversations
  add constraint conversations_subject_length check (
    subject is null or char_length(btrim(subject)) between 1 and 120
  );

create or replace function public.get_or_create_private_conversation(
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
  requesting_user_id uuid := auth.uid();
  conversation_id uuid;
  normalized_body text := nullif(btrim(coalesce(p_initial_body, '')), '');
  normalized_subject text := nullif(btrim(coalesce(p_subject, '')), '');
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

  if normalized_subject is not null and char_length(normalized_subject) > 120 then
    raise exception 'Subject is too long.';
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
    insert into public.conversations (subject)
    values (normalized_subject)
    returning id into conversation_id;

    insert into public.conversation_participants (conversation_id, user_id)
    values
      (conversation_id, requesting_user_id),
      (conversation_id, p_target_user_id);
  elsif normalized_subject is not null then
    update public.conversations
    set subject = coalesce(nullif(btrim(subject), ''), normalized_subject)
    where id = conversation_id;
  end if;

  if normalized_body is not null then
    insert into public.messages (conversation_id, sender_id, body)
    values (conversation_id, requesting_user_id, normalized_body);
  end if;

  return conversation_id;
end;
$$;

create or replace function public.get_or_create_private_conversation(
  p_target_user_id uuid,
  p_initial_body text default null
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.get_or_create_private_conversation(
    p_target_user_id,
    p_initial_body,
    null::text
  );
$$;

revoke all on function public.get_or_create_private_conversation(uuid, text, text) from public;
grant execute on function public.get_or_create_private_conversation(uuid, text, text) to authenticated;

revoke all on function public.get_or_create_private_conversation(uuid, text) from public;
grant execute on function public.get_or_create_private_conversation(uuid, text) to authenticated;
