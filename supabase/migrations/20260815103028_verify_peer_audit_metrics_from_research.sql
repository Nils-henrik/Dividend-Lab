create function public.assert_divlab_peer_comparison_audit_integrity(p_audit_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_audit_row public.divlab_peer_comparison_audits%rowtype;
  v_audit jsonb;
  v_target_packet jsonb;
  v_target_data_as_of timestamptz;
  v_target_symbol text;
  v_target_exchange text;
  v_registered_count integer;
  v_member_count integer;
  v_peer_json_count integer;
  v_distinct_peer_json_count integer;
  v_oldest_data_as_of timestamptz;
  v_metric text;
  v_metric_payload jsonb;
  v_target_value numeric;
  v_peer_count integer;
  v_peer_median numeric;
  v_peer_min numeric;
  v_peer_max numeric;
  v_target_vs_median numeric;
  v_expected_status text;
  v_path text[];
begin
  select *
  into v_audit_row
  from public.divlab_peer_comparison_audits
  where id = p_audit_id;

  if not found then
    raise exception 'divlab_peer_comparison_audit_integrity_missing_audit';
  end if;

  v_audit := v_audit_row.audit;
  if v_audit_row.audit_version <> 'peer-comparison-audit-v1'
     or v_audit_row.methodology_version <> 'peer-comparison-v1'
     or v_audit ->> 'version' <> 'peer-comparison-audit-v1'
     or v_audit #>> '{comparison,version}' <> 'peer-comparison-v1'
     or v_audit #>> '{comparison,status}' <> 'ready'
     or (v_audit #>> '{registry,peerSetId}')::uuid <> v_audit_row.peer_set_id
     or (v_audit #>> '{registry,versionNumber}')::integer <> v_audit_row.peer_set_version_number
     or (v_audit #>> '{targetResearch,analysisVersionId}')::uuid <> v_audit_row.target_analysis_version_id
  then
    raise exception 'divlab_peer_comparison_audit_integrity_header_invalid';
  end if;

  v_registered_count := coalesce((v_audit #>> '{registry,registeredPeerCount}')::integer, 0);
  if v_registered_count < 3 or v_registered_count > 25
     or coalesce((v_audit #>> '{comparison,peerCount}')::integer, -1) <> v_registered_count
     or jsonb_typeof(v_audit -> 'peerResearch') <> 'array'
  then
    raise exception 'divlab_peer_comparison_audit_integrity_peer_count_invalid';
  end if;

  select
    version_row.research_packet,
    version_row.data_as_of,
    upper(trim(version_row.research_packet #>> '{instrument,symbol}')),
    upper(trim(version_row.research_packet #>> '{instrument,exchange}'))
  into
    v_target_packet,
    v_target_data_as_of,
    v_target_symbol,
    v_target_exchange
  from public.divlab_analysis_versions as version_row
  where version_row.id = v_audit_row.target_analysis_version_id
    and version_row.engine_version = 'deep-research-v2'
    and version_row.publishable = true
    and version_row.research_packet ->> 'version' = 'deep-research-v2'
    and coalesce((version_row.research_packet #>> '{qualityGate,publishable}')::boolean, false) = true
    and version_row.research_packet #>> '{valuationProvenance,version}' = 'valuation-provenance-v1';

  if v_target_packet is null
     or upper(trim(coalesce(v_audit #>> '{comparison,target,symbol}', ''))) <> v_target_symbol
     or upper(trim(coalesce(v_audit #>> '{comparison,target,exchange}', ''))) <> v_target_exchange
     or upper(trim(coalesce(v_audit #>> '{targetResearch,symbol}', ''))) <> v_target_symbol
     or upper(trim(coalesce(v_audit #>> '{targetResearch,exchange}', ''))) <> v_target_exchange
     or (v_audit #>> '{targetResearch,dataAsOf}')::timestamptz <> v_target_data_as_of
  then
    raise exception 'divlab_peer_comparison_audit_integrity_target_invalid';
  end if;

  if exists (
    select 1
    from public.divlab_peer_sets as peer_set
    join public.divlab_peer_targets as target on target.id = peer_set.target_id
    where peer_set.id = v_audit_row.peer_set_id
      and (
        peer_set.version_number <> v_audit_row.peer_set_version_number
        or peer_set.methodology_version <> 'peer-comparison-v1'
        or peer_set.data_as_of > v_target_data_as_of
        or upper(trim(target.instrument_symbol)) <> v_target_symbol
        or upper(trim(target.exchange)) <> v_target_exchange
      )
  ) or not exists (
    select 1 from public.divlab_peer_sets where id = v_audit_row.peer_set_id
  ) then
    raise exception 'divlab_peer_comparison_audit_integrity_registry_invalid';
  end if;

  if exists (
    select 1
    from public.divlab_peer_set_sources as registry_source
    where registry_source.peer_set_id = v_audit_row.peer_set_id
      and registry_source.verified_at > v_target_data_as_of
  ) then
    raise exception 'divlab_peer_comparison_audit_integrity_registry_lookahead';
  end if;

  select count(*)
  into v_member_count
  from public.divlab_peer_comparison_audit_members
  where audit_id = p_audit_id;

  select
    jsonb_array_length(v_audit -> 'peerResearch'),
    count(distinct peer.value ->> 'analysisVersionId')
  into v_peer_json_count, v_distinct_peer_json_count
  from jsonb_array_elements(v_audit -> 'peerResearch') as peer(value);

  if v_member_count <> v_registered_count
     or v_peer_json_count <> v_registered_count
     or v_distinct_peer_json_count <> v_registered_count
  then
    raise exception 'divlab_peer_comparison_audit_integrity_member_count_invalid';
  end if;

  if exists (
    select 1
    from public.divlab_peer_comparison_audit_members as binding
    join public.divlab_peer_set_members as member
      on member.peer_set_id = binding.peer_set_id
     and member.id = binding.peer_member_id
    join public.divlab_analysis_versions as version_row
      on version_row.id = binding.peer_analysis_version_id
    where binding.audit_id = p_audit_id
      and (
        binding.peer_set_id <> v_audit_row.peer_set_id
        or version_row.engine_version <> 'deep-research-v2'
        or version_row.publishable <> true
        or version_row.research_packet ->> 'version' <> 'deep-research-v2'
        or coalesce((version_row.research_packet #>> '{qualityGate,publishable}')::boolean, false) <> true
        or version_row.research_packet #>> '{valuationProvenance,version}' <> 'valuation-provenance-v1'
        or version_row.data_as_of > v_target_data_as_of
        or upper(trim(version_row.research_packet #>> '{instrument,symbol}')) <> upper(trim(member.instrument_symbol))
        or upper(trim(version_row.research_packet #>> '{instrument,exchange}')) <> upper(trim(member.exchange))
        or trim(version_row.research_packet #>> '{instrument,name}') <> trim(member.instrument_name)
      )
  ) then
    raise exception 'divlab_peer_comparison_audit_integrity_member_research_invalid';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_audit -> 'peerResearch') as peer(value)
    where coalesce(peer.value ->> 'analysisVersionId', '') !~* '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
       or not exists (
         select 1
         from public.divlab_peer_comparison_audit_members as binding
         join public.divlab_peer_set_members as member
           on member.peer_set_id = binding.peer_set_id
          and member.id = binding.peer_member_id
         join public.divlab_analysis_versions as version_row
           on version_row.id = binding.peer_analysis_version_id
         where binding.audit_id = p_audit_id
           and binding.peer_analysis_version_id = (peer.value ->> 'analysisVersionId')::uuid
           and upper(trim(peer.value ->> 'symbol')) = upper(trim(member.instrument_symbol))
           and upper(trim(peer.value ->> 'exchange')) = upper(trim(member.exchange))
           and trim(peer.value ->> 'name') = trim(member.instrument_name)
           and trim(peer.value ->> 'engineVersion') = version_row.engine_version
           and (peer.value ->> 'dataAsOf')::timestamptz = version_row.data_as_of
           and peer.value ->> 'valuationProvenanceVersion' = version_row.research_packet #>> '{valuationProvenance,version}'
       )
  ) then
    raise exception 'divlab_peer_comparison_audit_integrity_peer_json_mismatch';
  end if;

  select min(data_as_of)
  into v_oldest_data_as_of
  from (
    select v_target_data_as_of as data_as_of
    union all
    select version_row.data_as_of
    from public.divlab_peer_comparison_audit_members as binding
    join public.divlab_analysis_versions as version_row
      on version_row.id = binding.peer_analysis_version_id
    where binding.audit_id = p_audit_id
  ) as participating_versions;

  if (v_audit #>> '{comparison,dataAsOf}')::timestamptz <> v_oldest_data_as_of then
    raise exception 'divlab_peer_comparison_audit_integrity_data_as_of_invalid';
  end if;

  foreach v_metric in array array['pe','priceToFcf','evToEbit','evToEbitda']::text[]
  loop
    v_metric_payload := v_audit #> array['comparison','metrics',v_metric];
    if jsonb_typeof(v_metric_payload) <> 'object'
       or v_metric_payload ->> 'metric' <> v_metric
    then
      raise exception 'divlab_peer_comparison_audit_integrity_metric_missing:%', v_metric;
    end if;

    v_target_value := null;
    v_path := array['valuation','trailing',v_metric];
    if coalesce((v_target_packet #>> array['valuationProvenance','measures',v_metric,'traceable'])::boolean, false) = true
       and jsonb_typeof(v_target_packet #> v_path) = 'number'
       and (v_target_packet #>> v_path)::numeric > 0
    then
      v_target_value := (v_target_packet #>> v_path)::numeric;
    end if;

    select
      count(*)::integer,
      percentile_cont(0.5) within group (
        order by (version_row.research_packet #>> array['valuation','trailing',v_metric])::numeric
      )::numeric,
      min((version_row.research_packet #>> array['valuation','trailing',v_metric])::numeric),
      max((version_row.research_packet #>> array['valuation','trailing',v_metric])::numeric)
    into v_peer_count, v_peer_median, v_peer_min, v_peer_max
    from public.divlab_peer_comparison_audit_members as binding
    join public.divlab_analysis_versions as version_row
      on version_row.id = binding.peer_analysis_version_id
    where binding.audit_id = p_audit_id
      and coalesce((version_row.research_packet #>> array['valuationProvenance','measures',v_metric,'traceable'])::boolean, false) = true
      and jsonb_typeof(version_row.research_packet #> array['valuation','trailing',v_metric]) = 'number'
      and (version_row.research_packet #>> array['valuation','trailing',v_metric])::numeric > 0;

    v_expected_status := case
      when v_target_value is not null and v_peer_count >= 3 then 'ready'
      else 'insufficient'
    end;

    v_target_vs_median := case
      when v_target_value is not null and v_peer_median is not null and v_peer_median > 0
        then round(v_target_value / v_peer_median - 1, 6)
      else null
    end;

    if v_metric_payload ->> 'status' <> v_expected_status
       or coalesce((v_metric_payload ->> 'peerSampleSize')::integer, -1) <> v_peer_count
    then
      raise exception 'divlab_peer_comparison_audit_integrity_metric_status_invalid:%', v_metric;
    end if;

    if v_target_value is null then
      if v_metric_payload -> 'targetValue' is distinct from 'null'::jsonb then
        raise exception 'divlab_peer_comparison_audit_integrity_metric_target_invalid:%', v_metric;
      end if;
    elsif jsonb_typeof(v_metric_payload -> 'targetValue') <> 'number'
       or (v_metric_payload ->> 'targetValue')::numeric <> round(v_target_value, 4)
    then
      raise exception 'divlab_peer_comparison_audit_integrity_metric_target_invalid:%', v_metric;
    end if;

    if v_peer_median is null then
      if v_metric_payload -> 'peerMedian' is distinct from 'null'::jsonb
         or v_metric_payload -> 'peerMin' is distinct from 'null'::jsonb
         or v_metric_payload -> 'peerMax' is distinct from 'null'::jsonb
      then
        raise exception 'divlab_peer_comparison_audit_integrity_metric_peer_range_invalid:%', v_metric;
      end if;
    elsif jsonb_typeof(v_metric_payload -> 'peerMedian') <> 'number'
       or jsonb_typeof(v_metric_payload -> 'peerMin') <> 'number'
       or jsonb_typeof(v_metric_payload -> 'peerMax') <> 'number'
       or (v_metric_payload ->> 'peerMedian')::numeric <> round(v_peer_median, 4)
       or (v_metric_payload ->> 'peerMin')::numeric <> round(v_peer_min, 4)
       or (v_metric_payload ->> 'peerMax')::numeric <> round(v_peer_max, 4)
    then
      raise exception 'divlab_peer_comparison_audit_integrity_metric_peer_range_invalid:%', v_metric;
    end if;

    if v_target_vs_median is null then
      if v_metric_payload -> 'targetVsMedianPct' is distinct from 'null'::jsonb then
        raise exception 'divlab_peer_comparison_audit_integrity_metric_delta_invalid:%', v_metric;
      end if;
    elsif jsonb_typeof(v_metric_payload -> 'targetVsMedianPct') <> 'number'
       or (v_metric_payload ->> 'targetVsMedianPct')::numeric <> v_target_vs_median
    then
      raise exception 'divlab_peer_comparison_audit_integrity_metric_delta_invalid:%', v_metric;
    end if;
  end loop;
end;
$$;

create function public.validate_divlab_peer_comparison_audit_integrity_trigger()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_audit_id uuid;
begin
  v_audit_id := case
    when tg_table_name = 'divlab_peer_comparison_audits' then new.id
    else new.audit_id
  end;
  perform public.assert_divlab_peer_comparison_audit_integrity(v_audit_id);
  return new;
end;
$$;

create constraint trigger validate_divlab_peer_comparison_audit_integrity
  after insert on public.divlab_peer_comparison_audits
  deferrable initially deferred
  for each row
  execute function public.validate_divlab_peer_comparison_audit_integrity_trigger();

create constraint trigger validate_divlab_peer_comparison_audit_member_integrity
  after insert on public.divlab_peer_comparison_audit_members
  deferrable initially deferred
  for each row
  execute function public.validate_divlab_peer_comparison_audit_integrity_trigger();

revoke all on function public.assert_divlab_peer_comparison_audit_integrity(uuid)
from public, anon, authenticated;
grant execute on function public.assert_divlab_peer_comparison_audit_integrity(uuid)
to service_role;

revoke all on function public.validate_divlab_peer_comparison_audit_integrity_trigger()
from public, anon, authenticated;
grant execute on function public.validate_divlab_peer_comparison_audit_integrity_trigger()
to service_role;