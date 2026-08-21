create table if not exists public.divlab_analyses (
  id uuid primary key default gen_random_uuid(),
  instrument_symbol text not null,
  exchange text not null,
  instrument_name text not null,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (instrument_symbol, exchange)
);

create table if not exists public.divlab_analysis_versions (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.divlab_analyses(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  engine_version text not null,
  data_as_of timestamptz not null,
  currency text not null,
  current_price numeric(24,8) not null check (current_price > 0),
  research_packet jsonb not null,
  quality_gate jsonb not null,
  publishable boolean not null default false,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (analysis_id, version_number),
  check (published_at is null or publishable is true)
);

create table if not exists public.divlab_analysis_sources (
  id uuid primary key default gen_random_uuid(),
  analysis_version_id uuid not null references public.divlab_analysis_versions(id) on delete cascade,
  source_key text not null,
  kind text not null,
  publisher text not null,
  source_url text not null,
  published_at timestamptz not null,
  verified_at timestamptz not null,
  primary_source boolean not null default false,
  created_at timestamptz not null default now(),
  unique (analysis_version_id, source_key)
);

create index if not exists divlab_analysis_versions_analysis_created_idx
  on public.divlab_analysis_versions (analysis_id, created_at desc);
create index if not exists divlab_analysis_versions_publishable_idx
  on public.divlab_analysis_versions (publishable, published_at desc);
create index if not exists divlab_analysis_sources_version_idx
  on public.divlab_analysis_sources (analysis_version_id);
create index if not exists divlab_analysis_sources_published_idx
  on public.divlab_analysis_sources (published_at desc);

alter table public.divlab_analyses enable row level security;
alter table public.divlab_analysis_versions enable row level security;
alter table public.divlab_analysis_sources enable row level security;

revoke all on public.divlab_analyses from anon, authenticated;
revoke all on public.divlab_analysis_versions from anon, authenticated;
revoke all on public.divlab_analysis_sources from anon, authenticated;

grant all on public.divlab_analyses to service_role;
grant all on public.divlab_analysis_versions to service_role;
grant all on public.divlab_analysis_sources to service_role;
