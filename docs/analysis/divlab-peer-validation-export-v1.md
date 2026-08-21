# DivLab peer validation export v1

Status: internal validation only.

## Purpose

`peer-research-validation-export-v1` is a temporary operator bridge for real-company peer validation while the protected Vercel Preview intentionally lacks a general Supabase service-role fallback.

The goal is to prove real immutable DEV persistence without copying a database secret into the repository, chat, browser bundle or generic Preview environment.

## Boundary

The existing internal route remains:

- `VERCEL_ENV=preview` only;
- curated-peer only;
- `Cache-Control: no-store`;
- production returns 404;
- batch persistence forbidden;
- Deployment Protection remains enabled.

Default responses continue to expose only bounded source/document metadata.

An explicit **single-peer** `export=1` request may additionally return a `peer-research-validation-export-v1` envelope only after the research packet already passes `peer-research-readiness-v1` and remains ordinary `publishable=false`.

`batch=1&export=1` is forbidden.

`persist=1&export=1` is forbidden.

The export path itself performs **zero database writes and zero additional model calls**.

## Operator validation flow

1. Use one protected Preview runtime after a meaningful code checkpoint.
2. Dry-run the complete curated peer batch first.
3. For a peer that is actually ready, request that one peer with `export=1`.
4. Verify the export reports:
   - `version=peer-research-validation-export-v1`;
   - `ordinaryPublishable=false`;
   - `readiness.ready=true`;
   - expected symbol/exchange/dataAsOf;
   - exact facts-only `deep-research-v2` packet.
5. Use the connected **dividend-lab-dev** Supabase operator, never production, to call the existing `persist_divlab_analysis_version(...)` RPC with the exported packet.
6. Read back the immutable version and verify:
   - symbol/exchange identity;
   - `publishable=false`;
   - `research_packet.version=deep-research-v2`;
   - `valuationProvenance.version=valuation-provenance-v1`;
   - `public.divlab_peer_research_ready(research_packet)=true`;
   - persisted source rows match the packet source set.
7. Only after all three peers in a registered set pass the same process may the real target peer audit be attempted.

## Existing persistence mapping

The export does not invent a second persistence format. The operator maps the packet into the already-established RPC:

- `p_instrument_symbol` ← `packet.instrument.symbol`
- `p_exchange` ← `packet.instrument.exchange`
- `p_instrument_name` ← `packet.instrument.name`
- `p_slug` ← export `slug`
- `p_engine_version` ← `packet.version`
- `p_data_as_of` ← `packet.dataAsOf`
- `p_currency` ← `packet.instrument.currency`
- `p_current_price` ← `packet.instrument.currentPrice`
- `p_research_packet` ← exact `packet`
- `p_quality_gate` ← exact `packet.qualityGate`
- `p_publishable` ← `false`
- `p_sources` ← exact `packet.sources`

The existing database integrity triggers and peer-readiness helper remain authoritative. The operator bridge does not bypass them.

## Removal condition

This export surface is temporary. Remove it after either:

1. dedicated DEV Preview credentials are safely provisioned and the normal guarded persistence path is proven; or
2. real peer validation is complete and the route is no longer needed.

Do not promote `export=1` into a public analysis API.
