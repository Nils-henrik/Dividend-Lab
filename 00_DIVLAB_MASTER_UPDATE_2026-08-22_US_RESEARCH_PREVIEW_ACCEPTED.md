# DivLab Master Update — US Research Preview Acceptance

Date: 2026-08-22
Status: VERIFIED_PREVIEW_ACCEPTANCE
Parent: `agent/us-research-coverage-v1` / PR #272
Verification target: `MSFT`

## Acceptance result

The final founder-authenticated Preview acceptance gate for **US Research Coverage v1** is now satisfied.

Vercel Preview runtime logs for deployment `dpl_DEwfLt5DNn4zcbMAKv8As1m8tcCX` on branch `agent/us-research-coverage-v1` show two successful requests to:

`GET /api/internal/analysis/us-research-coverage?yahooSymbol=MSFT`

at approximately 2026-08-22 08:18 and 08:19 Europe/Stockholm time, both returning HTTP **200**.

Under the locked route contract, HTTP 200 can only be returned after all of the following have passed server-side:

- `VERCEL_ENV=preview`;
- authenticated Supabase user;
- founder / `ceo_divlab` / admin role;
- exact allowlisted target `MSFT`;
- verified US listed-equity resolution;
- Global Source Discovery ready for evidence extraction;
- Global Evidence Extraction quality = **100/100**;
- existing Research loader succeeds;
- existing canonical facts packet is built with verified SEC sources/evidence merged in;
- US Research Coverage evaluates ready = true / **100/100**.

The same route contract always returns `analysisExecutionEnabled: false`; it contains no Analyst/LLM call, no persistence path and no publication path.

## Consequence

The acceptance condition defined in `00_DIVLAB_MASTER_UPDATE_2026-08-21_US_RESEARCH_COVERAGE_V1.md` is fulfilled.

A separate next slice may now be opened:

**US Preview Deep Research Execution v1**

This next slice must remain stacked on PR #272 and must preserve the following boundaries:

- Preview-only;
- founder/CEO/admin protected;
- MSFT-only initial runtime target;
- existing canonical Research + Analyst contracts;
- verified SEC evidence must be retained in the canonical facts packet presented to the Analyst stage;
- Research and Analyst quality gates may not be weakened;
- no global production `canRunAnalysis` enablement;
- no production persistence or publication;
- no merge to `main` until the stacked analysis architecture is explicitly accepted.

## Architectural requirement for the next slice

Do not fork a separate US analysis engine.

The next implementation must reuse the existing DivLab Analyst/final-quality sequence while allowing already-verified canonical Research inputs plus regulator evidence to enter that sequence without silently reloading a weaker source set.

The established Nordic path must remain behaviorally unchanged.
