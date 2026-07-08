create table if not exists public.forum_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('thread', 'reply')),
  thread_id uuid references public.forum_threads(id) on delete cascade,
  reply_id uuid references public.forum_replies(id) on delete cascade,
  reaction_type text not null check (
    reaction_type in ('helpful', 'insightful', 'well_researched')
  ),
  created_at timestamptz not null default now(),
  constraint forum_reactions_single_target check (
    (
      target_type = 'thread'
      and thread_id is not null
      and reply_id is null
    )
    or (
      target_type = 'reply'
      and reply_id is not null
      and thread_id is null
    )
  )
);

create unique index if not exists forum_reactions_user_thread_type_idx
  on public.forum_reactions (user_id, thread_id, reaction_type)
  where thread_id is not null;

create unique index if not exists forum_reactions_user_reply_type_idx
  on public.forum_reactions (user_id, reply_id, reaction_type)
  where reply_id is not null;

create index if not exists forum_reactions_thread_id_idx
  on public.forum_reactions (thread_id)
  where thread_id is not null;

create index if not exists forum_reactions_reply_id_idx
  on public.forum_reactions (reply_id)
  where reply_id is not null;

alter table public.forum_reactions enable row level security;

drop policy if exists "Forum reactions are publicly readable" on public.forum_reactions;
create policy "Forum reactions are publicly readable"
  on public.forum_reactions
  for select
  using (true);

drop policy if exists "Users can add their own forum reactions" on public.forum_reactions;
create policy "Users can add their own forum reactions"
  on public.forum_reactions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can remove their own forum reactions" on public.forum_reactions;
create policy "Users can remove their own forum reactions"
  on public.forum_reactions
  for delete
  to authenticated
  using (user_id = auth.uid());

grant select on public.forum_reactions to anon, authenticated;
grant insert, delete on public.forum_reactions to authenticated;
