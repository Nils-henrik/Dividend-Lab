import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus, 14 oktober 2026.
 * Editorial research cutoff: 2026-10-14T14:07:06+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://investor.bankofamerica.com/
 * P0_SOURCE[primary]: https://www.morganstanley.com/press-releases/morgan-stanley-reports-third-quarter-2026
 * P0_SOURCE[primary]: https://www.bls.gov/schedule/2026/home.htm
 * P0_SOURCE[primary]: https://www.federalreserve.gov/newsevents/2026-october.htm
 * P0_SOURCE[secondary]: https://www.reuters.com/business/finance/morgan-stanley-profit-rises-equity-trading-strength-2026-10-14/
 * P0_SOURCE[secondary]: https://apnews.com/article/stock-markets-earnings-bonds-artificial-intelligence-704d3190f0fba2908df07c85f26346ec
 */
export const USA_I_FOKUS_14_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-14-oktober-2026-bankrapporter-kpi",
  slug: "usa-i-fokus-14-oktober-2026-bankrapporter-kpi",
  title: "USA i fokus 14 oktober: Morgan Stanley lyfter vinsten – KPI väntar",
  summary: "Morgan Stanley ökar vinsten med stöd av stark aktiehandel, medan Bank of America redovisar lägre resultat. USA-terminerna är försiktigt blandade inför september-KPI klockan 14.30.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-14T14:07:20+02:00",
  url: "/news/usa-i-fokus-14-oktober-2026-bankrapporter-kpi",
  featured: true,
  imageAlt: "USA i fokus 14 oktober 2026 med Morgan Stanley, Bank of America och amerikansk inflation inför Wall Street.",
  readingMinutes: 5,
  seoTitle: "USA i fokus 14 oktober: Bankrapporter och KPI",
  seoDescription: "Wall Street idag: Morgan Stanley ökar vinsten, Bank of America redovisar lägre resultat och september-KPI publiceras klockan 14.30.",
  seoKeywords: ["USA i fokus", "Wall Street idag", "USA börsen 14 oktober 2026", "Morgan Stanley rapport", "Bank of America rapport", "USA KPI september 2026", "USA terminer", "Federal Reserve Beige Book"],
  internalLinking: {
    topics: ["Wall Street", "USA-terminer", "rapportsäsong", "amerikanska banker", "aktiehandel", "USA-inflation", "KPI", "Federal Reserve"],
    companies: ["Morgan Stanley", "Bank of America"],
    tickers: ["MS", "BAC"],
    relatedNewsSlugs: ["usa-i-fokus-13-oktober-2026-goldman-jpmorgan-chipaktier", "usa-i-fokus-12-oktober-2026-olja-storbanker-terminer", "usa-i-fokus-11-oktober-2026-veckan-som-kommer-storbanker-kpi"],
  },
  showDisclaimer: true,
  intro: [
    "Onsdagens bankrapporter fördjupar gårdagens splittrade rapportstart. Morgan Stanley redovisar högre vinst och kraftigt ökade intäkter från aktiehandel, medan Bank of Americas nettovinst sjunker jämfört med förra året.",
    "Samtidigt är terminsbilden försiktigt blandad inför september-KPI. Vid AP:s senaste verifierade uppdatering steg terminerna för S&P 500 med 0,2 procent och Dow Jones med 0,3 procent, medan Nasdaq-terminen föll 0,1 procent.",
  ],
  sections: [
    {
      heading: "Morgan Stanley får draghjälp av aktiehandeln",
      paragraphs: [
        "Morgan Stanleys vinst hänförlig till aktieägarna steg till 4,91 miljarder dollar i Q3, från 4,61 miljarder dollar ett år tidigare. Resultatet per aktie ökade till 3,03 dollar från 2,80 dollar.",
        "Intäkterna från aktiehandel steg nästan 41 procent till 5,8 miljarder dollar. Samtidigt minskade intäkterna från räntehandel med 7,3 procent till 2,01 miljarder dollar, medan investmentbankens intäkter ökade 2 procent till 2,16 miljarder dollar.",
        "Reuters uppgav att aktien handlades marginellt högre före öppningen. Det är en tidsstämplad förhandsrörelse, inte en slutkurs, och den kan förändras när kontanthandeln börjar klockan 15.30 svensk tid.",
      ],
    },
    {
      heading: "Bank of America redovisar lägre vinst",
      paragraphs: [
        "Bank of America redovisar intäkter efter räntekostnader på 30,0 miljarder dollar och en nettovinst på 6,9 miljarder dollar för tredje kvartalet. Resultatet per utspädd aktie var 0,91 dollar.",
        "Ett år tidigare var nettovinsten 8,3 miljarder dollar och resultatet per aktie 1,04 dollar, enligt AP:s sammanställning. AP uppger också att en myndighetsbot på omkring 1,2 miljarder dollar belastade kvartalet.",
        "Bank of America-aktien föll mer än 4 procent i AP:s senaste förhandelsuppdatering. Rörelsen beskriver läget före börsöppningen och ska inte läsas som dagens slutliga marknadsreaktion.",
      ],
    },
    {
      heading: "Gårdagens fråga får ett tydligare svar",
      paragraphs: [
        "Tisdagens USA i fokus visade att Goldman Sachs gynnades av stark aktiehandel samtidigt som JPMorgan och Wells Fargo möttes av försiktigare förhandsreaktioner. Morgan Stanleys rapport bekräftar att aktiehandeln även hos en annan stor Wall Street-bank blev ett starkt resultatområde.",
        "Bank of America visar samtidigt att rapportsäsongen inte ger ett enhetligt besked. Bolagsspecifika kostnader, intäktsmix och jämförelsen med förväntningar fortsätter att skilja bankerna åt.",
        "Det är därför mer relevant att granska varje banks vinstkällor och balansräkning än att behandla sektorn som en enda rapporthandel.",
      ],
    },
    {
      heading: "KPI publiceras efter artikelns cutoff",
      paragraphs: [
        "Bureau of Labor Statistics publicerar september-KPI klockan 08.30 östkusttid, motsvarande 14.30 svensk tid. Publiceringen ligger efter artikelns research-cutoff.",
        "Artikeln innehåller därför inget KPI-utfall och ingen påstådd marknadsreaktion på inflationen. AP:s sammanställning anger en förväntad årstakt på 3,6 procent, men det är en prognos och inte rapporterad statistik.",
        "När utfallet väl publiceras blir både huvudmåttet och kärninflationen viktiga för bedömningen av prispressen inför Federal Reserves möte senare i oktober.",
      ],
    },
    {
      heading: "Beige Book följer på kvällen",
      paragraphs: [
        "Federal Reserve publicerar Beige Book klockan 14.00 östkusttid, motsvarande 20.00 svensk tid. Rapporten samlar regionala observationer om aktivitet, arbetsmarknad och priser.",
        "Även detta ligger efter cutoff och beskrivs endast som en verifierad kalenderpunkt. Innehållet och en eventuell marknadsreaktion måste kontrolleras efter publiceringen.",
        "Dagens ordning är därmed tydlig: bankernas faktiska Q3-siffror är kända före öppningen, KPI kommer klockan 14.30 svensk tid och Beige Book senare på kvällen. Kontanthandeln på Wall Street börjar klockan 15.30.",
      ],
    },
    {
      heading: "Det här bevakar Wall Street vid öppningen",
      paragraphs: [
        "Den första kontrollpunkten blir om bankernas förhandsrörelser står sig efter klockan 15.30. Den andra blir hur KPI-utfallet påverkar räntor och index när statistiken har publicerats och verifierats.",
        "Den tredje är om Nasdaq fortsätter utvecklas svagare än Dow och S&P 500 eller om skillnaden i terminerna jämnas ut under handelsdagen.",
        "DivLabs redaktionella bedömning är att dagen har två tydliga spår: rapportkvaliteten i finanssektorn och inflationens betydelse för ränteläget. Det är en prioritering av verifierade katalysatorer, inte en prognos om dagens slutkurser.",
      ],
    },
  ],
  sources: [
    { text: "Bank of America Investor Relations: officiella Q3-resultat 2026 med intäkter, nettovinst och resultat per aktie", href: "https://investor.bankofamerica.com/" },
    { text: "Morgan Stanley: officiellt pressmeddelande om publicerat Q3-resultat 2026 och rapportkonferens", href: "https://www.morganstanley.com/press-releases/morgan-stanley-reports-third-quarter-2026" },
    { text: "Bureau of Labor Statistics: officiellt publiceringsschema för september-KPI den 14 oktober 2026", href: "https://www.bls.gov/schedule/2026/home.htm" },
    { text: "Federal Reserve: officiell oktoberkalender med Beige Book klockan 14.00 östkusttid den 14 oktober 2026", href: "https://www.federalreserve.gov/newsevents/2026-october.htm" },
    { text: "Reuters: Morgan Stanleys Q3-vinst, affärsområden och tidsstämplade förhandsreaktion den 14 oktober 2026", href: "https://www.reuters.com/business/finance/morgan-stanley-profit-rises-equity-trading-strength-2026-10-14/" },
    { text: "AP: tidsstämplad USA-terminsbild, Bank of America-resultat och inflationsförväntningar den 14 oktober 2026", href: "https://apnews.com/article/stock-markets-earnings-bonds-artificial-intelligence-704d3190f0fba2908df07c85f26346ec" },
  ],
};
