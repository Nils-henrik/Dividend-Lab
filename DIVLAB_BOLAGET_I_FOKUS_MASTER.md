# DIVLAB_BOLAGET_I_FOKUS_MASTER.md

**Version:** 1.0  
**Status:** Aktiv / kanonisk seriespecifikation  
**Serie:** Bolaget i fokus  
**Publicering:** måndag–fredag cirka 11.00 Europe/Stockholm  
**Relation:** Underordnad `DIVLAB_REDAKTION_MASTER.md` och `DIVLAB_REDAKTION_P0_FACT_GATE.md`; teknisk handoff styrs av `docs/automation/AUTOREDATION_V1_1.md`.

---

## 1. Syfte

`Bolaget i fokus` ska varje vardag lyfta **en enda verifierad bolagshändelse som är tillräckligt intressant för en egen DivLab-artikel**.

Serien är inte ett marknadssvep. Den ska ge läsaren en tydlig, begriplig och faktakontrollerad fördjupning i dagens mest nyhetsvärda bolagshändelse runt lunchtid.

Om inget bolag uppfyller kvalitets- och verifieringskraven ska serien **inte fyllas ut**. Körningen ska då avslutas fail-closed med:

`BLOCKED: inget tillräckligt nyhetsvärdigt och verifierat bolag`

## 2. Urval

Prioritetsordning:

1. svenska noterade bolag,
2. nordiska noterade bolag,
3. internationella noterade bolag endast när händelsen har ovanligt hög relevans för DivLabs svenska läsare.

Nyhetsvärde går före bolagsstorlek. Ett mindre bolag får väljas om händelsen är tydligt mer materiell och verifierad.

Giltiga huvudvinklar omfattar bland annat:

- kraftig och verifierad kursuppgång eller kursnedgång efter marknadsöppning,
- rapport, trading update eller annan verifierad finansiell överraskning,
- vinstvarning,
- offentligt bud, uppköp, fusion, avyttring eller större strategiskt förvärv,
- stor order eller materiellt avtal,
- förändrad utdelning, återköp, inlösen, kapitalanskaffning eller annan materiell kapitalstrukturhändelse,
- regulatoriskt eller myndighetsrelaterat besked med tydlig bolagspåverkan,
- ledningsförändring med materiell betydelse,
- annan konkret bolagshändelse som rimligen är viktig för läsaren samma dag.

En normal mindre kursrörelse utan ny information är inte en tillräcklig vinkel.

## 3. Faktakrav — absolut regel

`DIVLAB_REDAKTION_P0_FACT_GATE.md` gäller fullt ut.

Primärkällor används först när de finns:

- bolagets IR-sida,
- rapporter,
- regulatoriska pressmeddelanden,
- relevant börs/marknadsplats,
- myndigheter och regulatorer.

Starka sekundärkällor används för kontext och korsverifiering, inte som ersättning för tillgänglig primärkälla för materiella fakta.

Före handoff ska redaktionen verifiera bland annat:

- vad som faktiskt har hänt,
- exakt publiceringstid eller händelsetid när den är relevant,
- belopp, procenttal, valuta och rapportperiod,
- budnivå, ordervärde, guidning och andra materiella villkor,
- namn, ticker och marknadsplats,
- faktisk kursrörelse om artikeln påstår att aktien stiger, faller, rusar eller rasar.

Kursreaktion får aldrig uppfinnas eller härledas från ett pressmeddelande. Om aktuell handel inte kan verifieras ska kursreaktionen utelämnas.

Rykten, obekräftade uppgifter, spekulation som fakta och påhittade orsakssamband är förbjudna.

## 4. Research-cutoff och tidsintegritet

Varje artikelmodul ska innehålla en tydlig kommentar:

`Editorial research cutoff:`

Allt som beskrivs som inträffat ska vara verifierat före cutoff. Händelser efter cutoff får endast beskrivas framåtblickande med verifierat datum/tid.

Eftersom serien normalt körs runt 11.00 är svensk och nordisk kontanthandel öppen. Ord som `rusar`, `faller`, `stiger`, `sjunker` eller liknande kräver därför färsk, verifierad marknadsdata nära research-cutoff.

## 5. Förhållande till dagens andra DivLab-artiklar

Före urval ska dagens publicerade eller terminala `Norden i centrum` och `BörsSverige` granskas.

`Bolaget i fokus` får behandla ett bolag som redan nämnts tidigare samma dag endast när den nya artikeln har en **tydligt djupare, ny eller mer materiell bolagsvinkel**. Serien får inte återpublicera samma berättelse i längre form utan nytt läsvärde.

## 6. Artikelstandard

Normal lästid: cirka 3–5 minuter. En materiellt komplex händelse får vara längre om det förbättrar begripligheten.

Artikeln ska normalt svara på:

1. Vad har hänt?
2. Vilka är de viktigaste verifierade siffrorna eller villkoren?
3. Hur reagerar aktien/marknaden, om reaktionen faktiskt är verifierad?
4. Varför spelar beskedet roll för bolaget?
5. Vilken relevant bakgrund behöver läsaren?
6. Vad händer härnäst?

Språket ska vara lätt svenska i DivLab-ton: sakligt, konkret, modernt och utan AI-standardfraser eller onödig finansjargong.

Rubriken ska vara konkret och klickvänlig men får aldrig gå längre än fakta.

## 7. SEO och artikelmetadata

