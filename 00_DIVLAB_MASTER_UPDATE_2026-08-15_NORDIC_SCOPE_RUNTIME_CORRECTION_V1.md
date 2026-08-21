# DIVLAB MASTER UPDATE — Nordic scope runtime correction v1

Date: 2026-08-15
Status: ACTIVE_PR / INTERNAL_VALIDATION
Scope: Nasdaq Nordic CNS scope, real peer validation and cost-controlled rollback.

## Acceptance rule

This update is authoritative only if the exact commit containing it passes the full standard GitHub Quality Gate. It supersedes only the First North discovery claim in `00_DIVLAB_MASTER_UPDATE_2026-08-15_NORDIC_DISCOVERY_COST_CONTROL_V1.md`; all cost-control and issuer-name-normalization rules from that update remain in force.

## Runtime finding

A protected Preview on the batched validation-export checkpoint tested the proposed report-aware `globalName=""` Nasdaq CNS scope across all nine curated peer companies.

Observed result:

- 0/9 had accepted Nordic primary-source rows;
- every company reported `sourceCount=0` and `evidenceCount=0` on the primary-source path;
- previously ready Main Market peers such as Munters, Sandvik, Epiroc, Paradox and MTG therefore failed `freshPrimarySource` and `primaryEvidenceCoverage` in that run;
- no packet was exported;
- no peer research version was persisted;
- no target Analyst call was made.

Conclusion: blank `globalName` is **not** a verified broader Nasdaq Nordic discovery scope and must not remain in production-path code.

## Corrective rule

The CNS adapter is restored to the last runtime-proven scope:

- `globalGroup=exchangeNotice`;
- `globalName=NordicMainMarkets`;
- bounded `freeText` issuer/report discovery;
- max 5 search terms;
- max 20 CNS rows per term;
- max 12 accepted issuer-matched hits;
- one official PDF attempt per company/pass;
- `attachment.news.eu.nasdaq.com` allowlist;
- conservative issuer-name matching.

`preferFinancialReports=true` continues to change the **search terms and report prioritization only**. It no longer changes the Nasdaq market scope.

## First North status

First North remains an explicit source-coverage gap until a Nasdaq query contract is empirically verified without regressing Main Market discovery.

Known curated First North exposure includes Kambi and GiG Software. Their official disclosures exist, but DivLab must not guess a CNS market selector or silently broaden issuer matching merely to make readiness green.

The first real peer target milestone therefore remains **Atlas Copco first**, because its curated peer set (Munters, Sandvik, Epiroc A) has already demonstrated 3/3 readiness under the runtime-proven Main Market path before the failed scope experiment.

## Stillfront

The separate legal/display-name normalization (`StillFront AB` vs `Stillfront Group`) remains valid and tested. Its real runtime effect must be rechecked only when the next justified protected Preview is run on the restored Main Market scope.

## Cost-control rule remains binding

Do not create another Preview solely to test one query hypothesis.

Required workflow:

1. restore known-good Main Market behavior;
2. lock the rollback with root regression tests;
3. finish any other non-runtime peer work in the same code batch;
4. run full GitHub Quality Gate;
5. only then use one protected Preview for a meaningful batch that can advance immutable DEV persistence.

No documentation-only, test-only or one-line query experiment justifies a separate Vercel Preview build.

## Validation-export interaction

`peer-research-validation-export-v1` remains the intended read-only bridge once runtime readiness is restored. It must only export a single facts-only packet after `peer-research-readiness-v1` passes and ordinary public `publishable=false` is confirmed.

The connected `dividend-lab-dev` Supabase operator has been read-only verified to execute the existing analysis persistence RPC and peer-readiness helper. Production remains out of scope.

## Next gated sequence

1. full Quality Gate on this corrective checkpoint;
2. batch any remaining non-runtime Atlas operator/audit preparation before another Preview;
3. one protected runtime batch on the restored Main Market scope;
4. if Atlas remains 3/3 ready, export MTRS/SAND/EPI-A only;
5. persist those exact exports to `dividend-lab-dev` through the existing guarded RPC;
6. read back and SQL-verify `publishable=false`, `deep-research-v2`, `valuation-provenance-v1`, peer-ready=true and exact source bindings;
7. run the first real Atlas Copco version-bound peer audit;
8. run the first real single-call `analyst-v3-peer`;
9. solve First North as a separate source-adapter task using a verified Nasdaq scope, not trial deployments.

## Scope boundary

No production write, no production deployment, no public analysis route, no historical portfolio rewrite and no quality-gate weakening is authorized by this update.
