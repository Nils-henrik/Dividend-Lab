create index if not exists content_reports_decision_action_idx
  on public.content_reports(decision_action_id)
  where decision_action_id is not null;

create index if not exists moderation_actions_moderator_user_idx
  on public.moderation_actions(moderator_user_id, created_at desc);

create index if not exists moderation_appeals_appellant_user_idx
  on public.moderation_appeals(appellant_user_id, created_at desc);

create index if not exists moderation_appeals_reviewer_user_idx
  on public.moderation_appeals(reviewer_user_id, decided_at desc)
  where reviewer_user_id is not null;
