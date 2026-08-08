-- DivLab Modellportföljer foundation v1
-- Public, standardized model portfolios. Core state is service-role writable only;
-- authenticated users can read published state and manage only their own follows.

create extension if not exists pgcrypto;

create table if not exists public.model_portfolios (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,64}$'),
  name text not null check (char_length(name) between 2 and 80),
  strategy_key text not null unique check (strategy_key in ('conservative', 'balanced', 'high_risk', 'dividend')),
  risk_label text not null,
  description text not null,
  objective text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  currency text not null default 'SEK' check (currency = 'SEK'),
  initial_capital_minor bigint not null default 1000000 check (initial_capital_minor > 0),
  monthly_contribution_minor bigint not null default 500000 check (monthly_contribution_minor >= 0),
  contribution_day smallint not null default 25 check (contribution_day between 1 and 28),
  strategy_version integer not null default 1 check (strategy_version > 0),
  sort_order smallint not null unique,
  strategy_rules jsonb not null default '{}'::jsonb,
  launched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.model_portfolio_cash_ledger (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.model_portfolios(id) on delete cascade,
  event_type text not null check (event_type in ('initial_capital', 'monthly_contribution', 'buy', 'sell', 'dividend', 'fee', 'adjustment')),
  amount_minor bigint not null check (amount_minor <> 0),
  currency text not null default 'SEK' check (currency = 'SEK'),
  effective_at timestamptz not null,
  external_key text not null unique,
  transaction_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists model_portfolio_cash_ledger_portfolio_effective_idx
  on public.model_portfolio_cash_ledger (portfolio_id, effective_at desc);

create table if not exists public.model_portfolio_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null check (run_type in ('scheduled', 'report_event', 'monthly_contribution', 'manual')),
  status text not null default 'started' check (status in ('started', 'completed', 'skipped', 'failed')),
  trigger_key text not null unique,
  market_data_as_of timestamptz,
  source_snapshot jsonb not null default '{}'::jsonb,
  error_code text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.model_portfolio_decisions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.model_portfolios(id) on delete cascade,
  run_id uuid references public.model_portfolio_runs(id) on delete set null,
  decision_type text not null check (decision_type in ('hold', 'buy', 'sell', 'rebalance', 'deposit')),
  status text not null default 'proposed' check (status in ('proposed', 'executed', 'rejected', 'skipped', 'failed')),
  instrument_symbol text,
  exchange text,
  instrument_name text,
  rationale text not null check (char_length(rationale) between 1 and 2000),
  model_provider text,
  model_name text,
  prompt_version text,
  market_data_as_of timestamptz,
  evidence jsonb not null default '[]'::jsonb,
  input_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  executed_at timestamptz
);

create index if not exists model_portfolio_decisions_portfolio_created_idx
  on public.model_portfolio_decisions (portfolio_id, created_at desc);

create table if not exists public.model_portfolio_transactions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.model_portfolios(id) on delete cascade,
  decision_id uuid references public.model_portfolio_decisions(id) on delete set null,
  transaction_type text not null check (transaction_type in ('buy', 'sell', 'dividend', 'fee')),
  instrument_symbol text not null,
  exchange text not null,
  instrument_name text not null,
  quantity numeric(24,8) not null check (quantity > 0),
  price_minor bigint check (price_minor is null or price_minor >= 0),
  gross_amount_minor bigint not null check (gross_amount_minor >= 0),
  fee_minor bigint not null default 0 check (fee_minor >= 0),
  currency text not null default 'SEK' check (currency = 'SEK'),
  executed_at timestamptz not null,
  market_data_as_of timestamptz not null,
  rationale text not null check (char_length(rationale) between 1 and 2000),
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists model_portfolio_transactions_portfolio_executed_idx
  on public.model_portfolio_transactions (portfolio_id, executed_at desc);

alter table public.model_portfolio_cash_ledger
  drop constraint if exists model_portfolio_cash_ledger_transaction_id_fkey;
alter table public.model_portfolio_cash_ledger
  add constraint model_portfolio_cash_ledger_transaction_id_fkey
  foreign key (transaction_id) references public.model_portfolio_transactions(id) on delete set null;

create table if not exists public.model_portfolio_holdings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.model_portfolios(id) on delete cascade,
  instrument_symbol text not null,
  exchange text not null,
  instrument_name text not null,
  instrument_currency text not null,
  quantity numeric(24,8) not null default 0 check (quantity >= 0),
  average_cost_minor bigint not null default 0 check (average_cost_minor >= 0),
  last_price_minor bigint check (last_price_minor is null or last_price_minor >= 0),
  last_price_as_of timestamptz,
  updated_at timestamptz not null default now(),
  unique (portfolio_id, instrument_symbol, exchange)
);

