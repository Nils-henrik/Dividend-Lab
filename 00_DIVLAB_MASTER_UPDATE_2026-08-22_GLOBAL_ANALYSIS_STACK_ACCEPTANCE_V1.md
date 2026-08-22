# DivLab Master Update — Global Analysis Preview Stack Acceptance v1

Date: 2026-08-22
Status: ACCEPTED_PREVIEW_STACK / NO_PRODUCTION_EXPANSION
Consolidated branch: `agent/us-research-coverage-v1`
Parent: `agent/global-evidence-extraction-v1` / PR #271
Accepted child stack: PR #276 -> PR #277 -> PR #278

## Purpose

This update supersedes the previously unclaimed runtime-acceptance notes for the US Research Coverage slice and records the completed Preview-only acceptance of the stacked global-analysis proof.

It does not authorize production global execution, persistence/publication, a global `canRunAnalysis` expansion, or a merge to `main`.

## Founder-authenticated MSFT acceptance

The protected Preview execution path was exercised by the founder against real Microsoft (`MSFT`) data after deterministic source/evidence verification.

Accepted result:

- Execution gate: `READY`.
- US Research: `100/100`.
- Final Research: `100/100`.
- Analyst: `100/100`.
- Evidence gate: `100/100`.
- SEC source provenance: preserved through the final packet.
- SEC evidence provenance: preserved through the final packet.
- Persistence: `null` / off.
- Publication: `null` / off.

The route remained Preview-only, founder/CEO/admin protected and MSFT-only. No quality threshold was lowered to obtain this result.

## PR #276 — US Preview Deep Research Execution v1

PR #276 is runtime accepted and has been merged only into its parent stack branch.

The real runtime attempts initially failed closed on Analyst qualitative-factor coverage and provider/domain schema alignment. The repair work preserved all Research/Analyst thresholds, kept unsupported qualitative factors unknown unless source-bound evidence existed, and retained SEC provenance on both success and blocked branches.

Final founder runtime acceptance reached the exact required 100/100 + 100/100 result with no persistence/publication.

## PR #277 — Analysis Monster Coverage Pass v1

The frozen observation pass exercised 27 real targets across Nordic and US markets and all currently modeled company families where practical.

Acceptance summary:

- no P0 safety failures;
- unsupported methodology families remained fail-closed;
- Volvo completed full Nordic operating-company Deep Research at final Research `100/100` + Analyst `100/100` with no persistence/publication;
- MSFT completed the prepared-Research US path at Evidence `100/100`, US Research `100/100`, final Research `100/100`, Analyst `100/100`, with SEC provenance preserved;
- observed integration weaknesses were captured in the gap register instead of being hidden or reinterpreted.

PR #277 was restacked without rebasing/rewriting the frozen observation history and then merged only into the parent stack branch.

## PR #278 — bounded monster-pass repairs + Canary Certification v1

The patch phase repaired only observed source/evidence integration gaps and did not add unsupported methodology families or weaken gates.

Accepted outcomes include:

- XOM: bounded SEC successor/predecessor continuity preserves verified annual + interim filing provenance;
- EQT: asset-manager specialist Research is `research_ready` with source-bound Total AUM and FAUM evidence;
- SEB: source-bound ROE, CET1, capital-buffer and P/B evidence improved while missing bank-specific Fact Book context remains fail-closed;
- Investor: missing NAV/share and discount evidence remains fail-closed rather than guessed;
- temporary patch diagnostics were removed from ordinary deployment behavior;
- Canary Certification v1 remains the release gate for this bounded patch slice.

Intentionally unresolved P1s are not reclassified as passes. They remain explicit fail-closed product limitations for later dedicated slices.

## Consolidated branch verification

The complete accepted child stack is consolidated on `agent/us-research-coverage-v1` at merge commit:

`05c41f5695047d81c1079301a5d9dcb56232961a`

Vercel Preview deployment:

`dpl_55MoVxVUErwtzMWamM1THRDGqFFc`

Result: `READY`.

The exact consolidated commit completed the ordinary optimized Next.js build successfully, including TypeScript and static generation, and retained the internal analysis routes for source discovery, evidence extraction, US Research Coverage and US Preview Deep Research execution.

Earlier exact restack deployments were also READY before their respective parent-stack merges.

## Locked safety boundary after acceptance

The following remain mandatory:

- no merge to `main` from this acceptance decision;
- no production/global analysis enablement;
- no change to global `canRunAnalysis` eligibility;
- no persistence/publication expansion;
- no quality-gate reduction;
- no automatic routing of unsupported company families into the operating-company engine;
- insurance, real estate, ETF/fund and foreign-private-issuer methodology remain separate future slices unless independently specified and verified;
- the established Nordic path must remain protected.

## Stack decision

PR #276, PR #277 and PR #278 are complete for their defined Preview scopes and have been safely consolidated into PR #272's branch.

PR #272 may now be treated as runtime accepted for its Preview scope and may leave draft status after this documentation-only acceptance commit is built successfully.

Any further upward stack merge must remain a parent-branch merge only and must preserve the parent master contracts. Production or `main` release remains a separate explicit decision.