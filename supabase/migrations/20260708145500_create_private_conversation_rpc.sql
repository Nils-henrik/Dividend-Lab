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

  if normalized_subject is null then
    raise exception 'Subject is required.';
  end if;

  if char_length(normalized_subject) > 120 then
    raise exception 'Subject is too long.';
  end if;

  if normalized_body is null then
    raise exception 'Message is required.';
  end if;

  if char_length(normalized_body) > 2000 then
    raise exception 'Message is too long.';
  end if;

  insert into public.conversations (subject)
  values (normalized_subject)
  returning id into conversation_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values
    (conversation_id, requesting_user_id),
    (conversation_id, p_target_user_id);

  insert into public.messages (conversation_id, sender_id, body)
  values (conversation_id, requesting_user_id, normalized_body);

  return conversation_id;
end;
$$;

revoke all on function public.create_private_conversation(uuid, text, text) from public;
grant execute on function public.create_private_conversation(uuid, text, text) to authenticated;
