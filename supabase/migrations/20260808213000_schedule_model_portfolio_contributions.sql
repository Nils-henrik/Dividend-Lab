-- Idempotent monthly contribution automation for DivLab Modellportföljer.
-- Runs daily via Supabase Cron but only inserts on each portfolio's configured
-- contribution day. A unique external_key prevents duplicate monthly credits.

create extension if not exists pg_cron with schema extensions;

create or replace function public.apply_model_portfolio_monthly_contributions(
  p_now timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_local_date date := (p_now at time zone 'Europe/Stockholm')::date;
  v_month_key text := to_char((p_now at time zone 'Europe/Stockholm'), 'YYYY-MM');
  v_inserted integer := 0;
begin
  insert into public.model_portfolio_cash_ledger (
    portfolio_id,
    event_type,
    amount_minor,
    effective_at,
    external_key,
    metadata
  )
  select
    p.id,
    'monthly_contribution',
    p.monthly_contribution_minor,
    p_now,
    'monthly-contribution:' || p.slug || ':' || v_month_key,
    jsonb_build_object(
      'reason', 'Automatiskt månadsspar i DivLab Modellportföljer',
      'configured_day', p.contribution_day,
      'stockholm_date', v_local_date
    )
  from public.model_portfolios p
  where p.monthly_contribution_minor > 0
    and p.contribution_day = extract(day from v_local_date)::integer
  on conflict (external_key) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke all on function public.apply_model_portfolio_monthly_contributions(timestamptz)
  from public, anon, authenticated;
grant execute on function public.apply_model_portfolio_monthly_contributions(timestamptz)
  to service_role;

-- One inexpensive daily check is enough; business-day logic is irrelevant for
-- cash contributions. 00:05 UTC is safely inside the same Stockholm calendar
-- date in both CET and CEST.
select cron.schedule(
  'divlab-model-portfolios-monthly-contribution',
  '5 0 * * *',
  $$select public.apply_model_portfolio_monthly_contributions(now());$$
);
