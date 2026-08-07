-- Forum post editing with immutable, append-only revision history.
-- Current rows keep content_version + nullable edited_at.
-- Superseded versions are archived atomically by SECURITY DEFINER triggers
-- before content replacement so no application path can bypass the audit trail.

-- ---------------------------------------------------------------------------
-- Current-row version metadata
-- ---------------------------------------------------------------------------

alter table public.forum_threads
  add column if not exists content_version integer not null default 1,
  add column if not exists edited_at timestamptz;

alter table public.forum_replies
  add column if not exists content_version integer not null default 1,
  add column if not exists edited_at timestamptz;

alter table public.forum_threads
  drop constraint if exists forum_threads_content_version_positive;

alter table public.forum_threads
  add constraint forum_threads_content_version_positive
  check (content_version >= 1);

alter table public.forum_replies
  drop constraint if exists forum_replies_content_version_positive;

alter table public.forum_replies
  add constraint forum_replies_content_version_positive
  check (content_version >= 1);

comment on column public.forum_threads.content_version is
  'Monotonic content version. Starts at 1 for existing and new threads.';
comment on column public.forum_threads.edited_at is
  'Timestamp of the latest real content edit. Null until first edit.';
comment on column public.forum_replies.content_version is
  'Monotonic content version. Starts at 1 for existing and new replies.';
comment on column public.forum_replies.edited_at is
  'Timestamp of the latest real content edit. Null until first edit.';

-- ---------------------------------------------------------------------------
-- Append-only revision tables
-- ---------------------------------------------------------------------------

create table if not exists public.forum_thread_revisions (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  version integer not null,
  title text not null,
  body text not null,
  archived_at timestamptz not null default now(),
  constraint forum_thread_revisions_version_positive check (version >= 1),
  constraint forum_thread_revisions_title_length check (
    char_length(btrim(title)) between 1 and 120
  ),
  constraint forum_thread_revisions_body_length check (
    char_length(btrim(body)) between 1 and 5000
  ),
  constraint forum_thread_revisions_thread_version_unique unique (thread_id, version)
);

create table if not exists public.forum_reply_revisions (
  id uuid primary key default gen_random_uuid(),
  reply_id uuid not null references public.forum_replies(id) on delete cascade,
  version integer not null,
  body text not null,
  archived_at timestamptz not null default now(),
  constraint forum_reply_revisions_version_positive check (version >= 1),
  constraint forum_reply_revisions_body_length check (
    char_length(btrim(body)) between 1 and 5000
  ),
  constraint forum_reply_revisions_reply_version_unique unique (reply_id, version)
);

create index if not exists forum_thread_revisions_thread_id_version_idx
  on public.forum_thread_revisions (thread_id, version desc);

create index if not exists forum_reply_revisions_reply_id_version_idx
  on public.forum_reply_revisions (reply_id, version desc);

comment on table public.forum_thread_revisions is
  'Immutable archived versions of forum thread title/body. Append-only audit data.';
comment on table public.forum_reply_revisions is
  'Immutable archived versions of forum reply body. Append-only audit data.';

-- ---------------------------------------------------------------------------
-- Archive triggers (SECURITY DEFINER, locked down EXECUTE)
-- ---------------------------------------------------------------------------

create or replace function public.archive_forum_thread_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Keep identity and routing immutable through the edit path.
  new.id := old.id;
  new.author_id := old.author_id;
  new.slug := old.slug;
  new.category_slug := old.category_slug;
  new.created_at := old.created_at;

  if btrim(new.title) is not distinct from btrim(old.title)
     and btrim(new.body) is not distinct from btrim(old.body) then
    new.title := old.title;
    new.body := old.body;
    new.content_version := old.content_version;
    new.edited_at := old.edited_at;
    return new;
  end if;

  insert into public.forum_thread_revisions (
    thread_id,
    version,
    title,
    body,
    archived_at
  ) values (
    old.id,
    old.content_version,
    old.title,
    old.body,
    -- Timestamp for this historical version: when that content became current.
    coalesce(old.edited_at, old.created_at)
  );

  new.content_version := old.content_version + 1;
  new.edited_at := now();
  return new;
end;
$$;

create or replace function public.archive_forum_reply_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Keep identity and thread ownership immutable through the edit path.
  new.id := old.id;
  new.thread_id := old.thread_id;
  new.author_id := old.author_id;
  new.created_at := old.created_at;

  if btrim(new.body) is not distinct from btrim(old.body) then
    new.body := old.body;
    new.content_version := old.content_version;
    new.edited_at := old.edited_at;
    return new;
  end if;

  insert into public.forum_reply_revisions (
    reply_id,
    version,
    body,
    archived_at
  ) values (
    old.id,
    old.content_version,
    old.body,
    -- Timestamp for this historical version: when that content became current.
    coalesce(old.edited_at, old.created_at)
  );

  new.content_version := old.content_version + 1;
  new.edited_at := now();
  return new;
end;
$$;

drop trigger if exists archive_forum_thread_revision on public.forum_threads;
create trigger archive_forum_thread_revision
  before update of title, body on public.forum_threads
  for each row
  execute function public.archive_forum_thread_revision();

drop trigger if exists archive_forum_reply_revision on public.forum_replies;
create trigger archive_forum_reply_revision
  before update of body on public.forum_replies
  for each row
  execute function public.archive_forum_reply_revision();

revoke all on function public.archive_forum_thread_revision() from public;
revoke all on function public.archive_forum_thread_revision() from anon, authenticated;
revoke all on function public.archive_forum_reply_revision() from public;
revoke all on function public.archive_forum_reply_revision() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS: public read for revisions; no user write path
-- ---------------------------------------------------------------------------

alter table public.forum_thread_revisions enable row level security;
alter table public.forum_reply_revisions enable row level security;

drop policy if exists "Forum thread revisions are publicly readable"
  on public.forum_thread_revisions;
create policy "Forum thread revisions are publicly readable"
  on public.forum_thread_revisions
  for select
  using (true);

drop policy if exists "Forum reply revisions are publicly readable"
  on public.forum_reply_revisions;
create policy "Forum reply revisions are publicly readable"
  on public.forum_reply_revisions
  for select
  using (true);

revoke all on public.forum_thread_revisions from public;
revoke all on public.forum_thread_revisions from anon, authenticated;
revoke all on public.forum_reply_revisions from public;
revoke all on public.forum_reply_revisions from anon, authenticated;

grant select on public.forum_thread_revisions to anon, authenticated;
grant select on public.forum_reply_revisions to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Author-only UPDATE on current content (column-limited)
-- ---------------------------------------------------------------------------

drop policy if exists "Authors can update their own forum threads"
  on public.forum_threads;
create policy "Authors can update their own forum threads"
  on public.forum_threads
  for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "Authors can update their own forum replies"
  on public.forum_replies;
create policy "Authors can update their own forum replies"
  on public.forum_replies
  for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- Hosted Supabase defaults can leave broader non-DML privileges on public
-- tables than the forum client needs. Remove them as part of the edit rollout.
-- Public/anon only need SELECT; authenticated additionally needs INSERT and the
-- column-limited UPDATE grants below.
revoke delete, truncate, references, trigger, update
  on public.forum_threads from public, anon, authenticated;
revoke delete, truncate, references, trigger, update
  on public.forum_replies from public, anon, authenticated;

grant update (title, body) on public.forum_threads to authenticated;
grant update (body) on public.forum_replies to authenticated;
