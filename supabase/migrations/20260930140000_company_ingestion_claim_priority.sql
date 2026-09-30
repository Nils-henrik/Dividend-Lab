-- Claim-time priority for the daily company ingestion queue.
-- Apply after 20260929120000_seed_omxs30_crown_company_sources.sql.
-- This file does not start a crawl and must not be applied from the agent runtime.
--
-- The previous claim function ranked a pending row by source tier and then by
-- job.available_at, job.created_at. A company with one new unchecked automated
-- source shared tier 0 with a company whose automated sources had never been
-- checked. The older job row was claimed first. The route then stops once less
-- than 12s of the shared 45s budget remains, so the newer tier-0 jobs stayed
-- at attempts 0.
--
-- Order keys, highest priority first:
--   1. never-checked clean automated source
--   2. followed company with a clean stale automated source
--   3. retryable automated failure
--   4. any other pending job
-- Inside a tier, a job_deadline_exceeded retry sorts after clean work.
-- A company with no checked automated source sorts ahead of a company that
-- already has one. Equal companies rotate by UTC day. Job age is not a key.

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
          from public.company_sources as source
          where source.company_id = job.company_id
            and source.is_official = true
            and source.is_active = true
            and source.support_mode = 'automated'
            and source.last_checked_at is not null
        ) then 1
        else 0
      end,
      (
        (
          coalesce((
            select sum(ascii(substr(company.slug, gs.i, 1))::bigint * gs.i)
            from generate_series(1, char_length(company.slug)) as gs(i)
          ), 0) % 997
        )
        * (
          (
            (
              extract(
                epoch from (
                  date_trunc('day', now() at time zone 'utc') at time zone 'utc'
                )
              )::bigint / 86400
            ) % 996
          ) + 1
        )
      ) % 997,
      company.slug,
      job.id
    for update of job skip locked
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
