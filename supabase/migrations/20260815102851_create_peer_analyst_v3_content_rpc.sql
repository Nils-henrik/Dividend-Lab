create function public.persist_divlab_peer_analysis_content(
  p_analysis_version_id uuid,
  p_peer_audit_id uuid,
  p_analyst_model text,
  p_analyst_draft jsonb,
  p_analyst_quality_gate jsonb,
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
begin
  if p_analysis_version_id is null
     or p_peer_audit_id is null
     or nullif(trim(p_analyst_model), '') is null
     or p_analyst_draft is null
     or jsonb_typeof(p_analyst_draft) <> 'object'
     or p_analyst_quality_gate is null
     or jsonb_typeof(p_analyst_quality_gate) <> 'object'
     or p_ai_usage is null
     or jsonb_typeof(p_ai_usage) <> 'object'
     or p_generated_at is null
  then
    raise exception 'invalid_divlab_peer_analysis_content_input';
  end if;

  insert into public.divlab_analysis_contents (
    analysis_version_id,
    schema_version,
    analyst_quality_gate_version,
    analyst_quality_gate,
    analyst_model,
    analyst_draft,
    ai_usage,
    generated_at,
    peer_audit_id
  ) values (
    p_analysis_version_id,
    'analyst-v3-peer',
    'peer-analyst-quality-v1',
    p_analyst_quality_gate,
    trim(p_analyst_model),
    p_analyst_draft,
    p_ai_usage,
    p_generated_at,
    p_peer_audit_id
  )
  returning id into v_content_id;

  return jsonb_build_object(
    'content_id', v_content_id,
    'analysis_version_id', p_analysis_version_id,
    'peer_audit_id', p_peer_audit_id,
    'schema_version', 'analyst-v3-peer',
    'analyst_quality_gate_version', 'peer-analyst-quality-v1'
  );
end;
$$;

revoke all on function public.persist_divlab_peer_analysis_content(
  uuid, uuid, text, jsonb, jsonb, jsonb, timestamptz
) from public, anon, authenticated;

grant execute on function public.persist_divlab_peer_analysis_content(
  uuid, uuid, text, jsonb, jsonb, jsonb, timestamptz
) to service_role;