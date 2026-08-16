# DivLab Master Update — Peer Target Phase Split v1

**Datum:** 2026-08-15  
**Status:** permanent arkitekturtillägg till Deep Research / Analyst v3-peer  
**Scope:** intern fasdelning, ingen produktionsaktivering

## Beslut

Analyst v3-peer-finaliseringen ska vara en separat pure function från databas-, nätverks- och model-orchestreringen.

Den deterministiska kedjan är:

1. revalidera den redan framtagna Analyst-draften mot exakt target research packet,
2. kräva exakt samma immutable target analysis-version i peer context,
3. komponera den neutrala peer-appendixen,
4. validera v3-peer-strukturen och dess audit-bound numerik,
5. köra `peer-analyst-quality-v1`,
6. returnera draft + quality gate + samma model/usage utan någon persistens.

Denna kedja ligger i `finalizeDivLabPeerAnalyst(...)` och får inte:

- skapa en Supabase-klient,
- läsa eller skriva databasen,
- göra RPC-anrop,
- göra nätverksanrop,
- anropa Analyst-modellen,
- skapa en andra AI-tolkning.

## Befintlig service

`createDivLabPeerAiAnalysis(...)` behåller dagens DB-bundna ansvar:

- ladda exact target research-version,
- kontrollera befintligt innehåll,
- skapa/persistiera versionsbunden peer audit,
- läsa tillbaka audit och bygga peer context,
- välja antingen caller-supplied `preparedAnalyst` eller fallback Analyst-call,
- skicka resultatet genom samma pure finalizer,
- persistiera endast quality-godkänt `analyst-v3-peer`-innehåll.

Detta är en refaktor, inte en beteendeändring i peer-metodiken. Prepared Analyst reuse är kvar och single-call target-orchestratorn får fortfarande inte göra en extra model-call för peer context.

## Single-call invariant

`createDivLabPeerTargetAnalysis(...)` ska fortsatt:

1. preflighta registry + samtliga peer-ready immutable research-versioner före AI-kostnad,
2. köra `createDivLabAiAnalysis(...)` exakt en gång,
3. persistiera den färdiga publishable target research-versionen,
4. lämna exakt samma `draft`, `model` och `usage` som `preparedAnalyst` till peer-finaliseringen.

Ingen separat AI-call får införas bara för att lägga till peer-kontext.

## Varför fasdelningen behövs

Real-peer-valideringen använder en skyddad Preview-miljö medan DEV-persistensen kontrolleras separat. Genom att hålla finaliseringen pure kan target-flödet senare delas över en explicit operatorgräns utan att duplicera analyslogik eller ge Preview en generell databasnyckel.

Detta tillägg aktiverar **inte** ett nytt operator-target-flöde ännu. Först måste Atlas Copco-setets tre riktiga peers vara immutable persistierade och read-back-verifierade i `dividend-lab-dev`.

## Runtime / deployment status

Peer operator transport v1 passerade full Quality Gate på implementation-checkpoint `63f242ac6e3d5447ad65e305584d0487511b6e05`. Docs-checkpoint `5bd5fc275f3b5f9d2e826492b1b07ca9f964a764` passerade också full gate.

Vercel Git-integrationen har därefter inte skapat en ny branch Preview för dessa heads. Den senast verifierbara Previewn är därför fortfarande `eeb7ad0cc0cf867dab473d40a1989543b0f492b6`, som saknar operator-transport-v1. Ingen operator-persistens får göras från fel Preview-version.

Den generiska Vercel deploy-connectorn har dessutom ett schemafel där runtime kräver argument som verktygsschemat inte exponerar. Den får inte användas genom gissade parametrar och får aldrig ersättas med en production deploy.

## Säkerhetsgräns

- ingen production DB-write,
- ingen production deploy,
- ingen merge,
- ingen publik `/analyses`-routing,
- ingen service-role-secret får kopieras till repo eller generisk Preview-konfiguration,
- Deployment Protection får inte försvagas,
- historiska analyser/portföljbeslut får inte skrivas om.

## Nästa verifierade ordning

1. Quality Gate för pure finalizer-refaktorn.
2. När exakt operator-head finns som skyddad Preview: exportera MTRS, SAND och EPI-A med checksum-bound transport.
3. Verifiera checksumma/readiness före write.
4. Persistiera peers via befintlig guarded DEV-RPC.
5. Read-back-verifiera exakt packet och source-bindningar.
6. Först efter Atlas 3/3: kör versionsbunden target/audit/single-call Analyst v3-peer.
7. Kvalitativ QA innan peer context får påverka kärntes/scenarier eller manager-input.
