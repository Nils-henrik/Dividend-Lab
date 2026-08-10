-- DivLab Modellportföljer live simulation foundation:
-- FX audit columns, dividend event ledger, service-role settlement/credit RPCs,
-- and activation of the four seeded portfolios once the execution path exists.

alter table public.model_portfolio_transactions
  add column if not exists native_currency text,
  add column if not exists native_price_minor bigint,
  add column if not exists native_gross_amount_minor bigint,
  add column if not exists fx_rate_to_sek numeric(18,8),
  add column if not exists fx_as_of timestamptz,
  add column if not exists fx_source_publisher text,
  add column if not exists fill_label text;

alter table public.model_portfolio_transactions
  drop constraint if exists model_portfolio_transactions_native_price_minor_check;
alter table public.model_portfolio_transactions
  add constraint model_portfolio_transactions_native_price_minor_check
  check (native_price_minor is null or native_price_minor >= 0);

alter table public.model_portfolio_transactions
  drop constraint if exists model_portfolio_transactions_native_gross_amount_minor_check;
alter table public.model_portfolio_transactions
  add constraint model_portfolio_transactions_native_gross_amount_minor_check
  check (native_gross_amount_minor is null or native_gross_amount_minor >= 0);

alter table public.model_portfolio_transactions
  drop constraint if exists model_portfolio_transactions_fx_rate_to_sek_check;
alter table public.model_portfolio_transactions
  add constraint model_portfolio_transactions_fx_rate_to_sek_check
  check (fx_rate_to_sek is null or fx_rate_to_sek > 0);

alter table public.model_portfolio_transactions
  drop constraint if exists model_portfolio_transactions_fill_label_check;
alter table public.model_portfolio_transactions
  add constraint model_portfolio_transactions_fill_label_check
  check (fill_label is null or fill_label in ('SIMULATED'));

create table if not exists public.model_portfolio_dividend_events (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.model_portfolios(id) on delete cascade,
  instrument_symbol text not null,
  exchange text not null,
  instrument_name text not null,
  ex_date date not null,
  payment_date date not null,
  native_amount_per_share_minor bigint not null check (native_amount_per_share_minor > 0),
  native_currency text not null,
  source_publisher text not null,
  source_event_key text not null,
  status text not null default 'registered' check (status in ('registered', 'credited', 'skipped', 'cancelled')),
  eligible_quantity numeric(24,8),
  credited_transaction_id uuid references public.model_portfolio_transactions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (portfolio_id, source_event_key),
  check (payment_date >= ex_date)
);

create index if not exists model_portfolio_dividend_events_payment_idx
  on public.model_portfolio_dividend_events (status, payment_date);

alter table public.model_portfolio_dividend_events enable row level security;

create policy model_portfolio_dividend_events_authenticated_read
  on public.model_portfolio_dividend_events for select to authenticated using (true);

revoke all on public.model_portfolio_dividend_events from anon, authenticated;
grant select on public.model_portfolio_dividend_events to authenticated;
grant all on public.model_portfolio_dividend_events to service_role;

create trigger model_portfolio_dividend_events_touch_updated_at_trigger
before update on public.model_portfolio_dividend_events
for each row execute function public.model_portfolios_touch_updated_at();

