# DivLab Master Update — Preview Build Peer Export v1

**Datum:** 2026-08-15  
**Status:** RETIRED efter riktig runtime-/buildvalidering  
**Scope:** historik över avvisad transportväg; får inte återaktiveras utan ny verifiering

## Slutsats

Den temporära Preview-postbuild-idén är permanent avvisad i nuvarande arkitektur.

Checkpoint `8458997a10e2f3456f3f214ab274661f405efdab` passerade full Quality Gate #818, inklusive att postbuild korrekt no-op:ade utanför Vercel Preview. En docs-only commit `544cfd58c04f65f6d49a93a97aba2805307a6c2e` triggade därefter en riktig skyddad Preview-build på samma runtimekod.

Vercel-builden kompilerade Next.js och TypeScript korrekt men stoppade i postbuild med:

`DIVLAB_PEER_EXPORT_FAILED peer_research_export_yahoo_session_unavailable`

Det bevisar att Yahoo crumb/cookie-session inte är tillgänglig i Vercels build-miljö, trots att samma researchkedja tidigare har fungerat i Vercel Functions-runtime.

## Samlad miljöevidens

Yahoo quoteSummary/crumb-session har nu testats i flera exekveringsmiljöer:

- GitHub Actions `westus2`: `financial_statements_unavailable`
- GitHub Actions `eastus`: `financial_statements_unavailable`
- GitHub Actions `westus`: explicit `peer_research_export_yahoo_session_unavailable`
- Vercel Preview build `iad1`: explicit `peer_research_export_yahoo_session_unavailable`
- Vercel Preview Functions-runtime: tidigare verifierad peer-ready Munters-körning

Slutsats: facts-only Deep Research får inte flyttas till Actions/build bara för att förenkla operatortransport. Fetchmiljön måste vara en runtime där befintliga provider-kontrakt faktiskt fungerar.

## Cleanup

De temporära Preview-build-komponenterna är borttagna:

- `package.json` postbuild-hook
- `scripts/divlab-peer-research-preview-build-export.mts`
- `ops/peer-research-preview-build-request.json`
- dess specifika kontraktstest

Cleanup-checkpoint `6c955ded2dfa1d7f446df826c8ba2174882ce7ee` passerade full standardiserad Quality Gate #820:

- lint: success
- TypeScript: success
- core tests: success
- SEO/news: success
- DivBrain: success
- Cursor bridge: success
- Next.js production build: success

Den gemensamma `createDivLabPeerResearchExportArtifact(...)` finns kvar eftersom den centraliserar och återanvänder exakt samma curated/readiness/operator-exportlogik för interna operatortransporter och inte påverkar vanlig runtime eller build.

GitHub export-workflowen får tills vidare ligga kvar som fail-closed diagnostik/evidens men ska inte triggas igen för Yahoo-baserad real peer research utan en verifierad providerförändring.

## Deployment Protection

Vercels officiella dokumentation bekräftar att automatiserad access till skyddade deployments ska använda Protection Bypass for Automation (`VERCEL_AUTOMATION_BYPASS_SECRET`) i stället för att Deployment Protection stängs av.

Nuvarande connector kan skapa shareable URLs men kan inte fullfölja SSO-cookie-kedjan för det interna API-anropet. Projektets anslutna Vercelverktyg exponerar inte någon befintlig automation-bypass-secret eller en säker mutationsyta för att generera en sådan credential här.

Ingen ny bypass-secret ska därför genereras, hårdkodas eller kopieras till repo/GitHub/Vercel genom en ad hoc-väg.

## Kvarvarande real-peer gate

Atlas Copco-setet är fortsatt:

- MTRS — Munters
- SAND — Sandvik
- EPI-A — Epiroc A

Ingen av dessa har ännu persistierats som riktig immutable `deep-research-v2` peer-version i DEV.

Target-version-pinning och single-call Analyst v3-peer är redan Quality-Gate-verifierade. Nästa real-company-steg får köras först när en säker, officiell runtime-invocation mot skyddad Preview finns och kan leverera checksum-bound operator-export utan att skyddet försvagas.

## Säkerhetsgräns

- ingen production deploy,
- ingen production DB-write,
- ingen merge,
- ingen historisk omskrivning,
- ingen gissad Yahoo-endpoint,
- ingen mer Actions/build-retry för samma Yahoo-sessionblocker,
- ingen Deployment Protection-försvagning.
