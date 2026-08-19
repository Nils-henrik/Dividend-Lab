alter table public.forum_threads
  add column if not exists moderation_status text not null default 'visible';

alter table public.forum_threads
  drop constraint if exists forum_threads_moderation_status_check;
alter table public.forum_threads
  add constraint forum_threads_moderation_status_check
  check (moderation_status in ('visible', 'hidden', 'removed'));

alter table public.forum_replies
  add column if not exists moderation_status text not null default 'visible';

alter table public.forum_replies
  drop constraint if exists forum_replies_moderation_status_check;
alter table public.forum_replies
  add constraint forum_replies_moderation_status_check
  check (moderation_status in ('visible', 'hidden', 'removed'));

alter table public.learning_article_comments
  add column if not exists moderation_status text not null default 'visible';

alter table public.learning_article_comments
  drop constraint if exists learning_article_comments_moderation_status_check;
alter table public.learning_article_comments
  add constraint learning_article_comments_moderation_status_check
  check (moderation_status in ('visible', 'hidden', 'removed'));

drop policy if exists "Forum threads are publicly readable" on public.forum_threads;
create policy "Visible forum threads are publicly readable"
  on public.forum_threads
  for select
  using (moderation_status = 'visible');

drop policy if exists "Forum replies are publicly readable" on public.forum_replies;
create policy "Visible forum replies are publicly readable"
  on public.forum_replies
  for select
  using (moderation_status = 'visible');

drop policy if exists "Visible learning comments are publicly readable"
  on public.learning_article_comments;
create policy "Visible moderated learning comments are publicly readable"
  on public.learning_article_comments
  for select
  using (is_hidden = false and moderation_status = 'visible');

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique default (
    'DL-RPT-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 20))
  ),
  reporter_user_id uuid references auth.users(id) on delete set null,
  reporter_name text,
  reporter_email text,
  report_kind text not null check (report_kind in ('illegal_content', 'terms_violation')),
  category text not null check (
    category in (
      'child_safety',
      'threats_or_violence',
      'hate_or_illegal_discrimination',
      'harassment_or_defamation',
      'privacy_or_personal_data',
      'fraud_or_market_manipulation',
      'copyright_or_ip',
      'other_illegal',
      'spam_or_marketing',
      'impersonation',
      'other_terms_violation'
    )
  ),
  target_type text not null check (
    target_type in (
      'forum_thread',
      'forum_reply',
      'learning_comment',
      'profile',
      'profile_avatar',
      'other'
    )
  ),
  target_id uuid,
  target_url text not null,
  target_label text,
  target_owner_user_id uuid references auth.users(id) on delete set null,
  target_snapshot jsonb not null default '{}'::jsonb,
  explanation text not null,
  legal_basis text,
  good_faith_confirmed boolean not null default false,
  identity_exception_claimed boolean not null default false,
  status text not null default 'new' check (
    status in ('new', 'under_review', 'actioned', 'no_action', 'escalated')
  ),
  acknowledged_at timestamptz not null default now(),
  receipt_email_status text not null default 'pending' check (
    receipt_email_status in ('pending', 'sent', 'skipped', 'failed')
  ),
  receipt_email_error text,
  receipt_sent_at timestamptz,
  decision_email_status text not null default 'pending' check (
    decision_email_status in ('pending', 'sent', 'skipped', 'failed')
  ),
  decision_email_error text,
  decision_notified_at timestamptz,
  decision_action_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_reports_explanation_length check (
    char_length(btrim(explanation)) between 20 and 5000
  ),
  constraint content_reports_legal_basis_length check (
    legal_basis is null or char_length(legal_basis) <= 1000
  ),
  constraint content_reports_target_url_length check (
    char_length(btrim(target_url)) between 1 and 1500
  ),
  constraint content_reports_good_faith_required check (good_faith_confirmed = true),
  constraint content_reports_identity_exception_check check (
    identity_exception_claimed = false or category = 'child_safety'
  ),
  constraint content_reports_contact_check check (
    identity_exception_claimed = true
    or (
      reporter_name is not null
      and char_length(btrim(reporter_name)) between 2 and 200
      and reporter_email is not null
      and char_length(btrim(reporter_email)) between 3 and 320
    )
  )
);

