# 00_DIVLAB_MASTER_UPDATE_2026-08-15_HISTORICAL_VALUATION_V1

Detta är ett senare Master Update-lager för **historisk värdering** till:

- `00_DIVLAB_MASTER_2026-08-12-updated.md`
- `00_DIVLAB_MASTER_UPDATE_2026-08-15_DEEP_RESEARCH_PEER_VALIDATION.md`
- `00_DIVLAB_MASTER_UPDATE_2026-08-15_DEEP_RESEARCH_INTEGRATION_PHASE2.md`

Om äldre dokument föreslår att DivLab ska skapa historiska multipelintervall genom att para gamla rapportperioder med historiska kurser utan bevis för när rapportinformationen faktiskt var tillgänglig gäller denna fil i stället.

---

## 1. Permanent princip — ingen falsk point-in-time-backfill

DivLab får **inte** konstruera historisk P/E, P/FCF, FCF-yield, EV/EBIT eller EV/EBITDA för ett gammalt datum enbart genom att kombinera:

- ett historiskt kursdatum, och
- redovisningsdata vars faktiska publicerings-/tillgänglighetstid inte är verifierad.

Ett sådant upplägg kan smyga in framtidskunskap och får inte beskrivas som point-in-time.

Historisk värdering ska i första versionen därför ackumuleras **prospektivt från immutable Deep Research-versioner som faktiskt existerade vid observationstidpunkten**.

Ingen syntetisk historisk backfill används för att göra grafen längre eller mer imponerande.

---

## 2. historical-valuation-v1

Permanent kontrakt:

`historical-valuation-v1`

Tillåtna historiska mått:

- P/E
- P/FCF
- FCF-yield
- EV/EBIT
- EV/EBITDA

Raw enterprise value används inte som historisk relativ multipelrange eftersom företagets absoluta storlek förändras över tid.

Varje observation måste bindas till:

- exakt immutable analysis-version UUID
- research `createdAt`
- research `dataAsOf`
- exakt traceable valuation measure
- measure-specifika `sourceIds`
- `valuation-provenance-v1`
- full ordinary `qualityGate.publishable=true`

Facts-only peer research (`publishable=false`) får inte användas för target-bolagets historiska publika värderingsrange.

---

## 3. Anti-lookahead

För varje historisk observation gäller:

- `dataAsOf <= observationAt`
- varje source `publishedAt <= observationAt`
- varje source `verifiedAt <= observationAt`
- requested `maxObservationAt` får inte ligga efter `generatedAt`
- observationer efter `maxObservationAt` ska ge fail-closed error
- alla versioner måste tillhöra exakt samma instrument identity

Om någon av dessa regler bryts ska historikberäkningen stoppa i stället för att hoppa över felet tyst.

---

## 4. Daily canonicalization

Flera analyser av samma bolag samma kalenderdag får inte övervikta den dagen i historikfördelningen.

Regel:

- högst en observation per kalenderdag
- den senast skapade immutable versionen den dagen används
- olika dagar räknas som olika faktiska observationspunkter

---

## 5. Minimum sample size

Ett historiskt värderingsmått får inte få status `ready` med bara en eller två datapunkter.

Permanent minimum:

**4 separata observationsdagar**

Färre än fyra:

`status = insufficient`

och inga statistiska rangevärden publiceras.

När minst fyra giltiga observationer finns beräknas deterministiskt:

- min
- Q1
- median
- Q3
- max
- latest
- latest percentile rank i den observerade fördelningen

Detta är beskrivande historisk kontext, inte ett automatiskt köp-/säljbeslut.

---

## 6. Repository read-service

`historical-valuation-service` får endast läsa immutable versioner från `divlab_analysis_versions` som:

- hör till rätt `instrument_symbol` + `exchange`
- är `publishable=true`
- har `data_as_of <= maxObservationAt`
- har `created_at <= maxObservationAt`

Read-budget:

- default max 120 versioner
- hard max 500 versioner

Servicen får inte ringa Yahoo, EODHD, annan marknadsprovider eller en AI-modell för att rekonstruera historik.

Historikresultatet är deterministiskt derivat från immutable research och behöver inte en separat historik-AI-kostnad.

---

## 7. Analyst-proveniensgräns

`historical-valuation-v1` ska **inte** automatiskt injiceras i `analyst-v2` som fria historiska värderingspåståenden ännu.

Skäl:

`analyst-v2` har i dag ett source-kontrakt där konkreta valuation claims binds till dagens `valuationProvenance.sourceIds`. Ett påstående som exempelvis "P/E ligger i den historiska 80:e percentilen" behöver en separat versionsbunden historikproveniens.

Innan AI:n får skriva sådana konkreta historiska claims krävs ett separat kontrakt som minst binder:

- historikmetodversion
- ingående analysis-version UUIDs
- exakt metric
- sample size
- min/Q1/median/Q3/max
- latest + percentile

Tills dess får historikmotorn användas som deterministiskt internt/UI-data, men inte som en genväg runt Analyst-v2:s provenance-regler.

---

## 8. Historisk experimentintegritet

Historikmotorn får aldrig användas för att retroaktivt ge gamla AI-portföljbeslut information som inte fanns då.

Prospektiv regel:

När en portfolio/Analyst senare börjar konsumera historisk valuation context måste den använda en `maxObservationAt` som inte är senare än beslutets/analysens point-in-time-boundary.

Gamla beslut ska inte köras om.

---

## 9. QA-regler

Root Quality Gate ska minst verifiera:

- minimum 4 observationsdagar
- same-day dedup
- quantile/median/percentile determinism
- non-publishable research rejected
- mixed instruments rejected
- source publishedAt/verifiedAt lookahead rejected
- dataAsOf/createdAt/maxObservationAt lookahead rejected
- only traceable measures included
- source IDs måste existera i exakt research packet
- SQL read filter på både `data_as_of` och `created_at`
- read-version count bounded
- inga provider-/model-calls i history read-service

---

## 10. Verifierad kodcheckpoint

Senaste verifierade full Quality Gate-checkpoint för denna Master Update:

`a73d347433f4a056f0ed92e713bf2f2e27aa53c5`

Passerat:

- lint
- TypeScript
- core tests
- SEO/news tests
- DivBrain tests
- Cursor bridge tests
- Next.js production build

"Production build" betyder CI-build, inte production deployment.

Deep Research-PR:n är fortsatt Draft/ACTIVE_PR och inte mergead.

---

## 11. Operativ kortregel

**Ingen verifierad observationstidpunkt = ingen historisk datapunkt.**

**<4 riktiga observationsdagar = insufficient.**

**Immutable publishable research + traceable provenance + no lookahead = tillåten historisk observation.**

**Historisk AI-tolkning kräver separat provenance-kontrakt innan den aktiveras.**
