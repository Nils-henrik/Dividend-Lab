alter table public.user_notifications
  drop constraint if exists user_notifications_type_check;

alter table public.user_notifications
  add constraint user_notifications_type_check check (
    type in ('contact_request', 'forum_reply', 'moderation_decision')
  );

create or replace function public.notify_on_moderation_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.affected_user_id is null or new.action_type = 'no_action' then
    return new;
  end if;

  perform public._insert_user_notification(
    new.affected_user_id,
    new.moderator_user_id,
    'moderation_decision',
    new.id,
    '/moderation/appeal/' || new.id::text,
    jsonb_build_object(
      'actionId', new.id,
      'actionType', new.action_type,
      'scopeDescription', new.scope_description
    ),
    'moderation_decision:' || new.id::text || ':' || new.affected_user_id::text
  );

  return new;
end;
$$;

drop trigger if exists notify_on_moderation_action on public.moderation_actions;
create trigger notify_on_moderation_action
  after insert on public.moderation_actions
  for each row
  execute function public.notify_on_moderation_action();