create index if not exists model_portfolio_holdings_portfolio_idx
  on public.model_portfolio_holdings (portfolio_id);

create table if not exists public.model_portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.model_portfolios(id) on delete cascade,
  snapshot_at timestamptz not null,
  total_value_minor bigint not null check (total_value_minor >= 0),
  cash_value_minor bigint not null check (cash_value_minor >= 0),
  invested_value_minor bigint not null check (invested_value_minor >= 0),
  contributed_capital_minor bigint not null check (contributed_capital_minor >= 0),
  market_data_as_of timestamptz,
  created_at timestamptz not null default now(),
  unique (portfolio_id, snapshot_at)
);

create index if not exists model_portfolio_snapshots_portfolio_snapshot_idx
  on public.model_portfolio_snapshots (portfolio_id, snapshot_at desc);

create table if not exists public.model_portfolio_followers (
  portfolio_id uuid not null references public.model_portfolios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (portfolio_id, user_id)
);

create index if not exists model_portfolio_followers_user_idx
  on public.model_portfolio_followers (user_id);

create table if not exists public.model_portfolio_report_events (
  id uuid primary key default gen_random_uuid(),
  instrument_symbol text not null,
  exchange text not null,
  instrument_name text not null,
  report_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'processed', 'cancelled')),
  source_url text not null,
  source_publisher text not null,
  source_verified_at timestamptz not null,
  processed_run_id uuid references public.model_portfolio_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (instrument_symbol, exchange, report_at)
);

create or replace function public.model_portfolios_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger model_portfolios_touch_updated_at_trigger
before update on public.model_portfolios
for each row execute function public.model_portfolios_touch_updated_at();

create trigger model_portfolio_followers_touch_updated_at_trigger
before update on public.model_portfolio_followers
for each row execute function public.model_portfolios_touch_updated_at();

create trigger model_portfolio_holdings_touch_updated_at_trigger
before update on public.model_portfolio_holdings
for each row execute function public.model_portfolios_touch_updated_at();

create trigger model_portfolio_report_events_touch_updated_at_trigger
before update on public.model_portfolio_report_events
for each row execute function public.model_portfolios_touch_updated_at();

-- Browser clients can never mutate core portfolio state. Authenticated users may
-- read the standardized public model state. Followers are private per user.
alter table public.model_portfolios enable row level security;
alter table public.model_portfolio_cash_ledger enable row level security;
alter table public.model_portfolio_runs enable row level security;
alter table public.model_portfolio_decisions enable row level security;
alter table public.model_portfolio_transactions enable row level security;
alter table public.model_portfolio_holdings enable row level security;
alter table public.model_portfolio_snapshots enable row level security;
alter table public.model_portfolio_followers enable row level security;
alter table public.model_portfolio_report_events enable row level security;

create policy model_portfolios_authenticated_read
  on public.model_portfolios for select to authenticated using (true);
create policy model_portfolio_cash_authenticated_read
  on public.model_portfolio_cash_ledger for select to authenticated using (true);
create policy model_portfolio_decisions_authenticated_read
  on public.model_portfolio_decisions for select to authenticated using (true);
create policy model_portfolio_transactions_authenticated_read
  on public.model_portfolio_transactions for select to authenticated using (true);
create policy model_portfolio_holdings_authenticated_read
  on public.model_portfolio_holdings for select to authenticated using (true);
create policy model_portfolio_snapshots_authenticated_read
  on public.model_portfolio_snapshots for select to authenticated using (true);

create policy model_portfolio_followers_own_read
  on public.model_portfolio_followers for select to authenticated
  using (auth.uid() = user_id);
create policy model_portfolio_followers_own_insert
  on public.model_portfolio_followers for insert to authenticated
  with check (auth.uid() = user_id);
create policy model_portfolio_followers_own_update
  on public.model_portfolio_followers for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy model_portfolio_followers_own_delete
  on public.model_portfolio_followers for delete to authenticated
  using (auth.uid() = user_id);

revoke all on public.model_portfolios from anon, authenticated;
revoke all on public.model_portfolio_cash_ledger from anon, authenticated;
revoke all on public.model_portfolio_runs from anon, authenticated;
revoke all on public.model_portfolio_decisions from anon, authenticated;
revoke all on public.model_portfolio_transactions from anon, authenticated;
revoke all on public.model_portfolio_holdings from anon, authenticated;
revoke all on public.model_portfolio_snapshots from anon, authenticated;
revoke all on public.model_portfolio_followers from anon, authenticated;
revoke all on public.model_portfolio_report_events from anon, authenticated;