-- Atomic simulated decision settlement. Service-role only. Idempotent on decision id.
create or replace function public.settle_model_portfolio_decision(
  p_decision_id uuid,
  p_plan jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_decision public.model_portfolio_decisions%rowtype;
  v_portfolio public.model_portfolios%rowtype;
  v_existing_tx public.model_portfolio_transactions%rowtype;
  v_holding public.model_portfolio_holdings%rowtype;
  v_cash_minor bigint;
  v_invested_minor bigint;
  v_contributed_minor bigint;
  v_total_minor bigint;
  v_tx_id uuid;
  v_idempotency_key text;
  v_side text;
  v_quantity numeric(24,8);
  v_price_sek bigint;
  v_gross_sek bigint;
  v_fee_sek bigint;
  v_cash_delta bigint;
  v_avg_after bigint;
  v_qty_after numeric(24,8);
  v_native_currency text;
  v_native_price bigint;
  v_native_gross bigint;
  v_fx_rate numeric(18,8);
  v_fx_as_of timestamptz;
  v_fx_source text;
  v_fill_label text;
  v_market_as_of timestamptz;
  v_instrument_name text;
  v_now timestamptz := now();
begin
  if p_decision_id is null or p_plan is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_input');
  end if;

  select * into v_decision
  from public.model_portfolio_decisions
  where id = p_decision_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'decision_not_found');
  end if;

  v_idempotency_key := 'settle-decision:' || v_decision.id::text;

  select * into v_existing_tx
  from public.model_portfolio_transactions
  where idempotency_key = v_idempotency_key;

  if found then
    return jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'transaction_id', v_existing_tx.id,
      'decision_id', v_decision.id
    );
  end if;

  if v_decision.status <> 'proposed' then
    return jsonb_build_object('ok', false, 'reason', 'decision_not_proposed');
  end if;

  if coalesce((v_decision.input_snapshot ->> 'execution_allowed_at_decision_time')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'reason', 'execution_not_allowed');
  end if;

  select * into v_portfolio
  from public.model_portfolios
  where id = v_decision.portfolio_id
  for update;

  if v_portfolio.status <> 'active' then
    return jsonb_build_object('ok', false, 'reason', 'portfolio_not_active');
  end if;

  v_side := p_plan ->> 'side';
  v_quantity := (p_plan ->> 'quantity')::numeric;
  v_price_sek := (p_plan ->> 'priceSekMinor')::bigint;
  v_gross_sek := (p_plan ->> 'grossAmountSekMinor')::bigint;
  v_fee_sek := coalesce((p_plan ->> 'feeSekMinor')::bigint, 0);
  v_cash_delta := (p_plan ->> 'cashDeltaMinor')::bigint;
  v_avg_after := (p_plan ->> 'averageCostMinorAfter')::bigint;
  v_qty_after := (p_plan ->> 'quantityAfter')::numeric;
  v_native_currency := p_plan ->> 'nativeCurrency';
  v_native_price := (p_plan ->> 'nativePriceMinor')::bigint;
  v_native_gross := (p_plan ->> 'nativeGrossMinor')::bigint;
  v_fx_rate := (p_plan ->> 'fxRateToSek')::numeric;
  v_fx_as_of := nullif(p_plan ->> 'fxAsOf', '')::timestamptz;
  v_fx_source := p_plan ->> 'fxSourcePublisher';
  v_fill_label := coalesce(p_plan ->> 'fillLabel', 'SIMULATED');
  v_market_as_of := coalesce(nullif(p_plan ->> 'marketDataAsOf', '')::timestamptz, v_now);
  v_instrument_name := coalesce(nullif(p_plan ->> 'instrumentName', ''), v_decision.instrument_name, v_decision.instrument_symbol);

  if v_side not in ('buy', 'sell')
     or v_quantity is null or v_quantity <= 0
     or v_price_sek is null or v_price_sek <= 0
     or v_gross_sek is null or v_gross_sek < 0
     or v_fee_sek is null or v_fee_sek < 0
     or v_cash_delta is null or v_cash_delta = 0
     or v_native_currency is null
     or v_fx_rate is null or v_fx_rate <= 0
     or v_fill_label <> 'SIMULATED'
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid_plan');
  end if;

  if v_side = 'buy' and v_fee_sek <> 1000 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_buy_fee');
  end if;
  if v_side = 'sell' and v_fee_sek <> 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_sell_fee');
  end if;

  select coalesce(sum(amount_minor), 0) into v_cash_minor
  from public.model_portfolio_cash_ledger
  where portfolio_id = v_portfolio.id;

  if v_side = 'buy' and (v_gross_sek + v_fee_sek) > v_cash_minor then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_cash');
  end if;

  insert into public.model_portfolio_transactions (
    portfolio_id, decision_id, transaction_type, instrument_symbol, exchange, instrument_name,
    quantity, price_minor, gross_amount_minor, fee_minor, currency, executed_at, market_data_as_of,
    rationale, idempotency_key,
    native_currency, native_price_minor, native_gross_amount_minor,
    fx_rate_to_sek, fx_as_of, fx_source_publisher, fill_label
  ) values (
    v_portfolio.id,
    v_decision.id,
    v_side,
    v_decision.instrument_symbol,
    v_decision.exchange,
    v_instrument_name,
    v_quantity,
    v_price_sek,
    v_gross_sek,
    v_fee_sek,
    'SEK',
    v_now,
    v_market_as_of,
    v_decision.rationale,
    v_idempotency_key,
    v_native_currency,
    v_native_price,
    v_native_gross,
    v_fx_rate,
    v_fx_as_of,
    v_fx_source,
    v_fill_label
  )
  returning id into v_tx_id;

  insert into public.model_portfolio_cash_ledger (
    portfolio_id, event_type, amount_minor, currency, effective_at, external_key, transaction_id, metadata
  ) values (
    v_portfolio.id,
    v_side,
    v_cash_delta,
    'SEK',
    v_now,
    'cash:' || v_idempotency_key,
    v_tx_id,
    jsonb_build_object(
      'fill_label', v_fill_label,
      'fee_minor', v_fee_sek,
      'native_currency', v_native_currency,
      'fx_rate_to_sek', v_fx_rate
    )
  );

  select * into v_holding
  from public.model_portfolio_holdings
  where portfolio_id = v_portfolio.id
    and instrument_symbol = v_decision.instrument_symbol
    and exchange = v_decision.exchange
  for update;

  if found then
    update public.model_portfolio_holdings
    set quantity = v_qty_after,
        average_cost_minor = v_avg_after,
        last_price_minor = v_price_sek,
        last_price_as_of = v_market_as_of,
        instrument_name = v_instrument_name,
        instrument_currency = v_native_currency,
        updated_at = v_now
    where id = v_holding.id;
  else
    insert into public.model_portfolio_holdings (
      portfolio_id, instrument_symbol, exchange, instrument_name, instrument_currency,
      quantity, average_cost_minor, last_price_minor, last_price_as_of
    ) values (
      v_portfolio.id,
      v_decision.instrument_symbol,
      v_decision.exchange,
      v_instrument_name,
      v_native_currency,
      v_qty_after,
      v_avg_after,
      v_price_sek,
      v_market_as_of
    );
  end if;

  select coalesce(sum(amount_minor), 0) into v_cash_minor
  from public.model_portfolio_cash_ledger
  where portfolio_id = v_portfolio.id;

  select coalesce(sum(round(quantity * coalesce(last_price_minor, 0))), 0) into v_invested_minor
  from public.model_portfolio_holdings
  where portfolio_id = v_portfolio.id
    and quantity > 0;

  select coalesce(sum(amount_minor), 0) into v_contributed_minor
  from public.model_portfolio_cash_ledger
  where portfolio_id = v_portfolio.id
    and event_type in ('initial_capital', 'monthly_contribution');

  v_total_minor := v_cash_minor + v_invested_minor;

  insert into public.model_portfolio_snapshots (
    portfolio_id, snapshot_at, total_value_minor, cash_value_minor,
    invested_value_minor, contributed_capital_minor, market_data_as_of
  ) values (
    v_portfolio.id,
    v_now,
    v_total_minor,
    v_cash_minor,
    v_invested_minor,
    v_contributed_minor,
    v_market_as_of
  )
  on conflict (portfolio_id, snapshot_at) do nothing;

  update public.model_portfolio_decisions
  set status = 'executed',
      executed_at = v_now
  where id = v_decision.id;

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'transaction_id', v_tx_id,
    'decision_id', v_decision.id,
    'cash_minor', v_cash_minor,
    'invested_minor', v_invested_minor,
    'total_value_minor', v_total_minor
  );
