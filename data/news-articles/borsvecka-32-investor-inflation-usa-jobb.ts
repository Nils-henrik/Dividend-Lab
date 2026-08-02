import type { NewsArticle } from "@/types/news";

/**
 * Approved Börsnyheter article — do not rewrite body copy.
 *
 * Verified before publication (2026-08-02):
 * - Week 32: Mon 3 Aug – Fri 7 Aug 2026 (ISO week).
 * - OMXS30 close 31 Jul 2026: 3 246,92 (+0,42%) — Nasdaq OMX indexes.
 * - Investor Q2 2026: adj. NAV SEK 1 214,7bn / SEK 397 per share (30 Jun);
 *   NAV +9% incl. dividend; TSR 15% vs SIXRX 9%; leverage 1,9%;
 *   Patricia Industries TSR −3% — investorab.com / Cision.
 * - Investor B 31 Jul 2026: close SEK 411; day/52w high SEK 416,55
 *   (market data feeds; premium ≈3,5% vs reported NAV 397).
 * - Technical levels (MA/RSI) retained as approximate Friday-close values;
 *   platforms differ slightly — no false precision introduced.
 * - Atlas Copco Q2 2026: orders 50,95 / org. +26%; revenues 44,97 /
 *   org. +8%; adj. EBIT 9,46; adj. margin 21,0% (20,4) — atlascopcogroup.com.
 * - Volvo Q2 2026: sales 126,3 (+3%, org. +7%); adj. EBIT 14,8 (13,5);
 *   adj. margin 11,7% (11,0); industrial cash flow 5,8 (2,9) — volvogroup.com.
 * - Ericsson Q2 2026: sales 52,7 (56,1); org. −1%; adj. gross margin
 *   48,4% (48,0); adj. EBITA 6,9 (7,4); FCF before M&A 0,4 (2,6) — ericsson.com.
 * - SEB Q2 2026: operating profit 10,8bn (+4% YoY vs 10,4); ROE 15,7%;
 *   CET1 17,2% — sebgroup.com.
 * - Riksbank policy rate 1,75% (unchanged June); next decision 20 Aug 2026.
 * - SCB CPI flash July: Thu 6 Aug 08:00 — scb.se.
 * - ISM Manufacturing PMI: Mon 3 Aug 10:00 ET / 16:00 CEST.
 * - ISM Services PMI: Wed 5 Aug 10:00 ET / 16:00 CEST; June reading 54,0.
 * - BLS Employment Situation July: Fri 7 Aug 08:30 ET / 14:30 CEST.
 * - AMD FQ2 2026: Tue 4 Aug after close; call 17:00 ET / 23:00 CEST — ir.amd.com.
 *
 * Factual correction vs locked draft:
 * - Eurostat euro-area retail trade (June) releases Thu 6 Aug 2026
 *   (not Wed 5 Aug) — Eurostat euro indicators calendar / prior release
 *   “Next release: 6 August 2026”. Moved that item under Thursday.
 *
 * Cover: original DivLab editorial photograph (AI). No embedded headline.
 * See borsvecka-32-investor-inflation-usa-jobb.license.txt.
 */
