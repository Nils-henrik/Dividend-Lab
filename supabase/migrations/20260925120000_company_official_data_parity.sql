-- Generic company facts, ownership snapshots and public baseline refresh.
--
-- Apply after 20260924223000_seed_omxs30_completion_company_sources.sql.
-- This migration does not run ingestion and does not modify follows.
-- service_role writes. anon/authenticated may only read active official rows.

alter table public.company_sources
  add column if not exists support_mode text not null default 'automated',
  add column if not exists last_success_at timestamptz,
  add column if not exists last_failure_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'company_sources_support_mode_check'
  ) then
    alter table public.company_sources
      add constraint company_sources_support_mode_check
      check (support_mode in ('automated', 'source_link_only', 'blocked'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'company_sources_last_failure_reason_length'
  ) then
    alter table public.company_sources
      add constraint company_sources_last_failure_reason_length
      check (last_failure_reason is null or char_length(last_failure_reason) <= 160);
  end if;
end $$;

alter table public.company_sources drop constraint if exists company_sources_type_check;
alter table public.company_sources
  add constraint company_sources_type_check check (
    source_type in (
      'company_home',
      'press_releases',
      'financial_reports',
      'financial_calendar',
      'management',
      'ownership',
      'dividend'
    )
  );

alter table public.company_ingestion_jobs drop constraint if exists company_ingestion_jobs_type_check;
alter table public.company_ingestion_jobs
  add constraint company_ingestion_jobs_type_check check (
    job_type in ('initial_sync', 'baseline_refresh')
  );

create index if not exists company_sources_baseline_idx
  on public.company_sources (company_id, support_mode, last_checked_at)
  where is_active = true and is_official = true;

create table if not exists public.company_facts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  fact_type text not null,
  value_text text,
  value_numeric numeric,
  unit text,
  as_of date,
  source_url text not null,
  source_publisher text not null,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_facts_type_check check (
    fact_type in ('ceo', 'dividend_per_share', 'dividend_currency', 'dividend_year')
  ),
  constraint company_facts_value_text_length check (
    value_text is null or char_length(value_text) between 1 and 160
  ),
  constraint company_facts_unit_length check (
    unit is null or char_length(unit) between 1 and 16
  ),
  constraint company_facts_source_url_https check (source_url ~ '^https://'),
  constraint company_facts_publisher_length check (
    char_length(source_publisher) between 1 and 160
  ),
  constraint company_facts_value_present check (
    value_text is not null or value_numeric is not null
  ),
  unique (company_id, fact_type)
);

create table if not exists public.company_ownership (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_name text not null,
  capital_pct numeric not null,
  votes_pct numeric,
  as_of date,
  source_url text not null,
  source_publisher text not null,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_ownership_owner_name_length check (
    char_length(owner_name) between 1 and 200
  ),
  constraint company_ownership_capital_pct_range check (
    capital_pct >= 0 and capital_pct <= 100
  ),
  constraint company_ownership_votes_pct_range check (
    votes_pct is null or (votes_pct >= 0 and votes_pct <= 100)
  ),
  constraint company_ownership_source_url_https check (source_url ~ '^https://'),
  constraint company_ownership_publisher_length check (
    char_length(source_publisher) between 1 and 160
  ),
  unique (company_id, owner_name)
);

drop trigger if exists company_facts_set_updated_at on public.company_facts;
create trigger company_facts_set_updated_at
  before update on public.company_facts
  for each row execute function public.set_updated_at();

drop trigger if exists company_ownership_set_updated_at on public.company_ownership;
create trigger company_ownership_set_updated_at
  before update on public.company_ownership
  for each row execute function public.set_updated_at();

alter table public.company_facts enable row level security;
alter table public.company_ownership enable row level security;

revoke all on table public.company_facts from anon, authenticated;
revoke all on table public.company_ownership from anon, authenticated;
grant select on table public.company_facts to anon, authenticated;
grant select on table public.company_ownership to anon, authenticated;
grant all on table public.company_facts to service_role;
grant all on table public.company_ownership to service_role;

