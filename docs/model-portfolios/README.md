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

## AI launch gates

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

## Settlement layer (simulated)

Model trade settlement is **simulated only** — never brokerage execution.

- Fixed courtage: exactly **10 SEK** (`fee_minor = 1000`) on every BUY/SELL.
- Whole-share sizing from proposed weight and available SEK cash (fee reserved first).
- FX: portfolio accounting stays SEK; native price + `fx_to_sek` stored on transactions.
- Dividends: verified corporate-action payments only; idempotent by portfolio + instrument + payment event.
- Idempotency: `settle:decision:<decisionId>` prevents double settlement.
- Enable persistence path with `MODEL_PORTFOLIO_SETTLEMENT_ENABLED=true` after execution-quote validation.

Pure planning lives in `lib/model-portfolios/engine/settlement.ts` and `dividends.ts`.
DB writes live in `lib/model-portfolios/settlement-store.ts`.

## Live market status

`lib/model-portfolios/engine/market-hours.ts` resolves Nasdaq Stockholm and US regular sessions with deterministic holiday calendars (including movable Easter). UI: `LiveMarketStatus` on overview cards and detail headers.

## Scheduler direction

Use Supabase Cron to trigger the portfolio evaluation workflow rather than depending on Vercel Hobby cron frequency. Scheduled market evaluations should target four defined market-day windows plus verified report events. Missing/stale market data must produce a logged `skipped` run and zero AI calls.
