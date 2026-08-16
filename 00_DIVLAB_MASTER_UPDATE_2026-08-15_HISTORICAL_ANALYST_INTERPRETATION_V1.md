# 00_DIVLAB_MASTER_UPDATE_2026-08-15_HISTORICAL_ANALYST_INTERPRETATION_V1

Detta är ett senare Master Update-lager för **historisk Analyst-tolkning** till:

- `00_DIVLAB_MASTER_2026-08-12-updated.md`
- `00_DIVLAB_MASTER_UPDATE_2026-08-15_HISTORICAL_VALUATION_V1.md`
- `00_DIVLAB_MASTER_UPDATE_2026-08-15_HISTORICAL_VALUATION_CLAIM_V1.md`
- `00_DIVLAB_MASTER_UPDATE_2026-08-15_HISTORICAL_ANALYST_CONTEXT_V1.md`

Om den tidigare Historical Analyst Context-mastern beskriver interpretation-schema och quality gate som ännu ej byggda gäller denna fil för den delen.

Denna uppdatering är prospektiv. Den ändrar inga historiska portföljbeslut, affärer, researchversioner eller äldre Analyst-resultat.

---

## 1. Releaseklassning

Nya kontrakt:

- `historical-analyst-interpretation-v1`
- `historical-analyst-quality-v1`

Status:

**ACTIVE_PR / INTERNAL_VALIDATION — inte production**

Branch:

`agent/divlab-deep-research-v1`

Draft PR:

`#231`

Historisk context är fortfarande inte injicerad i `analyst-v2`, manager-prompter eller publikt UI.

---

## 2. Permanent historisk tolkningskedja

Tillåten kedja är nu:

**immutable publishable Deep Research → historical-valuation-v1 → historical-valuation-claim-v1 → historical-analyst-context-v1 → historical-analyst-interpretation-v1 → historical-analyst-quality-v1**

Varje steg är versionsbundet och fail-closed.

Historisk tolkning får inte byggas direkt från lösa multipeltal eller en fri AI-prompt.

---

## 3. Full ready-metric coverage — ingen cherry-picking

Interpretation-lagret måste täcka **exakt alla** historikmått som finns som verifierade ready claims i samma `historical-analyst-context-v1`.

Det är inte tillåtet att exempelvis:

- visa P/E när det ser gynnsamt ut men utelämna ready P/FCF
- välja bort FCF-yield för att narrativet blir sämre
- ändra metric-ordning för att skapa ett selektivt resultat

Kanonisk metric-ordning:

1. P/E
2. P/FCF
3. FCF-yield
4. EV/EBIT
5. EV/EBITDA

Endast metrics som faktiskt är ready i contextet förekommer.

---

## 4. Exakt numerisk grounding

Varje interpretation claim måste matcha sin verifierade historical claim exakt på:

- metric
- sample size
- antal immutable observationsversioner
- antal source IDs
- senaste immutable analysis-version UUID
- min
- Q1
- median
- Q3
- max
- latest
- latest percentile

Även top-level måste matcha:

- interpretation-version
- context-version
- history-version
- claim-version
- instrument identity
- exakt `maxObservationAt`

Ändrat tal, UUID, boundary eller metric ska stoppa kontraktet.

---

## 5. Deterministisk historisk position

Historikpercentilen får inte beskrivas med en fri modellklassning.

`positionBand` bestäms deterministiskt:

- percentile `< 0.25` → `bottom_quartile`
- percentile `>= 0.25 && < 0.75` → `middle_half`
- percentile `>= 0.75` → `top_quartile`

Detta beskriver endast var den senaste verifierade observationen ligger i DivLabs egna verkliga point-in-time-observationer.

Det betyder inte automatiskt billig, dyr, undervärderad eller övervärderad.

---

## 6. Evidensbredd / överkonfidens

Historikens evidensbredd bestäms deterministiskt av antal separata observationsdagar:

- 4–7 → `limited`
- 8–19 → `moderate`
- 20–500 → `broad`

En interpretation får inte själv höja evidensstyrkan.

Exempel:

Fyra riktiga observationsdagar får aldrig märkas `broad` bara för att percentilen är extrem.

Historisk fördelningsposition är beskrivande kontext, inte prognossäkerhet.

---

## 7. Neutralitetsregel

