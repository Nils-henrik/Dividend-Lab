-- Försiktig start-phase sizing calibration, 2026-08-14.
-- With only 10,000 SEK of starting capital and whole-share execution, a 12%
-- single-position ceiling blocks many otherwise valid quality names before the
-- AI can evaluate them. During the early experiment phase we allow up to 40%
-- in one position while retaining the conservative research/risk gates. The
-- turnover policy separately requires a minimum 10% trade.

update public.model_portfolios
set strategy_rules = jsonb_set(
  coalesce(strategy_rules, '{}'::jsonb),
  '{max_single_position_pct}',
  '40'::jsonb,
  true
)
where strategy_key = 'conservative';
