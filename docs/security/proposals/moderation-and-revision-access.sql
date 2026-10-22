-- PROPOSAL ONLY. Do not apply to production without explicit approval.
-- Verified against the 2026-10-22 catalog. Not an automatic migration.
begin;

-- Client roles only need DML through the Data API. RLS does not cover TRUNCATE.
-- Keep all service_role privileges and legitimate SELECT/INSERT/UPDATE/DELETE.
revoke truncate, references, trigger on all tables in schema public
  from public, anon, authenticated;

-- Remove both table-level and historical column-level write grants.
revoke insert, update on public.learning_article_comments from public, anon, authenticated;
revoke insert (id, article_slug, user_id, body, created_at, updated_at, is_hidden, moderation_status),
       update (id, article_slug, user_id, body, created_at, updated_at, is_hidden, moderation_status)
  on public.learning_article_comments from public, anon, authenticated;
grant insert (article_slug, user_id, body), update (body)
  on public.learning_article_comments to authenticated;

-- Direct REST reads must respect the same visibility as the parent content.
drop policy "Forum thread revisions are publicly readable" on public.forum_thread_revisions;
create policy "Visible forum thread revisions are publicly readable"
  on public.forum_thread_revisions for select to anon, authenticated
  using (exists (
    select 1 from public.forum_threads t
    where t.id = forum_thread_revisions.thread_id
      and t.moderation_status = 'visible'
  ));

drop policy "Forum reply revisions are publicly readable" on public.forum_reply_revisions;
create policy "Visible forum reply revisions are publicly readable"
  on public.forum_reply_revisions for select to anon, authenticated
  using (exists (
    select 1 from public.forum_replies r
    join public.forum_threads t on t.id = r.thread_id
    where r.id = forum_reply_revisions.reply_id
      and r.moderation_status = 'visible'
      and t.moderation_status = 'visible'
  ));

commit;
