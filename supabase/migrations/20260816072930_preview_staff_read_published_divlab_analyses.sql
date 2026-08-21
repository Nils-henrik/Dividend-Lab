create policy "DivLab staff can read published analyses"
on public.divlab_analyses
for select
to authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.profile_staff_roles psr
    where psr.user_id = auth.uid()
      and psr.role in ('founder','ceo_divlab','admin')
  )
);

create policy "DivLab staff can read published analysis versions"
on public.divlab_analysis_versions
for select
to authenticated
using (
  publishable = true
  and published_at is not null
  and exists (
    select 1
    from public.divlab_analyses a
    where a.id = divlab_analysis_versions.analysis_id
      and a.status = 'published'
  )
  and exists (
    select 1 from public.profile_staff_roles psr
    where psr.user_id = auth.uid()
      and psr.role in ('founder','ceo_divlab','admin')
  )
);

create policy "DivLab staff can read published analysis contents"
on public.divlab_analysis_contents
for select
to authenticated
using (
  analyst_quality_gate_version = 'analyst-quality-v1'
  and coalesce((analyst_quality_gate ->> 'publishable')::boolean, false) = true
  and coalesce((analyst_quality_gate ->> 'score')::numeric, -1) >= 100
  and jsonb_typeof(analyst_quality_gate -> 'blockers') = 'array'
  and jsonb_array_length(analyst_quality_gate -> 'blockers') = 0
  and exists (
    select 1
    from public.divlab_analysis_versions v
    join public.divlab_analyses a on a.id = v.analysis_id
    where v.id = divlab_analysis_contents.analysis_version_id
      and v.publishable = true
      and v.published_at is not null
      and a.status = 'published'
  )
  and exists (
    select 1 from public.profile_staff_roles psr
    where psr.user_id = auth.uid()
      and psr.role in ('founder','ceo_divlab','admin')
  )
);

create policy "DivLab staff can read published analysis sources"
on public.divlab_analysis_sources
for select
to authenticated
using (
  exists (
    select 1
    from public.divlab_analysis_versions v
    join public.divlab_analyses a on a.id = v.analysis_id
    where v.id = divlab_analysis_sources.analysis_version_id
      and v.publishable = true
      and v.published_at is not null
      and a.status = 'published'
  )
  and exists (
    select 1 from public.profile_staff_roles psr
    where psr.user_id = auth.uid()
      and psr.role in ('founder','ceo_divlab','admin')
  )
);
