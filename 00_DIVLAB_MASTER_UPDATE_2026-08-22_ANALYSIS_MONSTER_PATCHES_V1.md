# DIVLAB MASTER UPDATE — Analysis Monster Patches v1

Datum: 2026-08-22
Status: ACTIVE_PATCH_RETRY
Branch: `agent/analysis-monster-patches-v1`
Parent observation: `agent/analysis-monster-coverage-pass-v1` / PR #277
Frozen benchmark: commit `1db2a373d0db650c4fbee5d9d64a820fb0a1a1e5`
Frozen gap register: `00_DIVLAB_MASTER_UPDATE_2026-08-22_ANALYSIS_MONSTER_GAP_REGISTER_V1.md`

## Syfte

Patchfasen får endast reparera konkreta luckor som observerades i det frysta 27-måls-monsterpasset. Ingen ny metodikfamilj introduceras här och inga quality gates sänks för att få fler gröna resultat.

## Låst patchordning

1. SEB bank readiness: korrekt nordisk rapportdiscovery och spårbar P/B-input utan att mutera accounting facts.
2. Investor och EQT specialist readiness: korrekt rapportdiscovery samt explicit source-bound NAV/AUM/FAUM-extraktion.
3. XOM SEC annual discovery: strikt source-bound successor/predecessor-CIK-kontinuitet.
4. Avanza-fixturen: verifierad Yahoo-identitet är `AZA.ST`; monsterfixturen `AVANZ.ST` ska korrigeras innan nästa fulla 27-målskörning.
5. Därefter separat audit av Ericsson/Equinor och sedan Maersk technical coverage enligt det frysta gap-registret.

## Guardrails

- Ingen persistence eller publicering aktiveras av patchfasen.
- Ingen global `canRunAnalysis` öppnas.
- Ingen försäkrings-, fastighets-, financial-other- eller ETF-metodik läggs till.
- 6-K får inte promoveras till verifierad interimfiling.
- SEC successor continuity får inte härledas generellt ur accession-prefix. SEC accession-prefix kan tillhöra en filing agent och är därför inte en säker issuer-CIK-regel.
- XOM-kontinuiteten får endast använda en explicit curated registry-post där ticker, aktuell successor-CIK, predecessor-CIK, effective date och en specifik SEC successor-filing är låsta tillsammans. Ticker- eller CIK-drift ska faila stängt.
- För en sådan verifierad continuity-post får högst en extra predecessor submissions-request göras och endast när aktuell SEC-feed saknar annual eller interim coverage.
- Final SEC primary set förblir bounded till senaste annual + senaste interim; predecessor issuer-webbplatser importeras aldrig.
- Nasdaq Nordic behåller `NordicMainMarkets`, issuer-side filtering och den befintliga officiella attachment-host allowlisten.
- Dedicated Nordic Deep Research behåller totalt högst fem riktiga CNS-requests: tre current + två annual. Separata ticker-/issuer-name-seeds får användas inom samma budget för att undvika att återköps-/AGM-brus blockerar rapportdiscovery.
- Provider `bookValue` får endast användas som ett separat explicit per-share-faktum i listningsvalutan när statement equity/share-basen inte ger en användbar P/B. Det får inte användas för att syntetiskt skriva om equity.
- AUM/FAUM shorthand accepteras endast med explicit EUR/€ och explicit billion/bn/mdr/miljarder-scale.
- Befintliga quality thresholds, source provenance-regler och analyst gates ändras inte.

## Vercel-disciplin

Vercel är runtime/release-verifiering, inte vanlig edit-test-loop. Patchar ska samlas i ett Git-träd/commit innan branch-refen flyttas. Små diagnostik-, regex- eller loggändringar ska inte pushas var för sig.

Första Preview-verifieringen ska köra ordinarie lint/typecheck/core/SEO/DivBrain/Cursor/build samt den befintliga fokuserade patchdiagnostiken för SEB, Investor, EQT, XOM och Avanza. Den fulla 27-måls-monsterkörningen återaktiveras först när patchklustret är grönt eller när återstående blockers är exakt dokumenterade.

## Preview-verifiering 1 — stoppad av stale testkontrakt

Commit `b805eec99e7a87d1947cf8624ee0df861d47972e` gav Preview deployment `dpl_GJvBYSB4VfuKgbuTNrCpEtLQcKRZ`.

- Lint och TypeScript passerade fram till core-testfasen.
- Core: 556 av 557 tester passerade.
- Enda felet var `tests/divlab-qualitative-primary-research-contract.test.ts`, som fortfarande krävde den gamla implementationens exakta rad `symbol: annualDiscoverySymbol(input.symbol)`.
- Den nya implementationen reserverar samma 3 current + 2 annual budget via `annualDiscoverySeeds(...)` och en request per seed. Testets gamla implementation-detalj är därför stale; själva budget-/säkerhetskontraktet ska uppdateras, inte quality gate eller produktlogik.
- Eftersom buildkedjan stoppade i core-test kördes varken SEO/DivBrain/Cursor/build eller fokuserad live-diagnostik i denna deployment. Inga slutsatser om SEB/Investor/EQT/XOM readiness får därför markeras som verifierade ännu.
- Nästa push får endast innehålla den samlade kontraktstestkorrigeringen (och andra fel från samma körning om sådana fanns). Denna körning visade inga andra testfel.

## Success criteria för första patchklustret

- SEB discovery läser en faktisk finansiell primärrapport i stället för AGM/återköpsbrus.
- SEB P/B är traceable om Yahoo levererar explicit provider book value eller statement equity/share-basen är komplett.
- Explicit `Net ECL level` får användas som source-bound credit-loss-ratio-terminologi utan att härleda ett värde ur rubrik eller prose.
- Investor får primärrapportevidens och specialistmotorn kan bedöma NAV/discount med befintliga gates.
- EQT:s verifierade `FAUM` och `total AUM` shorthand kan extraheras utan bare-number guessing.
- XOM får komplettera den saknade årsfilingen via exakt en predecessor submissions-request endast genom den verifierade XOM successor-registry-posten; MSFT och övriga tickers får ingen generell CIK-heuristik.
- NVO/foreign-private-issuer-gränsen förblir fail-closed.
- Ingen persistence/publication sker.

## Nästa beslutspunkt

Kör en samlad Preview-retry efter stale testkontraktet. Om hela byggkedjan och fokuserad diagnostik passerar klassas varje mål som READY, kvarvarande P1 eller INFO. Först därefter görs nästa samlade patch eller den fulla 27-måls regressionen. Observationer får inte skrivas om i efterhand för att få ett bättre resultat.
