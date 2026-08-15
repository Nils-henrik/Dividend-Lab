# DivLab Peer Registry v1

Status: internal backend foundation / APPLIED_TO_DEV + POINT_IN_TIME_READ + VERSION_BOUND_AUDIT VERIFIED. No public peer UI or AI analyst consumption yet.

## Objective

Peer comparison must not let an AI choose whichever competitors make a valuation story look attractive. Peer membership is therefore versioned and source-backed separately from the market/fundamental data used to calculate valuation multiples.

The registry stores the **relationship decision**. Deterministic research versions store the financial facts. `peer-comparison-audit-v1` binds the exact two histories together.

## Registry model

Tables:

- `divlab_peer_targets` — stable target instrument identity;
- `divlab_peer_sets` — immutable peer-set versions per target;
- `divlab_peer_set_sources` — source material supporting one peer-set version;
- `divlab_peer_set_members` — peer members for one version;
- `divlab_peer_member_sources` — normalized member-to-source links constrained to that same immutable version.

RPC:

- `persist_divlab_peer_set(...)`;
- `SECURITY INVOKER`;
- fixed `search_path = public`;
- execute granted only to `service_role`.

The normal service-role path has `SELECT + INSERT` only. It has no `UPDATE` or `DELETE` privileges on registry tables.

## Registry invariants

A persisted peer set requires:

- methodology exactly `peer-comparison-v1`;
- 3–25 distinct peer instruments;
- 1–25 HTTPS peer-basis sources;
- at least one explicit relationship-source ID for every peer;
- no target company as its own peer;
- no duplicate peer identity;
- no duplicate source ID;
- no unknown relationship-source reference;
- bounded/canonical symbol, exchange, name, source and URL fields;
- composite foreign keys preventing a peer member from referencing a source belonging to another set version.

Application code validates and normalizes the bundle first in `peer-registry-contract.ts`. PostgreSQL repeats the critical invariants and remains authoritative.

## Version allocation and immutability

Version numbers are allocated serially per target. The RPC uses a transaction-scoped advisory lock keyed by canonical `exchange:symbol`, then calculates the next immutable version number.

This keeps concurrent creation safe without granting `UPDATE` privilege merely to obtain a row lock. Historical registry rows remain non-updatable through the normal service-role path.

## Read-side resolver

`peer-registry-read.ts` and `loadLatestDivLabPeerSet(...)` provide the fail-closed read boundary.

The resolver:

1. canonicalizes target symbol/exchange;
2. resolves the stable target identity;
3. selects one immutable peer-set version;
4. loads that version's sources, members and member↔source links;
5. rebuilds the set through a pure validator before returning it.

For current research, omitting `maxDataAsOf` selects the highest immutable `version_number`.

For historical analyst-grade work, `maxDataAsOf` restricts the query to peer-set rows whose `data_as_of` is at or before the target research boundary. A future registry version is therefore never silently substituted into an older analysis.

A target with no eligible registry version returns `null`. An inconsistent selected version throws instead of silently returning a smaller/source-less set.

The pure assembler rejects, among other cases:

- target/set mismatch;
- cross-set source/member/link rows;
- invalid methodology or dates;
- non-canonical identities;
- target included as its own peer;
- duplicate member/source identities;
- fewer than three members;
- a member without an explicit relationship-source link.

## Registry → research hydration

`peer-registry-hydration.ts` makes the immutable registry authoritative for membership.

Rules:

- target research must match the registry target exactly;
- only exact registered member identities may be hydrated;
- an extra/unregistered packet is rejected;
- duplicate packets for one member are rejected;
- a loader returning another instrument as a substitute is rejected;
- a missing/null result remains an explicit missing registered peer;
- if any registered member is missing, the **overall** comparison is `insufficient` even if a subset contains three usable valuation observations.

DivLab therefore never converts a four-company registry into a three-company comparison universe merely because one packet is unavailable.

### Bounded concurrency

The general hydration contract uses a bounded worker pool:

- default maximum concurrent peer research loads: **3**;
- hard maximum: **5**;
- values outside `1..5` fail before work begins.

The new analyst-grade historical service reuses the same bounds but does **not** trigger live external research. It reads existing persisted research versions only.

## Persisted research-version boundary

`research-version-read.ts` and `research-version-repository.ts` treat database JSON as untrusted input at the analyst-grade boundary.

An eligible research version must have:

- a valid immutable analysis-version UUID;
- engine version `deep-research-v2`;
- row `publishable=true`;
- packet `qualityGate.publishable=true`;
- exact row/packet `dataAsOf` equality;
- `valuation-provenance-v1`;
- valid target identity and valuation structures.

Two read modes exist:

- exact research version by UUID;
- newest publishable version for one symbol/exchange whose `data_as_of` is no later than a supplied historical boundary.

This is the basis for reproducible peer comparison without look-ahead.

## Version-bound peer-comparison audit

The audit layer permanently applied to `dividend-lab-dev` consists of:

- `divlab_peer_comparison_audits`;
- `divlab_peer_comparison_audit_members`;
- `persist_divlab_peer_comparison_audit(jsonb)`.

The audit row records the exact target research version, exact peer-set version and deterministic comparison payload. Normalized member rows bind every registered peer member to its exact immutable research-version ID.

