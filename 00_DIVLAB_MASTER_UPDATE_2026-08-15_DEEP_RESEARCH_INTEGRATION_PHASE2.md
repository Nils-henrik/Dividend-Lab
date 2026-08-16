# 00_DIVLAB_MASTER_UPDATE_2026-08-15_DEEP_RESEARCH_INTEGRATION_PHASE2

Denna fil är ett **senare Master Update-lager** till:

- `00_DIVLAB_MASTER_2026-08-12-updated.md`
- `00_DIVLAB_MASTER_UPDATE_2026-08-15_DEEP_RESEARCH_PEER_VALIDATION.md`

Om den tidigare peer-validation-uppdateringen beskriver **aktuell runtime-/readiness-/nästa-steg-status** som motsäger denna fil gäller denna fil. Den äldre 0/9-körningen ska fortfarande betraktas som en verifierad baseline och får inte skrivas om i efterhand.

Denna uppdatering är prospektiv och ändrar **inte** historiska AI-portföljbeslut, affärer, innehav, snapshots eller utvärderingshistorik.

---

## 1. Releaseklassning

DivLab Deep Research, peer comparison och portfolio→Deep Research-integrationen ska fortsatt klassificeras som:

**ACTIVE_PR / INTERNAL_VALIDATION — inte production**

Aktiv branch:

`agent/divlab-deep-research-v1`

Draft PR:

`#231`

Ingen merge till `main`, ingen production release och ingen publik `/analyses`-navigation är genomförd.

---

## 2. Senaste verifierade nio-peer runtime-status

Efter korrigeringen av Nasdaq Nordic CNS från display-name `company=` till bounded `freeText=` kördes exakt samma nio kurerade peer-bolag på en skyddad Vercel Preview.

Senaste verifierade resultat:

**5/9 peer-ready. 0 writes. 0 target-AI calls.**

Peer-ready:

- `MTRS.ST` — Munters Group
- `SAND.ST` — Sandvik
- `EPI-A.ST` — Epiroc A
- `PDX.ST` — Paradox Interactive
- `SF.ST` — Stillfront Group

Inte peer-ready:

- `HACK.ST` — primärkälla/evidence fungerar nu; blocker är `multiYearFundamentalCoverage`
- `KAMBI.ST` — aktuell verifierad batch blockerades fortfarande av `freshPrimarySource` + `primaryEvidenceCoverage`
- `GIG-SDB.ST` — blockerad av `multiYearFundamentalCoverage`, primärkälleevidence och `peerMetricCoverage`
- `MTG-B.ST` — aktuell verifierad batch blockerades fortfarande av primärkälleevidence; generiska återköpsmeddelanden dominerade discovery-resultatet

Permanent slutsats:

CNS `freeText`-korrigeringen är **runtime-verifierad** och flyttade systemet från 0/9 till 5/9 utan sänkt quality gate.

---

## 3. Atlas Copco-setet är första kompletta research-ready peer-setet

Atlas Copco A:s registrerade peer-set:

- Munters
- Sandvik
- Epiroc A

är nu verifierat:

**3/3 peer research-ready i riktig protected Preview dry-run.**

Detta betyder att de tre bolagens faktapaket kan kvalificera för peer comparison när exakta immutable researchversioner har persistierats.

Det betyder **inte** att en riktig Atlas Copco peer-audit ännu finns.

Aktuell DEV-verifiering efter runtime-körningarna:

**0 persisted analysis/research versions för samtliga nio peer-symboler.**

Ingen target-AI får köras mot Atlas peer-set förrän de tre exakta ready-versionerna faktiskt har persistierats och SQL-verifierats.

---

## 4. DEV-persistence — permanent säkerhetsregel

Preview persistence ska använda **dedikerade server-only DEV credentials**:

- `DIVLAB_ANALYSIS_DEV_SUPABASE_URL`
- `DIVLAB_ANALYSIS_DEV_SUPABASE_SERVICE_ROLE_KEY`

Det finns ingen tillåten fallback till:

- `NEXT_PUBLIC_SUPABASE_URL`
- generell `SUPABASE_SERVICE_ROLE_KEY`
- production Supabase-konfiguration

Klienten måste dessutom verifiera att URL-hostnamnet exakt är:

`faaxloafogpsywfkpbrm.supabase.co`

och att `VERCEL_ENV=preview`.

Om de dedikerade DEV-bindningarna saknas ska persistence returnera unavailable/STOP. Felkonfigurerad Preview får aldrig försöka välja en annan databas automatiskt.

