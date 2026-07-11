-- Hotfix: remove FOR UPDATE from reaction RPC (authenticated lacks UPDATE grant)
-- and add explicit self-reaction validation before inserts/switches.

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
    if not exists (
      select 1
      from public.forum_threads
      where id = p_target_id
    ) then
      raise exception 'TARGET_NOT_FOUND';
    end if;

    select *
    into existing_row
    from public.forum_reactions
    where user_id = requesting_user_id
      and target_type = 'thread'
      and thread_id = p_target_id;

    if not found then
      if exists (
        select 1
        from public.forum_threads
        where id = p_target_id
          and author_id = requesting_user_id
      ) then
        raise exception 'SELF_REACTION_NOT_ALLOWED';
      end if;

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

    if exists (
      select 1
      from public.forum_threads
      where id = p_target_id
        and author_id = requesting_user_id
    ) then
      raise exception 'SELF_REACTION_NOT_ALLOWED';
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

  if not exists (
    select 1
    from public.forum_replies
    where id = p_target_id
  ) then
    raise exception 'TARGET_NOT_FOUND';
  end if;

  select *
  into existing_row
  from public.forum_reactions
  where user_id = requesting_user_id
    and target_type = 'reply'
    and reply_id = p_target_id;

  if not found then
    if exists (
      select 1
      from public.forum_replies
      where id = p_target_id
        and author_id = requesting_user_id
    ) then
      raise exception 'SELF_REACTION_NOT_ALLOWED';
    end if;

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

  if exists (
    select 1
    from public.forum_replies
    where id = p_target_id
      and author_id = requesting_user_id
  ) then
    raise exception 'SELF_REACTION_NOT_ALLOWED';
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
