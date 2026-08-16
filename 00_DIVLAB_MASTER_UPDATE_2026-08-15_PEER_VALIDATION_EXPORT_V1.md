# DIVLAB MASTER UPDATE — Peer validation export v1

Date: 2026-08-15
Status: ACTIVE_PR / INTERNAL_VALIDATION
Scope: real-company peer persistence validation without weakening Preview security.

## Acceptance rule

This update is accepted only if the exact commit containing this file passes the full standard GitHub Quality Gate. If that commit fails, this update is not authoritative until corrected and re-verified.

## New internal contract

`peer-research-validation-export-v1`

Purpose: provide a read-only, single-peer operator export from the already protected Preview validation route after a facts-only packet passes `peer-research-readiness-v1`.

The export contains:

- export version;
- export timestamp;
- deterministic analysis slug;
- instrument identity;
- `dataAsOf`;
- `ordinaryPublishable=false`;
- complete peer-readiness result;
- exact `deep-research-v2` facts-only packet.

The export is rejected when:

- peer readiness is false;
- the packet is ordinary public `publishable=true`;
- the export timestamp is invalid.

The export makes zero model calls and zero database writes.

## Preview route rules

The temporary internal peer route remains Preview-only, curated-peer-only and no-store.

Additional permanent validation rules:

- `export=1` is single-peer only;
- `batch=1&export=1` returns `batch_export_forbidden`;
- `persist=1&export=1` returns `persist_export_conflict`;
- the export path does not initialize the DEV admin client merely because export was requested;
- default diagnostics remain bounded metadata and do not include report text;
- production continues to return 404;
- Deployment Protection must remain enabled.

## DEV operator persistence bridge

For internal validation only, a peer-ready export may be persisted through the connected `dividend-lab-dev` Supabase operator using the existing `persist_divlab_analysis_version(...)` RPC.

This is not a new production persistence mechanism and does not replace the guarded application path. It exists so real immutable peer versions can be proven without copying a service-role secret into Vercel or source control.

After operator persistence, mandatory read-back checks are:

- correct symbol/exchange;
- `publishable=false`;
- `research_packet.version=deep-research-v2`;
- `valuationProvenance.version=valuation-provenance-v1`;
- `public.divlab_peer_research_ready(research_packet)=true`;
- persisted source rows match the exported source set.

No real peer set may advance to a target audit until all required member versions have passed those checks.

## Cost-control interaction

The Vercel cost rule from `00_DIVLAB_MASTER_UPDATE_2026-08-15_NORDIC_DISCOVERY_COST_CONTROL_V1.md` remains in force.

This export work must be batched with related tests/docs into one meaningful commit before a branch ref is moved. A protected Preview is justified only after the code checkpoint is green and real runtime/export validation is ready to be performed.

## Next gated sequence

1. full Quality Gate for the validation-export checkpoint;
2. continue batching any remaining non-runtime peer work without Preview churn;
3. perform one protected runtime batch when the checkpoint is large enough;
4. export only peers that actually pass readiness;
5. persist exported peers only to `dividend-lab-dev` through the connected operator;
6. SQL/read-back verify each immutable version;
7. complete Atlas Copco's three persisted peers first if its 3/3 runtime readiness remains stable;
8. run first real version-bound Atlas Copco peer audit;
9. run first real single-call `analyst-v3-peer`;
10. keep production untouched until explicit release intent.

## Scope boundary

No production write, no production deployment, no public API exposure, no historical portfolio rewrite and no weakening of research or audit quality gates is authorized by this update.
