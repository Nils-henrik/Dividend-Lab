-- OMXS30 specialist methodology persistence/publication support.
-- Keeps all existing 100/100, chart and source guards while adding the
-- financial-specialist schema alongside analyst-v2 and analyst-v3-bank.

create or replace function public.persist_divlab_analysis_content(
  p_analysis_version_id uuid,
  p_schema_version text,
  p_analyst_model text,
  p_analyst_draft jsonb,
  p_ai_usage jsonb,
  p_generated_at timestamptz default now(),
  p_analyst_quality_gate jsonb default null,
  p_analyst_quality_gate_version text default null
)
returns table (
  content_id uuid,
  analysis_version_id uuid,
  schema_version text,
  analyst_model text,
  generated_at timestamptz,
  analyst_quality_gate_version text
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_content public.divlab_analysis_contents%rowtype;
  v_version_currency text;
  v_source_id_json jsonb;
  v_source_id text;
  v_scenario jsonb;
  v_quality_checks jsonb;
begin
  if p_analysis_version_id is null
     or nullif(trim(p_schema_version), '') is null
     or nullif(trim(p_analyst_model), '') is null
     or p_analyst_draft is null or jsonb_typeof(p_analyst_draft) <> 'object'
     or p_ai_usage is null or jsonb_typeof(p_ai_usage) <> 'object'
     or p_analyst_quality_gate is null or jsonb_typeof(p_analyst_quality_gate) <> 'object'
     or nullif(trim(p_analyst_quality_gate_version), '') is null
  then raise exception 'invalid_divlab_analysis_content_input'; end if;

  if p_analyst_quality_gate -> 'publishable' <> 'true'::jsonb
     or coalesce((p_analyst_quality_gate ->> 'score')::numeric, -1) < 100
     or coalesce(p_analyst_quality_gate ->> 'version', '') <> trim(p_analyst_quality_gate_version)
     or coalesce(jsonb_array_length(p_analyst_quality_gate -> 'blockers'), -1) <> 0
  then raise exception 'divlab_analysis_content_requires_passing_quality_gate'; end if;

  v_quality_checks := p_analyst_quality_gate -> 'checks';
  if jsonb_typeof(v_quality_checks) <> 'object'
     or v_quality_checks -> 'qualityFactorCoverage' <> 'true'::jsonb
     or v_quality_checks -> 'confidenceCalibration' <> 'true'::jsonb
     or v_quality_checks -> 'sourceDiversity' <> 'true'::jsonb
     or v_quality_checks -> 'scenarioDifferentiation' <> 'true'::jsonb
     or v_quality_checks -> 'assumptionDifferentiation' <> 'true'::jsonb
     or v_quality_checks -> 'viewValuationConsistency' <> 'true'::jsonb
  then raise exception 'invalid_divlab_analysis_content_quality_checks'; end if;

  if trim(p_schema_version) = 'analyst-v2' then
    if trim(p_analyst_quality_gate_version) <> 'analyst-quality-v1' then
      raise exception 'analyst_v2_requires_analyst_quality_v1';
    end if;
  elsif trim(p_schema_version) = 'analyst-v3-bank' then
    if trim(p_analyst_quality_gate_version) <> 'bank-analyst-quality-v1' then
      raise exception 'bank_analyst_v3_requires_bank_quality_v1';
    end if;
    if v_quality_checks -> 'bankCoreFactorCoverage' <> 'true'::jsonb
       or v_quality_checks -> 'bankResearchReady' <> 'true'::jsonb
       or v_quality_checks -> 'bankValuationTraceability' <> 'true'::jsonb
       or v_quality_checks -> 'bankScenarioBasisCoverage' <> 'true'::jsonb
    then raise exception 'invalid_bank_analyst_v3_quality_checks'; end if;
  elsif trim(p_schema_version) = 'analyst-v1-financial-specialist' then
    if trim(p_analyst_quality_gate_version) <> 'financial-specialist-analyst-quality-v1' then
      raise exception 'financial_specialist_requires_specialist_quality_v1';
    end if;
    if v_quality_checks -> 'specialistTypeConsistency' <> 'true'::jsonb
       or v_quality_checks -> 'specialistResearchReady' <> 'true'::jsonb
       or v_quality_checks -> 'specialistValuationCoverage' <> 'true'::jsonb
    then raise exception 'invalid_financial_specialist_quality_checks'; end if;
  else
    raise exception 'unsupported_divlab_analysis_content_schema';
  end if;

  select currency into v_version_currency
  from public.divlab_analysis_versions where id = p_analysis_version_id;
  if v_version_currency is null then raise exception 'divlab_analysis_version_not_found'; end if;

  if jsonb_typeof(p_analyst_draft -> 'valuationScenarios') <> 'array'
     or jsonb_array_length(p_analyst_draft -> 'valuationScenarios') <> 3
  then raise exception 'divlab_analysis_content_requires_three_scenarios'; end if;

  for v_scenario in select value from jsonb_array_elements(p_analyst_draft -> 'valuationScenarios') loop
    if jsonb_typeof(v_scenario) <> 'object'
       or nullif(trim(v_scenario ->> 'name'), '') is null
       or upper(trim(coalesce(v_scenario ->> 'currency', ''))) <> upper(trim(v_version_currency))
    then raise exception 'invalid_divlab_analysis_content_scenario'; end if;
  end loop;

  if not exists (select 1 from jsonb_array_elements(p_analyst_draft -> 'valuationScenarios') s(value) where s.value ->> 'name' = 'bear')
     or not exists (select 1 from jsonb_array_elements(p_analyst_draft -> 'valuationScenarios') s(value) where s.value ->> 'name' = 'base')
     or not exists (select 1 from jsonb_array_elements(p_analyst_draft -> 'valuationScenarios') s(value) where s.value ->> 'name' = 'bull')
  then raise exception 'divlab_analysis_content_requires_bear_base_bull'; end if;

  for v_source_id_json in select value from jsonb_path_query(p_analyst_draft, '$.**.sourceIds[*]') source_ids(value) loop
    if jsonb_typeof(v_source_id_json) <> 'string' then raise exception 'invalid_divlab_analysis_content_source_id'; end if;
    v_source_id := v_source_id_json #>> '{}';
    if nullif(trim(v_source_id), '') is null or not exists (
      select 1 from public.divlab_analysis_sources
      where analysis_version_id = p_analysis_version_id and source_key = v_source_id
    ) then raise exception 'divlab_analysis_content_unknown_source_id'; end if;
  end loop;

  if not exists (
    select 1
    from jsonb_path_query(p_analyst_draft, '$.latestReport[*].sourceIds[*]') source_ids(value)
    join public.divlab_analysis_sources source
      on source.analysis_version_id = p_analysis_version_id
     and source.source_key = (source_ids.value #>> '{}')
    where source.primary_source = true
  ) then raise exception 'divlab_analysis_content_latest_report_requires_primary_source'; end if;

  if coalesce((p_ai_usage ->> 'inputTokens')::numeric, -1) < 0
     or coalesce((p_ai_usage ->> 'outputTokens')::numeric, -1) < 0
     or coalesce((p_ai_usage ->> 'totalTokens')::numeric, -1) < 0
     or coalesce((p_ai_usage ->> 'estimatedCostUsdMicros')::numeric, -1) < 0
  then raise exception 'invalid_divlab_analysis_content_usage'; end if;

  insert into public.divlab_analysis_contents (
    analysis_version_id, schema_version, analyst_model, analyst_draft, ai_usage,
    generated_at, analyst_quality_gate_version, analyst_quality_gate
  ) values (
    p_analysis_version_id, trim(p_schema_version), trim(p_analyst_model), p_analyst_draft,
    p_ai_usage, coalesce(p_generated_at, now()), trim(p_analyst_quality_gate_version), p_analyst_quality_gate
  ) returning * into v_content;

  return query select v_content.id, v_content.analysis_version_id, v_content.schema_version,
    v_content.analyst_model, v_content.generated_at, v_content.analyst_quality_gate_version;
end;
$$;

revoke all on function public.persist_divlab_analysis_content(uuid, text, text, jsonb, jsonb, timestamptz, jsonb, text)
from public, anon, authenticated;
grant execute on function public.persist_divlab_analysis_content(uuid, text, text, jsonb, jsonb, timestamptz, jsonb, text)
to service_role;

create or replace function public.publish_divlab_analysis_version(
  p_analysis_id uuid,
  p_version_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_version_number integer;
  v_publishable boolean;
  v_research_packet jsonb;
  v_quality_gate jsonb;
  v_published_at timestamptz;
  v_chart jsonb;
  v_content_quality jsonb;
begin
  if p_analysis_id is null or p_version_id is null then raise exception 'invalid_divlab_analysis_publish_input'; end if;
  perform 1 from public.divlab_analyses where id = p_analysis_id for update;
  if not found then raise exception 'divlab_analysis_not_found'; end if;

  select version_number, publishable, research_packet, quality_gate, published_at
  into v_version_number, v_publishable, v_research_packet, v_quality_gate, v_published_at
  from public.divlab_analysis_versions where id = p_version_id and analysis_id = p_analysis_id for update;
  if v_version_number is null then raise exception 'divlab_analysis_version_not_found'; end if;

  if not coalesce(v_publishable, false)
     or coalesce((v_quality_gate ->> 'publishable')::boolean, false) is not true
     or coalesce((v_quality_gate ->> 'score')::numeric, -1) < 100
     or jsonb_typeof(v_quality_gate -> 'blockers') <> 'array'
     or jsonb_array_length(v_quality_gate -> 'blockers') <> 0
  then raise exception 'divlab_analysis_research_not_publishable'; end if;

  v_chart := v_research_packet -> 'chart';
  if jsonb_typeof(v_chart) <> 'object'
     or coalesce(v_chart ->> 'version', '') <> 'analysis-chart-v1'
     or coalesce(v_chart ->> 'sessions', '') !~ '^[0-9]+$'
     or (v_chart ->> 'sessions')::integer < 30
     or jsonb_typeof(v_chart -> 'bars') <> 'array'
     or jsonb_array_length(v_chart -> 'bars') < 30
     or jsonb_array_length(v_chart -> 'bars') <> (v_chart ->> 'sessions')::integer
  then raise exception 'divlab_analysis_chart_not_publishable'; end if;

  select analyst_quality_gate into v_content_quality
  from public.divlab_analysis_contents
  where analysis_version_id = p_version_id
    and (
      (schema_version = 'analyst-v2' and analyst_quality_gate_version = 'analyst-quality-v1')
      or (schema_version = 'analyst-v3-bank' and analyst_quality_gate_version = 'bank-analyst-quality-v1')
      or (schema_version = 'analyst-v1-financial-specialist' and analyst_quality_gate_version = 'financial-specialist-analyst-quality-v1')
    )
  order by generated_at desc limit 1;

  if v_content_quality is null
     or coalesce((v_content_quality ->> 'publishable')::boolean, false) is not true
     or coalesce((v_content_quality ->> 'score')::numeric, -1) < 100
     or jsonb_typeof(v_content_quality -> 'blockers') <> 'array'
     or jsonb_array_length(v_content_quality -> 'blockers') <> 0
  then raise exception 'divlab_analysis_content_not_publishable'; end if;

  if (select count(*) from public.divlab_analysis_sources where analysis_version_id = p_version_id) < 2
     or not exists (select 1 from public.divlab_analysis_sources where analysis_version_id = p_version_id and primary_source = true)
  then raise exception 'divlab_analysis_sources_not_publishable'; end if;

  if v_published_at is null then
    update public.divlab_analysis_versions set published_at = now()
    where id = p_version_id returning published_at into v_published_at;
  end if;
  update public.divlab_analyses set status = 'published', updated_at = now() where id = p_analysis_id;
  return jsonb_build_object('analysis_id', p_analysis_id, 'version_id', p_version_id,
    'version_number', v_version_number, 'published_at', v_published_at);
end;
$$;

revoke all on function public.publish_divlab_analysis_version(uuid, uuid) from public, anon, authenticated;
grant execute on function public.publish_divlab_analysis_version(uuid, uuid) to service_role;
