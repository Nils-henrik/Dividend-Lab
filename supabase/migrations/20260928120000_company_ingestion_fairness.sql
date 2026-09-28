-- Company ingestion fairness. Apply after 20260925120000_company_official_data_parity.sql.
-- This file does not start a crawl and must not be applied from the agent runtime.

update public.company_sources as source
set source_url = 'https://www.atlascopcogroup.com/en/media-new/press-releases'
from public.companies as company
where company.id = source.company_id
  and company.slug = 'atlas-copco'
  and source.source_type = 'press_releases'
  and source.source_url = 'https://www.atlascopcogroup.com/en/media/press-releases';

update public.company_sources as source
set support_mode = 'source_link_only'
from public.companies as company
where company.id = source.company_id
  and company.slug = 'investor'
  and source.source_type in ('press_releases', 'financial_calendar')
  and source.support_mode = 'automated';

insert into public.company_sources (
  company_id,
  source_type,
  publisher,
  source_url,
  is_official,
  is_active,
  support_mode
)
select
  company.id,
  source.source_type,
  source.publisher,
  source.source_url,
  true,
  true,
  source.support_mode
from (
  values
    ('addtech', 'management', 'Addtech', 'https://www.addtech.com/this-is-addtech/executive-management', 'automated'),
    ('addtech', 'ownership', 'Addtech', 'https://www.addtech.com/investors-and-media/the-share/owners', 'automated'),
    ('volvo', 'management', 'Volvo Group', 'https://www.volvogroup.com/en/investors/corporate-governance/ceo-and-group-executive-board.html', 'automated'),
    ('saab', 'management', 'Saab', 'https://www.saab.com/about/company-in-brief/group-management', 'automated'),
    ('sandvik', 'management', 'Sandvik', 'https://www.home.sandvik/en/investors/corporate-governance/group-executive-management/', 'automated'),
    ('hm', 'management', 'H&M Group', 'https://hmgroup.com/about-us/corporate-governance/ceo/', 'automated'),
    ('hm', 'ownership', 'H&M Group', 'https://hmgroup.com/investors/shareholders/', 'automated'),
    ('hm', 'dividend', 'H&M Group', 'https://hmgroup.com/investors/dividend/', 'automated'),
    ('evolution', 'management', 'Evolution', 'https://www.evolution.com/investors/corporate-governance/group-management', 'automated'),
    ('evolution', 'ownership', 'Evolution', 'https://www.evolution.com/investors/share-information/shareholder-structure', 'automated'),
    ('atlas-copco', 'management', 'Atlas Copco Group', 'https://www.atlascopcogroup.com/en/investors/corporate-governance/management-and-remuneration/meet-our-president-and-ceo', 'automated'),
    ('atlas-copco', 'ownership', 'Atlas Copco Group', 'https://www.atlascopcogroup.com/en/investors/atlas-copco-ab-share/shareholders', 'automated'),
    ('essity', 'management', 'Essity', 'https://www.essity.com/company/organization-and-management/executive-management-team/', 'automated')
) as source(slug, source_type, publisher, source_url, support_mode)
join public.companies as company on company.slug = source.slug
on conflict (company_id, source_type, source_url) do update
  set support_mode = excluded.support_mode,
      publisher = excluded.publisher,
      is_official = true,
      is_active = true;

create or replace function public.claim_company_ingestion_job(
  p_supported_company_slugs text[] default null
)
returns table (
  job_id uuid,
  company_id uuid,
  job_type text,
  attempts integer
)
language sql
security invoker
set search_path = ''
as $$
  with next_job as (
    select job.id
    from public.company_ingestion_jobs as job
    join public.companies as company
      on company.id = job.company_id
    where job.status = 'pending'
      and job.available_at <= now()
      and (
        p_supported_company_slugs is null
        or company.slug = any(p_supported_company_slugs)
      )
      and (
        job.job_type = 'baseline_refresh'
        or exists (
          select 1
          from public.company_follows as follow
          where follow.company_id = job.company_id
        )
      )
    order by
      case
        when exists (
          select 1
          from public.company_sources as source
          where source.company_id = job.company_id
            and source.is_official = true
            and source.is_active = true
            and source.support_mode = 'automated'
            and source.last_checked_at is null
            and source.last_failure_reason is null
        ) then 0
        when exists (
          select 1
          from public.company_follows as follow
          where follow.company_id = job.company_id
        ) and exists (
          select 1
          from public.company_sources as source
          where source.company_id = job.company_id
            and source.is_official = true
            and source.is_active = true
            and source.support_mode = 'automated'
            and source.last_failure_reason is null
            and (
              source.last_checked_at is null
              or source.last_checked_at < now() - interval '20 hours'
            )
        ) then 1
        when exists (
          select 1
          from public.company_sources as source
          where source.company_id = job.company_id
            and source.is_official = true
            and source.is_active = true
            and source.support_mode = 'automated'
            and source.last_failure_reason is not null
        ) then 2
        else 3
      end,
      case when job.last_error = 'job_deadline_exceeded' then 1 else 0 end,
      case
        when exists (
          select 1
          from public.company_follows as follow
          where follow.company_id = job.company_id
        ) then 0
        else 1
      end,
      job.available_at,
      job.created_at
    for update skip locked
    limit 1
  ),
  claimed_job as (
    update public.company_ingestion_jobs as job
    set
      status = 'processing',
      attempts = job.attempts + 1,
      locked_at = now(),
      last_error = null
    from next_job
    where job.id = next_job.id
    returning
      job.id as job_id,
      job.company_id,
      job.job_type,
      job.attempts
  )
  select
    claimed_job.job_id,
    claimed_job.company_id,
    claimed_job.job_type,
    claimed_job.attempts
  from claimed_job;
