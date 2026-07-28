-- User contacts (Kontakter) foundation.
-- Contacts are independent from private chat relationships.

create table if not exists public.user_connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  user_low_id uuid not null,
  user_high_id uuid not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint user_connections_status_check check (
    status in ('pending', 'accepted', 'rejected', 'cancelled', 'removed')
  ),
  constraint user_connections_no_self check (requester_id <> addressee_id),
  constraint user_connections_normalized_pair check (
    user_low_id = least(requester_id, addressee_id)
    and user_high_id = greatest(requester_id, addressee_id)
  ),
  constraint user_connections_unique_pair unique (user_low_id, user_high_id)
);

create index if not exists user_connections_requester_status_idx
  on public.user_connections (requester_id, status);

create index if not exists user_connections_addressee_status_idx
  on public.user_connections (addressee_id, status);

create index if not exists user_connections_accepted_low_idx
  on public.user_connections (user_low_id)
  where status = 'accepted';

create index if not exists user_connections_accepted_high_idx
  on public.user_connections (user_high_id)
  where status = 'accepted';

drop trigger if exists set_user_connections_updated_at on public.user_connections;
create trigger set_user_connections_updated_at
  before update on public.user_connections
  for each row
  execute function public.set_updated_at();

alter table public.user_connections enable row level security;

-- Participants may read their own relationship rows only.
drop policy if exists "Users can read their own connections" on public.user_connections;
create policy "Users can read their own connections"
  on public.user_connections
  for select
  to authenticated
  using (
    requester_id = auth.uid()
    or addressee_id = auth.uid()
  );

-- No direct client inserts/updates/deletes. Mutations go through RPCs.
revoke all on table public.user_connections from anon, authenticated;
grant select on table public.user_connections to authenticated;
revoke insert, update, delete on table public.user_connections from anon, authenticated;

