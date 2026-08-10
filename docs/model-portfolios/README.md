# DivLab Modellportföljer

## Product boundary

The four portfolios are standardized public model portfolios. They are not customized to any user's holdings, income, risk tolerance or financial circumstances and must not be presented as personal investment advice.

## Seed state

- Försiktig — 10,000 SEK model cash.
- Medelrisk — 10,000 SEK model cash.
- Högrisk — 10,000 SEK model cash.
- Utdelning — 10,000 SEK model cash.
- Monthly model contribution: 5,000 SEK on the 25th for each portfolio.
- No holdings are seeded or invented.

## Monthly contribution automation

Supabase migration `20260808210934_schedule_model_portfolio_contributions.sql` installs `apply_model_portfolio_monthly_contributions()` and a daily pg_cron job. The function evaluates the current date in `Europe/Stockholm`, inserts only on each portfolio's configured contribution day, and uses `monthly-contribution:<slug>:YYYY-MM` as an idempotency key.

Production verification on 2026-08-08:

- normal Aug 8 invocation inserted 0 rows;
- Aug 25 simulation created 4 rows inside an explicit transaction;
- transaction was rolled back;
- persisted monthly-contribution rows remained 0;
- cron job `divlab-model-portfolios-monthly-contribution` is active at `5 0 * * *` UTC.

## Live simulation (2026-08-10)

Settlement, SEK-10 courtage, FX audit fields, dividend credit foundation and market LIVE badges are documented in [`live-simulation-activation-20260810.md`](./live-simulation-activation-20260810.md). Automated corporate-action ingestion remains fail-closed.


A portfolio must remain fail-closed until all of the following are true:

1. verified market-data provider is configured server-side;
2. quote timestamps/currencies/exchanges are validated;
3. deterministic risk and cash rules pass before any model call is executable;
4. AI decisions are validated after generation and before transaction persistence;
5. every executed change stores rationale, evidence, data-as-of, run id and idempotency key;
6. scheduled checks cannot create duplicate runs or duplicate trades;
7. report-triggered evaluations use a verified issuer/report source;
8. email notifications are sent only after a transaction is durably persisted;
9. separate model-portfolio AI spend limits are configured;
10. production Alpha verification passes before portfolio status changes from `draft` to `active`.

## Scheduler direction

Use Supabase Cron to trigger the portfolio evaluation workflow rather than depending on Vercel Hobby cron frequency. Scheduled market evaluations should target four defined market-day windows plus verified report events. Missing/stale market data must produce a logged `skipped` run and zero AI calls.
