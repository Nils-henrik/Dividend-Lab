# DIVLAB MASTER UPDATE — Analysis Monster Patch Decision 2

Datum: 2026-08-22
Status: ACTIVE_PATCH_DECISION_2
Branch: `agent/analysis-monster-patches-v1`
Parent patch commit: `20478b4229e8bea371252b3ea141d17f35eb5d64`
Preview deployment: `dpl_EXmFSz4ADYKYTZ32uPDgNV76KUxj`

## Verifierad Preview-status

Preview-retryn blev READY och hela ordinarie byggkedjan passerade:

- lint: 0 fel, 3 sedan tidigare kända varningar
- TypeScript: passerad
- core: 557/557
- SEO: 49/49
- DivBrain: 518/518
- Cursor bridge: 30/30
- Next.js production build: passerad
- fokuserad patchdiagnostik: genomförd

## Resultat från fokuserad diagnostik

### XOM — READY för patchmålet

Global SEC-discovery gav verifierad senaste 10-Q och senaste 10-K. Annual + interim coverage är komplett och bounded. Successor/predecessor-regeln har inte generaliserats till andra bolag.

### SEB — DELVIS FIXAD, kvarvarande P1

- P/B är nu traceable och gav cirka 1,895x i Preview.
- Primärrapportdiscovery är fortfarande fel: de två dokumentförsöken träffade AGM-kallelser i stället för finansiell rapport.
- Bank research är därför fortfarande `insufficient` trots fixad valuation provenance.

### Investor — kvarvarande P1

Dedicated Nordic discovery gav ingen användbar primärrapportevidens. NAV/discount kan därför inte verifieras och specialist research förblir `insufficient`.

### EQT — kvarvarande P1 med verifierad rapport

- H1 2026 och Annual Report 2025 hämtades som verkliga primärrapporter.
- Specialistmotorn missade ändå total AUM och FAUM.
- Officiell H1 2026-källa innehåller explicit `FAUM ... €155bn` och `Total AUM ... €291bn`; texten innehåller osynliga Unicode-formattecken runt tal/valutasymboler. Nästa patch får normalisera sådana formattecken före strikt source-bound regexmatchning. Bare-number guessing är fortsatt förbjuden.

### Avanza — identitet verifierad

Global instrument search visar den svenska aktien som `AZA.ST` (`symbol=AZA`, `exchange=ST`). Den frysta monsterfixturen `AVANZ.ST` ska ändras innan nästa fulla 27-måls regression.

## Låst Patch Decision 2

Nästa samlade patch får endast:

1. ge dedicated Nordic Deep Research möjlighet att skicka explicita interna `freeText`-termer till den befintliga Nasdaq CNS-adaptern, fortfarande issuer-filtrerade, `NordicMainMarkets`, högst fem termer totalt och samma officiella attachment-host allowlist;
2. använda tre current-termer och två annual-termer med issuer/ticker report intent så att en intern aliasexpansion inte kan förbruka requesten före den avsedda termen;
3. normalisera Unicode `Cf`-formattecken i financial-specialist evidence text före befintlig strikt AUM/FAUM/NAV-regex;
4. korrigera Avanza-fixturen till `AZA.ST` innan nästa fulla monsterkörning;
5. lägga regressionstester för request-budget, issuer filtering och Unicode-formaterad EQT shorthand.

## Oförändrade guardrails

- Inga quality thresholds sänks.
- Ingen persistence eller publicering öppnas.
- Ingen global `canRunAnalysis` öppnas.
- Ingen ny specialistfamilj läggs till.
- Nasdaq Main Market-scope och attachment-host allowlist ändras inte.
- Max fem riktiga CNS-requests kvarstår för dedicated Nordic Deep Research.
- AUM/FAUM kräver fortfarande explicit EUR/€ och explicit `bn/billion/mdr/miljarder`.
- XOM continuity-regeln förblir explicit och ticker-/CIK-bunden.

## Nästa beslutspunkt

Efter en enda samlad Preview av Patch Decision 2 ska SEB, Investor och EQT klassas på nytt. Full 27-måls monsterregression får inte köras förrän dessa tre antingen är READY eller har nya exakt dokumenterade P1-blockers. Observationerna skrivs inte om i efterhand.
