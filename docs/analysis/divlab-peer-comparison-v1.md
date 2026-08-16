# DivLab Peer Comparison v1

Status: internal backend foundation / REGISTRY + VERSION-BOUND AUDIT APPLIED TO DEV. No public peer UI and no AI analyst consumption yet.

## Objective

Peer comparison adds valuation context without allowing an AI model to invent its own comparison group, rewrite historical research or turn a lower multiple into an automatic buy signal.

DivLab therefore separates four questions:

1. **Which companies are valid peers?** Explicit, source-backed peer registry.
2. **Which research version existed for each company at the target analysis boundary?** Immutable, publishable Deep Research versions only.
3. **How do their traceable valuation measures compare?** Deterministic `peer-comparison-v1` math.
4. **What exact peer set and research versions produced the comparison?** Immutable `peer-comparison-audit-v1`.

The AI analyst is not authoritative for any of those four steps.

## Deterministic comparison contract

`lib/analysis/peer-comparison.ts` compares one target research snapshot against explicit verified peer snapshots. Every peer has one or more relationship-source IDs that must exist in the supplied peer-basis source set.

The engine rejects:

- the target company as its own peer;
- duplicate peer identities;
- peers without relationship evidence;
- unknown relationship-source IDs;
- malformed source URLs or verification dates;
- untraceable valuation observations.

At least three explicit peer members are required for the overall comparison to become `ready`.

### Current comparable valuation measures

v1 compares only dimensionless deterministic measures already produced by Deep Research:

- P/E;
- P/FCF;
- EV/EBIT;
- EV/EBITDA.

An observation is eligible only when the corresponding valuation-provenance measure is available and `traceable=true`.

For every metric the engine reports neutral context only:

- target value;
- peer sample size;
- peer median;
- peer minimum;
- peer maximum;
- target difference versus peer median.

There is no cheapness score, buy score or composite recommendation.

## Immutable peer registry

Peer membership is supplied by `divlab_peer_*` registry tables rather than by the analyst model. Registry versions are immutable and source-backed. Every member must have an explicit relationship-source link belonging to the same registry version.

`loadLatestDivLabPeerSet(...)` now supports an optional `maxDataAsOf` boundary. Historical analysis therefore resolves the latest peer-set version that already existed no later than the target research version; a newer registry version is never silently substituted.

## Persisted research-version boundary

Analyst-grade peer comparison does not hydrate from arbitrary fresh packets.

`research-version-read.ts` and `research-version-repository.ts` require:

- an immutable analysis-version UUID;
- `deep-research-v2`;
- `publishable=true` on the persisted version;
- `qualityGate.publishable=true` inside the stored packet;
- exact equality between the row `data_as_of` and packet `dataAsOf`;
- current `valuation-provenance-v1`;
- exact symbol/exchange identity.

For peers, `loadLatestPublishableDivLabResearchVersionAsOf(...)` selects the newest qualifying persisted version whose `data_as_of` is **not later than the target research boundary**.

No live research/API call is triggered by this historical audit path.

## Version-bound peer audit v1

`lib/analysis/peer-comparison-audit.ts` builds `peer-comparison-audit-v1` only when:

- target research is an immutable publishable version;
- every registered peer has an immutable publishable version;
- all packets use `deep-research-v2` and `valuation-provenance-v1`;
- registry hydration is complete;
- comparison status is `ready`;
- no analysis-version ID is reused for another identity;
- no unregistered substitute packet is present.

The audit stores:

- exact target analysis-version ID;
- exact peer-set ID and version number;
- exact analysis-version ID for every peer;
- deterministic comparison output.

### Point-in-time / look-ahead invariant

Historical peer context may only use information that existed at or before the target research boundary.

Both TypeScript and PostgreSQL reject:

- a peer-set `dataAsOf` later than the target;
- a peer-basis source whose `verifiedAt` is later than the target;
- a peer research version whose `dataAsOf` is later than the target.

This prevents a historical analysis from gaining future knowledge merely because newer immutable rows now exist.

## Dev persistence

The audit persistence is permanently applied to `dividend-lab-dev`.

Tables:

- `divlab_peer_comparison_audits`;
- `divlab_peer_comparison_audit_members`.

RPC:

- `persist_divlab_peer_comparison_audit(jsonb)`;
- `SECURITY INVOKER`;
- fixed `search_path = public`;
- execute granted only to `service_role`.

The service-role table path has `SELECT + INSERT` only. Historical audit rows are not updateable or deletable through the normal service-role path.

Registered migrations:

- `20260815095948_create_divlab_peer_comparison_audit_persistence.sql`;
- `20260815100432_harden_divlab_peer_comparison_audit_persistence.sql`;
- `20260815100840_prevent_divlab_peer_comparison_audit_lookahead.sql`.

The persistence RPC also serializes concurrent retries for the same target-version + peer-set using a transaction advisory lock and is idempotent only when the already stored audit is identical.

## Verified dev smoke

Live dev rollback verification proved:

- four publishable research versions (one target + three peers) can be persisted through the real research-version RPC;
- a source-backed three-member peer registry can be created;
- one audit persists with three normalized peer-version bindings;
- the same retry returns the same audit ID with `idempotent=true`;
- rollback leaves zero smoke analysis, registry or audit rows.

Supabase advisors reported no new peer-audit WARN/ERROR or unindexed peer-audit foreign keys. New objects only have expected INFO notices while no real peer-audit data exists.

## Analyst boundary

The current `analyst-v2` schema is deliberately **not** modified to consume peer claims. Its claim-source contract is scoped to the target company's source IDs, while peer evidence belongs to a separate immutable audit chain.

A bounded neutral bridge now exists as `peer-analyst-context-v1`:

- audit ID;
- target analysis-version ID;
- peer-set ID/version;
- target identity;
- peer count;
- metric readiness;
- target/median/min/max/sample-size/target-vs-median aggregates.

It intentionally excludes peer source IDs and raw peer-research payloads from the model context. Persisted audit JSON is also cross-checked against the normalized audit-member FK rows before this context can be built.

A future explicit analyst schema may consume this context only after its own provenance and persistence contract is defined. DivLab will not silently widen `analyst-v2`.

## Deliberate non-goals

The current layer does **not**:

- let AI discover or select peers;
- assume broad index membership means operational comparability;
- use a lower multiple as evidence that a stock is better;
- compare raw EV across differently sized companies;
- accept untraceable valuations;
- trigger new live research while reconstructing historical peer context;
- feed peer claims into the existing `analyst-v2` schema;
- expose peer comparison publicly.

## Still pending

1. real verified peer-selection sources and memberships for real companies;
2. qualitative review of real-company peer comparisons;
3. an explicit next analyst schema that can reference the persisted peer audit without mixing source namespaces;
4. public UI only after the backend contract and real-company validation are complete.
