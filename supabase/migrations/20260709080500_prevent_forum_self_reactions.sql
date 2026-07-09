drop policy if exists "Users can add their own forum reactions" on public.forum_reactions;

create policy "Users can add their own forum reactions"
  on public.forum_reactions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      (
        target_type = 'thread'
        and thread_id is not null
        and not exists (
          select 1
          from public.forum_threads
          where id = thread_id
            and author_id = auth.uid()
        )
      )
      or (
        target_type = 'reply'
        and reply_id is not null
        and not exists (
          select 1
          from public.forum_replies
          where id = reply_id
            and author_id = auth.uid()
        )
      )
    )
  );
