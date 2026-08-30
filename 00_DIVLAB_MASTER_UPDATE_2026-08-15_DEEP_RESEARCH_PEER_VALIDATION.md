# 00_DIVLAB_MASTER_UPDATE_2026-08-15_DEEP_RESEARCH_PEER_VALIDATION

Denna fil är ett **Master Update-lager** till `00_DIVLAB_MASTER_2026-08-12-updated.md` och senare verifierade Master Updates.

Om äldre Master-text motsäger denna uppdatering inom **DivLab Analys / Deep Research / peer comparison**, gäller denna fil för det området.

Denna uppdatering ändrar **inte** tidigare historiska AI-portföljbeslut, affärer, innehav, snapshots eller utvärderingshistorik.

---

## 1. Releaseklassning

DivLab Deep Research + `analyst-v3-peer` ska per 2026-08-15 klassificeras som:

**ACTIVE_PR / INTERNAL_VALIDATION — inte production**

Verifierat:

- aktiv Draft PR `#231` på branch `agent/divlab-deep-research-v1`
- ingen merge till `main`
- ingen production release
- ingen publik `/analyses`-navigation
- databas-/auditkontrakt applicerade och verifierade i `dividend-lab-dev`
- riktig peer-registrydata finns permanent i DEV
- riktig nio-bolags peer-research dry-run har genomförts i skyddad Vercel Preview
- source-discovery-fix för Nasdaq CNS har passerat full ordinarie Quality Gate

Får **inte** beskrivas som LIVE eller production-verifierat förrän PR är mergead, production deploy är verifierad och relevant live-QA är genomförd.

---

## 2. Permanent Deep Research-princip

DivLab Analys ska hålla isär fyra lager:

1. verifierade fakta/källor
2. deterministisk fundamental/teknisk/värderingsmatematik
3. AI-tolkning
4. oberoende quality gate + versionsbunden proveniens

Saknad eller otillräcklig data ska förbli **unknown/blocker**. Systemet får inte skapa syntetiska neutrala värden eller fylla luckor för att få en analys att passera.

Primärkälla betyder endast källa/dokument som faktiskt har hämtats och klassificerats enligt source-kontraktet. En rubrik eller en känd rapportdag får aldrig räknas som läst rapporttext.

---

## 3. Immutable Peer Registry v1 — permanent DEV-status

AI:n får **inte själv uppfinna peer-gruppen** under analyskörningen. Peer-medlemskap ska vara explicit, källstyrt och versionsbundet.

Tre riktiga peer-set v1 finns permanent i `dividend-lab-dev`:

### Atlas Copco A — bred industriell jämförelse

Target: `ATCO-A.ST`

- `MTRS.ST` — Munters Group
- `SAND.ST` — Sandvik
- `EPI-A.ST` — Epiroc A

Klassning: bred nordisk industriell värderingskontext, **inte** ett påstående om tre direkta konkurrenter.

### Evolution — B2B iGaming-ekosystem

Target: `EVO.ST`

- `HACK.ST` — Hacksaw
- `KAMBI.ST` — Kambi Group
- `GIG-SDB.ST` — GiG Software

Klassning: operator-facing B2B iGaming-teknik/content-ekosystem. Produktmixarna är inte identiska.

### Embracer Group B — noterade gaminggrupper

Target: `EMBRAC-B.ST`

- `PDX.ST` — Paradox Interactive
- `SF.ST` — Stillfront Group
- `MTG-B.ST` — Modern Times Group MTG B

Klassning: bred nordisk noterad gamingkontext. Embracers omstrukturering gör historiska multipeljämförelser extra känsliga.

Permanent DEV-data:

- 3 peer targets
- 3 immutable peer-set v1
- 9 peer members
- 12 peer-set sources
- explicita member-to-source-länkar

Peer-set får versioneras framåt men får inte retroaktivt ersätta den peer-grupp som gällde vid ett äldre target research `dataAsOf`.

---

## 4. Peer research readiness är separat från publik analys

Permanent kontrakt:

`peer-research-readiness-v1`

Ett peer-bolag behöver inte få en full AI-skriven Bear/Base/Bull-analys bara för att bidra med deterministiska värderingsmått.

