-- Company page comments. Public reads are limited to visible rows.
-- Authenticated users may insert only their own visible comment and delete only their own row.
-- moderation_status is not user-writable; hide/remove goes through apply_moderation_decision.

create table public.company_comments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  moderation_status text not null default 'visible',
  constraint company_comments_body_length check (
    char_length(btrim(body)) between 1 and 2000
  ),
  constraint company_comments_moderation_status_check check (
    moderation_status in ('visible', 'hidden', 'removed')
  )
);

create index company_comments_company_created_idx
  on public.company_comments (company_id, created_at desc)
  where moderation_status = 'visible';

create index company_comments_user_idx
  on public.company_comments (user_id);

drop trigger if exists company_comments_set_updated_at on public.company_comments;
create trigger company_comments_set_updated_at
  before update on public.company_comments
  for each row
  execute function public.set_updated_at();

alter table public.company_comments enable row level security;

revoke all on table public.company_comments from public, anon, authenticated;

grant select on table public.company_comments to anon, authenticated;
grant insert (company_id, user_id, body) on table public.company_comments to authenticated;
grant delete on table public.company_comments to authenticated;
grant all on table public.company_comments to service_role;

create policy company_comments_visible_read
  on public.company_comments
  for select
  to anon, authenticated
  using (moderation_status = 'visible');

create policy company_comments_own_insert
  on public.company_comments
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and moderation_status = 'visible'
    and exists (
      select 1
      from public.companies
      where companies.id = company_comments.company_id
        and companies.is_active = true
    )
  );

create policy company_comments_own_delete
  on public.company_comments
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

alter table public.content_reports
  drop constraint if exists content_reports_target_type_check;

alter table public.content_reports
  add constraint content_reports_target_type_check
  check (
    target_type in (
      'forum_thread',
      'forum_reply',
      'learning_comment',
      'company_comment',
      'profile',
      'profile_avatar',
      'other'
    )
  );

create or replace function public.apply_moderation_decision(
  p_report_id uuid,
  p_moderator_user_id uuid,
  p_action_type text,
  p_basis_type text,
  p_legal_basis text,
  p_terms_basis text,
  p_factual_reason text,
  p_scope_description text,
  p_automated boolean,
  p_automation_details text,
  p_effective_until timestamptz
)
returns setof public.moderation_actions
language plpgsql
security definer
set search_path = public
as $$
declare
  report_row public.content_reports;
  action_row public.moderation_actions;
