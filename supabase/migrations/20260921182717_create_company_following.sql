-- Canonical company domain and private user follows.
--
-- The existing forum_companies table remains a forum catalog. This migration
-- creates a market-facing company model that can later grow beyond the forum
-- without making market data depend on forum ownership or naming.

create extension if not exists pgcrypto;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_code text not null,
  logo_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint companies_name_length check (
    char_length(name) between 1 and 160
  ),
  constraint companies_country_code_format check (
    country_code ~ '^[A-Z]{2}$'
  ),
  constraint companies_logo_path_format check (
    logo_path is null or logo_path like '/%'
  )
);

create index companies_active_name_idx
  on public.companies (is_active, name);

create table public.company_instruments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  symbol text not null,
  exchange_name text not null,
  exchange_mic text,
  currency_code text not null,
  tradingview_symbol text,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_instruments_symbol_length check (
    char_length(symbol) between 1 and 32
  ),
  constraint company_instruments_exchange_name_length check (
    char_length(exchange_name) between 1 and 120
  ),
  constraint company_instruments_exchange_mic_format check (
    exchange_mic is null or exchange_mic ~ '^[A-Z0-9]{4}$'
  ),
  constraint company_instruments_currency_code_format check (
    currency_code ~ '^[A-Z]{3}$'
  ),
  constraint company_instruments_tradingview_symbol_format check (
    tradingview_symbol is null or tradingview_symbol ~ '^[A-Z0-9_.-]+:[A-Z0-9_.-]+$'
  ),
  unique (company_id, exchange_name, symbol)
);

create unique index company_instruments_one_primary_idx
  on public.company_instruments (company_id)
  where is_primary = true;

create index company_instruments_active_symbol_idx
  on public.company_instruments (is_active, symbol);

create table public.company_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source_type text not null,
  publisher text not null,
  source_url text not null,
  is_official boolean not null default true,
  is_active boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_sources_type_check check (
    source_type in (
      'company_home',
      'press_releases',
      'financial_reports',
      'financial_calendar'
    )
  ),
  constraint company_sources_publisher_length check (
    char_length(publisher) between 1 and 160
  ),
  constraint company_sources_url_https check (
    source_url ~ '^https://'
  ),
  unique (company_id, id),
  unique (company_id, source_type, source_url)
);

create index company_sources_active_company_idx
  on public.company_sources (company_id, is_active, source_type);

create table public.company_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source_id uuid,
  document_type text not null,
  title text not null,
  source_url text not null,
  source_publisher text not null,
  published_at timestamptz,
  event_at timestamptz,
  fiscal_period text,
  fetched_at timestamptz not null default now(),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_documents_type_check check (
    document_type in (
      'press_release',
      'quarterly_report',
      'half_year_report',
      'annual_report',
      'report_date'
    )
  ),
  constraint company_documents_title_length check (
    char_length(title) between 1 and 500
  ),
  constraint company_documents_source_url_https check (
    source_url ~ '^https://'
  ),
  constraint company_documents_source_publisher_length check (
    char_length(source_publisher) between 1 and 160
  ),
  constraint company_documents_relevant_date check (
    published_at is not null or event_at is not null
  ),
  constraint company_documents_source_company_fkey
    foreign key (company_id, source_id)
    references public.company_sources(company_id, id)
    on delete cascade,
  unique (company_id, source_url)
);

create index company_documents_company_type_published_idx
  on public.company_documents (company_id, document_type, published_at desc)
  where is_published = true;

create index company_documents_company_event_idx
  on public.company_documents (company_id, event_at)
  where is_published = true and event_at is not null;

create table public.company_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

-- Supports the low-cost ingestion job: only companies with at least one
-- follower need recurring source checks.
create index company_follows_company_created_idx
  on public.company_follows (company_id, created_at);

create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

create trigger company_instruments_set_updated_at
  before update on public.company_instruments
  for each row execute function public.set_updated_at();

create trigger company_sources_set_updated_at
  before update on public.company_sources
  for each row execute function public.set_updated_at();

