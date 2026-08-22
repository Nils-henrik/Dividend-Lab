# DivLab Master Update — US Preview Runtime Repair v1

Date: 2026-08-22
Status: ACTIVE_PR / PREVIEW_ONLY
Parent slice: PR #276 `agent/us-preview-deep-research-execution-v1`
Target: MSFT only

## Runtime finding

The first real founder-authenticated US Preview Deep Research execution reached the existing Analyst chain and remained correctly fail-closed.

Verified runtime result:

- US Research Coverage: 100/100 before Analyst execution
- first Analyst quality pass: 67/100
- failed checks on first pass: `qualityFactorCoverage`, `confidenceCalibration`
- the existing single bounded Analyst quality repair executed
- repaired Analyst quality: 83/100
- remaining blocker: `qualityFactorCoverage`
- repaired qualitative coverage: 5 of 11 known; minimum remains 6 of 11
- final Research: 100/100
- persistence: null / off
- publication: null / off

No threshold may be lowered and no unknown qualitative factor may be promoted merely to make the gate green.

## Provenance observability correction

The failed Preview UI displayed SEC source/evidence provenance as not proven because the route only calculated the provenance booleans after `result.ok === true`.

This was an observability defect, not permission to ignore provenance. The `analyst_quality` failure result already contains the final Research packet, so the route must compare the expected SEC source/evidence IDs against that packet before returning the fail-closed response.

The blocked response must now expose:

- US Research Coverage score
- Evidence quality score
- final Research score
- Analyst score
- SEC source-provenance preserved boolean
- SEC evidence-provenance preserved boolean
- source/evidence counts
- exact Analyst blockers

Persistence and publication remain null.

## Bounded quality-repair correction

The existing single post-valuation quality repair remains the only allowed quality-repair attempt. The gate and threshold remain unchanged.

The repair is tightened so that it must internally audit all eleven qualitative factors against the supplied verified evidence, preserve already legitimate known factors, and re-check unknown factors for explicit direct support.

Important boundaries:

- no invented source IDs
- no unsupported factor promotion
- no generic statement reused as evidence for an unrelated factor
- SEC/primary evidence may support market position, customer concentration, regulatory risk, currency risk, acquisition risk or disruption risk only when the supplied text actually supports that factor
- confidence remains calibrated to unknown-factor count
- deterministic valuation and Bear < Base < Bull rules remain unchanged
- quality-repair reasoning may use medium reasoning effort, but the number of repair attempts remains exactly one

## Regression lock

A source-contract regression must prove that:

1. the `analyst_quality` fail-closed branch computes and returns SEC source/evidence provenance;
2. US Research and Evidence scores remain visible on that branch;
3. the bounded repair contains the factor-by-factor evidence audit instruction;
4. the minimum six-known-factor quality threshold is not lowered.

## Next gate

Do not spend another live Analyst run until the branch has rebuilt successfully and the new Preview deployment is READY.

The next founder-authenticated MSFT run must still satisfy all of:

- US Research Coverage 100/100
- final Research 100/100
- Analyst 100/100
- SEC source provenance preserved
- SEC evidence provenance preserved
- persistence = null
- publication = null

If the evidence honestly supports fewer than six qualitative factors after the tightened repair, the run must remain BLOCKED and the next task is to improve verified Research/evidence coverage rather than weaken Analyst quality.
