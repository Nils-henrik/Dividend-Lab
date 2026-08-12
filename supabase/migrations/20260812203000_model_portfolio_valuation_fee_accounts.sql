begin;

-- Restore the product rule: fixed SEK 10 simulated courtage on buys.
alter table public.model_portfolio_transactions
  drop constraint if exists model_portfolio_transactions_zero_fee_check;

create temporary table _model_portfolio_buy_fee_backfill on commit drop as
select
  id,
  portfolio_id,
  instrument_symbol,
  exchange,
  executed_at
from public.model_portfolio_transactions
where transaction_type = 'buy'
  and fee_minor = 0;

update public.model_portfolio_transactions t
set fee_minor = 1000
from _model_portfolio_buy_fee_backfill b
where t.id = b.id;

update public.model_portfolio_cash_ledger l
set
  amount_minor = l.amount_minor - 1000,
  metadata = jsonb_set(coalesce(l.metadata, '{}'::jsonb), '{fee_minor}', '1000'::jsonb, true)
from _model_portfolio_buy_fee_backfill b
where l.transaction_id = b.id
  and l.event_type = 'buy';

-- Existing positions with no historical sells can have their effective cost basis
-- corrected deterministically from their buy transactions.
update public.model_portfolio_holdings h
set
  average_cost_minor = corrected.average_cost_minor,
  updated_at = now()
from (
  select
    b.portfolio_id,
    b.instrument_symbol,
    b.exchange,
    round(
      sum(t.gross_amount_minor + t.fee_minor)::numeric /
      nullif(sum(t.quantity), 0)
    )::bigint as average_cost_minor
  from _model_portfolio_buy_fee_backfill b
  join public.model_portfolio_transactions t
    on t.portfolio_id = b.portfolio_id
   and t.instrument_symbol = b.instrument_symbol
   and t.exchange = b.exchange
   and t.transaction_type = 'buy'
  where not exists (
    select 1
    from public.model_portfolio_transactions s
    where s.portfolio_id = b.portfolio_id
      and s.instrument_symbol = b.instrument_symbol
      and s.exchange = b.exchange
      and s.transaction_type = 'sell'
  )
  group by b.portfolio_id, b.instrument_symbol, b.exchange
) corrected
where h.portfolio_id = corrected.portfolio_id
  and h.instrument_symbol = corrected.instrument_symbol
  and h.exchange = corrected.exchange
  and h.quantity > 0;

-- Correct already-persisted history so the chart does not preserve the old
-- zero-fee accounting after this bug fix.
update public.model_portfolio_snapshots s
set
  cash_value_minor = s.cash_value_minor - correction.fee_minor,
  total_value_minor = s.total_value_minor - correction.fee_minor
from (
  select
    s2.portfolio_id,
    s2.snapshot_at,
    count(b.id)::bigint * 1000 as fee_minor
  from public.model_portfolio_snapshots s2
  join _model_portfolio_buy_fee_backfill b
    on b.portfolio_id = s2.portfolio_id
   and b.executed_at <= s2.snapshot_at
  group by s2.portfolio_id, s2.snapshot_at
) correction
where s.portfolio_id = correction.portfolio_id
  and s.snapshot_at = correction.snapshot_at;

alter table public.model_portfolio_transactions
  add constraint model_portfolio_transactions_simulated_fee_check
  check (
    (transaction_type <> 'buy' or fee_minor = 1000)
    and (transaction_type <> 'sell' or fee_minor = 0)
  );

-- Keep DB settlement enforcement aligned with the application planner.
do $$
declare
  v_definition text;
begin
  select pg_get_functiondef('public.settle_model_portfolio_decision(uuid,jsonb)'::regprocedure)
    into v_definition;

  if position('v_side = ''buy'' and v_fee_sek <> 0' in v_definition) > 0 then
    v_definition := replace(
      v_definition,
      'v_side = ''buy'' and v_fee_sek <> 0',
      'v_side = ''buy'' and v_fee_sek <> 1000'
    );
    execute v_definition;
  elsif position('v_side = ''buy'' and v_fee_sek <> 1000' in v_definition) = 0 then
    raise exception 'settle_model_portfolio_decision buy-fee guard has unexpected shape';
  end if;
end
$$;

-- Dividend portfolio account routing. The portfolio still has one shared model
-- cash balance; account_type records which simulated account owns each holding/trade.
alter table public.model_portfolio_transactions
  add column if not exists account_type text;

alter table public.model_portfolio_holdings
  add column if not exists account_type text;

alter table public.model_portfolio_transactions
  drop constraint if exists model_portfolio_transactions_account_type_check;
alter table public.model_portfolio_transactions
  add constraint model_portfolio_transactions_account_type_check
  check (account_type is null or account_type in ('ISK', 'KF'));

alter table public.model_portfolio_holdings
  drop constraint if exists model_portfolio_holdings_account_type_check;
alter table public.model_portfolio_holdings
  add constraint model_portfolio_holdings_account_type_check
  check (account_type is null or account_type in ('ISK', 'KF'));

create or replace function public.assign_model_portfolio_account_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_strategy_key text;
begin
  select strategy_key
    into v_strategy_key
  from public.model_portfolios
  where id = new.portfolio_id;

  if v_strategy_key = 'dividend' then
    new.account_type := case
      when upper(new.exchange) = 'ST' then 'ISK'
      else 'KF'
    end;
  else
    new.account_type := null;
  end if;

  return new;
end;
$$;

revoke all on function public.assign_model_portfolio_account_type()
  from public, anon, authenticated;
grant execute on function public.assign_model_portfolio_account_type()
  to service_role;

drop trigger if exists model_portfolio_transactions_account_type_trigger
  on public.model_portfolio_transactions;
create trigger model_portfolio_transactions_account_type_trigger
before insert or update of portfolio_id, exchange
on public.model_portfolio_transactions
for each row
execute function public.assign_model_portfolio_account_type();

drop trigger if exists model_portfolio_holdings_account_type_trigger
  on public.model_portfolio_holdings;
create trigger model_portfolio_holdings_account_type_trigger
before insert or update of portfolio_id, exchange
on public.model_portfolio_holdings
for each row
execute function public.assign_model_portfolio_account_type();

update public.model_portfolio_transactions t
set account_type = case when upper(t.exchange) = 'ST' then 'ISK' else 'KF' end
from public.model_portfolios p
where p.id = t.portfolio_id
  and p.strategy_key = 'dividend';

update public.model_portfolio_holdings h
set account_type = case when upper(h.exchange) = 'ST' then 'ISK' else 'KF' end
from public.model_portfolios p
where p.id = h.portfolio_id
  and p.strategy_key = 'dividend';

commit;
