-- Durable fail-closed ledger for DivLab's free EODHD allowance.
-- One claim per Stockholm trading day/pass prevents retries from spending the
-- same 0/7/6/7 allocation twice.

create table if not exists public.model_portfolio_eodhd_budget_claims (
  usage_date date not null,
  pass text not null check (pass in ('nordic_morning', 'us_1550', 'us_1830', 'us_2130')),
  allocated_calls smallint not null check (allocated_calls between 0 and 20),
  used_calls smallint not null default 0 check (used_calls between 0 and allocated_calls),
  claimed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (usage_date, pass)
);

alter table public.model_portfolio_eodhd_budget_claims enable row level security;
revoke all on table public.model_portfolio_eodhd_budget_claims from anon, authenticated;

comment on table public.model_portfolio_eodhd_budget_claims is
  'Service-role-only EODHD daily/pass budget ledger for model-portfolio research.';
