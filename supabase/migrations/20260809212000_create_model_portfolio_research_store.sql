-- Shared verified research store for model portfolios and future DivBrain grounding.
-- Service-role writes only; authenticated users may read verified snapshots.

create table if not exists public.model_portfolio_research_snapshots (
  id uuid primary key default gen_random_uuid(),
  instrument_symbol text not null,
  exchange text not null,
  instrument_name text not null,
  kind text not null check (kind in ('company_report', 'regulatory_filing', 'company_release', 'news', 'market_data')),
  publisher text not null,
  source_url text not null,
  published_at timestamptz not null,
  verified_at timestamptz not null default now(),
  title text not null,
  summary text not null check (char_length(summary) between 1 and 6000),
  content_hash text not null unique check (char_length(content_hash) between 16 and 128),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists model_portfolio_research_instrument_idx
  on public.model_portfolio_research_snapshots (instrument_symbol, exchange, published_at desc);
create index if not exists model_portfolio_research_kind_idx
  on public.model_portfolio_research_snapshots (kind, published_at desc);

alter table public.model_portfolio_research_snapshots enable row level security;

create policy model_portfolio_research_authenticated_read
  on public.model_portfolio_research_snapshots for select to authenticated using (true);

revoke all on public.model_portfolio_research_snapshots from anon, authenticated;
grant select on public.model_portfolio_research_snapshots to authenticated;
grant all on public.model_portfolio_research_snapshots to service_role;