-- Public accepted-contact count without exposing relationship rows.
create or replace function public.get_accepted_contact_count(p_user_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.user_connections
  where status = 'accepted'
    and (user_low_id = p_user_id or user_high_id = p_user_id);
$$;

revoke all on function public.get_accepted_contact_count(uuid) from public;
grant execute on function public.get_accepted_contact_count(uuid) to anon, authenticated;

-- Batch counts for profile lists / search without N+1 round trips.
create or replace function public.get_accepted_contact_counts(p_user_ids uuid[])
returns table (
  user_id uuid,
  contact_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    candidate.user_id,
    coalesce(counts.contact_count, 0)::bigint as contact_count
  from unnest(coalesce(p_user_ids, array[]::uuid[])) as candidate(user_id)
  left join lateral (
    select count(*)::bigint as contact_count
    from public.user_connections uc
    where uc.status = 'accepted'
      and (uc.user_low_id = candidate.user_id or uc.user_high_id = candidate.user_id)
  ) counts on true;
$$;

revoke all on function public.get_accepted_contact_counts(uuid[]) from public;
grant execute on function public.get_accepted_contact_counts(uuid[]) to anon, authenticated;

create or replace function public.are_accepted_contacts(
  p_user_a uuid,
  p_user_b uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_connections
    where status = 'accepted'
      and user_low_id = least(p_user_a, p_user_b)
      and user_high_id = greatest(p_user_a, p_user_b)
  );
$$;

revoke all on function public.are_accepted_contacts(uuid, uuid) from public;
grant execute on function public.are_accepted_contacts(uuid, uuid) to authenticated;

create or replace function public.send_contact_request(p_target_user_id uuid)
returns public.user_connections
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  pair_low uuid;
  pair_high uuid;
  existing public.user_connections;
  result_row public.user_connections;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_target_user_id is null then
    raise exception 'Target user is required.';
  end if;

  if p_target_user_id = acting_user_id then
    raise exception 'You cannot send a contact request to yourself.';
  end if;

  if not exists (select 1 from public.profiles where id = p_target_user_id) then
    raise exception 'Target user was not found.';
  end if;

  pair_low := least(acting_user_id, p_target_user_id);
  pair_high := greatest(acting_user_id, p_target_user_id);

  select *
  into existing
  from public.user_connections
  where user_low_id = pair_low
    and user_high_id = pair_high
  for update;

  if found then
    if existing.status = 'pending' then
      return existing;
    end if;

    if existing.status = 'accepted' then
      return existing;
    end if;

    -- Reconnect after rejected / cancelled / removed.
    update public.user_connections
    set
      requester_id = acting_user_id,
      addressee_id = p_target_user_id,
      status = 'pending',
      responded_at = null,
      updated_at = now()
    where id = existing.id
    returning * into result_row;

    return result_row;
  end if;

  begin
    insert into public.user_connections (
      requester_id,
      addressee_id,
      user_low_id,
      user_high_id,
      status
    )
    values (
      acting_user_id,
      p_target_user_id,
      pair_low,
      pair_high,
      'pending'
    )
    returning * into result_row;
  exception
    when unique_violation then
      select *
      into result_row
      from public.user_connections
      where user_low_id = pair_low
        and user_high_id = pair_high;

      if not found then
        raise;
      end if;
  end;

  return result_row;
end;
$$;

revoke all on function public.send_contact_request(uuid) from public;
grant execute on function public.send_contact_request(uuid) to authenticated;

create or replace function public.accept_contact_request(p_connection_id uuid)
returns public.user_connections
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  existing public.user_connections;
  result_row public.user_connections;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select *
  into existing
  from public.user_connections
  where id = p_connection_id
  for update;

  if not found then
    raise exception 'Contact request was not found.';
  end if;

  if existing.addressee_id <> acting_user_id then
    raise exception 'Only the recipient can accept a contact request.';
  end if;

  if existing.status = 'accepted' then
    return existing;
  end if;

  if existing.status <> 'pending' then
    raise exception 'Only pending contact requests can be accepted.';
  end if;

  update public.user_connections
  set
    status = 'accepted',
    responded_at = now(),
    updated_at = now()
  where id = existing.id
  returning * into result_row;

  -- Conversation activation on contact acceptance is applied in the
  -- private-conversation enhancement migration once pair columns exist.

  return result_row;
end;
$$;

revoke all on function public.accept_contact_request(uuid) from public;
grant execute on function public.accept_contact_request(uuid) to authenticated;

create or replace function public.decline_contact_request(p_connection_id uuid)
returns public.user_connections
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  existing public.user_connections;
  result_row public.user_connections;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select *
  into existing
  from public.user_connections
  where id = p_connection_id
  for update;

  if not found then
    raise exception 'Contact request was not found.';
  end if;

  if existing.addressee_id <> acting_user_id then
    raise exception 'Only the recipient can decline a contact request.';
  end if;

  if existing.status = 'rejected' then
    return existing;
  end if;

  if existing.status <> 'pending' then
    raise exception 'Only pending contact requests can be declined.';
  end if;

  update public.user_connections
  set
    status = 'rejected',
    responded_at = now(),
    updated_at = now()
  where id = existing.id
  returning * into result_row;

  return result_row;
end;
$$;

revoke all on function public.decline_contact_request(uuid) from public;
grant execute on function public.decline_contact_request(uuid) to authenticated;

create or replace function public.cancel_contact_request(p_connection_id uuid)
returns public.user_connections
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  existing public.user_connections;
  result_row public.user_connections;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select *
  into existing
  from public.user_connections
  where id = p_connection_id
  for update;

  if not found then
    raise exception 'Contact request was not found.';
  end if;

  if existing.requester_id <> acting_user_id then
    raise exception 'Only the sender can cancel a contact request.';
  end if;

  if existing.status = 'cancelled' then
    return existing;
  end if;

  if existing.status <> 'pending' then
    raise exception 'Only pending contact requests can be cancelled.';
  end if;

  update public.user_connections
  set
    status = 'cancelled',
    responded_at = now(),
    updated_at = now()
  where id = existing.id
  returning * into result_row;

  return result_row;
end;
$$;

revoke all on function public.cancel_contact_request(uuid) from public;
grant execute on function public.cancel_contact_request(uuid) to authenticated;

create or replace function public.remove_contact(p_connection_id uuid)
returns public.user_connections
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  existing public.user_connections;
  result_row public.user_connections;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  select *
  into existing
  from public.user_connections
  where id = p_connection_id
  for update;

  if not found then
    raise exception 'Contact relationship was not found.';
  end if;

  if existing.requester_id <> acting_user_id
     and existing.addressee_id <> acting_user_id then
    raise exception 'Only participants can remove a contact.';
  end if;

  if existing.status = 'removed' then
    return existing;
  end if;

  if existing.status <> 'accepted' then
    raise exception 'Only accepted contacts can be removed.';
  end if;

  update public.user_connections
  set
    status = 'removed',
    responded_at = now(),
    updated_at = now()
  where id = existing.id
  returning * into result_row;

  -- Contact removal must not alter chat status or history.
  return result_row;
end;
$$;

revoke all on function public.remove_contact(uuid) from public;
grant execute on function public.remove_contact(uuid) to authenticated;
