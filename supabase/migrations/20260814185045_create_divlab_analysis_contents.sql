create table if not exists public.divlab_analysis_contents (
  id uuid primary key default gen_random_uuid(),
  analysis_version_id uuid not null unique references public.divlab_analysis_versions(id) on delete cascade,
  schema_version text not null,
  analyst_model text not null,
  analyst_draft jsonb not null,
  ai_usage jsonb not null,
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(analyst_draft) = 'object'),
  check (jsonb_typeof(ai_usage) = 'object')
);

alter table public.divlab_analysis_contents enable row level security;

revoke all on public.divlab_analysis_contents from public, anon, authenticated;
revoke all on public.divlab_analysis_contents from service_role;
grant select, insert on public.divlab_analysis_contents to service_role;

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

  -- Validate every nested sourceIds reference against sources persisted for the
  -- exact same immutable analysis version. JSONPath recursive descent catches
  -- claims, quality factors and valuation scenarios without relying on UI shape.
  for v_source_id_json in
    select value from jsonb_path_query(p_analyst_draft, '$.**.sourceIds[*]')
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

create or replace function public.persist_divlab_analysis_bundle(
  p_instrument_symbol text,
  p_exchange text,
  p_instrument_name text,
  p_slug text,
  p_engine_version text,
  p_data_as_of timestamptz,
  p_currency text,
  p_current_price numeric,
  p_research_packet jsonb,
  p_quality_gate jsonb,
  p_publishable boolean,
  p_sources jsonb,
  p_content_schema_version text,
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
  v_version_result jsonb;
  v_content_result jsonb;
begin
  -- Both writes occur in this RPC transaction. Any content validation failure
  -- rolls back the newly inserted research version and its source rows too.
  v_version_result := public.persist_divlab_analysis_version(
    p_instrument_symbol,
    p_exchange,
    p_instrument_name,
    p_slug,
    p_engine_version,
    p_data_as_of,
    p_currency,
    p_current_price,
    p_research_packet,
    p_quality_gate,
    p_publishable,
    p_sources
  );

  v_content_result := public.persist_divlab_analysis_content(
    (v_version_result ->> 'version_id')::uuid,
    p_content_schema_version,
    p_analyst_model,
    p_analyst_draft,
    p_ai_usage,
    p_generated_at
  );

  return v_version_result || v_content_result;
end;
$$;

revoke all on function public.persist_divlab_analysis_bundle(
  text, text, text, text, text, timestamptz, text, numeric, jsonb, jsonb,
  boolean, jsonb, text, text, jsonb, jsonb, timestamptz
) from public, anon, authenticated;
grant execute on function public.persist_divlab_analysis_bundle(
  text, text, text, text, text, timestamptz, text, numeric, jsonb, jsonb,
  boolean, jsonb, text, text, jsonb, jsonb, timestamptz
) to service_role;
