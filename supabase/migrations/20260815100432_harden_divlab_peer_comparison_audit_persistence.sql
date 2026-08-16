create or replace function public.persist_divlab_peer_comparison_audit(p_audit jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_audit_id uuid;
  v_existing_audit jsonb;
  v_target_version_id uuid;
  v_peer_set_id uuid;
  v_registry_version integer;
  v_registered_count integer;
  v_actual_registered_count integer;
  v_peer_count integer;
  v_peer jsonb;
  v_peer_version_id uuid;
  v_peer_member_id uuid;
  v_target_symbol text;
  v_target_exchange text;
  v_target_name text;
  v_target_engine_version text;
  v_target_data_as_of timestamptz;
  v_target_provenance_version text;
  v_registry_symbol text;
  v_registry_exchange text;
  v_registry_data_as_of timestamptz;
  v_peer_symbol text;
  v_peer_exchange text;
  v_peer_name text;
  v_peer_engine_version text;
  v_peer_data_as_of timestamptz;
  v_peer_provenance_version text;
  v_bound_count integer := 0;
  v_oldest_data_as_of timestamptz;
  v_uuid_pattern text := '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$';
begin
  if p_audit is null
     or jsonb_typeof(p_audit) <> 'object'
     or p_audit ->> 'version' <> 'peer-comparison-audit-v1'
     or jsonb_typeof(p_audit -> 'registry') <> 'object'
     or jsonb_typeof(p_audit -> 'targetResearch') <> 'object'
     or jsonb_typeof(p_audit -> 'peerResearch') <> 'array'
     or jsonb_typeof(p_audit -> 'comparison') <> 'object'
  then
    raise exception 'invalid_divlab_peer_comparison_audit';
  end if;

  if coalesce(p_audit #>> '{targetResearch,analysisVersionId}', '') !~* v_uuid_pattern
     or coalesce(p_audit #>> '{registry,peerSetId}', '') !~* v_uuid_pattern
  then
    raise exception 'divlab_peer_comparison_audit_invalid_reference';
  end if;

  v_target_version_id := (p_audit #>> '{targetResearch,analysisVersionId}')::uuid;
  v_peer_set_id := (p_audit #>> '{registry,peerSetId}')::uuid;
  v_registry_version := coalesce((p_audit #>> '{registry,versionNumber}')::integer, 0);
  v_registered_count := coalesce((p_audit #>> '{registry,registeredPeerCount}')::integer, 0);
  v_peer_count := jsonb_array_length(p_audit -> 'peerResearch');

  if v_registry_version <= 0
     or v_registered_count < 3
     or v_registered_count > 25
     or v_peer_count <> v_registered_count
     or p_audit #>> '{comparison,version}' <> 'peer-comparison-v1'
     or p_audit #>> '{comparison,status}' <> 'ready'
     or coalesce((p_audit #>> '{comparison,peerCount}')::integer, -1) <> v_registered_count
  then
    raise exception 'divlab_peer_comparison_audit_registry_contract_invalid';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      'divlab-peer-comparison-audit:' || v_target_version_id::text || ':' || v_peer_set_id::text,
      0
    )
  );

  select
    upper(trim(v.research_packet #>> '{instrument,symbol}')),
    upper(trim(v.research_packet #>> '{instrument,exchange}')),
    trim(v.research_packet #>> '{instrument,name}'),
    trim(v.engine_version),
    v.data_as_of,
    trim(v.research_packet #>> '{valuationProvenance,version}')
  into
    v_target_symbol,
    v_target_exchange,
    v_target_name,
    v_target_engine_version,
    v_target_data_as_of,
    v_target_provenance_version
  from public.divlab_analysis_versions as v
  where v.id = v_target_version_id
    and v.publishable = true
    and coalesce((v.research_packet #>> '{qualityGate,publishable}')::boolean, false) = true;

  if v_target_symbol is null
     or v_target_symbol <> upper(trim(coalesce(p_audit #>> '{targetResearch,symbol}', '')))
     or v_target_exchange <> upper(trim(coalesce(p_audit #>> '{targetResearch,exchange}', '')))
     or v_target_name <> trim(coalesce(p_audit #>> '{targetResearch,name}', ''))
     or v_target_engine_version <> trim(coalesce(p_audit #>> '{targetResearch,engineVersion}', ''))
     or v_target_provenance_version <> 'valuation-provenance-v1'
     or v_target_provenance_version <> trim(coalesce(p_audit #>> '{targetResearch,valuationProvenanceVersion}', ''))
     or coalesce(p_audit #>> '{targetResearch,dataAsOf}', '') = ''
     or (p_audit #>> '{targetResearch,dataAsOf}')::timestamptz <> v_target_data_as_of
  then
    raise exception 'divlab_peer_comparison_audit_target_binding_invalid';
  end if;

  select
    upper(trim(target.instrument_symbol)),
    upper(trim(target.exchange)),
    peer_set.version_number,
    peer_set.data_as_of,
    (select count(*) from public.divlab_peer_set_members member where member.peer_set_id = peer_set.id)
  into
    v_registry_symbol,
    v_registry_exchange,
    v_registry_version,
    v_registry_data_as_of,
    v_actual_registered_count
  from public.divlab_peer_sets as peer_set
  join public.divlab_peer_targets as target on target.id = peer_set.target_id
  where peer_set.id = v_peer_set_id
    and peer_set.methodology_version = 'peer-comparison-v1';

  if v_registry_symbol is null
     or v_registry_symbol <> v_target_symbol
     or v_registry_exchange <> v_target_exchange
     or v_registry_version <> coalesce((p_audit #>> '{registry,versionNumber}')::integer, 0)
     or v_actual_registered_count <> v_registered_count
     or coalesce(p_audit #>> '{registry,dataAsOf}', '') = ''
     or (p_audit #>> '{registry,dataAsOf}')::timestamptz <> v_registry_data_as_of
     or upper(trim(coalesce(p_audit #>> '{comparison,target,symbol}', ''))) <> v_target_symbol
     or upper(trim(coalesce(p_audit #>> '{comparison,target,exchange}', ''))) <> v_target_exchange
  then
    raise exception 'divlab_peer_comparison_audit_registry_binding_invalid';
  end if;

  select audit_record.id, audit_record.audit
  into v_audit_id, v_existing_audit
  from public.divlab_peer_comparison_audits as audit_record
  where audit_record.target_analysis_version_id = v_target_version_id
    and audit_record.peer_set_id = v_peer_set_id;

  if v_audit_id is not null then
    if v_existing_audit = p_audit then
      return jsonb_build_object(
        'audit_id', v_audit_id,
        'target_analysis_version_id', v_target_version_id,
        'peer_set_id', v_peer_set_id,
        'peer_count', v_registered_count,
        'idempotent', true
      );
    end if;
    raise exception 'divlab_peer_comparison_audit_conflict';
  end if;

  insert into public.divlab_peer_comparison_audits (
    target_analysis_version_id,
    peer_set_id,
    audit_version,
    methodology_version,
    peer_set_version_number,
    audit
  ) values (
    v_target_version_id,
    v_peer_set_id,
    'peer-comparison-audit-v1',
    'peer-comparison-v1',
    v_registry_version,
    p_audit
  )
  returning id into v_audit_id;

  for v_peer in
    select value from jsonb_array_elements(p_audit -> 'peerResearch')
  loop
    if jsonb_typeof(v_peer) <> 'object'
       or coalesce(v_peer ->> 'analysisVersionId', '') !~* v_uuid_pattern
    then
      raise exception 'divlab_peer_comparison_audit_peer_reference_invalid';
    end if;

    v_peer_version_id := (v_peer ->> 'analysisVersionId')::uuid;
    if v_peer_version_id = v_target_version_id then
      raise exception 'divlab_peer_comparison_audit_target_used_as_peer';
    end if;

    v_peer_symbol := upper(trim(coalesce(v_peer ->> 'symbol', '')));
    v_peer_exchange := upper(trim(coalesce(v_peer ->> 'exchange', '')));
    v_peer_name := trim(coalesce(v_peer ->> 'name', ''));
    v_peer_engine_version := trim(coalesce(v_peer ->> 'engineVersion', ''));
    v_peer_provenance_version := trim(coalesce(v_peer ->> 'valuationProvenanceVersion', ''));

    if v_peer_symbol = '' or v_peer_exchange = '' or v_peer_name = ''
       or v_peer_engine_version = '' or v_peer_provenance_version = ''
       or coalesce(v_peer ->> 'dataAsOf', '') = ''
    then
      raise exception 'divlab_peer_comparison_audit_peer_binding_invalid';
    end if;

    select member.id
    into v_peer_member_id
    from public.divlab_peer_set_members as member
    where member.peer_set_id = v_peer_set_id
      and member.instrument_symbol = v_peer_symbol
      and member.exchange = v_peer_exchange;

    if v_peer_member_id is null then
      raise exception 'divlab_peer_comparison_audit_unregistered_peer';
    end if;

    select
      upper(trim(version_row.research_packet #>> '{instrument,symbol}')),
      upper(trim(version_row.research_packet #>> '{instrument,exchange}')),
      trim(version_row.research_packet #>> '{instrument,name}'),
      trim(version_row.engine_version),
      version_row.data_as_of,
      trim(version_row.research_packet #>> '{valuationProvenance,version}')
    into
      v_registry_symbol,
      v_registry_exchange,
      v_target_name,
      v_target_engine_version,
      v_peer_data_as_of,
      v_target_provenance_version
    from public.divlab_analysis_versions as version_row
    where version_row.id = v_peer_version_id
      and version_row.publishable = true
      and coalesce((version_row.research_packet #>> '{qualityGate,publishable}')::boolean, false) = true;

    if v_registry_symbol is null
       or v_registry_symbol <> v_peer_symbol
       or v_registry_exchange <> v_peer_exchange
       or v_target_name <> v_peer_name
       or v_target_engine_version <> v_peer_engine_version
       or v_target_provenance_version <> 'valuation-provenance-v1'
       or v_target_provenance_version <> v_peer_provenance_version
       or (v_peer ->> 'dataAsOf')::timestamptz <> v_peer_data_as_of
    then
      raise exception 'divlab_peer_comparison_audit_peer_research_mismatch';
    end if;

    insert into public.divlab_peer_comparison_audit_members (
      audit_id,
      peer_set_id,
      peer_member_id,
      peer_analysis_version_id
    ) values (
      v_audit_id,
      v_peer_set_id,
      v_peer_member_id,
      v_peer_version_id
    );
    v_bound_count := v_bound_count + 1;
  end loop;

  if v_bound_count <> v_registered_count then
    raise exception 'divlab_peer_comparison_audit_peer_binding_count_mismatch';
  end if;

  select min(version_times.data_as_of)
  into v_oldest_data_as_of
  from (
    select target_version.data_as_of
    from public.divlab_analysis_versions as target_version
    where target_version.id = v_target_version_id
    union all
    select peer_version.data_as_of
    from public.divlab_peer_comparison_audit_members as member_binding
    join public.divlab_analysis_versions as peer_version
      on peer_version.id = member_binding.peer_analysis_version_id
    where member_binding.audit_id = v_audit_id
  ) as version_times;

  if coalesce(p_audit #>> '{comparison,dataAsOf}', '') = ''
     or (p_audit #>> '{comparison,dataAsOf}')::timestamptz <> v_oldest_data_as_of
  then
    raise exception 'divlab_peer_comparison_audit_data_as_of_mismatch';
  end if;

  return jsonb_build_object(
    'audit_id', v_audit_id,
    'target_analysis_version_id', v_target_version_id,
    'peer_set_id', v_peer_set_id,
    'peer_count', v_registered_count,
    'idempotent', false
  );
end;
$$;

revoke all on function public.persist_divlab_peer_comparison_audit(jsonb)
from public, anon, authenticated;
grant execute on function public.persist_divlab_peer_comparison_audit(jsonb)
to service_role;
