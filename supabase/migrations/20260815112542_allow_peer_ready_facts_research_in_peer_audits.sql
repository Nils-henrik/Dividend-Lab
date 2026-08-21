create or replace function public.divlab_peer_research_ready(p_packet jsonb)
returns boolean
language sql
immutable
security invoker
set search_path = public
as $$
  select
    p_packet is not null
    and jsonb_typeof(p_packet) = 'object'
    and p_packet ->> 'version' = 'deep-research-v2'
    and p_packet #>> '{valuationProvenance,version}' = 'valuation-provenance-v1'
    and p_packet #> '{qualityGate,checks,companyClassificationCoverage}' = 'true'::jsonb
    and p_packet #> '{qualityGate,checks,fundamentalMethodologyCoverage}' = 'true'::jsonb
    and p_packet #> '{qualityGate,checks,fundamentalCoverage}' = 'true'::jsonb
    and p_packet #> '{qualityGate,checks,multiYearFundamentalCoverage}' = 'true'::jsonb
    and p_packet #> '{qualityGate,checks,freshPrimarySource}' = 'true'::jsonb
    and p_packet #> '{qualityGate,checks,sourceTraceability}' = 'true'::jsonb
    and p_packet #> '{qualityGate,checks,primaryEvidenceCoverage}' = 'true'::jsonb
    and p_packet #> '{qualityGate,checks,valuationTraceability}' = 'true'::jsonb
    and (
      case when
        p_packet #> '{valuationProvenance,measures,pe,available}' = 'true'::jsonb
        and p_packet #> '{valuationProvenance,measures,pe,traceable}' = 'true'::jsonb
        and jsonb_typeof(p_packet #> '{valuation,trailing,pe}') = 'number'
        and (p_packet #>> '{valuation,trailing,pe}')::numeric > 0
      then 1 else 0 end
      + case when
        p_packet #> '{valuationProvenance,measures,priceToFcf,available}' = 'true'::jsonb
        and p_packet #> '{valuationProvenance,measures,priceToFcf,traceable}' = 'true'::jsonb
        and jsonb_typeof(p_packet #> '{valuation,trailing,priceToFcf}') = 'number'
        and (p_packet #>> '{valuation,trailing,priceToFcf}')::numeric > 0
      then 1 else 0 end
      + case when
        p_packet #> '{valuationProvenance,measures,evToEbit,available}' = 'true'::jsonb
        and p_packet #> '{valuationProvenance,measures,evToEbit,traceable}' = 'true'::jsonb
        and jsonb_typeof(p_packet #> '{valuation,trailing,evToEbit}') = 'number'
        and (p_packet #>> '{valuation,trailing,evToEbit}')::numeric > 0
      then 1 else 0 end
      + case when
        p_packet #> '{valuationProvenance,measures,evToEbitda,available}' = 'true'::jsonb
        and p_packet #> '{valuationProvenance,measures,evToEbitda,traceable}' = 'true'::jsonb
        and jsonb_typeof(p_packet #> '{valuation,trailing,evToEbitda}') = 'number'
        and (p_packet #>> '{valuation,trailing,evToEbitda}')::numeric > 0
      then 1 else 0 end
    ) >= 2;
$$;

revoke all on function public.divlab_peer_research_ready(jsonb) from public, anon, authenticated;
grant execute on function public.divlab_peer_research_ready(jsonb) to service_role;

do $$
declare
  v_definition text;
  v_patched text;
  v_old text := $old$where version_row.id = v_peer_version_id
      and version_row.publishable = true
      and coalesce((version_row.research_packet #>> '{qualityGate,publishable}')::boolean, false) = true;$old$;
  v_new text := $new$where version_row.id = v_peer_version_id
      and (
        (
          version_row.publishable = true
          and version_row.research_packet #> '{qualityGate,publishable}' = 'true'::jsonb
        )
        or public.divlab_peer_research_ready(version_row.research_packet)
      );$new$;
begin
  select pg_get_functiondef('public.persist_divlab_peer_comparison_audit(jsonb)'::regprocedure)
  into v_definition;
  v_patched := replace(v_definition, v_old, v_new);
  if v_patched = v_definition then
    raise exception 'peer_audit_persist_predicate_patch_not_applied';
  end if;
  execute v_patched;
end;
$$;

do $$
declare
  v_definition text;
  v_patched text;
  v_old text := $old$or version_row.engine_version <> 'deep-research-v2'
        or version_row.publishable <> true
        or version_row.research_packet ->> 'version' <> 'deep-research-v2'
        or coalesce((version_row.research_packet #>> '{qualityGate,publishable}')::boolean, false) <> true
        or version_row.research_packet #>> '{valuationProvenance,version}' <> 'valuation-provenance-v1'$old$;
  v_new text := $new$or version_row.engine_version <> 'deep-research-v2'
        or not (
          (
            version_row.publishable = true
            and version_row.research_packet #> '{qualityGate,publishable}' = 'true'::jsonb
          )
          or public.divlab_peer_research_ready(version_row.research_packet)
        )
        or version_row.research_packet ->> 'version' <> 'deep-research-v2'
        or version_row.research_packet #>> '{valuationProvenance,version}' <> 'valuation-provenance-v1'$new$;
begin
  select pg_get_functiondef('public.assert_divlab_peer_comparison_audit_integrity(uuid)'::regprocedure)
  into v_definition;
  v_patched := replace(v_definition, v_old, v_new);
  if v_patched = v_definition then
    raise exception 'peer_audit_integrity_predicate_patch_not_applied';
  end if;
  execute v_patched;
end;
$$;
