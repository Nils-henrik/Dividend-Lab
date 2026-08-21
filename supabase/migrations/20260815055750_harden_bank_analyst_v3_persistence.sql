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
  v_has_price_to_book_claim boolean := false;
begin
  if nullif(trim(new.schema_version), '') is null
     or nullif(trim(new.analyst_quality_gate_version), '') is null
     or new.analyst_quality_gate is null
     or jsonb_typeof(new.analyst_quality_gate) <> 'object'
     or new.analyst_draft is null
     or jsonb_typeof(new.analyst_draft) <> 'object'
  then
    raise exception 'invalid_divlab_analysis_content_schema_quality';
  end if;

  v_checks := new.analyst_quality_gate -> 'checks';
  if jsonb_typeof(v_checks) <> 'object' then
    raise exception 'invalid_divlab_analysis_content_quality_checks';
  end if;

  if trim(new.schema_version) = 'analyst-v2' then
    if trim(new.analyst_quality_gate_version) <> 'analyst-quality-v1'
       or coalesce(new.analyst_quality_gate ->> 'version', '') <> 'analyst-quality-v1'
    then
      raise exception 'analyst_v2_requires_analyst_quality_v1';
    end if;
    return new;
  end if;

  if trim(new.schema_version) <> 'analyst-v3-bank' then
    raise exception 'unsupported_divlab_analysis_content_schema';
  end if;

  if trim(new.analyst_quality_gate_version) <> 'bank-analyst-quality-v1'
     or coalesce(new.analyst_quality_gate ->> 'version', '') <> 'bank-analyst-quality-v1'
  then
    raise exception 'bank_analyst_v3_requires_bank_quality_v1';
  end if;

  if new.analyst_quality_gate -> 'publishable' <> 'true'::jsonb
     or coalesce((new.analyst_quality_gate ->> 'score')::numeric, -1) < 100
  then
    raise exception 'bank_analyst_v3_requires_passing_quality_gate';
  end if;

  if v_checks -> 'qualityFactorCoverage' <> 'true'::jsonb
     or v_checks -> 'confidenceCalibration' <> 'true'::jsonb
     or v_checks -> 'sourceDiversity' <> 'true'::jsonb
     or v_checks -> 'scenarioDifferentiation' <> 'true'::jsonb
     or v_checks -> 'assumptionDifferentiation' <> 'true'::jsonb
     or v_checks -> 'viewValuationConsistency' <> 'true'::jsonb
     or v_checks -> 'bankCoreFactorCoverage' <> 'true'::jsonb
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

  if jsonb_typeof(new.analyst_draft -> 'valuationScenarios') <> 'array'
     or jsonb_array_length(new.analyst_draft -> 'valuationScenarios') <> 3
  then
    raise exception 'bank_analyst_v3_requires_three_scenarios';
  end if;

  for v_scenario in
    select value from jsonb_array_elements(new.analyst_draft -> 'valuationScenarios')
  loop
    if jsonb_typeof(v_scenario) <> 'object'
       or v_scenario -> 'bookValueGrowthPct' is null
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
from public, anon, authenticated;

-- Trigger functions do not need a public execution surface. The trigger is
-- created by the migration owner and runs as part of the protected table write.
revoke all on function public.validate_divlab_analysis_content_schema_quality()
from service_role;

drop trigger if exists validate_divlab_analysis_content_schema_quality_before_insert
on public.divlab_analysis_contents;

create trigger validate_divlab_analysis_content_schema_quality_before_insert
before insert on public.divlab_analysis_contents
for each row
execute function public.validate_divlab_analysis_content_schema_quality();