drop policy if exists company_facts_public_read on public.company_facts;
create policy company_facts_public_read
  on public.company_facts
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.companies
      where companies.id = company_facts.company_id
        and companies.is_active = true
    )
  );

drop policy if exists company_ownership_public_read on public.company_ownership;
create policy company_ownership_public_read
  on public.company_ownership
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.companies
      where companies.id = company_ownership.company_id
        and companies.is_active = true
    )
  );

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
    ('investor', 'management', 'Investor AB', 'https://www.investorab.com/about-investor/board-management/executive-leadership-team', 'automated'),
    ('investor', 'ownership', 'Investor AB', 'https://www.investorab.com/investors-media/the-investor-share/ownership-structure', 'automated'),
    ('investor', 'dividend', 'Investor AB', 'https://www.investorab.com/investors-media/the-investor-share/dividend-and-dividend-policy', 'automated'),
    ('essity', 'press_releases', 'Essity', 'https://www.essity.com/media/press-releases/', 'automated'),
    ('essity', 'financial_reports', 'Essity', 'https://www.essity.com/investors/financial-reports/interim-reports/', 'automated'),
    ('essity', 'financial_calendar', 'Essity', 'https://www.essity.com/investors/calendar/', 'automated'),
    ('hm', 'press_releases', 'H&M Group', 'https://hmgroup.com/media/news/', 'automated'),
    ('hm', 'financial_reports', 'H&M Group', 'https://hmgroup.com/investors/', 'automated'),
    ('hm', 'financial_calendar', 'H&M Group', 'https://hmgroup.com/investors/financial-calendar/', 'automated'),
    ('alfa-laval', 'press_releases', 'Alfa Laval', 'https://www.alfalaval.com/media/newsroom/', 'automated'),
    ('alfa-laval', 'financial_reports', 'Alfa Laval', 'https://www.alfalaval.com/media/newsroom/', 'automated'),
    ('alfa-laval', 'financial_calendar', 'Alfa Laval', 'https://www.alfalaval.com/investors/', 'source_link_only'),
    ('assa-abloy', 'press_releases', 'ASSA ABLOY', 'https://www.assaabloy.com/group/en/news-media/press-releases', 'automated'),
    ('assa-abloy', 'financial_reports', 'ASSA ABLOY', 'https://www.assaabloy.com/group/en/investors/reports-presentations/interim-reports', 'automated'),
    ('assa-abloy', 'financial_calendar', 'ASSA ABLOY', 'https://www.assaabloy.com/group/en/investors/events-calendar', 'source_link_only'),
    ('handelsbanken', 'press_releases', 'Handelsbanken', 'https://www.handelsbanken.com/en/press-and-news/press-releases', 'source_link_only'),
    ('handelsbanken', 'financial_reports', 'Handelsbanken', 'https://www.handelsbanken.com/en/investor-relations', 'automated'),
    ('handelsbanken', 'financial_calendar', 'Handelsbanken', 'https://www.handelsbanken.com/en/investor-relations', 'automated'),
    ('abb', 'press_releases', 'ABB', 'https://global.abb/group/en', 'source_link_only'),
    ('abb', 'financial_reports', 'ABB', 'https://global.abb/group/en', 'source_link_only'),
    ('abb', 'financial_calendar', 'ABB', 'https://global.abb/group/en', 'source_link_only'),
    ('boliden', 'press_releases', 'Boliden', 'https://www.boliden.com/investor-relations/', 'blocked'),
    ('boliden', 'financial_reports', 'Boliden', 'https://www.boliden.com/investor-relations/', 'blocked'),
    ('boliden', 'financial_calendar', 'Boliden', 'https://www.boliden.com/investor-relations/', 'blocked'),
    ('epiroc', 'press_releases', 'Epiroc', 'https://www.epirocgroup.com/en/investors', 'blocked'),
    ('epiroc', 'financial_reports', 'Epiroc', 'https://www.epirocgroup.com/en/investors', 'blocked'),
    ('epiroc', 'financial_calendar', 'Epiroc', 'https://www.epirocgroup.com/en/investors', 'blocked'),
    ('hexagon', 'press_releases', 'Hexagon', 'https://hexagon.com/investors', 'blocked'),
    ('hexagon', 'financial_reports', 'Hexagon', 'https://hexagon.com/investors', 'blocked'),
    ('hexagon', 'financial_calendar', 'Hexagon', 'https://hexagon.com/investors', 'blocked'),
    ('skanska', 'press_releases', 'Skanska', 'https://www.skanska.com/investors/', 'blocked'),
    ('skanska', 'financial_reports', 'Skanska', 'https://www.skanska.com/investors/', 'blocked'),
    ('skanska', 'financial_calendar', 'Skanska', 'https://www.skanska.com/investors/', 'blocked'),
    ('industrivarden', 'press_releases', 'Industrivärden', 'https://www.industrivarden.se/media/Pressmeddelanden/', 'source_link_only'),
    ('industrivarden', 'financial_reports', 'Industrivärden', 'https://www.industrivarden.se/', 'source_link_only'),
    ('industrivarden', 'financial_calendar', 'Industrivärden', 'https://www.industrivarden.se/investerare/Kalender/', 'source_link_only'),
    ('lifco', 'press_releases', 'Lifco', 'https://www.lifco.se/investors/', 'source_link_only'),
    ('lifco', 'financial_reports', 'Lifco', 'https://www.lifco.se/investors/', 'source_link_only'),
    ('lifco', 'financial_calendar', 'Lifco', 'https://www.lifco.se/investors/', 'source_link_only'),
    ('nordea', 'press_releases', 'Nordea', 'https://www.nordea.com/en/investors', 'source_link_only'),
    ('nordea', 'financial_reports', 'Nordea', 'https://www.nordea.com/en/investors', 'source_link_only'),
    ('nordea', 'financial_calendar', 'Nordea', 'https://www.nordea.com/en/investors', 'source_link_only'),
    ('seb', 'press_releases', 'SEB', 'https://sebgroup.com/investor-relations', 'source_link_only'),
    ('seb', 'financial_reports', 'SEB', 'https://sebgroup.com/investor-relations', 'source_link_only'),
    ('seb', 'financial_calendar', 'SEB', 'https://sebgroup.com/investor-relations', 'source_link_only'),
    ('skf', 'press_releases', 'SKF', 'https://www.skf.com/group/investors', 'source_link_only'),
    ('skf', 'financial_reports', 'SKF', 'https://www.skf.com/group/investors', 'source_link_only'),
    ('skf', 'financial_calendar', 'SKF', 'https://www.skf.com/group/investors', 'source_link_only'),
    ('swedbank', 'press_releases', 'Swedbank', 'https://www.swedbank.com/investor-relations.html', 'source_link_only'),
    ('swedbank', 'financial_reports', 'Swedbank', 'https://www.swedbank.com/investor-relations.html', 'source_link_only'),
    ('swedbank', 'financial_calendar', 'Swedbank', 'https://www.swedbank.com/investor-relations.html', 'source_link_only'),
    ('tele2', 'press_releases', 'Tele2', 'https://www.tele2.com/investors', 'source_link_only'),
    ('tele2', 'financial_reports', 'Tele2', 'https://www.tele2.com/investors', 'source_link_only'),
    ('tele2', 'financial_calendar', 'Tele2', 'https://www.tele2.com/investors', 'source_link_only'),
    ('telia', 'press_releases', 'Telia', 'https://www.teliacompany.com/en/investors', 'source_link_only'),
    ('telia', 'financial_reports', 'Telia', 'https://www.teliacompany.com/en/investors', 'source_link_only'),
    ('telia', 'financial_calendar', 'Telia', 'https://www.teliacompany.com/en/investors', 'source_link_only')
) as source(slug, source_type, publisher, source_url, support_mode)
join public.companies as company on company.slug = source.slug
on conflict (company_id, source_type, source_url) do update
  set support_mode = excluded.support_mode,
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
  -- The route drains that batch inside a shared 45s budget.
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
        ) then 0
        else 1
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
