# DivLab Master Update — Peer Operator Transport v1

**Datum:** 2026-08-15  
**Status:** permanent tillägg till Deep Research / real-peer validation-spåret  
**Scope:** DEV/Preview-validering, ingen produktionsaktivering

## Beslut

Real peer research ska kunna flyttas från den skyddade Vercel Preview-miljön till `dividend-lab-dev` utan att en Supabase service-role-nyckel läggs i Vercel och utan att Deployment Protection försvagas.

Den befintliga `peer-research-validation-export-v1` är fortsatt det granskningsbara sanningsobjektet. Ett separat `peer-research-operator-export-v1` får användas endast som transportformat ovanpå samma redan peer-ready packet.

Operator-transporten:

- är read-only och Preview-only,
- kräver explicit `export=1&operator=1`,
- får inte kombineras med `batch=1` eller `persist=1`,
- innehåller inga credentials,
- innehåller inte duplicerade diagnostics,
- kodar exakt `JSON.stringify(packet)` som UTF-8/base64,
- binder de exakta bytesen till SHA-256,
- binder dessutom slug, instrumentidentitet, `dataAsOf`, readiness-version och exakt source-ID-lista,
- ska fail-closed om base64, checksumma, identitet, readiness, publishability eller source-bindningar avviker.

Efter transport ska DEV fortfarande använda den befintliga `persist_divlab_analysis_version(...)`-RPC:n. Ingen ny svagare persistence-väg införs. RPC:n kräver bland annat att packetets quality gate och sources exakt matchar de separata RPC-parametrarna och att evidens refererar verkliga source-ID:n.

Efter varje DEV-write måste immutable read-back verifieras med `peer-research-persistence-verification-v1`. En rad räknas inte som godkänd peer research bara för att den finns i databasen.

## Runtime checkpoint före transport-v1

På den helt gröna checkpointen `eeb7ad0cc0cf867dab473d40a1989543b0f492b6` kördes en riktig skyddad Preview-export för Munters Group (`MTRS`, Stockholm).

Resultat:

- facts-only packet: `deep-research-v2`
- ordinary `publishable=false`
- `peer-research-readiness-v1`: **ready=true**
- samtliga readiness-checks godkända
- tre peer-eligible, traceable multiplar: P/E, P/FCF och EV/EBITDA
- riktig primär rapport-evidens fanns i packetet
- ingen DEV-persistens utfördes i denna checkpoint

Munters ska därför användas som första riktiga operator-transport/persistens/read-back-case när transport-v1 har passerat full Quality Gate.

## Quality Gate för transport-v1

Implementation-checkpoint `63f242ac6e3d5447ad65e305584d0487511b6e05` passerade den fulla standardiserade Quality Gate #810:

- lint: success
- TypeScript: success
- core tests: success
- SEO/news: success
- DivBrain: success
- Cursor bridge: success
- Next.js production build: success

Detta är endast en CI-build. Ingen produktionsdeploy eller merge har gjorts.

## Nasdaq Nordic scope

Den runtime-bevisade Main Market-queryn `globalName=NordicMainMarkets` ligger kvar. Den tidigare hypotesen att blank `globalName` skulle bredda till First North gav noll primärkällor även för kända Main Market-bolag och är därför permanent avvisad.

First North (bland annat Kambi/GiG) förblir explicit unsupported i denna källa tills ett separat Nasdaq-kontrakt har verifierats empiriskt. Inga fler queryvärden får gissas fram genom dyra Preview-loopar.

## Kostnadsregel

Arbetet ska fortsätta i samlade checkpoints:

1. produktionskod + tester + Master Update samlas före branch-flytt,
2. full GitHub Quality Gate måste vara grön,
3. först därefter får en meningsfull Preview-runtime användas,
4. flera real-company-valideringar ska samlas i samma runtime-checkpoint när det är möjligt.

## Nästa verifieringsordning

1. Quality Gate för operator-transport-v1.
2. Skyddad Preview `export=1&operator=1` för MTRS, SAND och EPI-A.
3. Kontrollera checksumma och exact packet decode före varje DEV-write.
4. Persistiera endast peer-ready packet i `dividend-lab-dev` via befintlig RPC.
5. Read-back verifiera exakt packet + source-ID-bindningar.
6. Först när Atlas-peers är 3/3 verifierade får Atlas Copco target-flödet gå vidare till versionsbunden peer audit och single-call `analyst-v3-peer`.
7. Ingen production write, ingen publik UI-routing och ingen merge i detta steg.
