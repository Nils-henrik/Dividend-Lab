# 00_DIVLAB_MASTER_UPDATE_2026-08-15_HISTORICAL_VALUATION_CLAIM_V1

Detta är ett senare Master Update-lager för **historisk värderingsproveniens** till:

- `00_DIVLAB_MASTER_2026-08-12-updated.md`
- `00_DIVLAB_MASTER_UPDATE_2026-08-15_DEEP_RESEARCH_PEER_VALIDATION.md`
- `00_DIVLAB_MASTER_UPDATE_2026-08-15_DEEP_RESEARCH_INTEGRATION_PHASE2.md`
- `00_DIVLAB_MASTER_UPDATE_2026-08-15_HISTORICAL_VALUATION_V1.md`

Om den tidigare Historical Valuation-mastern beskriver det separata historikclaim-kontraktet som ännu ej byggt gäller denna fil för den delen.

Denna uppdatering är prospektiv och ändrar inte historiska portföljbeslut, researchversioner eller tidigare analyser.

---

## 1. Releaseklassning

`historical-valuation-claim-v1` är:

**ACTIVE_PR / INTERNAL_VALIDATION — inte production**

Den ligger i Draft PR `#231` på branch:

`agent/divlab-deep-research-v1`

Ingen Analyst-prompt eller publik UI konsumerar kontraktet ännu.

---

## 2. Permanent kontrakt

Ny versionsbunden claim-proveniens:

`historical-valuation-claim-v1`

Syftet är att ett framtida konkret historiskt värderingspåstående, exempelvis en percentilposition, aldrig ska kunna bestå av ett fristående AI-genererat tal.

En claim får endast byggas från ett redan deterministiskt `historical-valuation-v1`-resultat där den aktuella metricen har:

`status = ready`

Det innebär fortsatt minst fyra separata verkliga observationsdagar.

---

## 3. Exakta bindningar per claim

Varje historisk valuation claim ska binda exakt till:

- claim-version `historical-valuation-claim-v1`
- history-version `historical-valuation-v1`
- instrument symbol
- exchange
- instrument name
- exakt metric
- exakt `maxObservationAt`
- sample size
- senaste immutable analysis-version UUID
- ordnad lista över samtliga immutable analysis-version UUIDs som ingår
- unionen av samtliga measure/source IDs som observationerna faktiskt använder
- exakt min
- exakt Q1
- exakt median
- exakt Q3
- exakt max
- exakt latest
- exakt latest percentile

Claimen ska därför kunna verifieras om från den deterministiska historiken utan att lita på AI-text.

---

## 4. Anti-manipulation / fail-closed

Validatorn ska rekonstruera den förväntade claimen från `historical-valuation-v1` och stoppa om någon av följande delar ändras:

- metric
- instrument identity
- point-in-time boundary
- sample size
- latest analysis-version UUID
- någon observationsversion UUID
- källmängden
- min/Q1/median/Q3/max/latest
- latest percentile

Det är inte tillåtet att tolerera en "nästan likadan" percentile eller aggregering.

Numerisk equality för claim-kontraktet är exakt mot det deterministiska history-resultatet.

---

## 5. Claimens egna point-in-time-regler

Utöver `historical-valuation-v1`-motorns ursprungliga anti-lookahead ska claim-lagret själv verifiera:

- giltiga immutable analysis-version UUIDs
- inga duplicerade analysis-version UUIDs
- observationsordning strikt stigande
- `observationAt <= maxObservationAt`
- `dataAsOf <= observationAt`
- varje observation har minst ett source ID
- observation value är positiv och finite
- senaste observationens value är exakt lika med history-statistikens `latest`
- percentile ligger inom `[0, 1]`
- `min <= Q1 <= median <= Q3 <= max`
- `latest` ligger inom `[min, max]`

Brott mot någon regel ska stoppa claimen i stället för att korrigeras automatiskt.

---

## 6. Neutralitetsregel

`historical-valuation-claim-v1` är ett **proveniens-/auditkontrakt**, inte en investeringssignal.

Det får inte själv översätta exempelvis:

- hög P/E-percentil → dyr / SÄLJ
- låg P/E-percentil → billig / KÖP
- hög FCF-yield-percentil → attraktiv

