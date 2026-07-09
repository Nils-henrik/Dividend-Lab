create table if not exists public.learning_article_comments (
  id uuid primary key default gen_random_uuid(),
  article_slug text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_hidden boolean not null default false,
  constraint learning_article_comments_body_length check (
    char_length(btrim(body)) between 1 and 2000
  ),
  constraint learning_article_comments_slug_format check (
    article_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  )
);

create index if not exists learning_article_comments_slug_created_at_idx
  on public.learning_article_comments(article_slug, created_at asc);

drop trigger if exists set_learning_article_comments_updated_at
  on public.learning_article_comments;
create trigger set_learning_article_comments_updated_at
  before update on public.learning_article_comments
  for each row
  execute function public.set_updated_at();

alter table public.learning_article_comments enable row level security;

drop policy if exists "Visible learning comments are publicly readable"
  on public.learning_article_comments;
create policy "Visible learning comments are publicly readable"
  on public.learning_article_comments
  for select
  using (is_hidden = false);

drop policy if exists "Authenticated users can create learning comments"
  on public.learning_article_comments;
create policy "Authenticated users can create learning comments"
  on public.learning_article_comments
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update their own learning comments"
  on public.learning_article_comments;
create policy "Users can update their own learning comments"
  on public.learning_article_comments
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete their own learning comments"
  on public.learning_article_comments;
create policy "Users can delete their own learning comments"
  on public.learning_article_comments
  for delete
  to authenticated
  using (user_id = auth.uid());

grant select on public.learning_article_comments to anon, authenticated;
grant insert, update, delete on public.learning_article_comments to authenticated;