create index if not exists content_reports_status_created_at_idx
  on public.content_reports(status, created_at desc);
create index if not exists content_reports_target_idx
  on public.content_reports(target_type, target_id, created_at desc);
create index if not exists content_reports_owner_idx
  on public.content_reports(target_owner_user_id, created_at desc)
  where target_owner_user_id is not null;
create index if not exists content_reports_reporter_idx
  on public.content_reports(reporter_user_id, created_at desc)
  where reporter_user_id is not null;

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.content_reports(id) on delete restrict,
  moderator_user_id uuid not null references auth.users(id) on delete restrict,
  affected_user_id uuid references auth.users(id) on delete set null,
  action_type text not null check (
    action_type in (
      'no_action',
      'hide_content',
      'remove_content',
      'clear_profile_bio',
      'remove_profile_avatar',
      'warn_user',
      'escalate_authorities'
    )
  ),
  basis_type text not null check (basis_type in ('law', 'terms', 'both', 'none')),
  legal_basis text,
  terms_basis text,
  factual_reason text not null,
  scope_description text not null,
  automated boolean not null default false,
  automation_details text,
  effective_until timestamptz,
  created_at timestamptz not null default now(),
  constraint moderation_actions_reason_length check (
    char_length(btrim(factual_reason)) between 20 and 5000
  ),
  constraint moderation_actions_scope_length check (
    char_length(btrim(scope_description)) between 1 and 1000
  ),
  constraint moderation_actions_legal_basis_required check (
    basis_type not in ('law', 'both') or nullif(btrim(legal_basis), '') is not null
  ),
  constraint moderation_actions_terms_basis_required check (
    basis_type not in ('terms', 'both') or nullif(btrim(terms_basis), '') is not null
  ),
  constraint moderation_actions_automation_details_check check (
    automated = false or nullif(btrim(automation_details), '') is not null
  )
);

create index if not exists moderation_actions_report_created_at_idx
  on public.moderation_actions(report_id, created_at desc);
create index if not exists moderation_actions_affected_user_idx
  on public.moderation_actions(affected_user_id, created_at desc)
  where affected_user_id is not null;

alter table public.content_reports
  drop constraint if exists content_reports_decision_action_fk;
alter table public.content_reports
  add constraint content_reports_decision_action_fk
  foreign key (decision_action_id) references public.moderation_actions(id) on delete restrict;

create table if not exists public.moderation_appeals (
  id uuid primary key default gen_random_uuid(),
  moderation_action_id uuid not null references public.moderation_actions(id) on delete restrict,
  appellant_user_id uuid not null references auth.users(id) on delete restrict,
  statement text not null,
  status text not null default 'open' check (
    status in ('open', 'upheld', 'changed', 'reversed')
  ),
  reviewer_user_id uuid references auth.users(id) on delete set null,
  outcome_reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint moderation_appeals_statement_length check (
    char_length(btrim(statement)) between 20 and 5000
  ),
  constraint moderation_appeals_action_user_unique unique (
    moderation_action_id,
    appellant_user_id
  )
);

create index if not exists moderation_appeals_status_created_at_idx
  on public.moderation_appeals(status, created_at asc);

alter table public.content_reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.moderation_appeals enable row level security;

revoke all on table public.content_reports from anon, authenticated;
revoke all on table public.moderation_actions from anon, authenticated;
revoke all on table public.moderation_appeals from anon, authenticated;
grant all on table public.content_reports to service_role;
grant all on table public.moderation_actions to service_role;
grant all on table public.moderation_appeals to service_role;

drop trigger if exists set_content_reports_updated_at on public.content_reports;
create trigger set_content_reports_updated_at
  before update on public.content_reports
  for each row
  execute function public.set_updated_at();

create or replace function public.prevent_moderation_action_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'moderation_actions is append-only';
end;
$$;

drop trigger if exists prevent_moderation_action_update_delete
  on public.moderation_actions;
create trigger prevent_moderation_action_update_delete
  before update or delete on public.moderation_actions
  for each row
  execute function public.prevent_moderation_action_mutation();

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
security invoker
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

  if report_row.target_type in ('forum_thread', 'forum_reply', 'learning_comment') then
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