Foreign keys use `ON DELETE RESTRICT` for research/registry history. Both audit tables have RLS enabled. The service-role path has `SELECT + INSERT`, not `UPDATE`/`DELETE`. The RPC is `SECURITY INVOKER` with execute granted only to `service_role`.

### Audit contract

A persisted analyst-grade audit requires:

- `peer-comparison-audit-v1`;
- registry methodology `peer-comparison-v1`;
- comparison status `ready`;
- 3–25 registered peers and exactly the same number of research bindings;
- publishable `deep-research-v2` target and peer versions;
- `valuation-provenance-v1` for target and peers;
- target identity matching the registry target;
- every peer identity matching a member of that exact registry version;
- no target version reused as a peer;
- no duplicate peer analysis-version binding;
- comparison `dataAsOf` matching the deterministic oldest participating research timestamp.

Concurrent retries for the same target-analysis-version + peer-set are serialized with a transaction advisory lock. An identical retry is idempotent and returns the existing audit ID; a conflicting payload is rejected.

## Point-in-time / no-lookahead invariant

Analyst-grade peer history cannot use information newer than the target research version.

Both TypeScript and PostgreSQL reject:

- registry `dataAsOf` later than target research `dataAsOf`;
- any peer-basis source whose `verifiedAt` is later than the target boundary;
- any peer research version newer than the target research version.

A target analysis therefore cannot acquire future peer relationships or future financial results merely because those rows exist today.

## End-to-end audit service

`createPersistedVersionBoundPeerComparisonAudit(...)` ties the internal pieces together:

1. load the exact target publishable research version;
2. load the latest eligible peer registry **as of the target boundary**;
3. load the latest publishable research version for every registered peer **as of the same boundary**;
4. fail closed if any registered peer lacks eligible research;
5. build deterministic `peer-comparison-v1`;
6. build `peer-comparison-audit-v1`;
7. persist the immutable audit.

No live market/provider/AI call is made in this historical assembly path.

## Verified dev status — 15 August 2026

The original peer registry is permanently applied to `dividend-lab-dev` (`faaxloafogpsywfkpbrm`). Registered registry migrations:

- `20260814211105_create_divlab_peer_registry.sql`;
- `20260814211115_index_divlab_peer_registry_member_sources.sql`;
- `20260814211138_harden_divlab_peer_registry.sql`;
- `20260814211543_fix_divlab_peer_registry_service_role_locking.sql`.

Registered peer-audit migrations:

- `20260815095948_create_divlab_peer_comparison_audit_persistence.sql`;
- `20260815100432_harden_divlab_peer_comparison_audit_persistence.sql`;
- `20260815100840_prevent_divlab_peer_comparison_audit_lookahead.sql`.

### Live service-role verification

Verified in rollback transactions under the actual `service_role` role:

- a valid three-peer/one-source registry set persists successfully;
- target-as-own-peer is rejected;
- four publishable research versions (target + three peers) can be persisted through the real research-version path;
- the three-member registry can be joined to those exact immutable versions;
- one peer audit persists with exactly three normalized member/version rows;
- repeating the exact audit returns the same audit ID with `idempotent=true`;
- post-rollback checks show zero smoke analysis, registry and audit rows.

All internal peer and audit tables have RLS enabled. Anon/authenticated cannot use the persistence RPCs. The service role cannot update/delete historical registry or audit rows through its normal grants.

## Read-back before analyst context

Persisted audit JSON is not trusted by itself.

`peer-comparison-audit-read.ts` cross-checks:

- audit row IDs/version/methodology;
- target analysis-version ID;
- peer-set ID and version;
- ready comparison peer count;
- every `audit.peerResearch[].analysisVersionId` against the normalized `divlab_peer_comparison_audit_members` FK rows.

Only an exact set match becomes `StoredPeerComparisonAudit`.

`peer-analyst-context-v1` then exposes bounded neutral aggregate facts only: audit/version references, target identity, peer count and P/E/P-FCF/EV-EBIT/EV-EBITDA median/min/max/sample/target-vs-median data. It deliberately omits raw peer research and peer source IDs from the model context.

## Analyst boundary

The existing `analyst-v2` claim schema is scoped to the target company's source IDs. Peer evidence has a different provenance chain, so DivLab does **not** silently mix peer claims into v2.

The audit/read/context foundation exists so a future explicit analyst schema can refer to one persisted peer-audit ID and define its own validation/persistence semantics without weakening the current target-company source contract.

## Advisor boundary

Post-DDL Supabase security/performance advisors show no new peer-audit WARN/ERROR and no new unindexed peer-audit foreign-key warning. New peer/audit objects only produce expected INFO notices for internal RLS-without-client-policy and currently-unused indexes before real data exists.

Existing unrelated project advisor notices remain outside this feature.

## Deliberately not included yet

1. a production-quality source/curation workflow for selecting real peers;
2. any real Atlas Copco, Evolution, Embracer or other company peer membership;
3. AI analyst interpretation of peer context;
4. public display of peer comparison;
5. any rule that a lower peer multiple means a better investment.

The analyst is never allowed to invent its own comparison group. Peer context reaches an AI analyst only after the exact source-backed registry and immutable research histories have passed the audit boundary above.
