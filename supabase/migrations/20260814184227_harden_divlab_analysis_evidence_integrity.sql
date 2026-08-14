create or replace function public.persist_divlab_analysis_version(
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
  p_sources jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_analysis_id uuid;
  v_version_number integer;
  v_version_id uuid;
  v_source jsonb;
  v_evidence jsonb;
  v_publishable boolean := coalesce(p_publishable, false);
  v_primary_evidence_ok boolean := false;
begin
  if nullif(trim(p_instrument_symbol), '') is null
     or nullif(trim(p_exchange), '') is null
     or nullif(trim(p_instrument_name), '') is null
     or nullif(trim(p_slug), '') is null
     or nullif(trim(p_engine_version), '') is null
     or p_data_as_of is null
     or nullif(trim(p_currency), '') is null
     or p_current_price is null
     or p_current_price <= 0
     or p_research_packet is null
     or jsonb_typeof(p_research_packet) <> 'object'
     or p_quality_gate is null
     or jsonb_typeof(p_quality_gate) <> 'object'
     or jsonb_typeof(coalesce(p_sources, '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p_research_packet -> 'evidence', '[]'::jsonb)) <> 'array'
  then
    raise exception 'invalid_divlab_analysis_input';
  end if;

  if p_research_packet -> 'qualityGate' is distinct from p_quality_gate
     or trim(coalesce(p_research_packet ->> 'version', '')) <> trim(p_engine_version)
     or upper(trim(coalesce(p_research_packet #>> '{instrument,symbol}', ''))) <> upper(trim(p_instrument_symbol))
     or upper(trim(coalesce(p_research_packet #>> '{instrument,exchange}', ''))) <> upper(trim(p_exchange))
     or upper(trim(coalesce(p_research_packet #>> '{instrument,currency}', ''))) <> upper(trim(p_currency))
     or coalesce((p_quality_gate ->> 'publishable')::boolean, false) <> v_publishable
     or coalesce(p_research_packet -> 'sources', '[]'::jsonb) <> coalesce(p_sources, '[]'::jsonb)
  then
    raise exception 'inconsistent_divlab_analysis_packet';
  end if;

  -- Every retained evidence item must be structurally valid and point to one of
  -- the exact source ids persisted for the same immutable analysis version.
  for v_evidence in
    select value
    from jsonb_array_elements(coalesce(p_research_packet -> 'evidence', '[]'::jsonb))
  loop
    if jsonb_typeof(v_evidence) <> 'object'
       or nullif(trim(coalesce(v_evidence ->> 'id', '')), '') is null
       or nullif(trim(coalesce(v_evidence ->> 'sourceId', '')), '') is null
       or nullif(trim(coalesce(v_evidence ->> 'kind', '')), '') is null
       or nullif(trim(coalesce(v_evidence ->> 'title', '')), '') is null
       or nullif(trim(coalesce(v_evidence ->> 'content', '')), '') is null
       or nullif(trim(coalesce(v_evidence ->> 'publishedAt', '')), '') is null
       or not exists (
         select 1
         from jsonb_array_elements(coalesce(p_sources, '[]'::jsonb)) as source_item(value)
         where source_item.value ->> 'id' = v_evidence ->> 'sourceId'
       )
    then
      raise exception 'invalid_divlab_analysis_evidence';
    end if;
  end loop;

  select exists (
    select 1
    from jsonb_array_elements(coalesce(p_research_packet -> 'evidence', '[]'::jsonb)) as evidence_item(value)
    join jsonb_array_elements(coalesce(p_sources, '[]'::jsonb)) as source_item(value)
      on source_item.value ->> 'id' = evidence_item.value ->> 'sourceId'
    where evidence_item.value ->> 'kind' = 'official_report_excerpt'
      and coalesce((evidence_item.value ->> 'primary')::boolean, false) = true
      and coalesce((evidence_item.value ->> 'documentRetrieved')::boolean, false) = true
      and length(trim(coalesce(evidence_item.value ->> 'content', ''))) >= 200
      and coalesce((source_item.value ->> 'primary')::boolean, false) = true
  ) into v_primary_evidence_ok;

  if v_publishable and (
    not v_primary_evidence_ok
    or coalesce((p_quality_gate #>> '{checks,primaryEvidenceCoverage}')::boolean, false) = false
  ) then
    raise exception 'publishable_divlab_analysis_requires_primary_evidence';
  end if;

  insert into public.divlab_analyses (
    instrument_symbol,
    exchange,
    instrument_name,
    slug,
    status,
    updated_at
  ) values (
    upper(trim(p_instrument_symbol)),
    upper(trim(p_exchange)),
    trim(p_instrument_name),
    trim(p_slug),
    'draft',
    now()
  )
  on conflict (instrument_symbol, exchange)
  do update set
    instrument_name = excluded.instrument_name,
    updated_at = now()
  returning id into v_analysis_id;

  perform 1
  from public.divlab_analyses
  where id = v_analysis_id
  for update;

  select coalesce(max(version_number), 0) + 1
  into v_version_number
  from public.divlab_analysis_versions
  where analysis_id = v_analysis_id;

  insert into public.divlab_analysis_versions (
    analysis_id,
    version_number,
    engine_version,
    data_as_of,
    currency,
    current_price,
    research_packet,
    quality_gate,
    publishable
  ) values (
    v_analysis_id,
    v_version_number,
    trim(p_engine_version),
    p_data_as_of,
    upper(trim(p_currency)),
    p_current_price,
    p_research_packet,
    p_quality_gate,
    v_publishable
  )
  returning id into v_version_id;

  for v_source in
    select value from jsonb_array_elements(coalesce(p_sources, '[]'::jsonb))
  loop
    if jsonb_typeof(v_source) <> 'object'
       or nullif(trim(coalesce(v_source ->> 'id', '')), '') is null
       or nullif(trim(coalesce(v_source ->> 'kind', '')), '') is null
       or nullif(trim(coalesce(v_source ->> 'publisher', '')), '') is null
       or nullif(trim(coalesce(v_source ->> 'url', '')), '') is null
       or nullif(trim(coalesce(v_source ->> 'publishedAt', '')), '') is null
       or nullif(trim(coalesce(v_source ->> 'verifiedAt', '')), '') is null
    then
      raise exception 'invalid_divlab_analysis_source';
    end if;

    insert into public.divlab_analysis_sources (
      analysis_version_id,
      source_key,
      kind,
      publisher,
      source_url,
      published_at,
      verified_at,
      primary_source
    ) values (
      v_version_id,
      v_source ->> 'id',
      v_source ->> 'kind',
      v_source ->> 'publisher',
      v_source ->> 'url',
      (v_source ->> 'publishedAt')::timestamptz,
      (v_source ->> 'verifiedAt')::timestamptz,
      coalesce((v_source ->> 'primary')::boolean, false)
    );
  end loop;

  return jsonb_build_object(
    'analysis_id', v_analysis_id,
    'version_id', v_version_id,
    'version_number', v_version_number,
    'publishable', v_publishable
  );
end;
$$;

revoke all on function public.persist_divlab_analysis_version(
  text, text, text, text, text, timestamptz, text, numeric, jsonb, jsonb, boolean, jsonb
) from public, anon, authenticated;
grant execute on function public.persist_divlab_analysis_version(
  text, text, text, text, text, timestamptz, text, numeric, jsonb, jsonb, boolean, jsonb
) to service_role;
