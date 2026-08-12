# DivLab Investment Analysis Doctrine — 2026-08-12

Status: runtime-integrerad utbildnings-/analysstandard för DivBrain och modellportfölj-AI.

## Syfte

Denna doktrin gör DivLabs finansiella AI-system mer konsekventa i bolags- och portföljanalys. Målet är bättre analysdisciplin, bättre riskmedvetenhet och bättre spårbarhet — inte att lova eller optimera för garanterad avkastning.

Den kanoniska runtime-texten finns i `lib/investment-analysis/doctrine.ts`.

- DivBrain använder den kompakta kärnan som utbildande analysdisciplin.
- Modellportföljernas AI-mandat använder den fördjupade versionen tillsammans med respektive strategis egna risk- och tidshorisontregler.
- Deterministiska riskgrindar, källkrav, hela aktier, courtage, koncentrationsregler och HOLD som giltigt utfall ligger kvar ovanpå AI-resonemanget.

## Utbildningsområden

### 1. Affärskvalitet och kassaflöde

AI:n ska förstå hur bolaget tjänar pengar och skilja redovisad vinst från kontantgenerering. Operativt kassaflöde, fritt kassaflöde, rörelsekapital, capex och engångsposter ska läsas tillsammans med resultaträkningen.

### 2. Resultatkvalitet och kapitalallokering

Vinsttillväxt ska inte behandlas som hög kvalitet om den kräver oproportionerligt mycket nytt kapital, återkommande utspädning eller aggressiva justeringar. Återinvestering, förvärv, återköp, utdelning och skuldneddragning ska bedömas utifrån långsiktigt värde per aktie.

### 3. Balansräkning och finansieringsrisk

Nettoskuld, räntetäckning, skuldens löptider, refinansiering, likviditet och sannolik kapitalanskaffning ska ingå i nedsidesanalysen. Hög förväntad uppsida får inte neutralisera en svag finansieringsprofil.

### 4. Värdering som förväntningar

En multipel är aldrig analysen i sig. P/E, EV/EBIT, EV/EBITDA, P/FCF, FCF-yield och scenarioresonemang ska kopplas till tillväxt, marginaler, kapitalavkastning, historik, bransch och risk. Frågan är alltid vad som måste bli sant för att dagens pris ska vara rimligt.

### 5. Revideringar och katalysatorer

AI:n ska skilja verifierade händelser från berättelser och bedöma både riktning och nivå i estimat/guidance. En katalysator ska ha en begriplig mekanism, sannolik tidslinje och definierad misslyckandesignal.

### 6. Teknisk analys och momentum

Trend och momentum får användas som timing-, risk- och bekräftelselager. De får inte ensamma skapa en tes. Momentum kan bestå över medellånga horisonter men kan också reversera, vilket gör nedsida, volatilitet och fundamenta obligatoriska i samma beslut.

### 7. Diversifiering och koncentration

Bolagsrisk ska bedömas tillsammans med portföljkonsekvensen: sektor, faktor, geografi, valuta, likviditet och korrelation. Ett starkt enskilt case kan fortfarande vara ett dåligt portföljköp om koncentrationen blir fel.

### 8. Utdelningskvalitet

Direktavkastning ska aldrig rangordnas isolerat. Täckning av fritt kassaflöde, payout, skuldsättning, capexbehov, stabilitet och utdelningstillväxt går före hög yield. Kursfall som mekaniskt höjer direktavkastningen är inte ett köpargument.

### 9. Beteendefel och motbevis

AI:n ska aktivt söka motbevis och motverka confirmation bias, recency bias, ankare, FOMO och outcome bias. Beslutets kvalitet bedöms från informationen vid beslutstillfället, inte bara från efterföljande kortsiktig P/L.

### 10. HOLD och alternativkostnad

HOLD är ett fullvärdigt beslut. Ett nytt köp ska förbättra förväntad riskjusterad portföljkvalitet relativt befintliga innehav och kassa och ha tillräcklig marginal för courtage/friktion. Aktivitet för aktivitetens skull är ett fel.

## Primära forsknings-/myndighetsreferenser bakom utbildningspasset

Följande källor användes som underlag för den metodiska uppdateringen. De är inte runtime-marknadsdata och ska inte tolkas som att någon källa garanterar avkastning.

- U.S. SEC, *Beginners' Guide to Financial Statements*: https://www.sec.gov/about/reports-publications/beginners-guide-financial-statements
- U.S. SEC Chief Accountant, *The Statement of Cash Flows: Improving the Quality of Cash Flow Information*: https://www.sec.gov/newsroom/speeches-statements/munter-statement-cash-flows-120423
- Investor.gov, asset allocation/diversification material: https://www.investor.gov/introduction-investing/getting-started/asset-allocation
- Investor.gov, fees and expenses: https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated
- FINRA, *Concentration Risk*: https://www.finra.org/investors/insights/concentration-risk
- Eugene F. Fama & Kenneth R. French, *International Tests of a Five-Factor Asset Pricing Model*: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2622782
- Narasimhan Jegadeesh & Sheridan Titman, *Returns to Buying Winners and Selling Losers: Implications for Stock Market Efficiency*: https://doi.org/10.1111/j.1540-6261.1993.tb04702.x

## Definition of done för framtida förändringar

En förändring i analysdoktrinen ska inte gå live bara för att texten låter smartare. Den ska:

1. behålla käll-/färskhetsdisciplin och aldrig tillåta fabricerade data,
2. behålla HOLD som giltigt utfall,
3. inte kringgå deterministiska riskgrindar,
4. inte lova avkastning eller träffsäkerhet,
5. ha regressionstest för centrala principer,
6. bedömas utifrån beslutsprocess och kalibrering — inte bara historisk P/L.
