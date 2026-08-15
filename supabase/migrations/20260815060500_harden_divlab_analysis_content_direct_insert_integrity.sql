create or replace function public.validate_divlab_analysis_content_schema_quality()
returns trigger
language plpgsql
security invoker
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
    return new;
  end if;

  if trim(new.schema_version) <> 'analyst-v3-bank' then
    raise exception 'unsupported_divlab_analysis_content_schema';
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

revoke all on function public.validate_divlab_analysis_content_schema_quality()
from public, anon, authenticated, service_role;