create trigger company_documents_set_updated_at
  before update on public.company_documents
  for each row execute function public.set_updated_at();

alter table public.companies enable row level security;
alter table public.company_instruments enable row level security;
alter table public.company_sources enable row level security;
alter table public.company_documents enable row level security;
alter table public.company_follows enable row level security;

revoke all on table public.companies from anon, authenticated;
revoke all on table public.company_instruments from anon, authenticated;
revoke all on table public.company_sources from anon, authenticated;
revoke all on table public.company_documents from anon, authenticated;
revoke all on table public.company_follows from anon, authenticated;

grant select on table public.companies to anon, authenticated;
grant select on table public.company_instruments to anon, authenticated;
grant select on table public.company_sources to anon, authenticated;
grant select on table public.company_documents to anon, authenticated;
grant select, insert, delete on table public.company_follows to authenticated;

grant all on table public.companies to service_role;
grant all on table public.company_instruments to service_role;
grant all on table public.company_sources to service_role;
grant all on table public.company_documents to service_role;
grant all on table public.company_follows to service_role;

create policy companies_public_read
  on public.companies
  for select
  to anon, authenticated
  using (is_active = true);

create policy company_instruments_public_read
  on public.company_instruments
  for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.companies
      where companies.id = company_instruments.company_id
        and companies.is_active = true
    )
  );

create policy company_sources_public_read
  on public.company_sources
  for select
  to anon, authenticated
  using (
    is_active = true
    and is_official = true
    and exists (
      select 1
      from public.companies
      where companies.id = company_sources.company_id
        and companies.is_active = true
    )
  );

create policy company_documents_public_read
  on public.company_documents
  for select
  to anon, authenticated
  using (
    is_published = true
    and exists (
      select 1
      from public.companies
      where companies.id = company_documents.company_id
        and companies.is_active = true
    )
  );

create policy company_follows_own_read
  on public.company_follows
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
  );

create policy company_follows_own_insert
  on public.company_follows
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
  );

create policy company_follows_own_delete
  on public.company_follows
  for delete
  to authenticated
  using (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
  );

-- Preserve existing IDs when possible so the later forum adapter can move to
-- this canonical table without an identity translation layer.
insert into public.companies (
  id,
  slug,
  name,
  country_code,
  logo_path,
  is_active,
  created_at,
  updated_at
)
select
  id,
  slug,
  name,
  country_code,
  logo_path,
  is_active,
  created_at,
  updated_at
from public.forum_companies
on conflict (slug) do update
set
  name = excluded.name,
  country_code = excluded.country_code,
  logo_path = excluded.logo_path,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.company_instruments (
  company_id,
  symbol,
  exchange_name,
  exchange_mic,
  currency_code,
  tradingview_symbol,
  is_primary,
  is_active
)
select
  company.id,
  forum_company.primary_ticker,
  forum_company.exchange,
  case
    when forum_company.exchange = 'Nasdaq Stockholm' then 'XSTO'
    when forum_company.exchange = 'Nasdaq' then 'XNAS'
    when forum_company.exchange = 'NYSE' then 'XNYS'
    else null
  end,
  case when forum_company.country_code = 'SE' then 'SEK' else 'USD' end,
  case forum_company.slug
    when 'investor' then 'OMXSTO:INVE_B'
    when 'volvo' then 'OMXSTO:VOLV_B'
    when 'ericsson' then 'OMXSTO:ERIC_B'
    when 'atlas-copco' then 'OMXSTO:ATCO_A'
    when 'astrazeneca' then 'OMXSTO:AZN'
    else null
  end,
  true,
  forum_company.is_active
from public.forum_companies as forum_company
join public.companies as company on company.slug = forum_company.slug
on conflict (company_id, exchange_name, symbol) do update
set
  exchange_mic = excluded.exchange_mic,
  currency_code = excluded.currency_code,
  tradingview_symbol = excluded.tradingview_symbol,
  is_primary = excluded.is_primary,
  is_active = excluded.is_active,
  updated_at = now();
