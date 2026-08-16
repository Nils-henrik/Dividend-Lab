-- Contact-scoped presence + narrowly scoped realtime for private chat.
--
-- Freshness contract (also documented in lib/messages/presence.ts):
--   Heartbeat cadence (client, visible tab only): 30 seconds
--   Server-side heartbeat write bound: 20 seconds
--   Online threshold: last_seen_at within 90 seconds
--   Recent-active window: last_seen_at within 24 hours
--   Hidden/background tabs do not heartbeat; staleness is timeout-based
--
-- Privacy:
--   last_seen_at is NOT stored on public.profiles
--   Only the owner and accepted contacts may read a presence row
--   When sharing is disabled, accepted contacts can still read the row so
--   realtime can invalidate stale UI, but last_seen_at is forced to NULL
--   Anonymous and unrelated authenticated users cannot select or subscribe
--
-- Realtime publication is limited to messages + user_presence.
-- Existing conversation/message RLS is not altered.

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz default now(),
  share_active_status boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists user_presence_shared_last_seen_idx
  on public.user_presence (last_seen_at desc)
  where share_active_status = true;

drop trigger if exists set_user_presence_updated_at on public.user_presence;
create trigger set_user_presence_updated_at
  before update on public.user_presence
  for each row
  execute function public.set_updated_at();

alter table public.user_presence enable row level security;
alter table public.user_presence force row level security;

drop policy if exists "Users can read own or accepted-contact presence" on public.user_presence;
create policy "Users can read own or accepted-contact presence"
  on public.user_presence
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.user_connections connection
      where connection.status = 'accepted'
        and connection.user_low_id = least((select auth.uid()), user_id)
        and connection.user_high_id = greatest((select auth.uid()), user_id)
    )
  );

-- No client writes. Heartbeat and the privacy toggle go through RPCs.
revoke all on table public.user_presence from anon, authenticated;
grant select on table public.user_presence to authenticated;
revoke insert, update, delete on table public.user_presence from anon, authenticated;

create or replace function public.heartbeat_user_presence()
returns public.user_presence
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  result_row public.user_presence;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  insert into public.user_presence as presence (
    user_id,
    last_seen_at,
    share_active_status
  )
  values (
    acting_user_id,
    now(),
    true
  )
  on conflict (user_id) do update
    set last_seen_at = case
      when presence.share_active_status = false then null
      when presence.last_seen_at is null
        or presence.last_seen_at < now() - interval '20 seconds'
        then now()
      else presence.last_seen_at
    end
  returning * into result_row;

  return result_row;
end;
$$;

revoke all on function public.heartbeat_user_presence() from public;
revoke all on function public.heartbeat_user_presence() from anon;
grant execute on function public.heartbeat_user_presence() to authenticated;

create or replace function public.set_share_active_status(p_enabled boolean)
returns public.user_presence
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  desired_enabled boolean := coalesce(p_enabled, true);
  result_row public.user_presence;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  insert into public.user_presence as presence (
    user_id,
    last_seen_at,
    share_active_status
  )
  values (
    acting_user_id,
    case when desired_enabled then now() else null end,
    desired_enabled
  )
  on conflict (user_id) do update
    set
      share_active_status = desired_enabled,
      last_seen_at = case when desired_enabled then now() else null end
  returning * into result_row;

  return result_row;
end;
$$;

revoke all on function public.set_share_active_status(boolean) from public;
revoke all on function public.set_share_active_status(boolean) from anon;
grant execute on function public.set_share_active_status(boolean) to authenticated;

-- Narrow realtime publication. Do not publish profiles or the contact graph.
do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.messages;
    exception
      when duplicate_object then
        null;
    end;

    begin
      alter publication supabase_realtime add table public.user_presence;
    exception
      when duplicate_object then
        null;
    end;
  end if;
end;
$$;
