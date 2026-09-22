-- Private, service-owned ingestion queue.
--
-- The first follower activates a bounded initial sync when the company has an
-- official source but has never been checked. Authenticated clients never get
-- direct access to this table. Removing the final follower cancels work that
-- has not started yet.

create table public.company_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_type text not null default 'initial_sync',
  status text not null default 'pending',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  completed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_ingestion_jobs_type_check check (
    job_type in ('initial_sync')
  ),
  constraint company_ingestion_jobs_status_check check (
    status in ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),
  constraint company_ingestion_jobs_attempts_check check (
    attempts between 0 and 10
  ),
  constraint company_ingestion_jobs_last_error_length check (
    last_error is null or char_length(last_error) <= 4000
  )
);

create unique index company_ingestion_jobs_one_active_idx
  on public.company_ingestion_jobs (company_id, job_type)
  where status in ('pending', 'processing');

create index company_ingestion_jobs_poll_idx
  on public.company_ingestion_jobs (available_at, created_at)
  where status = 'pending';

create index company_ingestion_jobs_processing_lock_idx
  on public.company_ingestion_jobs (locked_at)
  where status = 'processing';

create trigger company_ingestion_jobs_set_updated_at
  before update on public.company_ingestion_jobs
  for each row execute function public.set_updated_at();

alter table public.company_ingestion_jobs enable row level security;

revoke all on table public.company_ingestion_jobs from anon, authenticated;
grant all on table public.company_ingestion_jobs to service_role;

create or replace function private.enqueue_company_initial_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.company_sources
    where company_sources.company_id = new.company_id
      and company_sources.is_official = true
      and company_sources.is_active = true
  )
  and not exists (
    select 1
    from public.company_sources
    where company_sources.company_id = new.company_id
      and company_sources.last_checked_at is not null
  )
  and not exists (
    select 1
    from public.company_documents
    where company_documents.company_id = new.company_id
  ) then
    insert into public.company_ingestion_jobs (
      company_id,
      job_type,
      status
    )
    values (
      new.company_id,
      'initial_sync',
      'pending'
    )
    on conflict (company_id, job_type)
      where status in ('pending', 'processing')
      do nothing;
  end if;

  return new;
end;
$$;

create or replace function private.cancel_company_initial_sync_without_followers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.company_follows
    where company_follows.company_id = old.company_id
  ) then
    update public.company_ingestion_jobs
    set
      status = 'cancelled',
      completed_at = now(),
      last_error = null
    where company_id = old.company_id
      and job_type = 'initial_sync'
      and status = 'pending';
  end if;

  return old;
end;
$$;

revoke all on function private.enqueue_company_initial_sync()
  from public, anon, authenticated, service_role;
revoke all on function private.cancel_company_initial_sync_without_followers()
  from public, anon, authenticated, service_role;

create trigger company_follows_enqueue_initial_sync
  after insert on public.company_follows
  for each row execute function private.enqueue_company_initial_sync();

create trigger company_follows_cancel_pending_initial_sync
  after delete on public.company_follows
  for each row execute function private.cancel_company_initial_sync_without_followers();

-- Atomically claim one job through PostgREST without granting clients access
-- to the queue table. SECURITY INVOKER preserves the service_role boundary.
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
      and exists (
        select 1
        from public.company_follows as follow
        where follow.company_id = job.company_id
      )
    order by job.available_at, job.created_at
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

-- Recover jobs whose worker disappeared after claiming them. The lease is
-- deliberately longer than the bounded Vercel worker runtime, and exhausted
-- jobs are failed instead of being retried forever.
create or replace function public.recover_stale_company_ingestion_jobs()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  recovered_count integer;
begin
  update public.company_ingestion_jobs
  set
    status = case when attempts >= 3 then 'failed' else 'pending' end,
    available_at = case when attempts >= 3 then available_at else now() end,
    locked_at = null,
    completed_at = case when attempts >= 3 then now() else null end,
    last_error = 'worker_lease_expired'
  where status = 'processing'
    and (
      locked_at is null
      or locked_at <= now() - interval '15 minutes'
    );

  get diagnostics recovered_count = row_count;
  return recovered_count;
end;
$$;

revoke all on function public.recover_stale_company_ingestion_jobs()
  from public, anon, authenticated;
grant execute on function public.recover_stale_company_ingestion_jobs()
  to service_role;
