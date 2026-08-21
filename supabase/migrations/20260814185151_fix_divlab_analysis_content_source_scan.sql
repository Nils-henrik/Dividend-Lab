create or replace function public.persist_divlab_analysis_content(
  p_analysis_version_id uuid,
  p_schema_version text,
  p_analyst_model text,
  p_analyst_draft jsonb,
  p_ai_usage jsonb,
  p_generated_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_content_id uuid;
  v_version_currency text;
  v_scenario jsonb;
  v_source_id_json jsonb;
  v_source_id text;
  v_scenario_names text[] := array[]::text[];
  v_latest_report_has_primary_source boolean := false;
begin
  if p_analysis_version_id is null
     or nullif(trim(p_schema_version), '') is null
     or nullif(trim(p_analyst_model), '') is null
     or p_analyst_draft is null
     or jsonb_typeof(p_analyst_draft) <> 'object'
     or p_ai_usage is null
     or jsonb_typeof(p_ai_usage) <> 'object'
     or p_generated_at is null
  then
    raise exception 'invalid_divlab_analysis_content_input';
  end if;

  select currency
  into v_version_currency
  from public.divlab_analysis_versions
  where id = p_analysis_version_id;

  if v_version_currency is null then
    raise exception 'divlab_analysis_version_not_found';
  end if;

  if jsonb_typeof(p_analyst_draft -> 'valuationScenarios') <> 'array'
     or jsonb_array_length(p_analyst_draft -> 'valuationScenarios') <> 3
  then
    raise exception 'divlab_analysis_content_requires_three_scenarios';
  end if;

  for v_scenario in
    select value from jsonb_array_elements(p_analyst_draft -> 'valuationScenarios')
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
    select source_ref
    from jsonb_path_query(p_analyst_draft, '$.**.sourceIds[*]') as source_refs(source_ref)
  loop
    if jsonb_typeof(v_source_id_json) <> 'string' then
      raise exception 'invalid_divlab_analysis_content_source_id';
    end if;
    v_source_id := v_source_id_json #>> '{}';
    if nullif(trim(v_source_id), '') is null
       or not exists (
         select 1
         from public.divlab_analysis_sources
         where analysis_version_id = p_analysis_version_id
           and source_key = v_source_id
       )
    then
      raise exception 'divlab_analysis_content_unknown_source_id';
    end if;
  end loop;

  select exists (
    select 1
    from jsonb_path_query(p_analyst_draft, '$.latestReport[*].sourceIds[*]') as ids(value)
    join public.divlab_analysis_sources source
      on source.analysis_version_id = p_analysis_version_id
     and source.source_key = (ids.value #>> '{}')
    where source.primary_source = true
  ) into v_latest_report_has_primary_source;

  if not v_latest_report_has_primary_source then
    raise exception 'divlab_analysis_content_latest_report_requires_primary_source';
  end if;

  if coalesce((p_ai_usage ->> 'inputTokens')::numeric, -1) < 0
     or coalesce((p_ai_usage ->> 'outputTokens')::numeric, -1) < 0
     or coalesce((p_ai_usage ->> 'totalTokens')::numeric, -1) < 0
     or coalesce((p_ai_usage ->> 'estimatedCostUsdMicros')::numeric, -1) < 0
  then
    raise exception 'invalid_divlab_analysis_content_usage';
  end if;

  insert into public.divlab_analysis_contents (
    analysis_version_id,
    schema_version,
    analyst_model,
    analyst_draft,
    ai_usage,
    generated_at
  ) values (
    p_analysis_version_id,
    trim(p_schema_version),
    trim(p_analyst_model),
    p_analyst_draft,
    p_ai_usage,
    p_generated_at
  )
  returning id into v_content_id;

  return jsonb_build_object(
    'content_id', v_content_id,
    'analysis_version_id', p_analysis_version_id,
    'schema_version', trim(p_schema_version)
  );
end;
$$;

revoke all on function public.persist_divlab_analysis_content(
  uuid, text, text, jsonb, jsonb, timestamptz
) from public, anon, authenticated;
grant execute on function public.persist_divlab_analysis_content(
  uuid, text, text, jsonb, jsonb, timestamptz
) to service_role;
