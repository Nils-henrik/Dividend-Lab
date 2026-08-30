create or replace function public.founder_publish_divlab_analysis_bundle(
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
  p_analyst_quality_gate_version text,
  p_analyst_quality_gate jsonb,
  p_analyst_model text,
  p_analyst_draft jsonb,
  p_ai_usage jsonb,
  p_generated_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_id uuid;
  v_bundle jsonb;
  v_publication jsonb;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'divlab_analysis_founder_auth_required';
  end if;

  if not exists (
    select 1
    from public.profile_staff_roles
    where user_id = v_user_id
      and role in ('founder', 'ceo_divlab', 'admin')
  ) then
    raise exception 'divlab_analysis_founder_role_required';
  end if;

  -- Reuse the existing immutable persistence transaction and all of its
  -- deterministic source/content validations. No founder-specific bypasses.
  v_bundle := public.persist_divlab_analysis_bundle(
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
    p_sources,
    p_content_schema_version,
    p_analyst_quality_gate_version,
    p_analyst_quality_gate,
    p_analyst_model,
    p_analyst_draft,
    p_ai_usage,
    p_generated_at
  );

  -- Publication remains guarded by the ordinary 100/100 research + Analyst
  -- gate, immutable chart checks, source count and primary-source requirement.
  -- Because both calls are inside this wrapper transaction, any publication
  -- failure rolls the new analysis/version/content rows back as well.
  v_publication := public.publish_divlab_analysis_version(
    (v_bundle ->> 'analysis_id')::uuid,
    (v_bundle ->> 'version_id')::uuid
  );

  return v_bundle || v_publication;
end;
$$;

revoke all on function public.founder_publish_divlab_analysis_bundle(
  text, text, text, text, text, timestamptz, text, numeric, jsonb, jsonb,
  boolean, jsonb, text, text, jsonb, text, jsonb, jsonb, timestamptz
) from public, anon, authenticated;

grant execute on function public.founder_publish_divlab_analysis_bundle(
  text, text, text, text, text, timestamptz, text, numeric, jsonb, jsonb,
  boolean, jsonb, text, text, jsonb, text, jsonb, jsonb, timestamptz
) to authenticated;
