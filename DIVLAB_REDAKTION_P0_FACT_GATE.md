# DivLab Redaktion — P0 Fact Gate

**Status:** Obligatorisk redaktionell P0-regel  
**Gäller:** All autonom och manuell redaktionell publicering, inklusive Norden i centrum, BörsSverige, Bolaget i fokus och USA i fokus.  
**Relation:** Detta dokument skärper faktakraven i `DIVLAB_REDAKTION_MASTER.md`. Vid oklarhet gäller den striktare fail-closed-regeln här.

## P0 — verifierade fakta före publicering

Ingen artikel får lämna redaktionsfasen, gå vidare till managed handoff eller beskrivas som publicerbar om Fact Gate inte är PASS.

Fact Gate är en separat kontroll efter research och före slutlig artikel/handoff.

### PASS kräver

- Varje konkret siffra, procent, kurs-/indexrörelse, belopp, datum, tid, rapportperiod, bolagshändelse, citat och makrouppgift i sluttexten ska kunna spåras till en faktiskt använd och tillräckligt trovärdig källa.
- Primärkällor används först när de finns: bolagens IR/rapporter/pressmeddelanden, börser, regulatorer, myndigheter, centralbanker och officiell statistik.
- Sekundärkällor får användas för upptäckt, marknadssammanhang och korsverifiering men får inte ersätta tillgänglig primärkälla för materiella fakta.
- Påstådd orsak till en kurs- eller marknadsrörelse får endast skrivas som fakta när orsakssambandet stöds av tillräcklig källa. Annars ska det uttryckligen vara analys/möjlig förklaring eller utelämnas.
- Händelser efter `Editorial research cutoff` får inte beskrivas som inträffade. De får endast beskrivas framåtblickande med verifierad tid/datum. Ett senare utfall kräver ny separat verifiering.
- Rykten, obekräftade uppgifter, spekulation som fakta, påhittade citat, siffror, utfall, kursreaktioner, orsaker eller slutsatser är förbjudna.
- Om två källor motsäger varandra ska primärkällan väga tyngst. Om en materiell uppgift fortfarande inte kan avgöras säkert ska den tas bort.

### FAIL / BLOCKED

Fact Gate ska vara FAIL och publiceringen `BLOCKED` när en materiell uppgift i den planerade sluttexten inte kan verifieras tillräckligt eller när en relevant källkonflikt inte kan lösas.

Systemet får aldrig fylla en lucka med antagande, sannolik formulering eller egen påhittad förklaring för att få artikeln publicerad.

Vid FAIL får ingen canonical artikel-commit/managed handoff skapas förrän sluttexten har korrigerats genom att den osäkra uppgiften verifierats eller tagits bort. Ingen release-, CI- eller deploymentmekanism får kringgå Fact Gate.

## Operativ ordning

`research → separat fact-check → P0 Fact Gate PASS → artikel/SEO → latest-main check → managed handoff → preflight → PR/Quality Gate → merge → production verify → LIVE`

P0 Fact Gate kontrollerar redaktionell evidens och sanningshalt. GitHubs tekniska Quality Gate kontrollerar kod-/artikelkontraktet. Ett tekniskt grönt CI-resultat får aldrig tolkas som ersättning för P0 Fact Gate.

## Rapportering

Den autonoma körningen ska internt kunna redovisa `P0_FACT_GATE=PASS` före managed handoff. Om gate inte kan passera ska slutstatus vara `BLOCKED` med den konkreta verifieringsorsaken, inte ett försök att publicera ändå.