`historical-analyst-quality-v1` blockerar direkt investment-verdict-språk som försöker översätta historikpercentilen ensam till exempelvis:

- köp / sälj
- buy / sell
- billig / dyr
- undervärderad / övervärderad
- guaranteed / garanterad
- riskfri

Första implementationen använder därför en **deterministisk neutral composition** som beskriver:

- metric
- historiskt kvartilband
- antal observationsdagar
- att informationen är beskrivande historisk kontext och inte en investeringsrekommendation

Composition-lagret gör **0 model calls**.

---

## 8. Quality Gate

`historical-analyst-quality-v1` kräver alla följande checks:

- `contextBinding`
- `completeMetricCoverage`
- `numericGrounding`
- `positionGrounding`
- `evidenceBreadthCalibration`
- `neutralLanguage`

`publishable=true` endast när samtliga blockers är borta.

Detta gäller interpretation-appendixets interna kvalitet. Det betyder inte att hela Analyst-systemet eller en publik analys automatiskt ska publiceras.

---

## 9. Regressionstester

Root Quality Gate verifierar nu minst:

- två ready historikmått täcks samtidigt
- canonical metric order
- top/bottom quartile klassas deterministiskt
- 4 observationsdagar ger endast `limited`
- valid neutral interpretation blir quality score 100
- cherry-pick av ett ready metric avvisas
- manipulerad median avvisas av exact grounding
- fel `maxObservationAt` avvisas
- fel percentile-band avvisas
- överdriven `broad` evidens avvisas
- investment-verdict-språk blockeras av quality gate
- duplicerad metric avvisas av schema

---

## 10. Verifierad kodcheckpoint

Full Quality Gate passerad på:

`ab0211811cab13cd6411b332ddab20adc0d57e26`

Passerat:

- lint
- TypeScript
- core tests
- SEO/news tests
- DivBrain tests
- Cursor bridge tests
- Next.js production build

`production build` betyder CI-build, inte production deployment.

---

## 11. AI-aktivering är fortfarande spärrad

Trots att interpretation-schema och quality gate nu finns ska historisk värdering **inte** börja påverka AI:ns core thesis, scenarios eller manager-beslut ännu.

Aktivering kräver minst:

1. verklig persisted publishable Deep Research som ackumulerar historik prospektivt;
2. minst fyra separata verkliga observationsdagar för ett metric;
3. riktig ready historical range;
4. interpretation som passerar `historical-analyst-quality-v1`;
5. kvalitativ mänsklig QA på riktig bolagsdata;
6. separat prospektiv aktiveringscheckpoint.

Gamla analyser eller portföljbeslut får aldrig köras om med historik som inte fanns då.

---

## 12. Peer/real-data-status oförändrad

Detta historikarbete ändrar inte peer-runtime-statusen.

Senaste verifierade baseline kvarstår:

- 5/9 peer-ready
- Atlas Copco peer-set 3/3 research-ready i protected Preview dry-run
- inga real peer researchversioner persistierade ännu
- Kambi/MTG report-aware runtime behöver fortfarande verifieras i en skyddad Preview-session
- dedikerade DEV Supabase-bindningar saknas fortfarande i Preview och persistence ska därför fail-closed

Deployment Protection eller DEV/production-separation får inte sänkas för att forcera nästa steg.

---

## 13. Nästa prioriterade arbete

Real-data/peer-spåret har högst prioritet:

1. protected Preview session på senaste report-aware head
2. verifiera Kambi/MTG
3. binda dedikerade DEV credentials säkert
4. persistiera endast peer-ready research
5. SQL-verifiera immutable peer versions
6. första riktiga Atlas Copco version-bound peer audit
7. första riktiga single-call `analyst-v3-peer`
8. kvalitativ QA

Historikspåret fortsätter prospektivt genom att låta riktiga publishable Deep Research-versioner ackumulera minst fyra observationsdagar innan någon historisk AI-aktivering övervägs.

---

## 14. Operativ kortregel

**Ingen ready history = ingen interpretation.**

**Alla ready metrics eller inget publishable interpretation-resultat.**

**Exakt statistik + exakt versionsbindning + deterministiskt kvartilband + kalibrerad evidensbredd + neutralt språk.**

Om något inte kan verifieras:

**STOP / UNKNOWN — aldrig cherry-pick, syntetisk historik eller fri investeringsslutsats från en percentile.**
