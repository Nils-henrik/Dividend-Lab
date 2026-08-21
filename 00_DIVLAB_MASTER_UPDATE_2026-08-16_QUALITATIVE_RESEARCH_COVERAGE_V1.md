# DivLab Master Update — Qualitative Research Coverage v1

Date: 2026-08-16
Status: Preview release candidate / runtime QA required

## Runtime finding

The third real Atlas Copco A protected Preview run reached the post-valuation Analyst quality gate and remained fail-closed.

Observed runtime result:

- initial Analyst quality: 67/100
- bounded Terra quality repair: improved Analyst quality to 83/100
- initial failed checks: `qualityFactorCoverage`, `confidenceCalibration`
- after repair: only `qualityFactorCoverage` remained
- known qualitative factors after repair: 4/11
- required qualitative factors: at least 6/11
- Research quality shown by final packet: 91/100
- DEV database after failure: 0 analyses, 0 versions, 0 contents, 0 sources

This proves `analyst-quality-repair-v1` works technically and improves a real model result without bypassing the gate. The remaining blocker is insufficient legitimate qualitative source coverage, not transport/schema failure.

## Root cause

Dedicated Nordic Deep Research currently prioritizes a current quarterly/interim report and allows only one official PDF attempt per company pass. That is enough for current financial metrics but structurally thin for qualitative factors such as competitive advantage, pricing power, market position, management/capital allocation, reinvestment runway, customer concentration, regulatory risk, acquisition risk and disruption risk.

The quality threshold must not be lowered to compensate for thin research.

## Qualitative Primary Research v1

Dedicated DivLab product analysis now reserves bounded primary-source capacity for two different document jobs:

1. latest current/interim financial report
2. latest discoverable annual/year-end report

Rules:

- ordinary portfolio primary-source enrichment remains unchanged at one PDF attempt
- dedicated product analysis may attempt at most two official documents
- official attachment hostname allowlist is unchanged
- max document bytes remain hard-capped by `PRIMARY_SOURCE_ENRICHMENT_BOUNDS`
- issuer matching remains required
- no arbitrary web crawl is introduced
- current-report Nasdaq CNS discovery receives max 3 requests
- annual-report discovery receives max 2 requests
- total dedicated CNS request budget remains max 5 requests
- annual discovery reuses the existing bounded CNS adapter and issuer-side filtering
- duplicate disclosure URLs are removed before enrichment
- document ordering explicitly prefers one current report plus one annual/year-end report before lower-priority releases
- Analyst/repair still receives bounded evidence and may not invent facts or promote unknown factors without source support

## Research-quality observability

The protected Preview operator now exposes independent Research gate diagnostics as well as Analyst diagnostics:

- Research quality score
- Research blockers
- failed Research check names
- Research warnings
- Analyst quality score
- Analyst blockers
- failed Analyst check names
- Analyst warnings

If Analyst quality reaches 100 but final Research quality remains below 100, Preview stops before founder publication and returns `research_quality_failed` instead of allowing a later database error to hide the deterministic blocker.

## Quality thresholds remain unchanged

No threshold or integrity rule is weakened.

- Analyst `qualityFactorCoverage` remains at least 6 legitimate known factors out of 11.
- Research publication remains 100/100.
- Analyst publication remains 100/100.
- Bear/Base/Bull, source IDs, FX/currency, primary report, technical history and valuation provenance contracts remain unchanged.
- No production database writes are added.
- No model-portfolio decision, trade, holding or historical experiment result is rewritten.

## Release gate

Production remains blocked until a fresh real Atlas Copco A Preview run reaches:

1. Research quality 100/100
2. Analyst quality 100/100
3. guarded atomic publication success in `dividend-lab-dev`
4. DEV persistence verified by SQL
5. manual QA of public analysis page, chart, scenarios, sources, mobile layout and share actions
6. OpenGraph/X card, canonical, robots, JSON-LD and sitemap verification
7. Founder/ChatGPT release review

If the next run still reports Research 91/100, the newly exposed exact Research failed-check name is the source of truth for the next correction; no quality gate may be bypassed.
