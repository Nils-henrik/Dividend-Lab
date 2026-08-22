# DIVLAB MASTER UPDATE — Analysis Monster Patch Decision 3

Datum: 2026-08-22
Status: ACTIVE_PATCH_DECISION_3
Branch: `agent/analysis-monster-patches-v1`
Parent patch commit: `7065128dd905d465f639c748a078ad854d154dc9`
Preview deployment: `dpl_99KLxreWYN9h5paX9rtq3sGU6xag`

## Verifierad Preview-status

Patch Decision 2 blev READY och ordinarie lint/typecheck/test/build-kedja passerade. Den fokuserade live-diagnostiken gav följande nya observationsläge.

### XOM — fortsatt READY

SEC discovery har fortfarande exakt en verifierad interim 10-Q och en verifierad annual 10-K. Curated predecessor/successor-CIK continuity är intakt och ingen generell accession-prefix-heuristik har införts.

### SEB — P/B READY, rapportdiscovery fortfarande P1

P/B är fortsatt traceable, cirka 1,895x, men de explicita `interim/results`-termerna gav fortfarande generiska samma-dagsreleaser i stället för Q2-rapporten. Nasdaq publicerade den verifierade primärrapporten den 15 juli 2026 med rubriken `SEB's results for the second quarter 2026` och kategorin Half Year financial report. Nästa patch ska därför använda periodstyrd Q2/H1-intent inom exakt samma requestbudget.

### Investor — rapportdiscovery fortfarande P1

Ingen användbar primärrapport nådde research packet. Nasdaq har en verifierad `Interim report January-June 2026` från Investor den 16 juli 2026 med NAV 397 SEK per aktie. Nästa patch ska söka periodstyrt Q2/H1/interim, fortfarande via samma Nasdaq-adapter och issuer-filter.

### EQT — rapportdiscovery READY, specialist extraction fortfarande P1

H1 2026 och year-end 2025 hämtas som primärrapporter. Unicode `Cf`-normalisering sänkte inte några krav men räckte inte för att nå AUM/FAUM. Det observerade `documentExcerptLength` ligger exakt på nuvarande 4 500-teckengräns, medan den verifierade H1-källan innehåller `FAUM ... €155bn` och `Total AUM ... €291bn` längre ned i dokumentet. Nästa patch får därför öka textfönstret endast för dedicated DivLab Deep Research, med bibehållna sid-, dokument-, byte-, timeout- och hostgränser.

### Avanza — fixture-korrigering nu låst

Den svenska verifierade identiteten är `AZA.ST` (`symbol=AZA`, `exchange=ST`). Den gamla monsterfixturen `AVANZ.ST` ska korrigeras nu, innan nästa fulla 27-måls regression.

## Låst Patch Decision 3

Nästa samlade patch får endast:

1. göra current-report intent periodstyrd utifrån klockan: Q1 under april–juni, Q2/H1 under juli–september, Q3 under oktober–december och Q4/year-end under januari–mars;
2. behålla exakt tre current CNS-requests och två annual CNS-requests; ingen extra extern request får läggas till;
3. för Q2 använda strikt interna termer baserade på ticker/issuer + `Q2`, `half-year` och `interim report`, så att SEB/Investor/EQT kan hittas utan bolagsspecifik URL-registry;
4. tillåta dedicated Deep Research att extrahera högst 12 000 texttecken per hämtad officiell PDF, medan portfolio default förblir 4 500 och max sex sidor, två dokument i dedicated path, 24 MB per dokument, samma timeout och samma attachment-host allowlist;
5. behålla Unicode `Cf`-normalisering före specialistregex och oförändrat krav på explicit EUR/€ + bn/billion/mdr/miljarder för AUM/FAUM;
6. korrigera monsterfixturen från `AVANZ.ST` till `AZA.ST` utan att öppna financial-other metodik;
7. lägga regressionstester för periodintent, separat 12k-vs-4.5k textgräns och Avanza-identiteten.

## Oförändrade guardrails

- Inga Analyst- eller Research-quality thresholds sänks.
- Ingen persistence eller publicering öppnas.
- Ingen global `canRunAnalysis` öppnas.
- Ingen ny metodikfamilj läggs till.
- Nasdaq `NordicMainMarkets`, issuer-side filtering och `attachment.news.eu.nasdaq.com`-allowlisten ändras inte.
- Dedicated Nordic Deep Research får fortfarande högst fem riktiga CNS-requests totalt.
- Portfolio research behåller sina konservativa standardgränser.
- 6-K/20-F/foreign-private-issuer-regler ändras inte.
- XOM continuity förblir explicit ticker/CIK/filing-bunden.

## Nästa beslutspunkt

Kör en enda samlad Preview på Patch Decision 3. Om SEB, Investor och EQT når sina Research-ready-grindar får patchfasen gå vidare till det frysta gap-registrets Ericsson/Equinor-audit och därefter Maersk technical coverage. Om någon fortfarande blockerar ska exakt ny P1 dokumenteras innan ytterligare kodändring. Full 27-måls regression körs först efter denna beslutspunkt.