exception
  when unique_violation then
    select * into v_existing_tx
    from public.model_portfolio_transactions
    where idempotency_key = 'settle-decision:' || p_decision_id::text;
    if found then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'transaction_id', v_existing_tx.id,
        'decision_id', p_decision_id
      );
    end if;
    return jsonb_build_object('ok', false, 'reason', 'unique_violation');
end;
$$;

revoke all on function public.settle_model_portfolio_decision(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.settle_model_portfolio_decision(uuid, jsonb)
  to service_role;

-- Credit a registered, source-confirmed dividend event. Eligibility uses ex-date holdings.
create or replace function public.credit_model_portfolio_dividend_event(
  p_event_id uuid,
  p_plan jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.model_portfolio_dividend_events%rowtype;
  v_portfolio public.model_portfolios%rowtype;
  v_existing_tx public.model_portfolio_transactions%rowtype;
  v_tx_id uuid;
  v_idempotency_key text;
  v_qty numeric(24,8);
  v_gross_sek bigint;
  v_native_currency text;
  v_native_gross bigint;
  v_fx_rate numeric(18,8);
  v_fx_as_of timestamptz;
  v_fx_source text;
  v_cash_minor bigint;
  v_invested_minor bigint;
  v_contributed_minor bigint;
  v_total_minor bigint;
  v_now timestamptz := now();
begin
  if p_event_id is null or p_plan is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_input');
  end if;

  select * into v_event
  from public.model_portfolio_dividend_events
  where id = p_event_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'event_not_found');
  end if;

  v_idempotency_key := coalesce(p_plan ->> 'idempotencyKey', 'dividend:' || v_event.portfolio_id::text || ':' || v_event.source_event_key);

  select * into v_existing_tx
  from public.model_portfolio_transactions
  where idempotency_key = v_idempotency_key;

  if found then
    update public.model_portfolio_dividend_events
    set status = 'credited',
        credited_transaction_id = v_existing_tx.id,
        updated_at = v_now
    where id = v_event.id
      and status <> 'credited';
    return jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'transaction_id', v_existing_tx.id,
      'event_id', v_event.id
    );
  end if;

  if v_event.status = 'credited' then
    return jsonb_build_object('ok', true, 'idempotent', true, 'event_id', v_event.id);
  end if;

  if v_event.status <> 'registered' then
    return jsonb_build_object('ok', false, 'reason', 'event_not_registered');
  end if;

  select * into v_portfolio
  from public.model_portfolios
  where id = v_event.portfolio_id
  for update;

  if v_portfolio.status <> 'active' then
    return jsonb_build_object('ok', false, 'reason', 'portfolio_not_active');
  end if;

  if (v_now at time zone 'Europe/Stockholm')::date < v_event.payment_date then
    return jsonb_build_object('ok', false, 'reason', 'payment_not_due');
  end if;

  v_qty := (p_plan ->> 'eligibleQuantity')::numeric;
  v_gross_sek := (p_plan ->> 'grossAmountSekMinor')::bigint;
  v_native_currency := p_plan ->> 'nativeCurrency';
  v_native_gross := (p_plan ->> 'nativeGrossMinor')::bigint;
  v_fx_rate := (p_plan ->> 'fxRateToSek')::numeric;
  v_fx_as_of := nullif(p_plan ->> 'fxAsOf', '')::timestamptz;
  v_fx_source := p_plan ->> 'fxSourcePublisher';

  if v_qty is null or v_qty <= 0 or v_gross_sek is null or v_gross_sek <= 0
     or v_native_currency is null or v_fx_rate is null or v_fx_rate <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_plan');
  end if;

  insert into public.model_portfolio_transactions (
    portfolio_id, decision_id, transaction_type, instrument_symbol, exchange, instrument_name,
    quantity, price_minor, gross_amount_minor, fee_minor, currency, executed_at, market_data_as_of,
    rationale, idempotency_key,
    native_currency, native_price_minor, native_gross_amount_minor,
    fx_rate_to_sek, fx_as_of, fx_source_publisher, fill_label
  ) values (
    v_portfolio.id,
    null,
    'dividend',
    v_event.instrument_symbol,
    v_event.exchange,
    v_event.instrument_name,
    v_qty,
    null,
    v_gross_sek,
    0,
    'SEK',
    v_now,
    v_now,
    'Utdelning krediterad från verifierad bolagshändelse (' || v_event.source_publisher || ').',
    v_idempotency_key,
    v_native_currency,
    v_event.native_amount_per_share_minor,
    v_native_gross,
    v_fx_rate,
    v_fx_as_of,
    v_fx_source,
    'SIMULATED'
  )
  returning id into v_tx_id;

  insert into public.model_portfolio_cash_ledger (
    portfolio_id, event_type, amount_minor, currency, effective_at, external_key, transaction_id, metadata
  ) values (
    v_portfolio.id,
    'dividend',
    v_gross_sek,
    'SEK',
    v_now,
    'cash:' || v_idempotency_key,
    v_tx_id,
    jsonb_build_object(
      'source_event_key', v_event.source_event_key,
      'ex_date', v_event.ex_date,
      'payment_date', v_event.payment_date,
      'native_currency', v_native_currency,
      'fx_rate_to_sek', v_fx_rate
    )
  );

  update public.model_portfolio_dividend_events
  set status = 'credited',
      eligible_quantity = v_qty,
      credited_transaction_id = v_tx_id,
      updated_at = v_now
  where id = v_event.id;

  select coalesce(sum(amount_minor), 0) into v_cash_minor
  from public.model_portfolio_cash_ledger
  where portfolio_id = v_portfolio.id;

  select coalesce(sum(round(quantity * coalesce(last_price_minor, 0))), 0) into v_invested_minor
  from public.model_portfolio_holdings
  where portfolio_id = v_portfolio.id
    and quantity > 0;

  select coalesce(sum(amount_minor), 0) into v_contributed_minor
  from public.model_portfolio_cash_ledger
  where portfolio_id = v_portfolio.id
    and event_type in ('initial_capital', 'monthly_contribution');

  v_total_minor := v_cash_minor + v_invested_minor;

  insert into public.model_portfolio_snapshots (
    portfolio_id, snapshot_at, total_value_minor, cash_value_minor,
    invested_value_minor, contributed_capital_minor, market_data_as_of
  ) values (
    v_portfolio.id,
    v_now,
    v_total_minor,
    v_cash_minor,
    v_invested_minor,
    v_contributed_minor,
    v_now
  )
  on conflict (portfolio_id, snapshot_at) do nothing;

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'transaction_id', v_tx_id,
    'event_id', v_event.id,
    'cash_minor', v_cash_minor
  );
exception
  when unique_violation then
    select * into v_existing_tx
    from public.model_portfolio_transactions
    where idempotency_key = coalesce(p_plan ->> 'idempotencyKey', '');
    if found then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'transaction_id', v_existing_tx.id,
        'event_id', p_event_id
      );
    end if;
    return jsonb_build_object('ok', false, 'reason', 'unique_violation');
end;
$$;

revoke all on function public.credit_model_portfolio_dividend_event(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.credit_model_portfolio_dividend_event(uuid, jsonb)
  to service_role;

-- Activate the four seeded model portfolios now that settlement exists.
update public.model_portfolios
set status = 'active',
    launched_at = coalesce(launched_at, timestamptz '2026-08-10T09:00:00+02:00'),
    updated_at = now()
where slug in ('forsiktig', 'medelrisk', 'hog-risk', 'utdelning')
  and status = 'draft';
