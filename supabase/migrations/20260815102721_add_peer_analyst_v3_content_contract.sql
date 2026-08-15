alter table public.divlab_analysis_contents
  add column peer_audit_id uuid null;

alter table public.divlab_analysis_contents
  add constraint divlab_analysis_contents_peer_audit_id_fkey
  foreign key (peer_audit_id)
  references public.divlab_peer_comparison_audits(id)
  on delete restrict;

create index divlab_analysis_contents_peer_audit_id_idx
  on public.divlab_analysis_contents(peer_audit_id)
  where peer_audit_id is not null;

create or replace function public.validate_divlab_analysis_content_schema_quality()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_checks jsonb;
  v_bank_factors jsonb;
  v_scenario jsonb;
  v_scenario_names text[] := array[]::text[];
  v_source_id_json jsonb;
  v_source_id text;
  v_version_currency text;
  v_has_price_to_book_claim boolean := false;
  v_latest_report_has_primary_source boolean := false;
  v_peer_audit jsonb;
  v_peer_claim jsonb;
  v_peer_metric text;
  v_peer_metric_payload jsonb;
  v_ready_metric_count integer := 0;
  v_claim_metric_count integer := 0;
  v_uuid_pattern text := '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$';
begin
  if nullif(trim(new.schema_version), '') is null
     or nullif(trim(new.analyst_quality_gate_version), '') is null
     or nullif(trim(new.analyst_model), '') is null
     or new.analyst_quality_gate is null
     or jsonb_typeof(new.analyst_quality_gate) <> 'object'
     or new.analyst_draft is null
     or jsonb_typeof(new.analyst_draft) <> 'object'
     or new.ai_usage is null
     or jsonb_typeof(new.ai_usage) <> 'object'
     or new.generated_at is null
  then
    raise exception 'invalid_divlab_analysis_content_input';
  end if;

  if coalesce(new.analyst_quality_gate ->> 'version', '') <> trim(new.analyst_quality_gate_version)
     or new.analyst_quality_gate -> 'publishable' <> 'true'::jsonb
     or coalesce((new.analyst_quality_gate ->> 'score')::numeric, -1) < 100
  then
    raise exception 'divlab_analysis_content_requires_passing_quality_gate';
  end if;

  v_checks := new.analyst_quality_gate -> 'checks';
  if jsonb_typeof(v_checks) <> 'object'
     or v_checks -> 'qualityFactorCoverage' <> 'true'::jsonb
     or v_checks -> 'confidenceCalibration' <> 'true'::jsonb
     or v_checks -> 'sourceDiversity' <> 'true'::jsonb
     or v_checks -> 'scenarioDifferentiation' <> 'true'::jsonb
     or v_checks -> 'assumptionDifferentiation' <> 'true'::jsonb
     or v_checks -> 'viewValuationConsistency' <> 'true'::jsonb
  then
    raise exception 'invalid_divlab_analysis_content_quality_checks';
  end if;

  select currency
  into v_version_currency
  from public.divlab_analysis_versions
  where id = new.analysis_version_id;

  if v_version_currency is null then
    raise exception 'divlab_analysis_version_not_found';
  end if;

  if jsonb_typeof(new.analyst_draft -> 'valuationScenarios') <> 'array'
     or jsonb_array_length(new.analyst_draft -> 'valuationScenarios') <> 3
  then
    raise exception 'divlab_analysis_content_requires_three_scenarios';
  end if;

  for v_scenario in
    select value from jsonb_array_elements(new.analyst_draft -> 'valuationScenarios')
  loop
    if jsonb_typeof(v_scenario) <> 'object'
       or nullif(trim(coalesce(v_scenario ->> 'name', '')), '') is null
       or upper(trim(coalesce(v_scenario ->> 'currency', ''))) <> upper(trim(v_version_currency))
    then
      raise exception 'invalid_divlab_analysis_content_scenario';
    end if;
    v_scenario_names := array_append(v_scenario_names, lower(trim(v_scenario ->> 'name')));
  end loop;

  if not (
    'bear' = any(v_scenario_names)
    and 'base' = any(v_scenario_names)
    and 'bull' = any(v_scenario_names)
    and (select count(distinct value) from unnest(v_scenario_names) as names(value)) = 3
  ) then
    raise exception 'divlab_analysis_content_requires_unique_bear_base_bull';
  end if;

  for v_source_id_json in
    select value from jsonb_path_query(new.analyst_draft, '$.**.sourceIds[*]') as source_ids(value)
  loop
    if jsonb_typeof(v_source_id_json) <> 'string' then
      raise exception 'invalid_divlab_analysis_content_source_id';
    end if;
    v_source_id := v_source_id_json #>> '{}';
    if nullif(trim(v_source_id), '') is null
       or not exists (
         select 1
         from public.divlab_analysis_sources
         where analysis_version_id = new.analysis_version_id
           and source_key = v_source_id
       )
    then
      raise exception 'divlab_analysis_content_unknown_source_id';
    end if;
  end loop;

  select exists (
    select 1
    from jsonb_path_query(new.analyst_draft, '$.latestReport[*].sourceIds[*]') as ids(value)
    join public.divlab_analysis_sources source
      on source.analysis_version_id = new.analysis_version_id
     and source.source_key = (ids.value #>> '{}')
    where source.primary_source = true
  ) into v_latest_report_has_primary_source;

  if not v_latest_report_has_primary_source then
    raise exception 'divlab_analysis_content_latest_report_requires_primary_source';
  end if;

  if coalesce((new.ai_usage ->> 'inputTokens')::numeric, -1) < 0
     or coalesce((new.ai_usage ->> 'outputTokens')::numeric, -1) < 0
     or coalesce((new.ai_usage ->> 'totalTokens')::numeric, -1) < 0
     or coalesce((new.ai_usage ->> 'estimatedCostUsdMicros')::numeric, -1) < 0
  then
    raise exception 'invalid_divlab_analysis_content_usage';
  end if;

  if new.generated_at > now() + interval '5 minutes' then
    raise exception 'divlab_analysis_content_generated_at_in_future';
  end if;

  if trim(new.schema_version) = 'analyst-v2' then
    if trim(new.analyst_quality_gate_version) <> 'analyst-quality-v1' then
      raise exception 'analyst_v2_requires_analyst_quality_v1';
    end if;
    if new.peer_audit_id is not null
       or new.analyst_draft ? 'peerAuditId'
       or new.analyst_draft ? 'peerInterpretation'
    then
      raise exception 'analyst_v2_must_not_reference_peer_audit';
    end if;
    return new;
  end if;

  if trim(new.schema_version) = 'analyst-v3-peer' then
    if trim(new.analyst_quality_gate_version) <> 'peer-analyst-quality-v1' then
      raise exception 'analyst_v3_peer_requires_peer_quality_v1';
    end if;
    if v_checks -> 'peerContextReady' <> 'true'::jsonb
       or v_checks -> 'peerAuditBinding' <> 'true'::jsonb
       or v_checks -> 'peerMetricCoverage' <> 'true'::jsonb
       or v_checks -> 'peerNumericGrounding' <> 'true'::jsonb
    then
      raise exception 'invalid_peer_analyst_v3_quality_checks';
    end if;
    if new.analyst_draft ->> 'peerContextVersion' <> 'peer-analyst-context-v1'
       or coalesce(new.analyst_draft ->> 'peerAuditId', '') !~* v_uuid_pattern
       or jsonb_typeof(new.analyst_draft -> 'peerInterpretation') <> 'array'
       or jsonb_array_length(new.analyst_draft -> 'peerInterpretation') < 1
       or jsonb_array_length(new.analyst_draft -> 'peerInterpretation') > 4
    then
      raise exception 'invalid_peer_analyst_v3_draft_contract';
    end if;

    if new.peer_audit_id is not null
       and new.peer_audit_id <> (new.analyst_draft ->> 'peerAuditId')::uuid
    then
      raise exception 'peer_analyst_v3_column_audit_mismatch';
    end if;
    new.peer_audit_id := (new.analyst_draft ->> 'peerAuditId')::uuid;

    select audit_record.audit
    into v_peer_audit
    from public.divlab_peer_comparison_audits as audit_record
    where audit_record.id = new.peer_audit_id
      and audit_record.target_analysis_version_id = new.analysis_version_id
      and audit_record.audit_version = 'peer-comparison-audit-v1'
      and audit_record.methodology_version = 'peer-comparison-v1';

    if v_peer_audit is null
       or v_peer_audit #>> '{comparison,status}' <> 'ready'
    then
      raise exception 'peer_analyst_v3_audit_binding_invalid';
    end if;

    select count(*)
    into v_ready_metric_count
    from jsonb_each(v_peer_audit #> '{comparison,metrics}') as metrics(key, value)
    where metrics.key in ('pe','priceToFcf','evToEbit','evToEbitda')
      and metrics.value ->> 'status' = 'ready';

    select count(distinct claim.value ->> 'metric')
    into v_claim_metric_count
    from jsonb_array_elements(new.analyst_draft -> 'peerInterpretation') as claim(value);

    if v_ready_metric_count < 1
       or jsonb_array_length(new.analyst_draft -> 'peerInterpretation') <> v_ready_metric_count
       or v_claim_metric_count <> v_ready_metric_count
    then
      raise exception 'peer_analyst_v3_metric_coverage_invalid';
    end if;

    for v_peer_claim in
      select value from jsonb_array_elements(new.analyst_draft -> 'peerInterpretation')
    loop
      v_peer_metric := v_peer_claim ->> 'metric';
      if jsonb_typeof(v_peer_claim) <> 'object'
         or v_peer_metric not in ('pe','priceToFcf','evToEbit','evToEbitda')
         or coalesce(v_peer_claim ->> 'peerAuditId', '') !~* v_uuid_pattern
         or (v_peer_claim ->> 'peerAuditId')::uuid <> new.peer_audit_id
         or jsonb_typeof(v_peer_claim -> 'targetValue') <> 'number'
         or jsonb_typeof(v_peer_claim -> 'peerSampleSize') <> 'number'
         or jsonb_typeof(v_peer_claim -> 'peerMedian') <> 'number'
         or jsonb_typeof(v_peer_claim -> 'peerMin') <> 'number'
         or jsonb_typeof(v_peer_claim -> 'peerMax') <> 'number'
         or jsonb_typeof(v_peer_claim -> 'targetVsMedianPct') <> 'number'
      then
        raise exception 'peer_analyst_v3_claim_invalid';
      end if;

      v_peer_metric_payload := v_peer_audit #> array['comparison','metrics',v_peer_metric];
      if v_peer_metric_payload is null
         or v_peer_metric_payload ->> 'status' <> 'ready'
         or (v_peer_claim ->> 'targetValue')::numeric <> (v_peer_metric_payload ->> 'targetValue')::numeric
         or (v_peer_claim ->> 'peerSampleSize')::integer <> (v_peer_metric_payload ->> 'peerSampleSize')::integer
         or (v_peer_claim ->> 'peerMedian')::numeric <> (v_peer_metric_payload ->> 'peerMedian')::numeric
         or (v_peer_claim ->> 'peerMin')::numeric <> (v_peer_metric_payload ->> 'peerMin')::numeric
         or (v_peer_claim ->> 'peerMax')::numeric <> (v_peer_metric_payload ->> 'peerMax')::numeric
         or (v_peer_claim ->> 'targetVsMedianPct')::numeric <> (v_peer_metric_payload ->> 'targetVsMedianPct')::numeric
      then
        raise exception 'peer_analyst_v3_claim_not_grounded';
      end if;

      if (v_peer_claim ->> 'targetValue')::numeric <= 0
         or (v_peer_claim ->> 'peerSampleSize')::integer < 3
         or (v_peer_claim ->> 'peerSampleSize')::integer > 25
         or (v_peer_claim ->> 'peerMin')::numeric <= 0
         or (v_peer_claim ->> 'peerMedian')::numeric <= 0
         or (v_peer_claim ->> 'peerMax')::numeric <= 0
         or (v_peer_claim ->> 'peerMin')::numeric > (v_peer_claim ->> 'peerMedian')::numeric
         or (v_peer_claim ->> 'peerMedian')::numeric > (v_peer_claim ->> 'peerMax')::numeric
      then
        raise exception 'peer_analyst_v3_claim_range_invalid';
      end if;
    end loop;

    return new;
  end if;

  if trim(new.schema_version) <> 'analyst-v3-bank' then
    raise exception 'unsupported_divlab_analysis_content_schema';
  end if;

  if new.peer_audit_id is not null
     or new.analyst_draft ? 'peerAuditId'
     or new.analyst_draft ? 'peerInterpretation'
  then
    raise exception 'bank_analyst_v3_must_not_reference_peer_audit';
  end if;

  if trim(new.analyst_quality_gate_version) <> 'bank-analyst-quality-v1' then
    raise exception 'bank_analyst_v3_requires_bank_quality_v1';
  end if;

  if v_checks -> 'bankCoreFactorCoverage' <> 'true'::jsonb
     or v_checks -> 'bankResearchReady' <> 'true'::jsonb
     or v_checks -> 'bankValuationTraceability' <> 'true'::jsonb
     or v_checks -> 'bankScenarioBasisCoverage' <> 'true'::jsonb
  then
    raise exception 'invalid_bank_analyst_v3_quality_checks';
  end if;

  v_bank_factors := new.analyst_draft -> 'bankFactors';
  if jsonb_typeof(v_bank_factors) <> 'object'
     or nullif(trim(coalesce(v_bank_factors -> 'profitability' ->> 'assessment', '')), '') is null
     or nullif(trim(coalesce(v_bank_factors -> 'capitalStrength' ->> 'assessment', '')), '') is null
     or nullif(trim(coalesce(v_bank_factors -> 'creditQuality' ->> 'assessment', '')), '') is null
     or nullif(trim(coalesce(v_bank_factors -> 'fundingAndLiquidity' ->> 'assessment', '')), '') is null
     or lower(v_bank_factors -> 'profitability' ->> 'assessment') = 'unknown'
     or lower(v_bank_factors -> 'capitalStrength' ->> 'assessment') = 'unknown'
     or lower(v_bank_factors -> 'creditQuality' ->> 'assessment') = 'unknown'
     or lower(v_bank_factors -> 'fundingAndLiquidity' ->> 'assessment') = 'unknown'
  then
    raise exception 'bank_analyst_v3_requires_core_bank_factors';
  end if;

  if jsonb_typeof(new.analyst_draft -> 'valuationInterpretation') <> 'array' then
    raise exception 'bank_analyst_v3_requires_valuation_interpretation';
  end if;

  select exists (
    select 1
    from jsonb_array_elements(new.analyst_draft -> 'valuationInterpretation') as claims(value)
    where claims.value ->> 'measure' = 'priceToBook'
  ) into v_has_price_to_book_claim;

  if not v_has_price_to_book_claim then
    raise exception 'bank_analyst_v3_requires_price_to_book_claim';
  end if;

  for v_scenario in
    select value from jsonb_array_elements(new.analyst_draft -> 'valuationScenarios')
  loop
    if v_scenario -> 'bookValueGrowthPct' is null
       or v_scenario -> 'bookValueGrowthPct' = 'null'::jsonb
       or v_scenario -> 'priceToBookMultiple' is null
       or v_scenario -> 'priceToBookMultiple' = 'null'::jsonb
    then
      raise exception 'bank_analyst_v3_requires_price_to_book_scenario_basis';
    end if;
  end loop;

  return new;
end;
$$;