begin
  if not exists (
    select 1
    from public.profile_staff_roles
    where user_id = p_moderator_user_id
      and role in ('moderator', 'admin', 'founder', 'ceo_divlab')
  ) then
    raise exception 'Moderator authorization required.';
  end if;

  select *
    into report_row
    from public.content_reports
    where id = p_report_id
    for update;

  if not found then
    raise exception 'Report not found.';
  end if;

  if report_row.status not in ('new', 'under_review') then
    raise exception 'Report already has a final decision.';
  end if;

  if p_action_type not in (
    'no_action', 'hide_content', 'remove_content', 'clear_profile_bio',
    'remove_profile_avatar', 'warn_user', 'escalate_authorities'
  ) then
    raise exception 'Invalid moderation action.';
  end if;

  if p_basis_type not in ('law', 'terms', 'both', 'none') then
    raise exception 'Invalid moderation basis.';
  end if;

  if p_basis_type in ('law', 'both') and nullif(btrim(p_legal_basis), '') is null then
    raise exception 'Legal basis is required.';
  end if;

  if p_basis_type in ('terms', 'both') and nullif(btrim(p_terms_basis), '') is null then
    raise exception 'Terms basis is required.';
  end if;

  if char_length(btrim(p_factual_reason)) not between 20 and 5000 then
    raise exception 'Factual reason length is invalid.';
  end if;

  if p_automated and nullif(btrim(p_automation_details), '') is null then
    raise exception 'Automation details are required.';
  end if;

  if report_row.target_type in ('forum_thread', 'forum_reply', 'learning_comment', 'company_comment') then
    if p_action_type not in ('no_action', 'hide_content', 'remove_content', 'warn_user', 'escalate_authorities') then
      raise exception 'Action not allowed for content target.';
    end if;
  elsif report_row.target_type = 'profile' then
    if p_action_type not in ('no_action', 'clear_profile_bio', 'remove_profile_avatar', 'warn_user', 'escalate_authorities') then
      raise exception 'Action not allowed for profile target.';
    end if;
  elsif report_row.target_type = 'profile_avatar' then
    if p_action_type not in ('no_action', 'remove_profile_avatar', 'warn_user', 'escalate_authorities') then
      raise exception 'Action not allowed for profile avatar target.';
    end if;
  elsif report_row.target_type = 'other' then
    if p_action_type not in ('no_action', 'warn_user', 'escalate_authorities') then
      raise exception 'Action not allowed for generic target.';
    end if;
  else
    raise exception 'Unknown moderation target type.';
  end if;

  if p_action_type in ('hide_content', 'remove_content') then
    if report_row.target_id is null then
      raise exception 'Target id is required for content restriction.';
    end if;

    if report_row.target_type = 'forum_thread' then
      update public.forum_threads
      set moderation_status = case when p_action_type = 'hide_content' then 'hidden' else 'removed' end
      where id = report_row.target_id;
      if not found then raise exception 'Forum thread target no longer exists.'; end if;
    elsif report_row.target_type = 'forum_reply' then
      update public.forum_replies
      set moderation_status = case when p_action_type = 'hide_content' then 'hidden' else 'removed' end
      where id = report_row.target_id;
      if not found then raise exception 'Forum reply target no longer exists.'; end if;
    elsif report_row.target_type = 'learning_comment' then
      update public.learning_article_comments
      set moderation_status = case when p_action_type = 'hide_content' then 'hidden' else 'removed' end,
          is_hidden = true
      where id = report_row.target_id;
      if not found then raise exception 'Learning comment target no longer exists.'; end if;
    elsif report_row.target_type = 'company_comment' then
      update public.company_comments
      set moderation_status = case when p_action_type = 'hide_content' then 'hidden' else 'removed' end
      where id = report_row.target_id;
      if not found then raise exception 'Company comment target no longer exists.'; end if;
    else
      raise exception 'Content restriction target type is invalid.';
    end if;
  elsif p_action_type = 'clear_profile_bio' then
    update public.profiles
    set bio = null
    where id = report_row.target_id;
    if not found then raise exception 'Profile target no longer exists.'; end if;
  elsif p_action_type = 'remove_profile_avatar' then
    update public.profiles
    set avatar_path = null
    where id = report_row.target_id;
    if not found then raise exception 'Profile target no longer exists.'; end if;
  end if;

  insert into public.moderation_actions (
    report_id,
    moderator_user_id,
    affected_user_id,
    action_type,
    basis_type,
    legal_basis,
    terms_basis,
    factual_reason,
    scope_description,
    automated,
    automation_details,
    effective_until
  )
  values (
    report_row.id,
    p_moderator_user_id,
    report_row.target_owner_user_id,
    p_action_type,
    p_basis_type,
    nullif(btrim(p_legal_basis), ''),
    nullif(btrim(p_terms_basis), ''),
    btrim(p_factual_reason),
    btrim(p_scope_description),
    coalesce(p_automated, false),
    nullif(btrim(p_automation_details), ''),
    p_effective_until
  )
  returning * into action_row;

  update public.content_reports
  set status = case
        when p_action_type = 'no_action' then 'no_action'
        when p_action_type = 'escalate_authorities' then 'escalated'
        else 'actioned'
      end,
      decision_action_id = action_row.id
  where id = report_row.id;

  return next action_row;
  return;
end;
$$;

revoke all on function public.apply_moderation_decision(
  uuid, uuid, text, text, text, text, text, text, boolean, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.apply_moderation_decision(
  uuid, uuid, text, text, text, text, text, text, boolean, text, timestamptz
) to service_role;
