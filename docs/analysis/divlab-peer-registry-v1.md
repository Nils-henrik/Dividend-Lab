# DivLab Peer Registry v1

Status: internal backend foundation / APPLIED_TO_DEV. No public peer UI or analyst integration yet.

## Objective

Peer comparison must not let the AI choose whichever competitors make a valuation story look attractive. Peer selection is therefore versioned and source-backed separately from the market/fundamental data used to calculate current valuation multiples.

## Model

The registry stores the **relationship** between a target company and its verified comparison set. It deliberately does not persist today's P/E, P/FCF, EV/EBIT or EV/EBITDA values. Those are recalculated from fresh Deep Research packets by `peer-comparison-v1`.

Tables:

- `divlab_peer_targets` — stable target instrument identity;
- `divlab_peer_sets` — immutable versions per target;
- `divlab_peer_set_sources` — source material supporting the peer basis for one version;
- `divlab_peer_set_members` — peer members for one version;
- `divlab_peer_member_sources` — normalized member-to-source links constrained to the same immutable set version.

RPC:

- `persist_divlab_peer_set(...)`
- `SECURITY INVOKER`
- fixed `search_path = public`
- execute granted only to `service_role`
- anon/authenticated have no table read access and cannot execute the RPC.

The normal service-role path has `SELECT + INSERT` only. It has no `UPDATE` or `DELETE` privileges on registry tables.

## Invariants

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

Version numbers are allocated serially per target. An initial implementation used `SELECT ... FOR UPDATE` on the stable target row, but a live service-role smoke correctly exposed that PostgreSQL requires `UPDATE` table privilege for that lock mode.

DivLab does **not** grant `UPDATE` merely to obtain a lock. The final RPC uses a transaction-scoped advisory lock keyed by canonical `exchange:symbol`, then calculates the next immutable peer-set version. This preserves concurrency safety while the service role remains unable to mutate historical rows.

## Supabase dev status — 14 August 2026

The registry is permanently applied to `dividend-lab-dev` (`faaxloafogpsywfkpbrm`). Supabase registered these migration versions:

- `20260814211105_create_divlab_peer_registry.sql`
- `20260814211115_index_divlab_peer_registry_member_sources.sql`
- `20260814211138_harden_divlab_peer_registry.sql`
- `20260814211543_fix_divlab_peer_registry_service_role_locking.sql`

Repository filenames are aligned with those registered versions. The already-applied SQL blobs were not rewritten merely to align timestamps.

### Dev verification

Verified under the actual `service_role` database role:

- a valid 3-peer/1-source set reaches `persist_divlab_peer_set(...)` successfully;
- the RPC returns version `1`, peer count `3`, source count `1` and methodology `peer-comparison-v1` for the isolated fixture;
- a target included as its own peer is rejected with `divlab_peer_set_contains_target`;
- both smoke transactions were rolled back;
- post-smoke checks found zero `TEST/ST` target or peer-set rows;
- all five peer tables have RLS enabled;
- anon/authenticated cannot read the peer tables;
- anon/authenticated cannot execute the persistence RPC;
- `service_role` can `SELECT + INSERT` but cannot `UPDATE` or `DELETE` peer-registry rows;
- the RPC is `SECURITY INVOKER`, not `SECURITY DEFINER`.

No real company peer memberships have been inserted yet.

## Advisor boundary

The Supabase project already contains existing security/performance advisor notices outside this feature (for example older `SECURITY DEFINER` functions and unrelated unindexed foreign keys). Registry verification compares the post-migration advisor output against that pre-migration baseline and treats only new `divlab_peer_*` notices as belonging to this milestone.

## Deliberately not included yet

1. a production-quality source/curation workflow for selecting real peers;
2. any real Atlas Copco, Evolution, Embracer or other company peer membership;
3. automatic ingestion of registry versions into the AI analyst;
4. public display of peer comparison;
5. a rule that a lower peer multiple means a better investment.

The analyst is not allowed to invent its own comparison group. Peer data reaches the analyst only after a verified registry version exists.
