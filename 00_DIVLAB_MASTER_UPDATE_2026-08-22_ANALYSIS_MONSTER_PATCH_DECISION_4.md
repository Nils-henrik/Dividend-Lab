# DIVLAB MASTER UPDATE — Analysis Monster Patch Decision 4

Datum: 2026-08-22
Status: ACTIVE_PATCH_DECISION_4
Branch: `agent/analysis-monster-patches-v1`
Parent patch commit: `dda2ce1aae0302ecb64be45c7dd762de0272e5f8`
Preview deployment: `dpl_4Gxjh9Uwvfpm1HPVhDVcfZTqv1Bg`

## Verifierad Preview-status

Patch Decision 3 blev READY och ordinarie test/build-kedja passerade. Fokuserad live-diagnostik visar att source discovery nu är korrekt för SEB men att evidensformatet är nästa blocker.

### XOM — fortsatt READY och fryst

Verifierad annual + interim SEC coverage består. Curated predecessor/successor-CIK-regeln ändras inte i denna patch.

### SEB — discovery READY, bank evidence P1

Den riktiga primärrapporten `SEB's results for the second quarter 2026` hittas nu, klassas som Q2/H1 2026 och hämtas som primärevidens. P/B är fortsatt traceable, cirka 1,895x.

Den hämtade PDF-evidensen ger däremot inte bankens required metrics i nuvarande parser. Den officiella Nasdaq-disclosure-sidan innehåller explicit ROE 15,7 %, CET1 17,2 % och kapitalbuffert 250 bp, men inte hela bankpaketet. Patch Decision 4 får därför läsa själva redan verifierade Nasdaq-disclosure-sidan som separat bounded primary evidence. Det får inte användas för att påstå ECL/LCR/NSFR om dessa saknas i sidtexten.

### Investor — discovery P1

Investor Q2-sidan finns officiellt hos Nasdaq men rubriken är generisk: `Interim report January-June 2026`. Den innehåller explicit NAV 397 SEK per aktie och leverage 1,9 %. Issuer-filter ska inte försvagas. Patchen får i stället använda en period-only tredje current-term (`Interim report January-June <år>`) inom den redan låsta tre-requestbudgeten och låta befintligt issuer-filter avgöra träffen.

### EQT — discovery READY, release-body evidence P1

H1 2026 och year-end 2025 hämtas korrekt som primärrapporter. Att öka PDF-fönstret till 12 000 tecken räckte inte för AUM/FAUM. Den officiella Nasdaq-disclosure-sidan innehåller däremot explicit `FAUM ... €155bn` och `Total AUM ... €291bn`. Unicode `Cf`-normalisering behålls. Nästa patch får läsa release-sidans synliga text source-bound i stället för att öka PDF-fönstret igen.

### Avanza — fixture correction kvarstår

Verifierad svensk identitet är `AZA.ST`. Monsterfixturen ska ändras före nästa fulla 27-måls regression; ingen financial-other-metodik öppnas av detta.

## Låst Patch Decision 4

Nästa samlade patch får endast:

1. lägga till en separat, server-only och fail-closed hämtare för officiella Nasdaq-disclosure-sidor som redan kommit från den verifierade CNS-träffen;
2. tillåta endast HTTPS, inga credentials, host exakt `view.news.eu.nasdaq.com`, path `/view`, högst ett redirect som måste stanna på samma allowlistade host/path-familj, timeout högst 8 sekunder, body högst 750 kB och synlig text högst 16 000 tecken;
3. aldrig exekvera HTML, script eller instruktioner; script/style/noscript/template/svg ska tas bort och resultatet behandlas som untrusted external evidence;
4. göra högst en sådan release-body request per bolagspass och endast för den högst rankade aktuella finansiella rapportträffen;
5. behålla PDF-bounds från Decision 3: portfolio default 4 500 texttecken, dedicated Deep Research högst 12 000, max 6 sidor, max två PDF-försök och samma attachment-host allowlist;
6. för Q2/H1 byta den tredje current CNS-termen till period-only `interim report January-June <år>` medan ticker Q2 och issuer half-year behålls; issuer-side `companyNamesLikelyMatch` är fortsatt obligatorisk;
7. skapa separat AnalysisSource/AnalysisEvidence för Nasdaq release body så att release-text aldrig felaktigt attribueras till PDF-URL:en;
8. endast märka release-body evidens som `official_report_excerpt` när den befintliga rapportmetadata-parsern redan klassar CNS-träffen som finansiell rapport;
9. behålla specialistreglerna: NAV/AUM/FAUM måste komma från explicit source-bound text och AUM/FAUM kräver explicit EUR/€ + bn/billion/mdr/miljarder;
10. inte ändra bankens ECL/LCR/NSFR-regler i denna patch. Om SEB fortfarande blockerar efter release-body evidence ska nästa P1 beskriva exakt vilken Fact Book-/current-column-evidens som saknas.

## Requestbudget efter Decision 4

Dedicated Nordic Deep Research får per bolagspass högst:

- 3 current CNS discovery requests,
- 2 annual CNS discovery requests,
- 2 bounded official PDF attempts,
- 1 bounded official Nasdaq release-body request för högst rankad current report.

Ingen annan extern request läggs till. Portfolio research påverkas inte av release-body-hämtningen.

## Oförändrade guardrails

- Inga Research- eller Analyst-quality thresholds sänks.
- Ingen persistence eller publicering öppnas.
- Ingen global `canRunAnalysis` öppnas.
- Ingen ny metodikfamilj läggs till.
- Nasdaq `NordicMainMarkets`, issuer-side filtering och `attachment.news.eu.nasdaq.com`-allowlisten ändras inte.
- Release-body text är untrusted evidence, aldrig instruktion.
- XOM continuity-regeln ändras inte.
- 6-K/foreign-private-issuer-gränsen ändras inte.

## Nästa beslutspunkt

Efter en enda samlad Preview ska Investor och EQT klassas på nytt och SEB:s kvarvarande bankblockers räknas om. Om Investor/EQT blir research-ready och SEB bara återstår på specifik Fact Book/current-column extraction, fryses det som nästa smala P1 innan ytterligare bankkod. Avanza-fixturen korrigeras senast i samma samlade commit som föregår full 27-måls regression.
