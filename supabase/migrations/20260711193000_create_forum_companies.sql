-- Forum company directory: companies, collections, and memberships.
--
-- primary_ticker is the company's primary display/search ticker for the MVP.
-- One forum entity represents the company, not every listed share class.
-- Alternative securities may be modeled in a later phase.

create table if not exists public.forum_companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  primary_ticker text not null,
  exchange text not null,
  country_code text not null,
  logo_path text null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_companies_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint forum_companies_country_code_format check (
    country_code ~ '^[A-Z]{2}$'
  )
);

create unique index if not exists forum_companies_exchange_primary_ticker_idx
  on public.forum_companies (exchange, primary_ticker);

create index if not exists forum_companies_country_code_sort_order_idx
  on public.forum_companies (country_code, sort_order, name);

create index if not exists forum_companies_active_name_idx
  on public.forum_companies (is_active, name);

drop trigger if exists set_forum_companies_updated_at on public.forum_companies;
create trigger set_forum_companies_updated_at
  before update on public.forum_companies
  for each row
  execute function public.set_updated_at();

create table if not exists public.forum_company_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_code text null,
  collection_type text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint forum_company_collections_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint forum_company_collections_type_check check (
    collection_type in ('index', 'market', 'editorial')
  ),
  constraint forum_company_collections_country_code_format check (
    country_code is null or country_code ~ '^[A-Z]{2}$'
  )
);

create index if not exists forum_company_collections_active_sort_idx
  on public.forum_company_collections (is_active, country_code, sort_order, name);

