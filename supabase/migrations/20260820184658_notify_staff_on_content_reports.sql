alter table public.user_notifications
  alter column actor_id drop not null;

alter table public.user_notifications
  drop constraint if exists user_notifications_no_self;
alter table public.user_notifications
  add constraint user_notifications_no_self
  check (actor_id is null or recipient_id <> actor_id);

alter table public.user_notifications
  drop constraint if exists user_notifications_type_check;
alter table public.user_notifications
  add constraint user_notifications_type_check
  check (type in ('contact_request', 'forum_reply', 'moderation_report', 'moderation_decision'));

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
     or p_type is null
     or p_destination_path is null
     or p_dedupe_key is null then
    return;
  end if;

  if p_actor_id is not null and p_recipient_id = p_actor_id then
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

create or replace function public.notify_staff_on_content_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_row record;
  actor_for_notification uuid;
  is_urgent boolean;
begin
  if coalesce(new.target_snapshot ->> 'internalModeration', 'false') = 'true' then
    return new;
  end if;

  is_urgent := new.category in ('child_safety', 'threats_or_violence');

  for staff_row in
    select distinct user_id
    from public.profile_staff_roles
    where role in ('moderator', 'admin', 'founder', 'ceo_divlab')
  loop
    actor_for_notification := case
      when new.reporter_user_id = staff_row.user_id then null
      else new.reporter_user_id
    end;

    perform public._insert_user_notification(
      staff_row.user_id,
      actor_for_notification,
      'moderation_report',
      new.id,
      '/moderation/' || new.id::text,
      jsonb_build_object(
        'referenceCode', new.reference_code,
        'reportCategory', new.category,
        'targetLabel', coalesce(new.target_label, new.target_url),
        'urgent', is_urgent
      ),
      'moderation_report:' || new.id::text || ':' || staff_row.user_id::text
    );
  end loop;

  return new;
end;
$$;

revoke all on function public.notify_staff_on_content_report() from public;
revoke all on function public.notify_staff_on_content_report() from anon, authenticated, service_role;

drop trigger if exists notify_staff_on_content_report on public.content_reports;
create trigger notify_staff_on_content_report
  after insert on public.content_reports
  for each row
  execute function public.notify_staff_on_content_report();
