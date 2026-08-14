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
     or length(v_target_symbol) > 64
     or nullif(v_target_exchange, '') is null
     or length(v_target_exchange) > 16
     or nullif(trim(coalesce(p_target_name, '')), '') is null
     or length(trim(p_target_name)) > 200
     or p_data_as_of is null
     or p_data_as_of > now() + interval '1 day'
     or trim(coalesce(p_methodology_version, '')) <> 'peer-comparison-v1'
     or p_sources is null
     or jsonb_typeof(p_sources) is distinct from 'array'
     or p_members is null
     or jsonb_typeof(p_members) is distinct from 'array'
  then
    raise exception 'invalid_divlab_peer_set_input';
  end if;

  v_source_count := jsonb_array_length(p_sources);
  v_member_count := jsonb_array_length(p_members);
  if v_source_count < 1 or v_source_count > 25 then
    raise exception 'divlab_peer_set_invalid_source_count';
  end if;
  if v_member_count < 3 or v_member_count > 25 then
    raise exception 'divlab_peer_set_invalid_member_count';
  end if;

  select count(distinct trim(value ->> 'id'))
  into v_distinct_source_count
  from jsonb_array_elements(p_sources);
  if v_distinct_source_count <> v_source_count then
    raise exception 'divlab_peer_set_duplicate_or_invalid_source';
  end if;

  select count(distinct (
    upper(trim(value ->> 'exchange')) || ':' || upper(trim(value ->> 'symbol'))
  ))
  into v_distinct_member_count
  from jsonb_array_elements(p_members);
  if v_distinct_member_count <> v_member_count then
    raise exception 'divlab_peer_set_duplicate_or_invalid_member';
  end if;

  for v_source in
    select value from jsonb_array_elements(p_sources)
  loop
    if jsonb_typeof(v_source) is distinct from 'object'
       or nullif(trim(coalesce(v_source ->> 'id', '')), '') is null
       or length(trim(v_source ->> 'id')) > 240
       or nullif(trim(coalesce(v_source ->> 'publisher', '')), '') is null
       or length(trim(v_source ->> 'publisher')) > 200
       or nullif(trim(coalesce(v_source ->> 'url', '')), '') is null
       or length(trim(v_source ->> 'url')) > 2048
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
    if jsonb_typeof(v_member) is distinct from 'object'
       or nullif(trim(coalesce(v_member ->> 'symbol', '')), '') is null
       or length(trim(v_member ->> 'symbol')) > 64
       or nullif(trim(coalesce(v_member ->> 'exchange', '')), '') is null
       or length(trim(v_member ->> 'exchange')) > 16
       or nullif(trim(coalesce(v_member ->> 'name', '')), '') is null
       or length(trim(v_member ->> 'name')) > 200
       or jsonb_typeof(v_member -> 'relationshipSourceIds') is distinct from 'array'
       or coalesce(jsonb_array_length(v_member -> 'relationshipSourceIds'), 0) < 1
       or jsonb_array_length(v_member -> 'relationshipSourceIds') > 10
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
      if jsonb_typeof(v_source_ref) is distinct from 'string'
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

  -- Serialize version allocation for one target without granting UPDATE on
  -- immutable peer-registry rows. SELECT ... FOR UPDATE would require UPDATE
  -- table privileges even though no row is changed.
  perform pg_advisory_xact_lock(
    hashtextextended('divlab-peer-target:' || v_target_exchange || ':' || v_target_symbol, 0)
  );

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
    and exchange = v_target_exchange;

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
    'peer-comparison-v1'
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
    'methodology_version', 'peer-comparison-v1'
  );
end;
$$;

revoke all on function public.persist_divlab_peer_set(
  text, text, text, timestamptz, text, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.persist_divlab_peer_set(
  text, text, text, timestamptz, text, jsonb, jsonb
) to service_role;