create table if not exists public.forum_company_collection_members (
  company_id uuid not null references public.forum_companies(id) on delete cascade,
  collection_id uuid not null references public.forum_company_collections(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (company_id, collection_id)
);

create index if not exists forum_company_collection_members_collection_idx
  on public.forum_company_collection_members (collection_id, sort_order);

create index if not exists forum_company_collection_members_company_idx
  on public.forum_company_collection_members (company_id);

alter table public.forum_companies enable row level security;
alter table public.forum_company_collections enable row level security;
alter table public.forum_company_collection_members enable row level security;

drop policy if exists "Active forum companies are publicly readable" on public.forum_companies;
create policy "Active forum companies are publicly readable"
  on public.forum_companies
  for select
  using (is_active = true);

drop policy if exists "Active forum company collections are publicly readable" on public.forum_company_collections;
create policy "Active forum company collections are publicly readable"
  on public.forum_company_collections
  for select
  using (is_active = true);

drop policy if exists "Forum company collection members are publicly readable" on public.forum_company_collection_members;
create policy "Forum company collection members are publicly readable"
  on public.forum_company_collection_members
  for select
  using (
    exists (
      select 1
      from public.forum_companies company
      where company.id = company_id
        and company.is_active = true
    )
    and exists (
      select 1
      from public.forum_company_collections collection
      where collection.id = collection_id
        and collection.is_active = true
    )
  );

grant select on public.forum_companies to anon, authenticated;
grant select on public.forum_company_collections to anon, authenticated;
grant select on public.forum_company_collection_members to anon, authenticated;

insert into public.forum_company_collections (
  slug,
  name,
  country_code,
  collection_type,
  sort_order
)
values
  ('omxs30', 'OMXS30', 'SE', 'index', 10),
  ('mid-cap', 'Mid Cap', 'SE', 'market', 20),
  ('small-cap', 'Small Cap', 'SE', 'market', 30),
  ('nasdaq-100', 'Nasdaq-100', 'US', 'index', 10),
  ('sp-500', 'S&P 500', 'US', 'index', 20),
  ('russell-2000', 'Russell 2000', 'US', 'index', 30)
on conflict (slug) do update
set
  name = excluded.name,
  country_code = excluded.country_code,
  collection_type = excluded.collection_type,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.forum_companies (
  slug,
  name,
  primary_ticker,
  exchange,
  country_code,
  sort_order
)
values
  ('investor', 'Investor', 'INVE-B', 'Nasdaq Stockholm', 'SE', 10),
  ('volvo', 'Volvo', 'VOLV-B', 'Nasdaq Stockholm', 'SE', 20),
  ('ericsson', 'Ericsson', 'ERIC-B', 'Nasdaq Stockholm', 'SE', 30),
  ('atlas-copco', 'Atlas Copco', 'ATCO-A', 'Nasdaq Stockholm', 'SE', 40),
  ('assa-abloy', 'ASSA ABLOY', 'ASSA-B', 'Nasdaq Stockholm', 'SE', 50),
  ('hexagon', 'Hexagon', 'HEXA-B', 'Nasdaq Stockholm', 'SE', 60),
  ('sandvik', 'Sandvik', 'SAND', 'Nasdaq Stockholm', 'SE', 70),
  ('seb', 'SEB', 'SEB-A', 'Nasdaq Stockholm', 'SE', 80),
  ('swedbank', 'Swedbank', 'SWED-A', 'Nasdaq Stockholm', 'SE', 90),
  ('handelsbanken', 'Handelsbanken', 'SHB-A', 'Nasdaq Stockholm', 'SE', 100),
  ('hm', 'H&M', 'HM-B', 'Nasdaq Stockholm', 'SE', 110),
  ('astrazeneca', 'AstraZeneca', 'AZN', 'Nasdaq Stockholm', 'SE', 120),
  ('evolution', 'Evolution', 'EVO', 'Nasdaq Stockholm', 'SE', 130),
  ('industrivarden', 'Industrivärden', 'INDU-C', 'Nasdaq Stockholm', 'SE', 140),
  ('saab', 'Saab', 'SAAB-B', 'Nasdaq Stockholm', 'SE', 150),
  ('apple', 'Apple', 'AAPL', 'Nasdaq', 'US', 10),
  ('microsoft', 'Microsoft', 'MSFT', 'Nasdaq', 'US', 20),
  ('nvidia', 'Nvidia', 'NVDA', 'Nasdaq', 'US', 30),
  ('amazon', 'Amazon', 'AMZN', 'Nasdaq', 'US', 40),
  ('alphabet', 'Alphabet', 'GOOGL', 'Nasdaq', 'US', 50),
  ('meta', 'Meta Platforms', 'META', 'Nasdaq', 'US', 60),
  ('berkshire-hathaway', 'Berkshire Hathaway', 'BRK.B', 'NYSE', 'US', 70),
  ('jpmorgan', 'JPMorgan Chase', 'JPM', 'NYSE', 'US', 80),
  ('johnson-johnson', 'Johnson & Johnson', 'JNJ', 'NYSE', 'US', 90),
  ('coca-cola', 'Coca-Cola', 'KO', 'NYSE', 'US', 100),
  ('pepsico', 'PepsiCo', 'PEP', 'Nasdaq', 'US', 110),
  ('costco', 'Costco', 'COST', 'Nasdaq', 'US', 120),
  ('walmart', 'Walmart', 'WMT', 'NYSE', 'US', 130),
  ('visa', 'Visa', 'V', 'NYSE', 'US', 140),
  ('unitedhealth', 'UnitedHealth', 'UNH', 'NYSE', 'US', 150)
on conflict (slug) do update
set
  name = excluded.name,
  primary_ticker = excluded.primary_ticker,
  exchange = excluded.exchange,
  country_code = excluded.country_code,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- Membership seeds (curated MVP; not a complete constituent list).
-- Verification date: 2026-07-11.
--
-- OMXS30: base constituent reference OMX Stockholm 30 list (Nasdaq/Wikipedia,
-- composition dated 2025-07-01). Later check: Nasdaq semi-annual review notice
-- effective 2026-06-01 reported no constituent changes. Only seeded Swedish
-- companies already present in this MVP set.
insert into public.forum_company_collection_members (company_id, collection_id, sort_order)
select company.id, collection.id, company.sort_order
from public.forum_companies company
join public.forum_company_collections collection
  on collection.slug = 'omxs30'
where company.country_code = 'SE'
on conflict (company_id, collection_id) do nothing;

-- Nasdaq-100 and S&P 500: curated large-cap US memberships verified individually.
-- Base references: widely documented index membership for each seeded company.
-- Later checks: Nasdaq-100 quarterly rebalance (2026-06) with no removal of
-- Walmart; Walmart addition effective 2026-01-20 retained. This block does not
-- claim a full Nasdaq-100 or S&P 500 constituent download.
insert into public.forum_company_collection_members (company_id, collection_id, sort_order)
select company.id, collection.id, company.sort_order
from public.forum_companies company
join public.forum_company_collections collection
  on collection.slug in ('nasdaq-100', 'sp-500')
where company.slug in (
  'apple',
  'microsoft',
  'nvidia',
  'amazon',
  'alphabet',
  'meta',
  'pepsico',
  'costco',
  'walmart'
)
on conflict (company_id, collection_id) do nothing;

-- S&P 500 only: NYSE large caps in the MVP set, not assumed to be Nasdaq-100 members.
-- Verification date: 2026-07-11. Curated MVP; not a complete S&P 500 constituent list.
insert into public.forum_company_collection_members (company_id, collection_id, sort_order)
select company.id, collection.id, company.sort_order
from public.forum_companies company
join public.forum_company_collections collection
  on collection.slug = 'sp-500'
where company.slug in (
  'berkshire-hathaway',
  'jpmorgan',
  'johnson-johnson',
  'coca-cola',
  'visa',
  'unitedhealth'
)
on conflict (company_id, collection_id) do nothing;
