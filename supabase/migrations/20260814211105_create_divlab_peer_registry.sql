create table if not exists public.divlab_peer_targets (
  id uuid primary key default gen_random_uuid(),
  instrument_symbol text not null,
  exchange text not null,
  created_at timestamptz not null default now(),
  unique (instrument_symbol, exchange),
  check (nullif(trim(instrument_symbol), '') is not null),
  check (nullif(trim(exchange), '') is not null)
);

create table if not exists public.divlab_peer_sets (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references public.divlab_peer_targets(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  target_name text not null check (nullif(trim(target_name), '') is not null),
  data_as_of timestamptz not null,
  methodology_version text not null check (nullif(trim(methodology_version), '') is not null),
  created_at timestamptz not null default now(),
  unique (target_id, version_number)
);

create index if not exists divlab_peer_sets_target_created_idx
  on public.divlab_peer_sets (target_id, created_at desc);

create table if not exists public.divlab_peer_set_sources (
  id uuid primary key default gen_random_uuid(),
  peer_set_id uuid not null references public.divlab_peer_sets(id) on delete cascade,
  source_key text not null check (nullif(trim(source_key), '') is not null),
  publisher text not null check (nullif(trim(publisher), '') is not null),
  source_url text not null check (source_url ~ '^https://[^[:space:]]+$'),
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (peer_set_id, source_key),
  unique (peer_set_id, id)
);

create table if not exists public.divlab_peer_set_members (
  id uuid primary key default gen_random_uuid(),
  peer_set_id uuid not null references public.divlab_peer_sets(id) on delete cascade,
  instrument_symbol text not null check (nullif(trim(instrument_symbol), '') is not null),
  exchange text not null check (nullif(trim(exchange), '') is not null),
  instrument_name text not null check (nullif(trim(instrument_name), '') is not null),
  created_at timestamptz not null default now(),
  unique (peer_set_id, instrument_symbol, exchange),
  unique (peer_set_id, id)
);

create table if not exists public.divlab_peer_member_sources (
  peer_set_id uuid not null,
  peer_member_id uuid not null,
  peer_set_source_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (peer_set_id, peer_member_id, peer_set_source_id),
  foreign key (peer_set_id, peer_member_id)
    references public.divlab_peer_set_members(peer_set_id, id)
    on delete cascade,
  foreign key (peer_set_id, peer_set_source_id)
    references public.divlab_peer_set_sources(peer_set_id, id)
    on delete cascade
);

alter table public.divlab_peer_targets enable row level security;
alter table public.divlab_peer_sets enable row level security;
alter table public.divlab_peer_set_sources enable row level security;
alter table public.divlab_peer_set_members enable row level security;
alter table public.divlab_peer_member_sources enable row level security;

revoke all on public.divlab_peer_targets from public, anon, authenticated, service_role;
revoke all on public.divlab_peer_sets from public, anon, authenticated, service_role;
revoke all on public.divlab_peer_set_sources from public, anon, authenticated, service_role;
revoke all on public.divlab_peer_set_members from public, anon, authenticated, service_role;
revoke all on public.divlab_peer_member_sources from public, anon, authenticated, service_role;

grant select, insert on public.divlab_peer_targets to service_role;
grant select, insert on public.divlab_peer_sets to service_role;
grant select, insert on public.divlab_peer_set_sources to service_role;
grant select, insert on public.divlab_peer_set_members to service_role;
grant select, insert on public.divlab_peer_member_sources to service_role;

create or replace function public.persist_divlab_peer_set(
  p_target_symbol text,
  p_target_exchange text,
  p_target_name text,
  p_data_as_of timestamptz,
  p_methodology_version text,
  p_sources jsonb,
  p_members jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_target_symbol text := upper(trim(coalesce(p_target_symbol, '')));
  v_target_exchange text := upper(trim(coalesce(p_target_exchange, '')));
  v_target_id uuid;
  v_peer_set_id uuid;
  v_version_number integer;
  v_source jsonb;
  v_member jsonb;
  v_source_ref jsonb;
  v_source_id uuid;
  v_member_id uuid;
  v_source_count integer;
  v_member_count integer;
  v_distinct_source_count integer;
  v_distinct_member_count integer;
begin
  if nullif(v_target_symbol, '') is null
     or nullif(v_target_exchange, '') is null
     or nullif(trim(coalesce(p_target_name, '')), '') is null
     or p_data_as_of is null
     or p_data_as_of > now() + interval '1 day'
     or nullif(trim(coalesce(p_methodology_version, '')), '') is null
     or p_sources is null
     or jsonb_typeof(p_sources) <> 'array'
     or p_members is null
     or jsonb_typeof(p_members) <> 'array'
  then
    raise exception 'invalid_divlab_peer_set_input';
  end if;

  v_source_count := jsonb_array_length(p_sources);
  v_member_count := jsonb_array_length(p_members);
  if v_source_count < 1 then
    raise exception 'divlab_peer_set_requires_source';
  end if;
  if v_member_count < 3 then
    raise exception 'divlab_peer_set_requires_three_members';
  end if;

  select count(distinct trim(value ->> 'id'))
  into v_distinct_source_count
  from jsonb_array_elements(p_sources);
  if v_distinct_source_count <> v_source_count then
    raise exception 'divlab_peer_set_duplicate_source';
  end if;

  select count(distinct (
    upper(trim(value ->> 'exchange')) || ':' || upper(trim(value ->> 'symbol'))
  ))
  into v_distinct_member_count
  from jsonb_array_elements(p_members);
  if v_distinct_member_count <> v_member_count then
    raise exception 'divlab_peer_set_duplicate_member';
  end if;

  for v_source in
    select value from jsonb_array_elements(p_sources)
  loop
    if jsonb_typeof(v_source) <> 'object'
       or nullif(trim(coalesce(v_source ->> 'id', '')), '') is null
       or nullif(trim(coalesce(v_source ->> 'publisher', '')), '') is null
       or nullif(trim(coalesce(v_source ->> 'url', '')), '') is null
       or (v_source ->> 'url') !~ '^https://[^[:space:]]+$'
       or nullif(trim(coalesce(v_source ->> 'verifiedAt', '')), '') is null
       or (v_source ->> 'verifiedAt')::timestamptz > now() + interval '1 day'
    then
      raise exception 'invalid_divlab_peer_source';
    end if;
  end loop;

  for v_member in
    select value from jsonb_array_elements(p_members)
  loop
    if jsonb_typeof(v_member) <> 'object'
       or nullif(trim(coalesce(v_member ->> 'symbol', '')), '') is null
       or nullif(trim(coalesce(v_member ->> 'exchange', '')), '') is null
       or nullif(trim(coalesce(v_member ->> 'name', '')), '') is null
       or jsonb_typeof(v_member -> 'relationshipSourceIds') <> 'array'
       or jsonb_array_length(v_member -> 'relationshipSourceIds') < 1
    then
      raise exception 'invalid_divlab_peer_member';
    end if;

    if upper(trim(v_member ->> 'symbol')) = v_target_symbol
       and upper(trim(v_member ->> 'exchange')) = v_target_exchange
    then
      raise exception 'divlab_peer_set_contains_target';
    end if;

    if (
      select count(distinct trim(value #>> '{}'))
      from jsonb_array_elements(v_member -> 'relationshipSourceIds')
    ) <> jsonb_array_length(v_member -> 'relationshipSourceIds')
    then
      raise exception 'divlab_peer_member_duplicate_source_reference';
    end if;

    for v_source_ref in
      select value from jsonb_array_elements(v_member -> 'relationshipSourceIds')
    loop
      if jsonb_typeof(v_source_ref) <> 'string'
         or nullif(trim(v_source_ref #>> '{}'), '') is null
         or not exists (
           select 1
           from jsonb_array_elements(p_sources) as source_item(value)
           where trim(source_item.value ->> 'id') = trim(v_source_ref #>> '{}')
         )
      then
        raise exception 'divlab_peer_member_unknown_source_reference';
      end if;
    end loop;
  end loop;

  insert into public.divlab_peer_targets (
    instrument_symbol,
    exchange
  ) values (
    v_target_symbol,
    v_target_exchange
  )
  on conflict (instrument_symbol, exchange) do nothing;

  select id
  into v_target_id
  from public.divlab_peer_targets
  where instrument_symbol = v_target_symbol
    and exchange = v_target_exchange
  for update;

  if v_target_id is null then
    raise exception 'divlab_peer_target_resolution_failed';
  end if;

  select coalesce(max(version_number), 0) + 1
  into v_version_number
  from public.divlab_peer_sets
  where target_id = v_target_id;

  insert into public.divlab_peer_sets (
    target_id,
    version_number,
    target_name,
    data_as_of,
    methodology_version
  ) values (
    v_target_id,
    v_version_number,
    trim(p_target_name),
    p_data_as_of,
    trim(p_methodology_version)
  )
  returning id into v_peer_set_id;

  for v_source in
    select value from jsonb_array_elements(p_sources)
  loop
    insert into public.divlab_peer_set_sources (
      peer_set_id,
      source_key,
      publisher,
      source_url,
      verified_at
    ) values (
      v_peer_set_id,
      trim(v_source ->> 'id'),
      trim(v_source ->> 'publisher'),
      trim(v_source ->> 'url'),
      (v_source ->> 'verifiedAt')::timestamptz
    );
  end loop;

  for v_member in
    select value from jsonb_array_elements(p_members)
  loop
    insert into public.divlab_peer_set_members (
      peer_set_id,
      instrument_symbol,
      exchange,
      instrument_name
    ) values (
      v_peer_set_id,
      upper(trim(v_member ->> 'symbol')),
      upper(trim(v_member ->> 'exchange')),
      trim(v_member ->> 'name')
    )
    returning id into v_member_id;

    for v_source_ref in
      select value from jsonb_array_elements(v_member -> 'relationshipSourceIds')
    loop
      select id
      into v_source_id
      from public.divlab_peer_set_sources
      where peer_set_id = v_peer_set_id
        and source_key = trim(v_source_ref #>> '{}');

      if v_source_id is null then
        raise exception 'divlab_peer_member_source_resolution_failed';
      end if;

      insert into public.divlab_peer_member_sources (
        peer_set_id,
        peer_member_id,
        peer_set_source_id
      ) values (
        v_peer_set_id,
        v_member_id,
        v_source_id
      );
    end loop;
  end loop;

  return jsonb_build_object(
    'target_id', v_target_id,
    'peer_set_id', v_peer_set_id,
    'version_number', v_version_number,
    'peer_count', v_member_count,
    'source_count', v_source_count,
    'methodology_version', trim(p_methodology_version)
  );
end;
$$;

revoke all on function public.persist_divlab_peer_set(
  text, text, text, timestamptz, text, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.persist_divlab_peer_set(
  text, text, text, timestamptz, text, jsonb, jsonb
) to service_role;