$$;

revoke all on function public.claim_company_ingestion_job(text[])
  from public, anon, authenticated;
grant execute on function public.claim_company_ingestion_job(text[])
  to service_role;

create or replace function public.enqueue_stale_company_baseline_refreshes(
  p_supported_company_slugs text[],
  p_limit integer,
  p_stale_after interval
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer;
  v_limit integer;
  v_stale interval;
begin
  -- Hobby cron is once per day. One invocation may enqueue 8 companies.
  -- Never-checked sources come before followed stale sources, then retries.
  v_limit := least(greatest(coalesce(p_limit, 8), 1), 8);
  v_stale := coalesce(p_stale_after, interval '20 hours');
  if v_stale < interval '1 hour' or v_stale > interval '14 days' then
    v_stale := interval '20 hours';
  end if;

  with candidates as (
    select company.id
    from public.companies as company
    where company.is_active = true
      and (
        p_supported_company_slugs is null
        or company.slug = any(p_supported_company_slugs)
      )
      and exists (
        select 1
        from public.company_sources as source
        where source.company_id = company.id
          and source.is_official = true
          and source.is_active = true
          and source.support_mode = 'automated'
          and (
            source.last_checked_at is null
            or source.last_checked_at < now() - v_stale
          )
      )
      and not exists (
        select 1
        from public.company_ingestion_jobs as job
        where job.company_id = company.id
          and job.status in ('pending', 'processing')
      )
    order by
      case
        when exists (
          select 1
          from public.company_sources as source
          where source.company_id = company.id
            and source.is_official = true
            and source.is_active = true
            and source.support_mode = 'automated'
            and source.last_checked_at is null
            and source.last_failure_reason is null
        ) then 0
        when exists (
          select 1
          from public.company_follows as follow
          where follow.company_id = company.id
        ) and exists (
          select 1
          from public.company_sources as source
          where source.company_id = company.id
            and source.is_official = true
            and source.is_active = true
            and source.support_mode = 'automated'
            and source.last_failure_reason is null
            and (
              source.last_checked_at is null
              or source.last_checked_at < now() - v_stale
            )
        ) then 1
        when exists (
          select 1
          from public.company_sources as source
          where source.company_id = company.id
            and source.is_official = true
            and source.is_active = true
            and source.support_mode = 'automated'
            and source.last_failure_reason is not null
            and (
              source.last_checked_at is null
              or source.last_checked_at < now() - v_stale
            )
        ) then 2
        else 3
      end,
      case
        when exists (
          select 1
          from public.company_sources as source
          where source.company_id = company.id
            and source.support_mode = 'automated'
            and source.last_failure_reason = 'job_deadline_exceeded'
        ) then 1
        else 0
      end,
      case
        when exists (
          select 1
          from public.company_follows as follow
          where follow.company_id = company.id
        ) then 0
        else 1
      end,
      (
        select coalesce(min(source.last_checked_at), '-infinity'::timestamptz)
        from public.company_sources as source
        where source.company_id = company.id
          and source.is_active = true
          and source.support_mode = 'automated'
      )
    limit v_limit
  )
  insert into public.company_ingestion_jobs (
    company_id,
    job_type,
    status
  )
  select candidates.id, 'baseline_refresh', 'pending'
  from candidates
  on conflict (company_id, job_type)
    where status in ('pending', 'processing')
    do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.enqueue_stale_company_baseline_refreshes(text[], integer, interval)
  from public, anon, authenticated;
grant execute on function public.enqueue_stale_company_baseline_refreshes(text[], integer, interval)
  to service_role;
