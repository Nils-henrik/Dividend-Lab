# DivLab Master Update — Preview Curated Peer Set Operator Export v1

**Datum:** 2026-08-15  
**Status:** permanent intern operatorgräns för real-peer-validering  
**Scope:** Preview Functions-runtime, read-only export, ingen DB-write

## Beslut

Den skyddade Preview-only peer research-routen får exportera ett helt curated peer-set som ett enda all-or-nothing operator-artifact.

Anrop:

`set=1&operator=1&symbol=<TARGET>&exchange=<EXCHANGE>`

`symbol`/`exchange` identifierar target i `curated-peer-catalog-v1`, inte en peer och inte en fri operatorlista.

## Gemensam 3/3-motor

`createDivLabCuratedPeerResearchExportArtifact(...)` är transport-agnostisk och ansvarar för exakt:

1. curated target lookup,
2. catalog-versionkontroll,
3. exakt tre registrerade peers,
4. befintlig Yahoo crumb-session i samma runtime,
5. samma `createDivLabPeerResearchVersion(...)` för varje medlem,
6. `peer-research-readiness-v1`,
7. validation export,
8. `peer-research-operator-export-v1`,
9. exact curated identity-binding,
10. 3/3 fail-closed artifact.

Den gör ingen Supabase-persistens och ingen Analyst/model-call.

## Route-säkerhet

Set-exporten:

- är endast tillgänglig när `VERCEL_ENV=preview`,
- kräver `set=1&operator=1`,
- kan inte kombineras med `persist=1`, `export=1` eller `batch=1`,
- skapar ingen DEV-admin-klient,
- returnerar inget partial artifact om en peer faller,
- returnerar endast de tre checksum-bundna operator-envelopen när hela setet är ready,
- använder `Cache-Control: no-store`.

Den befintliga single-peer `export=1&operator=1`-vägen behålls för smal diagnostik.

## Varför

GitHub Actions och Vercel build har båda empiriskt visats sakna Yahoo crumb-session, medan Vercel Functions-runtime tidigare har producerat peer-ready Munters med samma provider-/researchkod.

Functions-runtime ska därför förbli fetchmiljön. När en officiell Protection Bypass for Automation eller annan säker Vercel-automation-access finns räcker ett enda skyddat request för Atlas 3/3 i stället för tre separata runtime-anrop.

## Operator artifact

Artifact-versionen är fortsatt `peer-research-export-artifact-v1` och innehåller:

- catalog-version,
- operator-export-version,
- generatedAt,
- exact curated target,
- `peerCount=3`,
- tre exact peer identities,
- tre `peer-research-operator-export-v1` envelopes.

Varje envelope binder exact packet bytes med SHA-256 samt identity/dataAsOf/readiness/source IDs.

## Efter säker runtime-invocation

1. verifiera artifact target/catalog/3-of-3,
2. decode/verifiera varje operator-envelope,
3. verifiera packet-SHA och source IDs,
4. kräva DEV `divlab_peer_research_ready(packet)=true` och ordinary `publishable=false`,
5. persistiera via befintlig guarded DEV-RPC,
6. exact immutable read-back,
7. först därefter target-analysis med pinned peer versions och single-call Analyst v3-peer.

## Säkerhetsgräns

- ingen production DB-write,
- ingen production deploy,
- ingen merge,
- ingen service-role-secret i operatorartifact,
- ingen Deployment Protection-försvagning,
- ingen operator-supplied peerlista,
- ingen historisk omskrivning.
