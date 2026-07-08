create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  author_id uuid not null references public.profiles(id) on delete cascade,
  category_slug text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_threads_title_length check (
    char_length(btrim(title)) between 1 and 120
  ),
  constraint forum_threads_body_length check (
    char_length(btrim(body)) between 1 and 5000
  ),
  constraint forum_threads_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  )
);

create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_replies_body_length check (
    char_length(btrim(body)) between 1 and 5000
  )
);

create index if not exists forum_threads_category_slug_created_at_idx
  on public.forum_threads(category_slug, created_at desc);

create index if not exists forum_threads_created_at_idx
  on public.forum_threads(created_at desc);

create index if not exists forum_replies_thread_id_created_at_idx
  on public.forum_replies(thread_id, created_at asc);

drop trigger if exists set_forum_threads_updated_at on public.forum_threads;
create trigger set_forum_threads_updated_at
  before update on public.forum_threads
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_forum_replies_updated_at on public.forum_replies;
create trigger set_forum_replies_updated_at
  before update on public.forum_replies
  for each row
  execute function public.set_updated_at();

alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;

drop policy if exists "Forum threads are publicly readable" on public.forum_threads;
create policy "Forum threads are publicly readable"
  on public.forum_threads
  for select
  using (true);

drop policy if exists "Authenticated users can create forum threads" on public.forum_threads;
create policy "Authenticated users can create forum threads"
  on public.forum_threads
  for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists "Forum replies are publicly readable" on public.forum_replies;
create policy "Forum replies are publicly readable"
  on public.forum_replies
  for select
  using (true);

drop policy if exists "Authenticated users can create forum replies" on public.forum_replies;
create policy "Authenticated users can create forum replies"
  on public.forum_replies
  for insert
  to authenticated
  with check (author_id = auth.uid());

grant select on public.forum_threads to anon, authenticated;
grant insert on public.forum_threads to authenticated;

grant select on public.forum_replies to anon, authenticated;
grant insert on public.forum_replies to authenticated;
