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
  if p_analysis_id is null or p_version_id is null then
    raise exception 'invalid_divlab_analysis_publish_input';
  end if;

  perform 1
  from public.divlab_analyses
  where id = p_analysis_id
  for update;

  if not found then
    raise exception 'divlab_analysis_not_found';
  end if;

  select
    version_number,
    publishable,
    research_packet,
    quality_gate,
    published_at
  into
    v_version_number,
    v_publishable,
    v_research_packet,
    v_quality_gate,
    v_published_at
  from public.divlab_analysis_versions
  where id = p_version_id
    and analysis_id = p_analysis_id
  for update;

  if v_version_number is null then
    raise exception 'divlab_analysis_version_not_found';
  end if;

  if not coalesce(v_publishable, false)
     or coalesce((v_quality_gate ->> 'publishable')::boolean, false) is not true
     or coalesce((v_quality_gate ->> 'score')::numeric, -1) < 100
     or jsonb_typeof(v_quality_gate -> 'blockers') <> 'array'
     or jsonb_array_length(v_quality_gate -> 'blockers') <> 0
  then
    raise exception 'divlab_analysis_research_not_publishable';
  end if;

  v_chart := v_research_packet -> 'chart';
  if jsonb_typeof(v_chart) <> 'object'
     or coalesce(v_chart ->> 'version', '') <> 'analysis-chart-v1'
     or coalesce(v_chart ->> 'sessions', '') !~ '^[0-9]+$'
     or (v_chart ->> 'sessions')::integer < 30
     or jsonb_typeof(v_chart -> 'bars') <> 'array'
     or jsonb_array_length(v_chart -> 'bars') < 30
     or jsonb_array_length(v_chart -> 'bars') <> (v_chart ->> 'sessions')::integer
  then
    raise exception 'divlab_analysis_chart_not_publishable';
  end if;

  select analyst_quality_gate
  into v_content_quality
  from public.divlab_analysis_contents
  where analysis_version_id = p_version_id
    and schema_version = 'analyst-v2'
    and analyst_quality_gate_version = 'analyst-quality-v1'
  order by generated_at desc
  limit 1;

  if v_content_quality is null
     or coalesce((v_content_quality ->> 'publishable')::boolean, false) is not true
     or coalesce((v_content_quality ->> 'score')::numeric, -1) < 100
     or jsonb_typeof(v_content_quality -> 'blockers') <> 'array'
     or jsonb_array_length(v_content_quality -> 'blockers') <> 0
  then
    raise exception 'divlab_analysis_content_not_publishable';
  end if;

  if (select count(*) from public.divlab_analysis_sources where analysis_version_id = p_version_id) < 2
     or not exists (
       select 1
       from public.divlab_analysis_sources
       where analysis_version_id = p_version_id
         and primary_source = true
     )
  then
    raise exception 'divlab_analysis_sources_not_publishable';
  end if;

  if v_published_at is null then
    update public.divlab_analysis_versions
    set published_at = now()
    where id = p_version_id
    returning published_at into v_published_at;
  end if;

  update public.divlab_analyses
  set status = 'published', updated_at = now()
  where id = p_analysis_id;

  return jsonb_build_object(
    'analysis_id', p_analysis_id,
    'version_id', p_version_id,
    'version_number', v_version_number,
    'published_at', v_published_at
  );
end;
$$;

revoke all on function public.publish_divlab_analysis_version(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.publish_divlab_analysis_version(uuid, uuid)
  to service_role;