grant select on public.model_portfolios to authenticated;
grant select on public.model_portfolio_cash_ledger to authenticated;
grant select on public.model_portfolio_decisions to authenticated;
grant select on public.model_portfolio_transactions to authenticated;
grant select on public.model_portfolio_holdings to authenticated;
grant select on public.model_portfolio_snapshots to authenticated;
grant select, insert, update, delete on public.model_portfolio_followers to authenticated;

grant all on public.model_portfolios to service_role;
grant all on public.model_portfolio_cash_ledger to service_role;
grant all on public.model_portfolio_runs to service_role;
grant all on public.model_portfolio_decisions to service_role;
grant all on public.model_portfolio_transactions to service_role;
grant all on public.model_portfolio_holdings to service_role;
grant all on public.model_portfolio_snapshots to service_role;
grant all on public.model_portfolio_followers to service_role;
grant all on public.model_portfolio_report_events to service_role;

-- Seed the four product strategies. They start as draft until the verified market
-- data adapter and AI execution pipeline are enabled. Capital is real model cash
-- from day one; there are deliberately no invented holdings.
insert into public.model_portfolios (
  slug, name, strategy_key, risk_label, description, objective, status,
  initial_capital_minor, monthly_contribution_minor, contribution_day,
  sort_order, strategy_rules
) values
  (
    'forsiktig', 'Försiktig', 'conservative', 'Lägre risk',
    'Prioriterar stabilitet, bred riskspridning och lägre svängningar framför maximal uppsida.',
    'Bygga ett robust långsiktigt modellkapital med kontrollerad aktierisk och tydliga riskgränser.',
    'draft', 1000000, 500000, 25, 1,
    '{"max_single_position_pct":12,"min_cash_pct":10,"max_equity_pct":75,"primary_style":"quality_defensive"}'::jsonb
  ),
  (
    'medelrisk', 'Medelrisk', 'balanced', 'Medelrisk',
    'Balanserar kvalitet, värdering och tillväxt med tydlig diversifiering över bolag och sektorer.',
    'Söka god långsiktig avkastning utan att koncentrera portföljen till enskilda högriskcase.',
    'draft', 1000000, 500000, 25, 2,
    '{"max_single_position_pct":15,"min_cash_pct":5,"max_equity_pct":95,"primary_style":"quality_growth_balance"}'::jsonb
  ),
  (
    'hog-risk', 'Högrisk', 'high_risk', 'Hög risk',
    'Accepterar större svängningar och högre bolagsspecifik risk för möjlighet till högre långsiktig avkastning.',
    'Söka asymmetrisk uppsida i tillväxt- och omvärderingscase under hårda positions- och likviditetsgränser.',
    'draft', 1000000, 500000, 25, 3,
    '{"max_single_position_pct":20,"min_cash_pct":3,"max_equity_pct":100,"primary_style":"growth_opportunistic"}'::jsonb
  ),
  (
    'utdelning', 'Utdelning', 'dividend', 'Medelrisk',
    'Fokuserar på uthålliga kassaflöden, utdelningsförmåga och rimlig värdering snarare än högsta direktavkastning.',
    'Bygga en växande modellportfölj med hållbara utdelningar och återinvesterbart kassaflöde.',
    'draft', 1000000, 500000, 25, 4,
    '{"max_single_position_pct":15,"min_cash_pct":5,"max_equity_pct":95,"primary_style":"dividend_quality"}'::jsonb
  )
on conflict (slug) do update set
  name = excluded.name,
  risk_label = excluded.risk_label,
  description = excluded.description,
  objective = excluded.objective,
  initial_capital_minor = excluded.initial_capital_minor,
  monthly_contribution_minor = excluded.monthly_contribution_minor,
  contribution_day = excluded.contribution_day,
  sort_order = excluded.sort_order,
  strategy_rules = excluded.strategy_rules;

insert into public.model_portfolio_cash_ledger (
  portfolio_id, event_type, amount_minor, effective_at, external_key, metadata
)
select
  id,
  'initial_capital',
  initial_capital_minor,
  '2026-08-08T22:00:00+02:00'::timestamptz,
  'initial-capital:' || slug || ':2026-08-08',
  jsonb_build_object('reason', 'DivLab Modellportföljer initialt modellkapital')
from public.model_portfolios
on conflict (external_key) do nothing;

insert into public.model_portfolio_snapshots (
  portfolio_id, snapshot_at, total_value_minor, cash_value_minor,
  invested_value_minor, contributed_capital_minor, market_data_as_of
)
select
  id,
  '2026-08-08T22:00:00+02:00'::timestamptz,
  initial_capital_minor,
  initial_capital_minor,
  0,
  initial_capital_minor,
  null
from public.model_portfolios
on conflict (portfolio_id, snapshot_at) do nothing;
