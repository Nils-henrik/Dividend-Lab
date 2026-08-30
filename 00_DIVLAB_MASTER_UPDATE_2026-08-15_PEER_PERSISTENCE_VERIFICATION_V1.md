# DIVLAB MASTER UPDATE — Peer persistence verification v1

Date: 2026-08-15
Status: ACTIVE_PR / INTERNAL_VALIDATION
Scope: deterministic read-back verification for operator-assisted peer research persistence in dividend-lab-dev.

## Acceptance rule

This update is authoritative only if the exact commit containing it passes the full standard GitHub Quality Gate: lint, TypeScript, core tests, SEO/news tests, DivBrain tests, Cursor bridge tests and Next.js production build.

## New contract

`peer-research-persistence-verification-v1`

Purpose: prove that a facts-only peer packet exported from the protected Preview validation surface was persisted **unchanged** as an immutable DEV analysis version before that version is allowed to participate in a peer audit.

The verifier is deterministic and performs no network or database work itself. The operator supplies:

- the exact `peer-research-validation-export-v1` envelope;
- the persisted analysis-version row read back from `dividend-lab-dev`;
- the persisted source IDs attached to that version.

## Mandatory checks

Verification fails closed unless all of the following hold:

1. export version is `peer-research-validation-export-v1`;
2. export and packet remain ordinary `publishable=false`;
3. exported packet still passes `peer-research-readiness-v1`;
4. export symbol/exchange/name/dataAsOf are bound to the packet;
5. persisted row passes the existing `buildPeerReadyResearchPacketFromRow(...)` immutable row contract;
6. persisted row symbol/exchange match the export;
7. persisted row `dataAsOf` exactly matches the export;
8. persisted instrument name matches the export;
9. persisted packet is canonically JSON-equivalent to the exact exported packet, independent of JSON object key ordering;
10. exported source IDs are unique and non-empty;
11. persisted source IDs are unique and non-empty;
12. persisted source-ID set equals the exported packet source-ID set exactly — no missing or extra bindings.

Success returns the verified immutable analysis-version UUID, instrument identity, `dataAsOf` and source count.

## Security / integrity purpose

A peer may not advance merely because an analysis row exists in DEV. The row must prove that it is the exact packet seen during protected runtime validation and that the source bindings survived persistence unchanged.

This prevents:

- operator copy/paste drift;
- wrong instrument or point-in-time version;
- a peer row being accidentally marked public publishable;
- post-export packet manipulation;
- lost, duplicated or extra source bindings;
- a stale or different peer packet from being used by a later audit.

The existing database integrity triggers, `valuation-provenance-v1`, `peer-research-readiness-v1` and version-bound peer audit checks remain authoritative. This verifier adds an operator read-back certification layer; it does not replace database integrity.

## Current DEV preflight

Read-only DEV inspection confirms the connected operator can execute the existing analysis persistence RPC and the `divlab_peer_research_ready(jsonb)` helper without exposing a Vercel service-role secret.

Current Atlas Copco peer registry in `dividend-lab-dev` is version 1, data-as-of 2026-08-15 11:27 UTC, and contains exactly:

- Epiroc A (`EPI-A.ST`)
- Munters (`MTRS.ST`)
- Sandvik (`SAND.ST`)

No peer research version may be treated as persisted/usable until it passes this read-back verification after a future runtime export.

## Cost-control interaction

The Vercel cost rule remains binding. This verifier is intentionally built in the same corrective batch as the Nasdaq Main Market rollback and runtime-correction Master so the next protected Preview can justify its cost by advancing the complete chain:

`real runtime fetch → peer readiness → single-peer export → DEV persistence → deterministic read-back verification`.

No new Preview is needed merely to test this verifier; GitHub Quality Gate is sufficient for the pure contract.

## Next gated sequence

1. full Quality Gate on the combined corrective + verification checkpoint;
2. only after green, use one protected Preview on that meaningful checkpoint;
3. re-run the curated peer batch on the restored Main Market scope;
4. if Atlas remains 3/3 ready, export MTRS/SAND/EPI-A individually from that same Preview;
5. persist each exact export to `dividend-lab-dev` using the existing RPC;
6. read back each version and its source IDs;
7. require `peer-research-persistence-verification-v1` semantics for all three;
8. only then create the first real Atlas Copco version-bound peer audit;
9. first real single-call `analyst-v3-peer` follows only after the audit passes;
10. production remains untouched until explicit release intent.

## Scope boundary

No production write, no production deployment, no public analysis route, no historical portfolio rewrite and no quality-gate weakening is authorized by this update.
