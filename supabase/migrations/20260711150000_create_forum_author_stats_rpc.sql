-- Read-only aggregate forum statistics for public author profiles.

create or replace function public.get_forum_author_stats(p_author_id uuid)
returns table (
  thread_count bigint,
  reply_count bigint,
  contribution_count bigint,
  helpful_count bigint,
  insightful_count bigint,
  well_researched_count bigint,
  total_received_reactions bigint
)
language sql
security invoker
set search_path = public
stable
as $$
  with content_counts as (
    select
      (
        select count(*)::bigint
        from public.forum_threads
        where author_id = p_author_id
      ) as thread_count,
      (
        select count(*)::bigint
        from public.forum_replies
        where author_id = p_author_id
      ) as reply_count
  ),
  reaction_counts as (
    select
      coalesce(
        sum(case when fr.reaction_type = 'helpful' then 1 else 0 end),
        0
      )::bigint as helpful_count,
      coalesce(
        sum(case when fr.reaction_type = 'insightful' then 1 else 0 end),
        0
      )::bigint as insightful_count,
      coalesce(
        sum(case when fr.reaction_type = 'well_researched' then 1 else 0 end),
        0
      )::bigint as well_researched_count,
      count(*)::bigint as total_received_reactions
    from public.forum_reactions fr
    where fr.user_id <> p_author_id
      and (
        exists (
          select 1
          from public.forum_threads ft
          where ft.id = fr.thread_id
            and ft.author_id = p_author_id
        )
        or exists (
          select 1
          from public.forum_replies frp
          where frp.id = fr.reply_id
            and frp.author_id = p_author_id
        )
      )
  )
  select
    cc.thread_count,
    cc.reply_count,
    (cc.thread_count + cc.reply_count)::bigint as contribution_count,
    rc.helpful_count,
    rc.insightful_count,
    rc.well_researched_count,
    rc.total_received_reactions
  from content_counts cc
  cross join reaction_counts rc;
$$;

revoke all on function public.get_forum_author_stats(uuid) from public;
grant execute on function public.get_forum_author_stats(uuid) to anon, authenticated;
