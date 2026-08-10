-- Model portfolio settlement: FX traceability on transactions + activate the four portfolios.
-- Courtage remains encoded in application settlement (fee_minor = 1000) with cash deltas net of fee.

alter table public.model_portfolio_transactions
  add column if not exists native_price_minor bigint check (native_price_minor is null or native_price_minor >= 0);

alter table public.model_portfolio_transactions
  add column if not exists native_currency text;

alter table public.model_portfolio_transactions
  add column if not exists fx_to_sek numeric(18, 8);

alter table public.model_portfolio_transactions
  add column if not exists gross_native_minor bigint check (gross_native_minor is null or gross_native_minor >= 0);

comment on column public.model_portfolio_transactions.native_price_minor is
  'Execution price in instrument/native currency minor units.';
comment on column public.model_portfolio_transactions.native_currency is
  'Instrument trading currency (SEK, USD, EUR, DKK, NOK, ...).';
comment on column public.model_portfolio_transactions.fx_to_sek is
  'FX rate used to convert native amounts to SEK (SEK per 1 native unit). SEK trades use 1.';
comment on column public.model_portfolio_transactions.gross_native_minor is
  'Gross trade/dividend amount in native currency minor units before FX.';

-- Activate standardized model portfolios after settlement layer ships.
update public.model_portfolios
set
  status = 'active',
  launched_at = coalesce(launched_at, timestamptz '2026-08-10 09:00:00+02'),
  updated_at = now()
where slug in ('forsiktig', 'medelrisk', 'hog-risk', 'utdelning')
  and status = 'draft';
