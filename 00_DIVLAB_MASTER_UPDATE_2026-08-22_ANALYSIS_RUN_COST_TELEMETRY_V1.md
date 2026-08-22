# DIVLAB MASTER UPDATE — ANALYSIS RUN COST TELEMETRY V1

Date: 2026-08-22
Status: ACTIVE / PREVIEW_ONLY
Parent stack: PR #279 (`agent/analysis-execution-auth-boundary-v1`)

## Why this update exists

DivLab Analys already records token usage and estimated model cost inside the Analyst services, but the ordinary internal analysis operator did not expose that usage after a run.

The locked Light Analysis / Deep Analysis product direction requires real run-level cost evidence before pricing can be calibrated. A commercial hypothesis such as approximately 10 SEK / 25 SEK must not be treated as validated unit economics without measured execution data.

## Decision

The internal Preview analysis flow shall surface the existing normalized Analyst usage object after cost-bearing AI execution.

For the currently supported analysis engines — operating company, bank and financial specialist — the ordinary `POST /api/internal/analysis/run` response may include:

- input tokens;
- output tokens;
- total tokens;
- `estimatedCostUsdMicros` from the existing Analyst usage contract.

The route must pass through the usage object produced by the analysis engine. It must not invent a second cost formula.

When a run reaches Analyst execution but later fails a Research/Analyst quality gate, available usage should still be returned to the internal operator so failed-but-cost-bearing runs are represented in future unit-economics measurements.

## Internal UI

The existing founder/staff-only Preview Analysis Creator may show:

- total tokens;
- estimated AI model cost in USD.

The UI must label the amount as an estimate and state that it is not DivLab's complete product cost.

No automatic USD-to-SEK conversion is introduced in this slice. Exchange-rate assumptions must not be silently mixed into run telemetry.

## What this telemetry does not represent

`estimatedCostUsdMicros` is model-cost telemetry from the existing Analyst contract. It is not a complete COGS number.

It does not automatically include every possible external cost such as:

- hosting/runtime cost;
- database/storage cost;
- market-data or future licensed-data cost;
- payment fees;
- support, moderation or editorial cost;
- future queue/infrastructure overhead;
- taxes or FX effects.

Pricing decisions therefore remain outside this engineering acceptance gate.

## Safety boundary

This slice does **not**:

- enable paid users;
- add credits, Stripe, subscriptions or billing;
- change the staff-only Preview execution boundary from PR #279;
- expose provider credentials or secrets;
- change model selection;
- change source/evidence contracts;
- lower Research 100/100 or Analyst 100/100 gates;
- change persistence/publication semantics;
- enable Production execution;
- broaden global `canRunAnalysis`.

## Regression contract

`tests/analysis-run-cost-telemetry.test.ts` locks the intended plumbing:

- all three ordinary analysis-engine success responses carry the engine's existing `result.usage`;
- post-Analyst quality failures carry usage when the service has it;
- the Preview creator understands the normalized usage fields;
- UI presentation converts micro-USD to display USD only;
- no SEK conversion or billing vocabulary is introduced by this slice.

## Validation / release discipline

This is a small stacked observability patch above PR #279.

- Create one atomic branch commit.
- Use the normal Vercel Preview build as release verification, not as an edit loop.
- No live Deep Research execution is required solely to prove pass-through telemetry.
- The separate founder-authenticated MSFT Deep Research acceptance gate remains unchanged.
- No merge is authorized by this document.

## Next product consequence

After enough real founder/canary runs have been observed, DivLab can compare actual Light/Deep execution economics against the commercial hypothesis and then design the separate paid-user entitlement/job/credit boundary described in PR #279.

Until then, telemetry is observational only and must not debit a user or imply a price.