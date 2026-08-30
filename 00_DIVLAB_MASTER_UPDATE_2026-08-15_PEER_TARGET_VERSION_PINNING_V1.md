# DivLab Master Update — Peer Target Version Pinning v1

**Datum:** 2026-08-15  
**Status:** permanent säkerhets-/reproducerbarhetstillägg till Analyst v3-peer  
**Scope:** target-orchestrering, ingen produktionsaktivering

## Beslut

Target-orchestratorn får inte ladda om "latest" registry eller peer research efter att Analyst-modellen har körts.

Före AI-kostnaden ska den:

1. ladda exakt senaste tillåtna immutable peer-registry-set inom point-in-time-gränsen,
2. ladda exakt en peer-ready immutable research-version för varje registrerad peer,
3. fail-closed om någon peer saknas,
4. pinna registry-objektet och de exakta peer analysis-versionerna i minnet.

Efter den enda target-Analyst-körningen ska samma pinned underlag användas för `buildVersionBoundPeerComparisonAudit(...)`. Ingen andra "latest"-query får ske mellan preflight och audit.

## Varför

Tidigare preflightade `createDivLabPeerTargetAnalysis(...)` registry + peers före AI, men den senare DB-bundna peer-servicen skapade audit genom att läsa senaste registry/peer-versioner igen. Om en ny immutable peer-version eller registry-version hann skrivas medan modellen körde kunde AI-kostnaden godkännas mot ett underlag men slut-auditen bindas mot ett annat.

Version pinning stänger detta TOCTOU/version-driftfönster och gör körningen reproducerbar:

`preflight registry+peer versions -> 1 Analyst-call -> target research persist -> audit från samma pinned peer versions -> audit persist/read-back -> pure peer finalizer -> content persist`.

## Invariants

- exakt en target Analyst-call,
- ingen separat peer-AI-call,
- exact `draft`, `model` och `usage` från target-körningen återanvänds,
- target research måste vara publishable innan audit,
- peer audit byggs deterministiskt från pinned registry/peer research,
- PostgreSQL verifierar fortsatt de immutable versionerna vid audit-persistens,
- persisted audit läses tillbaka innan peer context byggs,
- `peer-analyst-quality-v1` måste vara publishable innan v3-peer-content får persistieras,
- standalone `createDivLabPeerAiAnalysis(...)` behåller sin fallback Analyst-väg för andra callers.

## Quality checkpoint före ändringen

Pure peer finalizer-refaktorn + uppdaterade kontrakt passerade full Quality Gate #814 på `35e2f1b456d7bd8a38c12faa35f87fa6dbea32b3`:

- lint: success
- TypeScript: success
- core tests: success
- SEO/news: success
- DivBrain: success
- Cursor bridge: success
- production build: success

Ingen production deploy, production DB-write eller merge gjordes.

## Real-peer runtime-status

- Atlas Copco registry i `dividend-lab-dev`: Epiroc A, Munters, Sandvik.
- Senaste read-only DEV-kontroll: 0 persistierade `deep-research-v2`-versioner för samtliga tre.
- Munters har verifierats i skyddad Preview som `peer-research-readiness-v1 ready=true`, men ännu inte persistierats i DEV.
- Operator transport v1 är Quality-Gate-grön men saknar ännu en Vercel Preview på rätt Git-head; ingen write får göras från den äldre Previewn.

## Nästa ordning

1. Full Quality Gate för version-pinning-checkpointen.
2. Ingen runtime förrän rätt operator-head finns som skyddad Preview.
3. MTRS/SAND/EPI-A: checksum-bound export -> DEV guarded RPC -> exact immutable read-back.
4. När Atlas är 3/3 peer-ready i DEV: kör target-orchestratorn med pinned versions.
5. Kvalitativ QA av audit, peer appendix och scenario/thesis-konsekvens.
6. Ingen production write, publik routing eller merge före separat godkänd checkpoint.
