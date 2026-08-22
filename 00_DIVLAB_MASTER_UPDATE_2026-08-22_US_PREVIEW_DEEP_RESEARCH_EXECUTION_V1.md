# DivLab Master Update — US Preview Deep Research Execution v1

Date: 2026-08-22
Status: ACCEPTED_PREVIEW_RUNTIME / STACK_READY
Parent: `agent/us-research-coverage-v1` / PR #272
Branch: `agent/us-preview-deep-research-execution-v1`
First and only v1 execution target: `MSFT`

## Entry condition

This slice is allowed to start because the founder-authenticated US Research Coverage v1 Preview endpoint has now returned HTTP 200 for MSFT under its locked route contract. The deterministic US research chain is therefore formally accepted at 100/100 before Analyst execution is opened.

## Purpose

Prove that one allowlisted US operating company can enter DivLab's **existing** Analyst and final quality sequence using the same canonical Research facts and verified SEC evidence that passed US Research Coverage v1.

This is an execution proof, not a production launch.

## Locked architecture

DivLab must not create a separate US analyst engine.

The implementation must reuse the established operating-company sequence:

1. canonical facts-only Research packet;
2. supported company methodology gate;
3. existing Analyst generation;
4. deterministic Bear/Base/Bull valuation rebuild;
5. existing Analyst quality gate;
6. at most one existing bounded Analyst quality repair;
7. exact final Research publication quality gate;
8. exact final Analyst publication quality gate.

The generic Analyst service may be refactored so it can execute from **already loaded verified Research inputs** plus additional verified sources/evidence. The ordinary `createDivLabAiAnalysis` API must continue to behave the same for the existing Nordic path.

## Critical provenance requirement

The US execution path may not silently call the old loader and discard the SEC evidence that made US Research Coverage ready.

Before any Analyst/model call:

- Global Source Discovery must re-run server-side;
- Global Evidence Extraction must be 100/100;
- the existing `loadDivLabResearchInputs` must succeed;
- verified SEC `AnalysisSource` and `AnalysisEvidence` must be merged into the canonical Research inputs/packet;
- US Research Coverage must still equal 100/100.

The exact merged source/evidence set must then be the source set available to the Analyst stage and the final Research packet.

## Preview execution endpoint

Create a separate endpoint for this slice rather than widening the existing Nordic `/api/internal/analysis/run` route.

The endpoint must be:

- Preview-only;
- founder / `ceo_divlab` / admin protected;
- hard allowlisted to `MSFT` in v1;
- POST-only for explicit execution;
- no persistence option;
- no publication option;
- no Supabase service-role client passed to analysis persistence;
- no production `canRunAnalysis` change.

The endpoint may call the Analyst model only after deterministic US Research Coverage is 100/100.

## Success semantics

A successful Preview execution may return `ready` only when:

- US Research Coverage = 100/100 before Analyst execution;
- final Research quality gate is publishable / 100/100;
- final Analyst quality gate is publishable / 100/100;
- final packet still contains the verified SEC primary sources/evidence;
- persistence is null;
- publication is null.

The response may expose bounded internal QA fields such as model, usage, view, risk level, confidence, scenario values and quality scores. It must not expose provider credentials or secrets.

## Failure semantics

Every stage remains fail-closed.

If source discovery, evidence extraction, Research loading, US Research Coverage, methodology, Analyst generation, Analyst quality or final Research quality fails, the endpoint must stop at that stage and return exact safe blockers where available.

A failed run must never persist or publish partial output.

## Existing behavior protection

- The established Nordic `/api/internal/analysis/run` behavior must remain unchanged.
- Existing `createDivLabAiAnalysis` callers must retain their current load -> Analyst -> optional persistence contract.
- Specialist engines for bank, investment company and asset manager must not be modified in this slice.
- Global `canRunAnalysis` must remain locked outside separately verified paths.

## Automated regression requirements

Tests must prove at minimum:

1. existing `createDivLabAiAnalysis` still loads ordinary Research inputs and delegates to the shared Analyst sequence;
2. the shared Analyst sequence can accept already loaded Research inputs plus additional verified sources/evidence;
3. additional SEC source/evidence IDs survive into facts and final packets;
4. Preview execution route is founder protected and MSFT-only;
5. the route re-runs source discovery + Evidence 100/100 + US Research Coverage 100/100 before any Analyst execution call;
6. route does not import or call persistence/publication services;
7. route never passes a Supabase persistence client to the Analyst service;
8. success requires both final Research and Analyst quality gates to be publishable;
9. existing Nordic run route remains structurally unchanged by this slice.

## Validation gate

This slice may be called code-complete only after:

- lint passes with no new warnings/errors;
- TypeScript passes;
- repository core tests pass;
- DivBrain and Cursor bridge regression suites pass;
- optimized Next.js build passes;
- ordinary Preview deployment is READY;
- founder-authenticated MSFT execution proves Research 100/100 + Analyst 100/100;
- persistence/publication remain absent;
- no production deployment or write is performed.

## Founder runtime acceptance — 2026-08-22

The founder-authenticated MSFT Preview Deep Research execution has now passed the locked gate on the repaired PR #276 Preview stack.

Observed acceptance result:

- Execution gate: `READY`
- US Research: `100/100`
- Final Research: `100/100`
- Analyst: `100/100`
- Evidence gate: `100/100`
- SEC source provenance: `BEVARAD`
- SEC evidence provenance: `BEVARAD`
- Persistence: `AV` / no persistence performed
- Publication: `AV` / no publication performed
- Source packet: 4 sources / 2 evidence items
- Analyst run completed through the existing canonical engine and bounded quality-repair path without lowering the 6/11 qualitative-factor gate.

The earlier runtime failures were intentionally fail-closed and led to three bounded corrections only: blocked-branch SEC provenance observability, provider/domain schema alignment, and source-linked qualitative factor evidence hints. No Research or Analyst quality threshold was lowered, unsupported factors were not auto-promoted, and no persistence/publication path was introduced.

### Acceptance decision

`US Preview Deep Research Execution v1` is **accepted for Preview runtime**. PR #276 may now leave draft status and the master-guided stacked workflow may proceed to PR #277 and then PR #278. This acceptance does **not** authorize production global execution, persistence, publication, or a global `canRunAnalysis` expansion.

Next stack order remains:

1. PR #276 — accepted Preview execution foundation;
2. PR #277 — observation-first monster coverage pass;
3. PR #278 — bounded source/evidence gap repairs and canary certification.

Only after the stack is explicitly reviewed as a unit should merge/release decisions be taken.
