# 00_DIVLAB_MASTER_UPDATE_2026-08-15_HISTORICAL_ANALYST_CONTEXT_V1

Detta är ett senare Master Update-lager till `00_DIVLAB_MASTER_UPDATE_2026-08-15_HISTORICAL_VALUATION_CLAIM_V1.md`.

Om det tidigare lagret beskriver historical Analyst-context som nästa ännu ej byggda steg gäller denna fil för den delen.

---

## 1. Releaseklassning

`historical-analyst-context-v1` är:

**ACTIVE_PR / INTERNAL_VALIDATION — inte production**

Draft PR: `#231`

Branch: `agent/divlab-deep-research-v1`

Ingen Analyst-prompt, portfolio manager eller publik UI konsumerar contextet ännu.

---

## 2. Permanent kontrakt

Ny neutral context-version:

`historical-analyst-context-v1`

Den enda tillåtna framtida vägen från `historical-valuation-v1` till ett Analyst-lager ska gå genom validerade:

`historical-valuation-claim-v1`

Contextet får inte ta emot lösa historikvärden, fria percentiler eller providerdata direkt.

---

## 3. Context-bindningar

Ett context binder:

- context-version
- history-version `historical-valuation-v1`
- claim-version `historical-valuation-claim-v1`
- exakt instrument identity
- exakt `maxObservationAt`
- en kanoniskt ordnad lista av validerade historical valuation claims

Alla claims måste tillhöra samma instrument och samma point-in-time history.

---

## 4. Ready-only / fail-closed

Default-bygget får endast ta med metrics vars historical range redan är:

`status = ready`

Om en caller uttryckligen begär en metric som är `insufficient` ska contextbygget stoppa med error.

Det är inte tillåtet att tyst utelämna en explicit begärd otillräcklig metric, eftersom det kan dölja dataluckor för nästa lager.

Duplicerade metrics är förbjudna.

Metricordningen är kanonisk:

1. P/E
2. P/FCF
3. FCF yield
4. EV/EBIT
5. EV/EBITDA

---

## 5. Revalidation

Context-validatorn ska för varje claim köra om hela `historical-valuation-claim-v1`-verifieringen mot samma originating history.

Den ska dessutom stoppa vid:

- fel context-version
- fel history-version
- fel claim-version
- instrument mismatch
- `maxObservationAt` mismatch
- tom claim-lista
- duplicerad metric
- icke-kanonisk metricordning
- claim med annan point-in-time boundary
- någon manipulerad underliggande claim/statistik/source/version binding

---

## 6. Neutralitets- och kostnadsregel

`historical-analyst-context-v1` är endast ett verifierat input-envelope.

Det gör:

**0 model calls**

Det får inte själv skapa:

- KÖP/HOLD/SÄLJ
- billig/dyr-etikett
- target price
- Bear/Base/Bull
- confidence
- scenarioförändring

Sådan tolkning kräver ett senare explicit Analyst-schema + quality gate.

---

## 7. Vad som fortfarande krävs före AI-tolkning

Nästa steg är inte att stoppa contextet direkt i nuvarande `analyst-v2` prompt.

Före AI-konsumtion krävs ett separat historiskt Analyst-claim/schema som minst:

- refererar exakt till en claim i `historical-analyst-context-v1`
- reproducerar metric + relevant statistik/percentile exakt
- förbjuder historiska påståenden utanför contextet
- förbjuder favorable-metric cherry-picking
- skiljer observerad historisk position från investeringsslutsats
- kalibrerar confidence efter sample size och historikens längd
- stoppar om ingen riktig ready range finns

Ingen AI-aktivering ska göras innan detta är implementerat och kvalitativt testat på verklig historik.

---

## 8. QA

Root Quality Gate verifierar nu även:

- context byggs endast av ready claims
- default context utelämnar insufficient metrics
- explicit requested insufficient metric failar
- duplicate requested metric failar
- instrument/boundary måste matcha originating history
- manipulerad claim inuti contextet failar genom claim-revalidation
- neutral context kan verifieras utan model call

---

## 9. Verifierad checkpoint

Full Quality Gate passerad på:

`b8f45242698b784bfe01ae1528d52e2edc5d6405`

Passerat:

- lint
- TypeScript
- core tests
- SEO/news tests
- DivBrain tests
- Cursor bridge tests
- Next.js production build

CI production build betyder inte production deployment.

---

## 10. Real-data/peer-status ändras inte

Detta arbete är oberoende av peer-runtime-blockern.

Senaste real-data baseline kvarstår:

- 5/9 peer-ready i verifierad protected Preview batch
- Atlas Copco peer-set 3/3 research-ready
- inga real peer researchversioner persistierade ännu
- senaste report-aware Kambi/MTG Preview saknar fortfarande lyckad skyddad API-session genom nuvarande connector-cookieflöde
- DEV persistence ska fortsatt fail-closed tills dedikerade DEV credentials finns i Preview

Deployment Protection får inte sänkas för att forcera smoke.

---

## 11. Operativ kedja framåt

Historik:

**immutable publishable research → historical-valuation-v1 → ready >=4 observationsdagar → historical-valuation-claim-v1 → historical-analyst-context-v1 → separat historical Analyst-schema/quality gate → verklig QA → först därefter prospektiv AI-tolkning.**

Peer:

**protected Preview → peer readiness → DEV persistence → SQL verification → version-bound peer audit → single-call analyst-v3-peer → qualitative QA.**

Om point-in-time, claim eller context inte kan verifieras:

**STOP / UNKNOWN.**