export const BORSVECKA_32_INVESTOR_INFLATION_USA_JOBB_ARTICLE: NewsArticle = {
  id: "borsvecka-32-investor-inflation-usa-jobb",
  slug: "borsvecka-32-investor-inflation-usa-jobb",
  title:
    "Börsvecka 32: Investor vid rekordnivå – inflation och USA-jobb kan avgöra riktningen",
  summary:
    "Börsvecka 32 präglas av svensk inflation, amerikansk jobbstatistik och storbolag nära höga kursnivåer. Här är veckans viktigaste händelser och en teknisk analys av Investor.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-02T10:30:00+02:00",
  url: "/news/borsvecka-32-investor-inflation-usa-jobb",
  featured: true,
  imageUrl: "/news-demo/borsvecka-32-investor-inflation-usa-jobb.webp",
  imageAlt:
    "Tom handelsdesk i Stockholm i gryningen med börskurva nära en hög nivå och stadssilhuetten genom fönstret.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 8,
  seoTitle: "Börsvecka 32: Investor, inflation och USA-jobb i fokus",
  seoDescription:
    "Börsvecka 32 präglas av svensk inflation, amerikansk jobbstatistik och storbolag nära höga kursnivåer. Här är veckans viktigaste händelser och en teknisk analys av Investor.",
  seoKeywords: [
    "börsvecka 32",
    "Investor",
    "OMXS30",
    "inflation",
    "SCB",
    "Riksbanken",
    "USA-jobb",
    "Atlas Copco",
    "Volvo",
    "Ericsson",
    "SEB",
    "teknisk analys",
    "Stockholmsbörsen",
  ],
  showDisclaimer: true,
  intro: [
    "Stockholmsbörsen går in i vecka 32 med flera svenska storbolag nära historiskt höga kursnivåer. Rapportsäsongen har hittills visat starkare orderingång och lönsamhet än många befarat, men samtidigt har värderingarna stigit. Under veckan flyttas därför fokus från bolagens kvartalsrapporter till inflation, konjunktursignaler och den amerikanska arbetsmarknaden.",
    "Vecka 32 sträcker sig från måndag den 3 augusti till fredag den 7 augusti. OMXS30 avslutade juli på 3 246,92 punkter efter en uppgång på 0,42 procent under fredagen. Det innebär att den svenska börsen går in i augusti från ett starkt utgångsläge, där det krävs mer än ”helt okej” ekonomiska siffror för att driva kurserna tydligt vidare uppåt.",
    "Rapportfloden från de största svenska bolagen har börjat avta. Investor, Atlas Copco, Volvo, Ericsson och storbankerna har redan presenterat sina andra kvartal. Veckans viktigaste fråga blir därför inte vad bolagen tjänade under våren, utan om de senaste rapporterna är tillräckligt starka för att motivera dagens aktiekurser.",
  ],
  sections: [
    {
      heading: "Investor: stark substansutveckling men rabatten är borta",
      paragraphs: [
        "Investor är en av de tydligaste temperaturmätarna för svensk storbolagsbörs. Genom innehaven i bland annat ABB, Atlas Copco, AstraZeneca, Ericsson, Saab och SEB ger aktien exponering mot stora delar av svensk industri, finans, försvar och läkemedel.",
        "Investors justerade substansvärde uppgick till 1 214,7 miljarder kronor, motsvarande 397 kronor per aktie, den 30 juni. Under det andra kvartalet ökade substansvärdet med 9 procent inklusive återlagd utdelning. Investors totalavkastning var samtidigt 15 procent, jämfört med 9 procent för SIXRX-indexet. Skuldsättningen var fortsatt låg på 1,9 procent.",
        "Investor B stängde fredagen den 31 juli på 411 kronor. Aktien handlades som högst till 416,55 kronor under dagen, vilket också var den högsta noterade kursen under de senaste 52 veckorna. Aktien har stigit drygt 24 procent sedan årsskiftet och omkring 47 procent på ett år.",
        "Jämför man kursen 411 kronor med det senast rapporterade substansvärdet på 397 kronor handlas aktien ungefär 3,5 procent över substansvärdet.",
        "Det ska inte tolkas som en exakt aktuell premie. Investors noterade innehav har förändrats i värde sedan den 30 juni och bolagets onoterade tillgångar värderas inte dagligen. Men jämförelsen visar ändå något viktigt: marknaden erbjuder inte längre den tydliga Investor-rabatt som många svenska småsparare historiskt har varit vana vid.",
        "För att Investor ska fortsätta stiga behöver därför minst ett av följande inträffa:",
        "• De stora noterade innehaven måste fortsätta upp.",
        "• Patricia Industries måste visa bättre värdeutveckling.",
        "• Marknaden måste acceptera en mer varaktig premie mot substansvärdet.",
        "I rapporten var utvecklingen i Patricia Industries svagare än i de noterade innehaven. Totalavkastningen där var minus 3 procent under kvartalet, även om bolagen sammantaget ökade försäljning, rörelseresultat och kassaflöde. Det innebär att Investor under den närmaste tiden fortfarande är starkt beroende av börsutvecklingen i framför allt ABB, Atlas Copco, AstraZeneca, Saab och SEB.",
      ],
    },
    {
      heading: "Teknisk analys: Investor testar taket kring 416–417 kronor",
      paragraphs: [
        "Den långsiktiga tekniska bilden i Investor är positiv, men aktien befinner sig nära ett område där säljare nyligen har kommit in.",
        "Stängningskursen på 411 kronor låg över det glidande medelvärdet för 20 dagar på cirka 410,3 kronor, 50 dagar på cirka 408,3 kronor och 200 dagar på cirka 399,6 kronor. Det visar att både den medellånga och långsiktiga trenden fortfarande pekar uppåt.",
        "Samtidigt låg kursen strax under fem- och tiodagarsmedelvärdena, som båda befann sig omkring 412,5 kronor. Det tyder på att uppgången kortsiktigt har tappat lite fart, även om den större trenden fortfarande är intakt.",
        "RSI för 14 dagar låg omkring 52,8. Det är ett neutralt värde och innebär att aktien varken var tydligt överköpt eller översåld inför vecka 32.",
      ],
    },
    {
      heading: "Viktiga nivåer i Investor B",
      paragraphs: [
        "Motstånd: 416,50–417 kronor",
        "Detta är området kring den senaste 52-veckorshögsta nivån. En tydlig stängning över 417 kronor, helst med högre handelsvolym än normalt, skulle tekniskt vara ett styrketecken. Eftersom aktien då skulle röra sig in på nya kursnivåer finns få tydliga historiska motstånd ovanför.",
        "Första stöd: 408–410 kronor",
        "Här sammanfaller 20- och 50-dagarsmedelvärdena med flera av de senaste handelsdagarnas kursnivåer. Så länge aktien håller sig över området är den kortsiktiga uppgången i huvudsak intakt.",
        "Starkare stöd: 399–403 kronor",
        "Om 408 kronor bryts blir området kring 400 kronor viktigare. Där finns både det långsiktiga 200-dagarsmedelvärdet, 100-dagarsmedelvärdet omkring 403 kronor och den psykologiskt viktiga jämna nivån 400 kronor.",
        "Den tekniska huvudbilden inför veckan är därför positiv men inte riskfri. Investor har en stigande långsiktig trend, samtidigt som aktien behöver ta sig förbi 416–417 kronor för att påbörja en ny tydlig uppgångsfas. En nedgång under 408 kronor skulle i stället öka sannolikheten för en rekyl mot 400 kronor.",
      ],
    },
    {
      heading: "Atlas Copco: stark orderingång höjer förväntningarna",
      paragraphs: [
        "Atlas Copco levererade en av de starkaste svenska storbolagsrapporterna för andra kvartalet.",
        "Orderingången ökade med 27 procent till 50,95 miljarder kronor. Den organiska ökningen var 26 procent. Intäkterna steg till 44,97 miljarder kronor, motsvarande en organisk tillväxt på 8 procent.",
        "Det justerade rörelseresultatet ökade till 9,46 miljarder kronor och den justerade rörelsemarginalen förbättrades från 20,4 till 21,0 procent. Bolagets egen kortsiktiga bedömning var att kundaktiviteten väntas ligga kvar på nuvarande nivå.",
        "Det positiva är att orderingången växer betydligt snabbare än försäljningen. Det ger bättre stöd för kommande kvartal och visar att efterfrågan inom bland annat kompressorer, vakuumteknik och industrisystem fortfarande är stark.",
        "Risken är att marknaden redan har hunnit prisa in en stor del av förbättringen. När ett högt värderat kvalitetsbolag levererar starka siffror flyttas förväntningarna snabbt upp. Under vecka 32 blir därför de internationella industriindikatorerna viktiga.",
        "En stark amerikansk industrisiffra kan ge stöd åt Atlas Copco, Sandvik, Epiroc och Alfa Laval. En svagare siffra kan däremot väcka frågan om den höga orderingången går att upprätthålla under hösten.",
      ],
    },
    {
      heading: "Volvo: starkare lönsamhet trots osäker omvärld",
      paragraphs: [
        "Volvo redovisade en försäljning på 126,3 miljarder kronor under andra kvartalet, en ökning med 3 procent jämfört med föregående år. Justerat för valuta och andra jämförelsestörande faktorer ökade försäljningen med 7 procent.",
        "Det justerade rörelseresultatet steg från 13,5 till 14,8 miljarder kronor. Den justerade rörelsemarginalen förbättrades från 11,0 till 11,7 procent. Kassaflödet inom industriverksamheten ökade samtidigt från cirka 2,9 till 5,8 miljarder kronor.",
        "Rapporten visade att Volvo fortfarande lyckas tjäna bra med pengar trots en mer osäker konjunktur. Både fordonsförsäljning och serviceintäkter ökade organiskt.",
        "Under vecka 32 kommer Volvo framför allt att påverkas av signaler om amerikansk och europeisk industriproduktion, transportaktivitet och räntor. En svagare amerikansk arbetsmarknad kan skapa oro för efterfrågan på lastbilar och anläggningsmaskiner. Samtidigt kan svagare statistik också pressa räntorna, vilket i vissa fall gynnar konjunkturkänsliga aktier.",
        "Det är därför inte säkert att en svag konjunktursiffra automatiskt leder till en svag börsreaktion. Marknadens tolkning beror på om investerarna främst oroar sig för fallande bolagsvinster eller hoppas på lägre räntor.",
      ],
    },
    {
      heading: "Ericsson: bättre marginal men svagt kassaflöde",
      paragraphs: [
        "Ericssons rapport var mer blandad.",
        "Försäljningen sjönk från 56,1 till 52,7 miljarder kronor. Den organiska försäljningen minskade med 1 procent, delvis eftersom motsvarande kvartal föregående år innehöll en positiv engångseffekt från licensintäkter.",
        "Den justerade bruttomarginalen förbättrades samtidigt från 48,0 till 48,4 procent. Justerad EBITA uppgick till 6,9 miljarder kronor, jämfört med 7,4 miljarder kronor året före.",
        "Den svagaste punkten var kassaflödet. Fritt kassaflöde före förvärv sjönk från 2,6 miljarder till endast 0,4 miljarder kronor.",
        "Ericsson visar därmed att kostnadskontroll och förbättrad lönsamhet inom mjukvara fungerar, men försäljning och kassagenerering behöver stärkas. För aktien blir utvecklingen i Nordamerika, operatörernas investeringar och kronans rörelser viktigare än enskilda svenska konjunktursiffror.",
        "Teknikrapporten från AMD efter den amerikanska börsens stängning på tisdagen kan också påverka det allmänna intresset för teknik- och AI-relaterade aktier. AMD publicerar sin rapport den 4 augusti och håller rapportsamtal klockan 23.00 svensk tid.",
        "Ericsson är inte en direkt konkurrent till AMD, men kraftiga rörelser i den amerikanska tekniksektorn påverkar ofta riskviljan även på Stockholmsbörsen.",
      ],
    },
    {
      heading: "Bankerna väntar på svensk inflation",
      paragraphs: [
        "SEB redovisade ett rörelseresultat på 10,8 miljarder kronor under andra kvartalet, 4 procent högre än ett år tidigare. Räntenettot ökade med stöd av utlåningstillväxt och stabila till stigande marknadsräntor. Avkastningen på eget kapital uppgick till 15,7 procent och kärnprimärkapitalrelationen till 17,2 procent.",
        "För SEB, Swedbank och Handelsbanken blir torsdagens svenska inflationssiffra en av veckans viktigaste händelser.",
        "Riksbankens styrränta ligger på 1,75 procent. I juni lämnades räntan oförändrad, samtidigt som Riksbanken betonade att risken för högre inflation hade ökat. Nästa räntebesked lämnas den 20 augusti.",
        "SCB publicerar en preliminär beräkning av inflationen för juli torsdagen den 6 augusti. Statistiken publiceras normalt klockan 08.00.",
        "En högre inflation än väntat kan få marknaden att räkna med en stramare Riksbank. Det kan kortsiktigt gynna bankernas räntenetton, men samtidigt pressa bostadsmarknaden, utlåningen och kreditkvaliteten.",
        "En lägre inflationssiffra kan i stället minska risken för en räntehöjning. Det skulle kunna ge stöd åt fastighetsbolag, byggbolag och högt värderade tillväxtaktier, medan bankerna kan få en mer blandad reaktion.",
      ],
    },
    {
      heading: "Veckans viktigaste tider",
      paragraphs: [
        "Måndag 3 augusti",
        "USA:s ISM-index för tillverkningsindustrin publiceras klockan 16.00 svensk tid. Rapporten är särskilt viktig för Atlas Copco, Volvo, Sandvik, Epiroc och Alfa Laval eftersom den ger en tidig bild av efterfrågan, orderingången och prisutvecklingen inom amerikansk industri.",
        "Tisdag 4 augusti",
        "AMD rapporterar efter den amerikanska börsens stängning. Rapporten kan påverka hela den globala tekniksektorn, särskilt om bolagets kommentarer förändrar synen på investeringarna i AI-servrar och datacenter.",
        "Onsdag 5 augusti",
        "USA:s ISM-index för tjänstesektorn publiceras klockan 16.00. Junis index låg på 54,0, vilket innebar fortsatt expansion.",
        "Torsdag 6 augusti",
        "Eurostat publicerar detaljhandeln för euroområdet under juni. Statistiken ger en bild av hushållens konsumtion och är relevant för bland annat H&M, Electrolux och andra konsumentbolag.",
        "SCB publicerar den svenska preliminära inflationssiffran för juli. Det är veckans viktigaste svenska makrobesked och kan påverka kronan, bankerna, fastighetsbolagen och marknadens förväntningar inför Riksbankens besked den 20 augusti.",
        "Fredag 7 augusti",
        "Den amerikanska jobbrapporten för juli publiceras klockan 14.30 svensk tid. Rapporten innehåller bland annat förändringen i antalet sysselsatta, arbetslösheten och löneutvecklingen. Den kan förändra förväntningarna på amerikanska räntor och därmed påverka börser, valutor och svenska exportbolag.",
      ],
    },
    {
      heading: "Slutsats: bra bolag – men mindre utrymme för besvikelser",
      paragraphs: [
        "De stora svenska bolagen går in i vecka 32 med förhållandevis starka kvartalsrapporter bakom sig.",
        "Atlas Copco visar kraftig ordertillväxt. Volvo har förbättrat både lönsamhet och kassaflöde. SEB fortsätter leverera hög avkastning på eget kapital. Ericsson har stärkt marginalen, även om kassaflödet behöver förbättras. Investor har slagit börsen och befinner sig nära sin högsta kurs någonsin.",
        "Problemet är inte i första hand bolagens kvalitet. Problemet är att marknadens förväntningar har stigit tillsammans med kurserna.",
        "Investor handlas nära sitt rekord och utan en tydlig rabatt mot senast rapporterade substansvärde. Det gör aktien mer beroende av fortsatt uppgång i de underliggande innehaven. Atlas Copcos starka rapport innebär på samma sätt att kommande konjunktursignaler måste vara tillräckligt bra för att försvara den höga värderingen.",
        "Den mest sannolika bilden inför veckan är därför en marknad som reagerar kraftigare på besvikelser än på mindre positiva överraskningar.",
        "Tekniskt är Investor fortsatt stark så länge aktien håller området 408–410 kronor. Ett utbrott över 417 kronor skulle vara ett nytt styrketecken. En nedgång under 408 kronor skulle däremot öppna för en rekyl mot området kring 400 kronor.",
        "Veckans slutliga riktning kan mycket väl avgöras av två siffror: svensk inflation på torsdag och den amerikanska arbetsmarknadsrapporten på fredag.",
        "Artikeln är generell marknadsinformation och ska inte betraktas som personlig investeringsrådgivning.",
      ],
    },
  ],
};
