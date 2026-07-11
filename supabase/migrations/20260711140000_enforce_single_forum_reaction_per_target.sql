-- Enforce one forum reaction per user and target (not per reaction type).

-- 1. Remove historical duplicates on thread targets.
with ranked_thread_reactions as (
  select
    id,
    row_number() over (
      partition by user_id, thread_id
      order by created_at desc, id desc
    ) as row_rank
  from public.forum_reactions
  where thread_id is not null
)
delete from public.forum_reactions reaction
using ranked_thread_reactions ranked
where reaction.id = ranked.id
  and ranked.row_rank > 1;

-- 2. Remove historical duplicates on reply targets.
with ranked_reply_reactions as (
  select
    id,
    row_number() over (
      partition by user_id, reply_id
      order by created_at desc, id desc
    ) as row_rank
  from public.forum_reactions
  where reply_id is not null
)
delete from public.forum_reactions reaction
using ranked_reply_reactions ranked
where reaction.id = ranked.id
  and ranked.row_rank > 1;

-- 3. Replace per-type uniqueness with per-target uniqueness.
drop index if exists public.forum_reactions_user_thread_type_idx;
drop index if exists public.forum_reactions_user_reply_type_idx;

create unique index if not exists forum_reactions_user_thread_idx
  on public.forum_reactions (user_id, thread_id)
  where thread_id is not null;

create unique index if not exists forum_reactions_user_reply_idx
  on public.forum_reactions (user_id, reply_id)
  where reply_id is not null;

-- 4. Atomic toggle/add/switch for authenticated users.
create or replace function public.toggle_forum_reaction(
  p_target_type text,
  p_target_id uuid,
  p_reaction_type text
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  requesting_user_id uuid := auth.uid();
  existing_row public.forum_reactions%rowtype;
begin
  if requesting_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if p_target_id is null then
    raise exception 'INVALID_TARGET_ID';
  end if;

  if p_target_type not in ('thread', 'reply') then
    raise exception 'INVALID_TARGET_TYPE';
  end if;

  if p_reaction_type not in ('helpful', 'insightful', 'well_researched') then
    raise exception 'INVALID_REACTION_TYPE';
  end if;

  perform pg_advisory_xact_lock(
    hashtext('divlab_forum_reaction'),
    hashtext(
      requesting_user_id::text
      || '|'
      || p_target_type
      || '|'
      || p_target_id::text
    )
  );

  if p_target_type = 'thread' then
    select *
    into existing_row
    from public.forum_reactions
    where user_id = requesting_user_id
      and target_type = 'thread'
      and thread_id = p_target_id
    for update;

    if not found then
      insert into public.forum_reactions (
        user_id,
        target_type,
        thread_id,
        reaction_type
      )
      values (
        requesting_user_id,
        'thread',
        p_target_id,
        p_reaction_type
      );

      return 'added';
    end if;

    if existing_row.reaction_type = p_reaction_type then
      delete from public.forum_reactions
      where id = existing_row.id
        and user_id = requesting_user_id;

      return 'removed';
    end if;

    delete from public.forum_reactions
    where id = existing_row.id
      and user_id = requesting_user_id;

    insert into public.forum_reactions (
      user_id,
      target_type,
      thread_id,
      reaction_type
    )
    values (
      requesting_user_id,
      'thread',
      p_target_id,
      p_reaction_type
    );

    return 'switched';
  end if;

  select *
  into existing_row
  from public.forum_reactions
  where user_id = requesting_user_id
    and target_type = 'reply'
    and reply_id = p_target_id
  for update;

  if not found then
    insert into public.forum_reactions (
      user_id,
      target_type,
      reply_id,
      reaction_type
    )
    values (
      requesting_user_id,
      'reply',
      p_target_id,
      p_reaction_type
    );

    return 'added';
  end if;

  if existing_row.reaction_type = p_reaction_type then
    delete from public.forum_reactions
    where id = existing_row.id
      and user_id = requesting_user_id;

    return 'removed';
  end if;

  delete from public.forum_reactions
  where id = existing_row.id
    and user_id = requesting_user_id;

  insert into public.forum_reactions (
    user_id,
    target_type,
    reply_id,
    reaction_type
  )
  values (
    requesting_user_id,
    'reply',
    p_target_id,
    p_reaction_type
  );

  return 'switched';
end;
$$;

revoke all on function public.toggle_forum_reaction(text, uuid, text) from public;
grant execute on function public.toggle_forum_reaction(text, uuid, text) to authenticated;
