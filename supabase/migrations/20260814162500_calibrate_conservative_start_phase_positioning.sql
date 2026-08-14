-- DivLab model portfolios: start-phase sizing calibration, 2026-08-14.
-- All four portfolios currently have only 10,000 SEK of starting capital and use
-- whole-share execution. Static low position ceilings can therefore exclude
-- otherwise valid shares purely because one whole share costs too much.
-- These values are hard ceilings, not target weights. Diversification remains a
-- portfolio objective and the AI should normally size materially below the cap.
-- Minimum meaningful trade size is enforced separately at 10% in turnover policy.

update public.model_portfolios
set strategy_rules = jsonb_set(
  coalesce(strategy_rules, '{}'::jsonb),
  '{max_single_position_pct}',
  case strategy_key
    when 'conservative' then '40'::jsonb
    when 'balanced' then '50'::jsonb
    when 'high_risk' then '100'::jsonb
    when 'dividend' then '100'::jsonb
    else coalesce(strategy_rules -> 'max_single_position_pct', '15'::jsonb)
  end,
  true
)
where strategy_key in ('conservative', 'balanced', 'high_risk', 'dividend');