Varje publicering ska ha:

- unik `seoTitle`,
- unik `seoDescription`,
- relevanta `seoKeywords`,
- korrekt slug och canonical,
- `source: "DivLab Redaktion"`,
- `category: "company"`,
- `showDisclaimer: true`,
- relevant `internalLinking`, inklusive huvudbolag och/eller ticker,
- `readingMinutes`,
- `Editorial research cutoff` i artikelmodulens redaktionella kommentar.

Google-sökfraser ska vävas in naturligt. Exempel är bolagsnamn + `aktie`, bolagsnamn + `rapport`, bolagsnamn + den konkreta händelsen och relevanta datum när det hjälper sökintentionen.

## 8. Masterbild — låst

Kanonisk masterbild:

`public/news-demo/bolaget-i-fokus-2026-09-15.png`

Den är uttryckligen godkänd som serieidentitet och ska återanvändas för varje `Bolaget i fokus`-artikel.

Masterbilden innehåller den godkända Stockholm/lunch-miljön, korrekt DivLab-logotyp och färjan Emelie i bakgrunden. Den är **inte knuten till dagens bolag** och ska därför inte ändras per artikel.

Daglig automation får inte:

- generera en ny bild,
- söka efter en ny bild,
- byta bolagslogotyp,
- lägga in dagens rubrik,
- lägga in dagens bolag,
- lägga in datum,
- ändra miljö, färger, motiv eller komposition.

Autoredaktion skapar endast en deterministisk 1280×720 PNG-kopia i dagens canonical output-path:

`/news/generated/bolaget-i-fokus-YYYY-MM-DD.png`

Template-version:

`bolaget-i-fokus-v1-2026-09-15-static-master`

## 9. Managed Autoredaktion-handoff

Serien är en full managed serie i Autoredaktion v1.1.

Canonical branch per datum:

`autoredaktion/bolaget-i-fokus-YYYY-MM-DD`

Canonical artikelmodul per Europe/Stockholm-datum:

`data/news-articles/bolaget-i-fokus-D-MÅNAD-YYYY.ts`

Exempel för 16 september 2026:

`data/news-articles/bolaget-i-fokus-16-september-2026.ts`

Bolagsnamn får finnas i artikelns id, slug, titel och innehåll men får **inte** läggas in som ett extra led i filnamnet. Samma gemensamma path-contract används av preflight, validator, PR-policy och Release State Machine.

Initial ChatGPT-commit får endast innehålla:

- dagens artikelmodul,
- additiv registrering i `lib/news/get-articles.ts`.

Artikelkommentaren ska samtidigt uppfylla det maskinläsbara cutoff-, `P0_FACT_GATE=PASS`- och `P0_SOURCE[...]`-kontraktet i `DIVLAB_REDAKTION_P0_FACT_GATE.md`.

GitHub Actions äger därefter deterministisk bildförberedelse, preflight, PR/Quality Gate, bounded repair, merge och produktionsverifiering enligt `AUTOREDATION_V1_1.md`.

Samma anti-loop-regler gäller som för övriga managed serier: en branch, en PR, högst en preparation-commit, högst en deterministic CI-repair, högst två Quality Gate-försök och högst en merge/produktionsdeployment.

## 10. Sekvensering

På vardagar gäller ordningen:

1. Norden i centrum — 08.00,
2. BörsSverige — 08.20,
3. Bolaget i fokus — 11.00,
4. USA i fokus — 14.00.

`Bolaget i fokus` får inte skapa sin branch förrän tidigare samma dags managed Norden/BörsSverige är i terminalt läge och senaste `main` har lästs om.

Om föregående serie fortfarande rör sig genom preflight/PR/Quality Gate får jobbet endast vänta inom sin begränsade körningstid. Kan terminalt läge och färsk `main` inte fastställas säkert ska serien rapportera `BLOCKED` och inte skapa en stale branch.

## 11. LIVE och X

En artikel är inte LIVE för att den är mergad. `autoredaktion/production=success` måste vara verifierad för exakt managed merge-SHA och artikeln måste vara kontrollerad på `divlab.se`.

När och endast när artikeln är LIVE ska användaren få:

- artikelns titel,
- fullständig URL,
- färdig X-text i DivLabs fasta stil,
- klickbar `Publicera på X`-handoff/Web Intent.

X-texten ska ha en stark faktabaserad första rad, 2–4 konkreta krokar, relevanta hashtags naturligt invävda och avslutas med:

`Läs dagens Bolaget i fokus på #DivLab 👇`

X publiceras aldrig automatiskt.

---

## Definition of Done

`Bolaget i fokus` är klar först när:

- [ ] en verkligt nyhetsvärdig huvudbolagshändelse har valts,
- [ ] P0 Fact Gate är PASS,
- [ ] ingen ryktes-/gissningsuppgift finns i sluttexten,
- [ ] aktuell kursreaktion är verifierad eller utelämnad,
- [ ] dagens tidigare DivLab-artiklar har kontrollerats för duplicering,
- [ ] SEO och metadata är kompletta,
- [ ] den låsta masterbilden används genom canonical generated path,
- [ ] managed Quality Gate är grön,
- [ ] exakt merge-SHA har lyckad Vercel-status,
- [ ] `autoredaktion/production=success`,
- [ ] artikel, bild och `/news` är verifierade live på desktop och mobil,
- [ ] färdig X-handoff är levererad.
