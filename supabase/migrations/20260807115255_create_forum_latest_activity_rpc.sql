create or replace function public.get_forum_threads_by_latest_activity(p_limit integer default 5)
returns table (
  id uuid,
  slug text,
  author_id uuid,
  category_slug text,
  title text,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  content_version integer,
  edited_at timestamptz,
  author_username text,
  author_display_name text,
  author_profile_created_at timestamptz,
  author_avatar_path text,
  author_profile_updated_at timestamptz,
  reply_count integer,
  last_activity_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    t.id,
    t.slug,
    t.author_id,
    t.category_slug,
    t.title,
    t.body,
    t.created_at,
    t.updated_at,
    t.content_version,
    t.edited_at,
    p.username as author_username,
    p.display_name as author_display_name,
    p.created_at as author_profile_created_at,
    p.avatar_path as author_avatar_path,
    p.updated_at as author_profile_updated_at,
    count(r.id)::integer as reply_count,
    greatest(
      t.created_at,
      coalesce(max(r.created_at), t.created_at)
    ) as last_activity_at
  from public.forum_threads t
  left join public.forum_replies r
    on r.thread_id = t.id
  left join public.profiles p
    on p.id = t.author_id
  group by
    t.id,
    p.username,
    p.display_name,
    p.created_at,
    p.avatar_path,
    p.updated_at
  order by last_activity_at desc, t.created_at desc, t.id desc
  limit least(greatest(coalesce(p_limit, 5), 1), 50);
$$;

revoke all on function public.get_forum_threads_by_latest_activity(integer) from public;
grant execute on function public.get_forum_threads_by_latest_activity(integer) to anon, authenticated, service_role;