Facts-only peer research kan användas internt när den klarar readiness, samtidigt som vanlig publik DivLab Analysis fortsätter vara:

`publishable=false`

Peer readiness kräver minst:

- company classification coverage
- supported fundamental methodology
- fundamental coverage
- multi-year fundamental coverage
- fresh primary source
- source traceability
- primary-report evidence
- valuation traceability
- `valuation-provenance-v1`
- minst två positiva spårbara värden bland P/E, P/FCF, EV/EBIT och EV/EBITDA

Den vanliga publiceringsgaten får **inte** breddas för att underlätta peer research.

Target-bolaget i `analyst-v3-peer` kräver fortsatt en full vanlig publishable Deep Research-version.

---

## 5. Database enforcement

DEV-migration:

`20260815112542_allow_peer_ready_facts_research_in_peer_audits.sql`

PostgreSQL accepterar en peer-version i audit endast när den exakta immutable researchversionen antingen:

1. är vanlig full `publishable=true`, eller
2. deterministiskt klarar SQL-ekvivalenten av `peer-research-readiness-v1`.

Target-predikatet är fortsatt full publishability.

Auditens point-in-time-regler och DB-recomputation gäller fortsatt. Framtida peer-set, framtida research eller manipulerade aggregat får inte smyga in i historisk analys.

---

## 6. Kostnadsregel — inga onödiga peer-modellanrop

Peer facts-only research ska använda **0 analyst-model calls**.

Target peer-analys ska använda den kostnadssäkra orchestrationen:

`createDivLabPeerTargetAnalysis(...)`

Ordning:

1. peer registry + peer research preflight
2. om någon registrerad peer saknas/inte är ready: stoppa före target-AI
3. kör vanlig target Analyst exakt en gång
4. bygg/persistiera final target research
5. skapa version-bound peer audit
6. återanvänd exakt samma Analyst draft/model/usage
7. lägg till deterministisk neutral peer-kontext
8. kör `peer-analyst-quality-v1`
9. persistiera `analyst-v3-peer`

Det får inte införas ett andra AI-anrop endast för att lägga till peer-sektionen utan ett nytt uttryckligt beslut och kostnads-/kvalitetsbevis.

---

## 7. Riktig nio-bolagsvalidering — verifierad observation

Skyddad Vercel Preview körde alla nio kurerade peers i en och samma **dry-run-only** batch.

Resultat:

**0/9 peer-ready. 0 writes. 0 target-AI calls.**

Gemensam blocker för samtliga nio:

- `freshPrimarySource`
- `primaryEvidenceCoverage`

Ytterligare blockers:

- Hacksaw: även `multiYearFundamentalCoverage`
- GiG Software: även `multiYearFundamentalCoverage` och `peerMetricCoverage`

Peer metric coverage i övrigt:

- MTRS: P/E, P/FCF, EV/EBITDA
- SAND: P/E, P/FCF, EV/EBITDA
- EPI-A: P/E, P/FCF, EV/EBITDA
- HACK: P/E, P/FCF, EV/EBITDA
- KAMBI: P/E, P/FCF, EV/EBITDA
- GIG-SDB: inga eligible peer metrics
- PDX: P/E, P/FCF, EV/EBITDA
- SF: P/FCF, EV/EBITDA
- MTG-B: P/E, P/FCF, EV/EBITDA

Permanent slutsats:

Det första gemensamma felet var **Nordic primary-report discovery/enrichment**, inte att nio bolag saknade värderingsdata.

Ingen facts-only peer-version får persistieras innan bolaget verkligen passerar readiness.

DEV-verifiering efter batchen visade:

- 0 analysis versions för de nio peer-symbolerna
- 0 nya analysis versions i dry-run-fönstret

---

## 8. Nasdaq Nordic CNS — permanent discovery-lärdom

Nasdaqs aktuella Company News-yta använder **Freetext** för publik issuer/news discovery.

Det tidigare DivLab CNS-anropet skickade display-name alias i `company=` och använde `count=` som result window. Detta kunde tyst ge noll användbara issuer rows trots att aktuella officiella rapporter/PDF:er fanns.

Prospektiv fix:

