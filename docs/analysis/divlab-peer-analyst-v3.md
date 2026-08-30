# DivLab Analyst v3-peer

Status: **internal backend pipeline implemented and verified on branch/dev**. No real peer memberships, no public UI and no production deployment.

## Why v3-peer exists

`analyst-v2` has a strict source namespace for claims about the target company. Peer evidence belongs to a different provenance chain: an immutable peer registry plus exact immutable research versions for every peer.

DivLab therefore does not silently add peer claims to `analyst-v2`.

`analyst-v3-peer` keeps the complete v2 target-company contract and adds a separate peer section whose provenance is one persisted `peerAuditId`.

## Provenance chain

The current path is:

1. exact immutable target `deep-research-v2` version;
2. latest eligible immutable peer-set version at or before the target boundary;
3. latest publishable immutable research version for every registered peer at or before the target boundary;
4. deterministic `peer-comparison-v1`;
5. immutable `peer-comparison-audit-v1`;
6. FK-verified `peer-analyst-context-v1`;
7. `analyst-v3-peer` content bound to the exact target analysis version and exact audit row.

No unregistered peer, later research version or later peer-basis source may be substituted.

## Point-in-time safety

Both TypeScript and PostgreSQL reject look-ahead:

- peer-set `dataAsOf` later than target research;
- relationship source `verifiedAt` later than target research;
- peer research later than target research.

Historical analysis therefore cannot gain future knowledge simply because newer immutable rows now exist.

## Peer audit integrity

The audit stores exact UUID references for target and every peer research version.

PostgreSQL now independently recomputes the four supported relative valuation measures from the persisted research packets before an audit transaction can commit:

- P/E;
- P/FCF;
- EV/EBIT;
- EV/EBITDA.

For each measure the database checks:

- traceable target value;
- eligible peer sample size;
- ready/insufficient status;
- median;
- min/max;
- target-vs-median percentage.

A manipulated aggregate is rejected even if all supplied UUIDs are otherwise valid.

The verification is a deferred constraint so the audit row and its normalized peer-member bindings can be inserted atomically before the final integrity check runs.

## Analyst schema

`analyst-v3-peer` composes the existing `analyst-v2` schema instead of replacing it.

All normal target-company sections still use ordinary target `sourceIds` and pass the existing v2 contract.

The added peer section contains:

- `peerContextVersion = peer-analyst-context-v1`;
- `peerAuditId`;
- one structured claim for every ready peer metric.

Every peer claim contains:

- metric;
- neutral interpretation text;
- same `peerAuditId`;
- target value;
- peer sample size;
- median;
- min/max;
- target-vs-median percentage.

Structured values must exactly match the immutable peer context.

## No cherry-picking

`peer-analyst-quality-v1` extends the existing `analyst-quality-v1` gate.

A peer-enabled analysis is publishable only if the ordinary v2 target-company analysis already passes and all additional peer checks pass:

- peer context ready;
- audit binding correct;
- every ready peer metric interpreted exactly once;
- all structured peer numbers exactly grounded.

The model cannot discuss only a favorable subset of the ready peer measures.

## Conservative first execution mode

The first internal execution path deliberately uses **no additional model call**.

`createDivLabPeerAiAnalysis(...)` performs:

1. load exact publishable target research version;
2. stop immediately if analyst content already exists for that immutable version;
3. assemble and persist the point-in-time peer audit using already-persisted research only;
4. load and FK-verify the stored audit;
5. run the established Analyst v2 target-company model call once;
6. keep the AI-written target thesis, view and scenarios unchanged;
7. append a deterministic neutral peer section covering every ready metric;
8. run the v3-peer contract and quality gate;
9. persist through the dedicated peer-content RPC.

This means peer data is visible and auditable, but it does **not yet steer the AI-written core view or valuation scenarios**.

That is intentional. A later peer-aware model prompt must be separately evaluated on real companies before it can influence financial interpretation.

## Neutral deterministic wording

The peer appendix states whether each metric is above, below or near the peer median, includes target/median/range/sample size, and explicitly states that the comparison is not a buy or sell signal by itself.

No cheapness score or composite recommendation exists.

## Database content contract

`divlab_analysis_contents` now has nullable `peer_audit_id` with `ON DELETE RESTRICT` FK to `divlab_peer_comparison_audits`.

Older schemas are protected:

- `analyst-v2` must not reference peer audit fields;
- `analyst-v3-bank` must not reference peer audit fields.

For `analyst-v3-peer`, the content trigger requires:

- `peer-analyst-quality-v1` with score 100 and all base + peer checks true;
- peer audit belongs to the exact same `analysis_version_id`;
- comparison is ready;
- claim set covers exactly every ready metric;
- every structured number exactly matches the stored audit.

A dedicated `SECURITY INVOKER`, service-role-only RPC — `persist_divlab_peer_analysis_content(...)` — fixes the schema and quality-gate versions in PostgreSQL and avoids relying on the older overloaded generic content RPC surface.

## Dev migrations

Applied to `dividend-lab-dev`:

- `20260815102721_add_peer_analyst_v3_content_contract.sql`;
- `20260815102851_create_peer_analyst_v3_content_rpc.sql`;
- `20260815103028_verify_peer_audit_metrics_from_research.sql`;
- `20260815103201_fix_peer_audit_integrity_trigger_row_access.sql`.

These sit on top of the previously applied peer-registry and peer-audit migrations.

## Live rollback verification

A full dev smoke under the real service-role path verified:

- four publishable research versions (target + three peers);
- a source-backed three-member peer registry;
- negative audit with manipulated P/E median rejected by PostgreSQL recomputation;
- valid audit persisted with three exact peer-version bindings;
- negative `analyst-v3-peer` content with manipulated structured peer median rejected;
- valid `analyst-v3-peer` content persisted with the exact `peer_audit_id` FK;
- rollback left zero smoke analysis, registry, audit and content rows.

Supabase advisors show no new peer/v3 security WARN/ERROR and no new unindexed FK warning. New indexes only show expected unused-index INFO while real peer data is still absent.

## Verification

The branch has passed the full repository Quality Gate after the v3-peer schema, DB contract, persistence adapter and two-phase service were added:

- lint;
- TypeScript;
- core tests;
- SEO/news tests;
- DivBrain tests;
- DivBrain context tests;
- Cursor bridge tests;
- production build.

## Still deliberately pending

1. curate real peer relationships from verified primary/credible sources;
2. insert the first real immutable peer sets;
3. run qualitative peer-comparison review on real companies;
4. run authenticated live `analyst-v3-peer` execution when the runtime boundary permits it;
5. only after that, evaluate a model-enabled peer prompt where peer context may influence the core thesis/scenarios;
6. public `/analyses` UI only after backend and real-company validation are complete.

No historical analysis, trade, decision, holding or portfolio result is rewritten by this work.
