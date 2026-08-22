# DIVLAB MASTER UPDATE — Analysis Canary Patch Decision 6

Datum: 2026-08-22
Status: ACTIVE_PATCH_DECISION_6
Branch: `agent/analysis-monster-patches-v1`
Parent patch commit: `545d472c4568e34540f0d5d58c526cff8ed0cb29`
Verified Decision 5 Preview: `dpl_26Y5K4UrzCsZCrnmp5SMDXX9Jumw`

## Verifierad Decision 5-status

Decision 5 är READY i Vercel. Ordinarie kvalitetkedja passerade: lint 0 errors med endast de tre sedan tidigare kända warnings, TypeScript grön, core-regression grön, SEO grön, DivBrain 518/518, Cursor 30/30 och Next.js compile/type/static-generation grön.

Ingen P0 observerades. Inga Research-/Analyst-grindar sänktes och ingen persistence/publication öppnades.

### EQT — asset-manager canary READY

Den verifierade Nasdaq H1 2026-releasen ger nu source-bound `Total AUM = EUR 291bn` och `FAUM = EUR 155bn`. Specialistmotorn är `research_ready` utan blockers eller warnings. Fee-AUM share härleds deterministiskt från de två explicit källbundna värdena. Denna canary är färdig för nuvarande byggfas.

### SEB — bank canary exakt blockerad på Fact Book/current-column

SEB:s Q2 2026 release-evidens ger nu explicit och source-bound:

- Return on equity 15,7 %;
- CET1 ratio 17,2 %;
- reported capital buffer 250 bp = 2,5 procentenheter;
- traceable P/B cirka 1,895x.

Bankens status är `partial`, inte därför att någon quality gate är fel, utan därför att följande fortfarande saknas i den generiska release-/rapporttexten:

- credit-loss ratio / Net ECL level;
- margin/efficiency context (NIM eller C/I);
- funding/liquidity context, inklusive LCR/NSFR.

Den officiella Q2-träffen exponerar separat Fact Book-material. Enligt Canary Certification v1 är detta nu en tillåten, exakt och källbunden bank-P1. Ingen bankregel får sänkas eller kringgås för att göra canaryn grön.

### Investor — enda kvarvarande specialist-discovery P1

Den officiella Nasdaq-källan är verifierad externt med rubriken `Interim report January-June 2026`, publicerad av Investor AB den 16 juli 2026. Den innehåller explicit adjusted NAV SEK 397 per aktie och leverage 1,9 %.

Decision 5:s breda period-only CNS-sökning gav fortfarande ingen Investor-evidens. Issuer-name matching är däremot verifierad korrekt: `Investor AB` normaliseras konservativt till den entydiga identiteten `Investor`.

Nästa patch ska därför inte bredda row-window, källor eller requestbudget ytterligare. Den ska i stället göra den tredje current-termen issuer-bunden, exempelvis `Investor interim report January-June 2026`. Det är mer precist än en generisk periodfråga och använder ordinary 20-row bound i samma redan budgeterade request.

## Låst Patch Decision 6

Den samlade patchen får endast:

1. behålla exakt tre current CNS-requests och två annual CNS-requests;
2. ändra den tredje current-termen från en fristående periodfras till `${issuer} ${periodPhrase}`;
3. därmed använda ordinary dedicated row bound 20 för den genererade termen; ingen extra request skapas;
4. behålla `companyNamesLikelyMatch` som obligatorisk issuer-side identity gate;
5. behålla `NordicMainMarkets`, max 12 issuer hits och befintlig attachment/release allowlist;
6. inte ändra Investor-metodiken, NAV-regler, discount-regler eller net-debt/leverage-regler;
7. inte ändra EQT eller SEB production logic i denna patch;
8. inte sänka någon quality gate och inte öppna persistence, publication eller global eligibility.

Den existerande hard row cap 100 får ligga kvar som defensiv explicit ceiling för en manuellt period-only dedicated term, men den genererade Decision 6-termen är issuer-bunden och använder därför 20 rader. Shared model-portfolio default är fortsatt 5.

## Nästa beslutspunkt

Kör en enda Preview efter den issuer-bundna termändringen. Om Investor då når source-bound NAV och specialist Research-ready är specialistcanaries färdiga. Om den fortfarande inte gör det ska Investor-blockern frysas exakt och ingen ytterligare bred discovery-expansion göras i denna byggfas.

När denna beslutspunkt är klar gäller Canary Certification v1 som release-gate. Ingen full 27-bolagskörning ska göras.
