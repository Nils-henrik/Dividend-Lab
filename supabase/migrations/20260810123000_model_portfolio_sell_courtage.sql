-- Correct simulated brokerage realism: every executed BUY and SELL costs exactly SEK 10.
-- Keep the settlement RPC service-role only while patching the already-reviewed function body.

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
    'IF v_side = ''sell'' AND v_fee_sek <> 0 THEN',
    'IF v_side = ''sell'' AND v_fee_sek <> 1000 THEN'
  );

  if v_patched = v_definition then
    v_patched := replace(
      v_definition,
      'if v_side = ''sell'' and v_fee_sek <> 0 then',
      'if v_side = ''sell'' and v_fee_sek <> 1000 then'
    );
  end if;

  if v_patched = v_definition then
    raise exception 'sell courtage guard was not found in settle_model_portfolio_decision';
  end if;

  execute v_patched;
end;
$$;

revoke all on function public.settle_model_portfolio_decision(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.settle_model_portfolio_decision(uuid, jsonb)
  to service_role;
