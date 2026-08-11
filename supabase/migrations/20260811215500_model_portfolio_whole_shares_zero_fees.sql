-- Model portfolio execution invariants:
-- 1) simulated trades use whole shares only;
-- 2) DivLab charges zero simulated brokerage/courtage on BUY and SELL;
-- 3) table-level checks protect these invariants even if application code regresses.

do $$
declare
  v_definition text;
  v_patched text;
begin
  select pg_get_functiondef(
    'public.settle_model_portfolio_decision(uuid,jsonb)'::regprocedure
  ) into v_definition;

  v_patched := replace(
    v_definition,
    'or v_quantity is null or v_quantity <= 0 or v_price_sek',
    'or v_quantity is null or v_quantity <= 0 or v_quantity <> trunc(v_quantity) or v_qty_after is null or v_qty_after < 0 or v_qty_after <> trunc(v_qty_after) or v_price_sek'
  );

  v_patched := replace(
    v_patched,
    'if v_side = ''buy'' and v_fee_sek <> 1000 then',
    'if v_side = ''buy'' and v_fee_sek <> 0 then'
  );
  v_patched := replace(
    v_patched,
    'if v_side = ''sell'' and v_fee_sek <> 1000 then',
    'if v_side = ''sell'' and v_fee_sek <> 0 then'
  );

  if v_patched = v_definition then
    raise exception 'settlement invariant guards were not found';
  end if;

  if position('v_quantity <> trunc(v_quantity)' in v_patched) = 0
     or position('v_qty_after <> trunc(v_qty_after)' in v_patched) = 0
     or position('v_side = ''buy'' and v_fee_sek <> 0' in v_patched) = 0
     or position('v_side = ''sell'' and v_fee_sek <> 0' in v_patched) = 0
  then
    raise exception 'settlement invariant patch incomplete';
  end if;

  execute v_patched;
end;
$$;

alter table public.model_portfolio_transactions
  drop constraint if exists model_portfolio_transactions_whole_quantity_check;
alter table public.model_portfolio_transactions
  add constraint model_portfolio_transactions_whole_quantity_check
  check (quantity = trunc(quantity)) not valid;

alter table public.model_portfolio_transactions
  drop constraint if exists model_portfolio_transactions_zero_fee_check;
alter table public.model_portfolio_transactions
  add constraint model_portfolio_transactions_zero_fee_check
  check (fee_minor = 0) not valid;

alter table public.model_portfolio_holdings
  drop constraint if exists model_portfolio_holdings_whole_quantity_check;
alter table public.model_portfolio_holdings
  add constraint model_portfolio_holdings_whole_quantity_check
  check (quantity = trunc(quantity)) not valid;

revoke all on function public.settle_model_portfolio_decision(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.settle_model_portfolio_decision(uuid, jsonb)
  to service_role;
