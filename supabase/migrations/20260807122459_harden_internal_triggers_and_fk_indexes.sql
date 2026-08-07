alter function public.set_updated_at() set search_path = public;

revoke execute on function public.set_updated_at() from public;
revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.touch_conversation_after_message() from public;

create index if not exists forum_replies_author_id_idx
  on public.forum_replies(author_id);

create index if not exists forum_threads_author_id_idx
  on public.forum_threads(author_id);

create index if not exists learning_article_comments_user_id_idx
  on public.learning_article_comments(user_id);

create index if not exists messages_sender_id_idx
  on public.messages(sender_id);

create index if not exists user_notifications_actor_id_idx
  on public.user_notifications(actor_id);