Sådan kvalitativ tolkning är ett senare Analyst-kontrakt och måste ha egen quality gate.

Claim-lagret gör **0 model calls**.

---

## 7. Analyst-gräns efter denna uppdatering

Den tidigare Masterns krav på ett separat historiskt claim/proveniens-kontrakt är nu tekniskt uppfyllt.

Det betyder däremot **inte** att historisk värdering nu får injiceras fritt i `analyst-v2`.

Nästa tillåtna steg är ett separat versionsbundet Analyst-context/schema som:

1. endast accepterar validerade `historical-valuation-claim-v1` claims;
2. gör skillnad på historisk observation och investeringsslutsats;
3. förbjuder claims för `status=insufficient`;
4. kräver exakt metric/percentile/statistik-grounding;
5. har quality gate mot cherry-picking och överdriven säkerhet.

AI-prompten ska inte ändras innan det kontraktet är byggt och testat.

---

## 8. Historisk experimentintegritet

Precis som tidigare gäller:

- ingen claim får använda observationer som skapades efter analysens point-in-time boundary
- gamla portföljbeslut får inte köras om med ny historik
- gamla analyser får inte få nya historiska claims inskrivna retroaktivt
- framtida historik får inte ersätta den historikmängd som fanns när en äldre claim skapades

Prospektiv versionsbundenhet är obligatorisk.

---

## 9. QA som nu ligger i root Quality Gate

Den nya root-testsviten verifierar minst:

- korrekt claim från fyra ready observationsdagar
- exakt latest immutable analysis-version
- exakt ordered observationsversion set
- exakt source binding set
- exakt latest percentile
- manipulerad percentile avvisas
- manipulerad analysis-version avvisas
- borttagen källbindning avvisas
- insufficient metric avvisas
- lookahead observation avvisas
- duplicerad immutable analysis-version avvisas

Detta körs i den ordinarie `npm test`-delen av Quality Gate.

---

## 10. Verifierad kodcheckpoint

Verifierad full Quality Gate-checkpoint:

`73dc7189faa963ddd80fc44e82e937c5cf3379d7`

Passerat:

- lint
- TypeScript
- core tests
- SEO/news tests
- DivBrain tests
- Cursor bridge tests
- Next.js production build

`production build` betyder CI-build. Branch/PR är fortsatt inte production-deployad.

---

## 11. Fortsatt blocker/status för real-data-spåret

Denna claim-utveckling ändrar inte real-data-statusen för peer-spåret.

Senaste verifierade peer-baseline kvarstår:

- 5/9 peer-ready
- Atlas Copco peer-set 3/3 research-ready i skyddad Preview dry-run
- inga real peer researchversioner persistierade ännu
- senaste report-aware Kambi/MTG-kod finns i protected Preview men ny API-session har ännu inte kunnat runtime-verifieras genom den tillgängliga Vercel-connectorns SSO-cookieflöde
- dedikerade DEV Supabase credentials saknas fortfarande i Preview, och persistence ska därför fortsatt fail-closed

Deployment Protection eller DEV/production-separation får inte sänkas för att forcera nästa smoke.

---

## 12. Nästa prioriterade arbetsordning

Peer/real-data-spåret:

1. protected Preview API-session på senaste report-aware head
2. verifiera Kambi/MTG
3. bind dedikerade DEV credentials säkert
4. persistiera endast ready peer versions
5. SQL-verifiera peer readiness + ordinary publishable=false
6. första Atlas Copco version-bound peer audit
7. första single-call `analyst-v3-peer`
8. kvalitativ QA innan peer-data får påverka core thesis/scenarier

Historikspåret:

1. bygg separat historical Analyst-context/schema ovanpå validerade claims
2. quality gate mot cherry-picking och felaktig percentiltolkning
3. ingen AI-aktivering innan minst en riktig ready historical range finns
4. aktivering sker prospektivt och versionsbundet

---

## 13. Operativ kortregel

**Historical range → ready minst 4 dagar → historical-valuation-claim-v1 → exact UUID/source/stat binding → framtida Analyst-context → quality gate → först därefter AI-tolkning.**

Om historik, source binding, point-in-time eller claim equality inte kan verifieras:

**STOP / UNKNOWN — aldrig syntetisk percentile eller fri AI-tolkning.**