Aktuell miljöstatus:

- protected Preview dry-run fungerar
- persistence-request når applikationen men returnerar `dev_admin_unavailable`
- detta är en säker miljödependency, inte ett skäl att hårdkoda eller flytta secrets till repo

Vercel Deployment Protection får fortsatt inte sänkas.

---

## 5. Report-aware Nordic discovery — bounded Deep Research-regel

Kambi och MTG har verifierats externt ha riktiga aktuella Q2-rapporter hos Nasdaq Nordic, vilket visade att deras tidigare blocker inte får tolkas som att rapporterna saknas.

Dedikerad Deep Research har därför ett **report-aware search mode** ovanpå samma CNS-adapter.

Regler:

- vanliga portföljresearch-calls behåller sitt tidigare konservativa beteende
- endast dedikerad Deep Research sätter `preferFinancialReports=true`
- max antal CNS-söktermer är fortsatt **5**
- report-aware termer ersätter några vanliga alias; de läggs inte ovanpå budgeten
- exempel: `<ticker> report` och ett kompakt `<company alias> report`
- max result rows per term är fortsatt **20**
- max accepterade hits är fortsatt **12**
- lokal issuer-name matching är kvar
- attachment allowlist är fortsatt endast officiell Nasdaq attachment-host
- PDF attempt budget är fortsatt **1 dokument per bolag/pass**

Syftet är att riktiga rapporter inte ska trängas undan av exempelvis veckovisa återköpsmeddelanden. Detta är en ranking/discovery-korrigering, inte en nätverksbudgetökning.

Report-aware Kambi/MTG-resultatet är ännu **inte runtime-verifierat** i en ny skyddad API-session och får därför inte beskrivas som löst förrän ny dry-run bekräftar det.

---

## 6. Automatic portfolio shortlist → Deep Research dispatch v1

Ny permanent intern arkitektur:

`portfolio-deep-research-dispatch-v1`

Varje av de fyra förvaltarna får automatiskt lämna högst **en** ny-entry-kandidat till Deep Research-planen per research-pass.

Urvalet sker först efter:

1. förvaltarens strategi-specifika attention/ranking
2. whole-share eligibility
3. kassa-/positions-/equity-riskfilter

Befintliga innehav med `held_for_monitoring` får **inte** konsumera denna new-entry Deep Research-budget. De ligger fortsatt på separat HOLD/SELL/TRIM-monitoring.

Hård dispatchbudget:

- max 1 kandidat per förvaltare
- max 4 unika Deep Research-jobb totalt per pass
- samma bolag valt av flera förvaltare dedupliceras till ett jobb
- jobbet behåller vilka förvaltare som triggat det samt respektive attention reasons

Dispatchplanen genereras automatiskt av model-portfolio-orkestratorn och följer med körningsresultatet/source snapshot.

Viktig metodgräns:

**Planering är inkopplad. Automatisk Deep Research-exekvering i samma portföljbeslut är ännu inte inkopplad.**

Därmed ändras inte redan genererade portföljbeslut retroaktivt eller mitt i samma decision pass.

---

## 7. Cost-safe Portfolio Deep Research execution v1

Separat server-only service finns för att exekvera en redan godkänd dispatchplan.

Regler:

- max 4 unika jobb från dispatchkontraktet
- körning är sekventiell, inte parallell
- före varje analyst-call laddas senaste publishable Deep Research-version
- om publishable version är högst **18 timmar** gammal återanvänds den
- fresh reuse = **0 nya analyst-model calls**
- stale/missing version får exekvera vanlig `createDivLabAiAnalysis(...)`
- instrument identity måste matcha dispatchjobbet
- domain failure förblir explicit failure
- ingen synthetic/fallback research skapas
- service-lagret har ingen settlement-, transaction-, holdings- eller cash-ledger-write-path

Denna exekveringsservice är byggd men ännu inte automatiskt anropad från model-portfolio-körningen.

---

## 8. Deep Research → portfolio evidence contract

Ny evidenstyp i portfölj-AI-kontraktet:

`deep_research`

En publishable immutable `deep-research-v2`-version kan deterministiskt konverteras till tre bounded evidensposter:

1. fundamental
2. valuation
3. technical

Evidence IDs måste innehålla exakt immutable analysis-version UUID:

`DEEP-RESEARCH:<analysisVersionId>:fundamental`

`DEEP-RESEARCH:<analysisVersionId>:valuation`

`DEEP-RESEARCH:<analysisVersionId>:technical`

Adapterkrav:

