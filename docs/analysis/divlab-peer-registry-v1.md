# DivLab Peer Registry v1

Status: internal migration-ready foundation. The registry migrations are committed on the Deep Research PR but are intentionally **not applied persistently** to `dividend-lab-dev` yet.

## Purpose

`peer-comparison-v1` can only be trustworthy if the comparison group itself is auditable. The peer registry therefore stores the peer-selection decision separately from the changing valuation data.

The registry records:

- stable target instrument identity;
- immutable peer-set version number;
- target display name at that version;
- peer-set data-as-of timestamp;
- methodology version (`peer-comparison-v1`);
- version-bound peer-basis sources;
- version-bound peer members;
- normalized member → relationship-source links.

It deliberately does **not** store yesterday's P/E, P/FCF, EV/EBIT or EV/EBITDA. Fresh Deep Research packets provide those values later. This keeps the historical question “why were these companies considered peers?” separate from the time-varying question “how were they valued on this date?”.

## Immutability model

`divlab_peer_targets` is the stable target identity used only to serialize version creation.

Every call to `persist_divlab_peer_set(...)` creates a new row in `divlab_peer_sets` with `version_number = previous + 1`. Old peer sets are never updated in place.

Child tables are insert-only through the intended service-role path:

- `divlab_peer_set_sources`
- `divlab_peer_set_members`
- `divlab_peer_member_sources`

The member-source table uses same-peer-set composite foreign keys so a membership cannot accidentally reference a source belonging to another immutable peer-set version.

## RPC invariants

`persist_divlab_peer_set(...)` is `SECURITY INVOKER`, has a fixed `search_path`, is revoked from `public`, `anon` and `authenticated`, and is granted only to `service_role`.

The RPC requires:

- canonical target symbol/exchange and non-empty target name;
- methodology exactly `peer-comparison-v1`;
- 1–25 peer-basis sources;
- 3–25 distinct peer members;
- HTTPS source URLs;
- non-future source verification timestamps;
- every peer to have 1–10 relationship-source IDs;
- every relationship-source ID to exist in the exact source bundle for that peer-set version;
- no target-as-peer membership;
- no duplicate peer identities;
- no duplicate member→source references.

Stored target/member symbols and exchanges are constrained to canonical uppercase format with bounded lengths.

## Application boundary

`lib/analysis/peer-registry-contract.ts` performs the same critical checks before a database call and normalizes the RPC bundle.

`lib/analysis/peer-registry-repository.ts` is the server-only Supabase adapter. It does not discover peers and it does not persist peer-comparison output. It persists only the explicit, sourced relationship decision.

PostgreSQL remains authoritative; application validation is defense in depth rather than a replacement for database constraints.

## Verification performed without persistent schema mutation

Before any permanent dev migration, the exact registry DDL/RPC shape was exercised inside a single explicit transaction against `dividend-lab-dev`:

1. create the peer-registry tables and indexes;
2. install the hardened RPC;
3. persist a valid three-member source-backed peer set;
4. attempt an invalid target-as-own-peer set and require it to fail;
5. `ROLLBACK` the entire transaction.

A follow-up absence check was issued for all five tables and the RPC so the test is intended to leave no registry schema or fixture data behind.

The permanent migration is deliberately deferred until the latest GitHub branch head has passed the complete repository Quality Gate. This also avoids creating Supabase migration-history drift while the schema is still being reviewed.

## Migration files in the PR

- `20260814210000_create_divlab_peer_registry.sql`
- `20260814210500_index_divlab_peer_registry_member_sources.sql`
- `20260814211000_harden_divlab_peer_registry.sql`

## What is still missing

The registry currently has **no real peer memberships**. That is intentional.

A real peer set must come from an explicit, auditable peer-selection source or registry. Index membership alone is not treated as proof of operational comparability, and the AI analyst is not allowed to choose its own peer group.

Only after a verified relationship source is available should real Atlas Copco, Evolution, Embracer or other peer memberships be inserted and then connected to `peer-comparison-v1`.