- alias skickas via `freeText=`
- `company=` lämnas tomt
- befintligt bounded query count skickas via `limit=`
- `showAttachments=true` behålls
- `showCnsSpecific=true` / `showCompany=true` används
- lokal issuer-name matching behålls för att stoppa free-text noise
- attachment allowlist är fortsatt endast officiell Nasdaq-host
- hard max query count är fortsatt 20 rows per alias
- hard max accepted hits är fortsatt 12
- official-document attempt budget är fortsatt 1 PDF per bolag/pass

Detta är en **source-contract correction**, inte en budgetökning och inte en quality-gate-relaxation.

Regressionen är låst i ordinarie root Quality Gate.

---

## 9. Preview/säkerhetsregel

Temporär peer-research route är endast för intern validering.

Krav:

- `VERCEL_ENV=preview`
- production/non-preview → 404
- endast curated peer-symboler
- persistence får endast ske via dev project `faaxloafogpsywfkpbrm`
- batchläge är dry-run-only
- batch persistence är förbjuden
- bounded batch concurrency = 3
- `Cache-Control: no-store`
- ingen analyst-model call
- diagnostik får endast exponera bounded metadata, inte rapporttext/excerpts
- Vercel Deployment Protection får inte sänkas för smoke testing

---

## 10. Historisk experimentintegritet

Denna Deep Research-/peer-utveckling är **prospektiv**.

Får aldrig användas för att:

- räkna om gamla portföljbeslut
- ändra historiska HOLD/KÖP/SÄLJ
- skapa efterhandsaffärer
- byta historiska peers med nyare peer-set
- ersätta gammal research med framtida källor
- förbättra historiskt resultat i efterhand

Detta följer samma experimentintegritet som fyrförvaltarmotorn.

---

## 11. Permanent QA-regel framåt

Framtida ändringar i Deep Research / peer comparison ska minst regressionstesta:

- target full publishability
- peer readiness separat från public publishability
- minst två traceable peer metrics
- exact analysis-version binding
- peer-set point-in-time boundary
- source verifiedAt/dataAsOf lookahead
- DB-recomputed median/min/max/target-vs-median
- all ready peer metrics covered exakt en gång i `analyst-v3-peer`
- ingen favorable-metric cherry-picking
- no second analyst call i single-call orchestration
- peer preflight före target-AI
- Nasdaq CNS freetext discovery-kontrakt
- official attachment allowlist
- official-document attempt budget
- Preview-only/dev-only smoke boundaries
- historisk experimentintegritet

---

## 12. Nästa prioriterade arbetssteg

1. Vänta på/erhåll nästa skyddade Preview-build med den korrigerade CNS-discoveryn.
2. Kör exakt samma nio-peer dry-run igen.
3. Persistiera endast individuella peers som verkligen klarar `peer-research-readiness-v1`.
4. SQL-verifiera varje persisted peer: vanlig `publishable=false`, men `divlab_peer_research_ready(research_packet)=true`.
5. Kör inte target-AI förrän samtliga tre registrerade peers i minst ett target-set är ready.
6. Kör första riktiga version-bound peer audit.
7. Kör första riktiga single-call `analyst-v3-peer`.
8. Gör kvalitativ mänsklig granskning av peer-avsnittet.
9. Först därefter får ett separat experiment överväga om peer-data ska påverka AI:ns core thesis/scenarier.
10. Merge/production/public UI är ett senare separat releasebeslut.

---

## 13. Verifierad kodcheckpoint för denna Master Update

Branch:

`agent/divlab-deep-research-v1`

Draft PR:

`#231`

Verifierad Quality Gate-checkpoint efter CNS-fix + root regression:

`062fe7f622d6d8e8af0b5fa8bc00ac0f8881e516`

Passerat:

- lint
- TypeScript
- core tests
- SEO/news tests
- DivBrain tests
- Cursor bridge tests
- production build

Notera: "production build" här betyder att Next.js production-buildtestet passerade i CI. Det betyder **inte** att branchen är production-deployad.

---

## 14. Operativ kortregel

För nästa Deep Research peer-pass:

**Master → aktuell PR/head → Quality Gate → protected Preview → peer dry-run → readiness → DEV persistence → SQL verification → target single-call → audit → qualitative QA.**

Om källan inte kan verifieras:

**STOP / UNKNOWN — aldrig syntetisk neutralisering.**