- exakt `deep-research-v2`
- `qualityGate.publishable=true`
- `valuation-provenance-v1`
- giltigt immutable analysis-version UUID
- ingen provider-/model-call i adaptern
- neutral text; får inte översätta analysen till automatiskt KÖP/SÄLJ
- teknisk data är timing/riskkontext och får inte ensam skapa affär
- DivLab Deep Research får inte maskeras som `company_report`, `news` eller annan extern källtyp

Evidensadaptern är byggd men Deep Research-evidens är ännu **inte automatiskt injicerad i förvaltarnas beslutsprompt**. Det steget kräver först riktig persisted research och prospektiv QA.

---

## 9. Historisk experimentintegritet — fortsatt absolut regel

Portfolio→Deep Research-integrationen är prospektiv.

Får aldrig användas för att:

- köra om äldre AI-beslut
- ersätta ett historiskt HOLD/KÖP/SÄLJ med ett nytt beslut
- lägga till en efterhandsaffär
- ge ett äldre beslut Deep Research som inte fanns vid beslutstidpunkten
- ändra historiska resultat eller grafer för att förbättra experimentets utfall

När Deep Research senare börjar påverka förvaltar-AI ska första sådana beslutet vara tydligt versions-/tidsbundet framåt från aktiveringspunkten.

---

## 10. QA-regler tillagda i fas 2

Root Quality Gate ska fortsättningsvis låsa minst:

- max 1 dispatchkandidat per manager
- max 4 unika dispatchjobb
- dedup mellan managers
- held-for-monitoring exkluderad från new-entry-budget
- dispatch efter whole-share/risk-filter
- ingen Deep Research execution i samma beslutssteg innan separat aktivering
- 18h fresh publishable reuse före analyst-call
- sekventiell execution
- ingen settlement/history mutation från Deep Research service
- exakt immutable analysis-version i portfolio Deep Research evidence IDs
- publishable + valuation provenance krävs före evidence-adapter
- report-aware CNS search max 5 terms
- ordinary portfolio CNS defaults får inte höjas
- dedicated DEV credentials utan generic/production fallback

---

## 11. Senaste verifierade kodcheckpoint

Verifierad full Quality Gate-checkpoint:

`5fd21305742f182064b0958899f601482679ea87`

Passerat:

- lint
- TypeScript
- core tests
- SEO/news tests
- DivBrain tests
- Cursor bridge tests
- Next.js production build

"Production build" betyder endast CI-build. PR:n är fortfarande inte production-deployad.

Vercel har ännu inte skapat en ny protected Preview efter den senaste säkerhets-/testheaden; senaste användbara report-aware Preview är från en tidigare commit i samma branch.

---

## 12. Nästa prioriterade arbetsordning

1. Få nästa protected Preview som innehåller senaste report-aware CNS + säkerhetshead.
2. Kör en ny nio-peer batch som första request i sessionen.
3. Verifiera särskilt Kambi och MTG report discovery.
4. Behåll Hacksaw som explicit history-blocker om multi-year data fortfarande saknas.
5. Bind de två dedikerade DEV Supabase-secrets till Preview-miljön utan att exponera dem i repo.
6. Persistiera endast peer-versioner som vid samma körning faktiskt klarar `peer-research-readiness-v1`.
7. SQL-verifiera varje persisted peer: ordinary `publishable=false`, men deterministic peer readiness=true.
8. När Atlas Copco-setets tre versioner är persisted: kör första riktiga version-bound peer audit.
9. Kör därefter första riktiga single-call `analyst-v3-peer`.
10. Gör kvalitativ mänsklig QA av Atlas-resultatet innan peer-data får påverka core thesis/scenarier.
11. Efter persisted publishable Deep Research: verifiera portfolio evidence-adaptern mot riktig version.
12. Aktivera senare Deep Research-feedback till managers endast prospektivt och med tydlig aktiveringscheckpoint.

---

## 13. Operativ kortregel fas 2

**Manager strategy attention → whole-share/risk eligibility → max 1 candidate/manager → dedup max 4 → Deep Research plan → fresh-version reuse eller bounded execution → immutable persistence → evidence adapter → nästa prospektiva manager-pass.**

För peer-spåret:

**protected Preview → readiness → dedicated DEV persistence → SQL verify → complete target peer-set → audit → single target Analyst call → deterministic peer appendix → qualitative QA.**

Om källa, historik, secret-binding eller provenance inte kan verifieras:

**STOP / UNKNOWN — aldrig fallback till production, syntetisk research eller efterhandskorrigering.**
