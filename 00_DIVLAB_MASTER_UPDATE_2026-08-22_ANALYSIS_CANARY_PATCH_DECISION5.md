# DIVLAB MASTER UPDATE — Analysis Canary Patch Decision 5

Datum: 2026-08-22
Status: ACTIVE_PATCH_DECISION_5
Branch: `agent/analysis-monster-patches-v1`
Parent patch commit: `b9fb5e73c5ac9bc0b4c52f2988090f1e247ed322`
Verified Preview: `dpl_ERf3f5a8bHTVnHKGjRP57bppuakW`

## Verifierad Decision 4-status

Decision 4 är READY i Vercel. Ordinarie kvalitetkedja passerade med 0 lint-errors, endast de tre sedan tidigare kända lint-varningarna, core 562/562, SEO 49/49, DivBrain 518/518, Cursor 30/30 samt grön Next.js compile/type/static-generation.

Ingen P0 observerades. Ingen persistence/publication öppnades och inga Research-/Analyst-grindar sänktes.

### XOM — fortsatt READY och fryst

Verifierad interim 10-Q + annual 10-K består. Curated predecessor/successor-CIK continuity är intakt och ändras inte i Decision 5.

### SEB — discovery och kärnkapital bättre, kvarvarande bankblocker isolerad

Den officiella Q2 2026-releasen läses nu som separat primärevidens. CET1 17,2 % bekräftas och rapporterad kapitalbuffert 250 bp bekräftas som 2,5 procentenheter. P/B är fortsatt traceable, cirka 1,895x.

ROE blev däremot `ambiguous` eftersom HTML-flattening placerar flera olika ratio-värden på samma fysiska rad. Det är ett parserproblem, inte ett skäl att sänka bankgrinden. Decision 5 får därför begränsa ett narrativt metricsök till den omedelbara satsdelen efter respektive etikett. Unit-first multi-period-tabeller ska fortsatt vara ambiguous.

Credit-loss ratio/ECL, LCR, NSFR och ytterligare funding/margin-context är efter Decision 4 fortfarande inte source-bound i den lästa generiska rapport-/release-evidensen. Nasdaq-träffen exponerar en separat Q2 Fact Book. Decision 5 får inte härleda eller hitta på dessa mått. Om de fortfarande blockerar efter satsfixen är de en explicit Fact Book/current-column P1 och uppfyller canary-masterns tillåtna exakta blockerstatus.

### Investor — exakt discovery-blocker

Den verifierade Nasdaq-källan finns med rubriken `Interim report January-June 2026` och innehåller source-bound NAV per aktie. Den period-only CNS-frågan använder dock bara de första 20 generiska träffraderna innan issuer-filtering, och Investor når därför inte research packet.

Decision 5 får öka **radfönstret i samma redan budgeterade period-only request** till högst 100. Antalet requests ändras inte. Model-portfolio default förblir 5 rader per term, max issuer hits förblir 12 och `companyNamesLikelyMatch` är fortsatt obligatorisk.

### EQT — exakt evidence-selection-blocker

Den verifierade H1 2026 Nasdaq-releasen hämtas korrekt och hålls inom 16 000 tecken, men den naiva första-16k-trunkeringen missar den senare source-bound rapporttexten med `FAUM ... €155bn` och `Total AUM ... €291bn`.

Decision 5 får **inte** öka 16k-gränsen och får inte lägga till en request. I stället får den deterministiskt behålla bounded context runt de sista explicita specialistankarna `Total AUM`, `FAUM`, `fee-generating AUM`, `net asset value/NAV/substansvärde` och `leverage`, samt använda resterande budget för den vanliga inledningen. Script/style/template/svg förblir borttagna innan urvalet.

## Låst Patch Decision 5

Den samlade patchen får endast:

1. behålla exakt 3 current + 2 annual CNS-requests;
2. behålla shared model-portfolio default `DEFAULT_QUERY_COUNT = 5`;
3. tillåta hard row cap 100 men använda den endast för dedicated Deep Research period-only term; ordinary dedicated terms stannar på 20 rader;
4. behålla Main Market-scope, issuer-side matching, max 12 issuer hits och befintlig attachment trust;
5. behålla Nasdaq release-body request till högst en per bolagspass, body max 750 kB, timeout 8 sekunder, host/path allowlist och visible-evidence hard cap 16 000 tecken;
6. välja relevant specialistcontext inom samma 16k i stället för att öka evidensmängden;
7. för banknarrativ låta ett metricvärde äga endast sin omedelbara satsdel, men lämna explicit unit-first multi-period-tabell ambiguous;
8. inte ändra ECL/LCR/NSFR-, capital-, funding-, valuation- eller specialist quality gates;
9. inte lägga till någon ny metodikfamilj, persistence, publication eller global eligibility;
10. verifiera endast Investor, EQT och SEB i nästa live Research-diagnostik. Volvo/MSFT återkörs inte eftersom deras certifierade kodvägar inte ändras.

## Regressioner

Patchen ska minst bevisa att:

- lång Nasdaq HTML med aktuell AUM/FAUM efter första 16k fortfarande ger den aktuella source-bound texten utan att output överstiger 16k;
- script-innehåll aldrig når evidensen;
- period-only dedicated query använder högst 100 rader medan ordinary dedicated query använder 20 och shared default är 5;
- SEB-lik narrativ text bekräftar ROE 15,7 % och CET1 17,2 % utan att blanda de två satserna;
- multi-period unit-first banktabell är fortsatt ambiguous.

## Nästa beslutspunkt

Efter en enda samlad Preview:

- om Investor når NAV/discount Research-ready och EQT når Total AUM/FAUM Research-ready är de två specialistcanaries färdiga;
- SEB räknas om. Om endast explicit Fact Book/current-column risk/funding-context återstår dokumenteras den som den sista bank-P1:n i stället för att sänka metodiken;
- ingen full 27-bolagskörning görs. Canary Certification v1 är release-gate.
