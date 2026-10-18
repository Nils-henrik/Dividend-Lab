import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus – Veckan som kommer, 18 oktober 2026.
 * Editorial research cutoff: 2026-10-18T14:05:46+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://ir.netflix.net/investor-news-and-events/financial-releases/press-release-details/2026/Netflix-to-Announce-Third-Quarter-2026-Financial-Results/default.aspx
 * P0_SOURCE[primary]: https://ir.tesla.com/press-release/tesla-third-quarter-2026-production-deliveries-and-deployments
 * P0_SOURCE[primary]: https://newsroom.ibm.com/2026-10-07-ibm-to-announce-third-quarter-2026-financial-results
 * P0_SOURCE[primary]: https://www.bls.gov/schedule/2026/10_sched_list.htm
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-st-futures-mixed-tech-wobbles-again-tesla-gains-2026-10-16/
 */
export const USA_I_FOKUS_18_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-18-oktober-2026-veckan-som-kommer-netflix-tesla-ibm",
  slug: "usa-i-fokus-18-oktober-2026-veckan-som-kommer-netflix-tesla-ibm",
  title: "USA i fokus – Veckan som kommer: Netflix, Tesla och IBM testar techhumöret",
  summary:
    "Wall Street går in i en rapporttät vecka efter fredagens breda nedgång. Netflix rapporterar på tisdag, medan Tesla och IBM följer på onsdag. Dessutom publicerar BLS ny arbetsmarknads- och lönestatistik.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-18T14:05:46+02:00",
  url: "/news/usa-i-fokus-18-oktober-2026-veckan-som-kommer-netflix-tesla-ibm",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-10-18.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-10-18.png",
  imageAlt: "USA i fokus 2026-10-18 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 5,
  seoTitle: "USA i fokus: Netflix, Tesla och IBM rapporterar",
  seoDescription:
    "Veckan på Wall Street: Netflix rapporterar 20 oktober, Tesla och IBM 21 oktober. Här är tiderna, siffrorna och vad marknaden bevakar.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street veckan som kommer",
    "Netflix rapport 2026",
    "Tesla rapport 2026",
    "IBM rapport 2026",
    "Nasdaq",
    "USA börsen",
    "BLS arbetsmarknad",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-börsen",
      "Nasdaq",
      "rapportperiod",
      "artificiell intelligens",
      "arbetsmarknad",
      "löner",
    ],
    companies: ["Netflix", "Tesla", "IBM"],
    tickers: ["NFLX", "TSLA", "IBM"],
    relatedNewsSlugs: [
      "usa-i-fokus-16-oktober-2026-ppi-detaljhandel-tech",
      "usa-i-fokus-14-oktober-2026-bankrapporter-kpi",
      "borssverige-18-oktober-2026-veckan-som-kommer",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Den amerikanska kontantmarknaden är stängd på söndagen. Nästa handelsvecka börjar efter en tung fredag då S&P 500 föll 1,22 procent, Nasdaq 2,19 procent och Dow Jones 0,55 procent. Reuters kopplade nedgången till förnyad press på AI-relaterad teknik och ett högre oljepris.",
    "Veckans bekräftade schema domineras av bolagsrapporter. Netflix publicerar på tisdag, medan Tesla och IBM rapporterar på onsdag. DivLabs redaktionella bedömning är att rapporterna blir viktiga testpunkter för tekniksektorn efter fredagens nedgång; det är en prioritering, inte ett påstående om kommande kursrörelser.",
  ],
  sections: [
    {
      heading: "Fredagens nedgång sätter startläget",
      paragraphs: [
        "S&P 500 stängde fredagen på 7 649,71 efter en nedgång på 1,22 procent. Nasdaq föll 2,19 procent till 26 128,13 och Dow Jones backade 0,55 procent till 51 891,77.",
        "Kommunikationstjänster och informationsteknik var de svagaste sektorerna i S&P 500 enligt Reuters. Samtidigt steg oljepriset mer än 3 procent under fredagen. Det är den senaste verifierade amerikanska sessionen och därmed utgångspunkten inför måndagen.",
        "Det verifierade utfallet säger inget säkert om nästa vecka. DivLabs bedömning är däremot att investerarnas tolerans för svagare utsikter kan vara lägre när tekniksektorn redan går in i rapporterna med ett försämrat kortsiktigt momentum.",
      ],
    },
    {
      heading: "Netflix öppnar rapportveckans första stora test",
      paragraphs: [
        "Netflix publicerar resultat och affärsutsikter för tredje kvartalet tisdagen den 20 oktober omkring klockan 13.01 Stillahavstid, motsvarande cirka 22.01 svensk tid. En videointervju med ledningen börjar klockan 13.45 Stillahavstid, cirka 22.45 svensk tid.",
        "Det verifierade schemat anger när materialet och intervjun kommer, men inte något utfall. DivLabs redaktionella bevakningspunkter är omsättning, rörelsemarginal och bolagets framåtblickande utsikter, eftersom de kan visa hur väl tillväxten omsätts i lönsamhet.",
        "Rapporten kommer efter den ordinarie handeln i USA. Eventuella kursreaktioner kan därför först beskrivas när de faktiskt har verifierats efter publiceringen.",
      ],
    },
    {
      heading: "Tesla: leveranserna är kända – lönsamheten återstår",
      paragraphs: [
        "Tesla publicerar sin rapport efter börsstängning onsdagen den 21 oktober. Frågestunden börjar klockan 17.30 östkusttid, motsvarande 23.30 svensk tid.",
        "Bolaget har redan redovisat 486 532 levererade fordon och 464 391 producerade fordon under tredje kvartalet. Energilagringsprodukterna nådde 13,7 GWh. Tesla betonar självt att leveranser och energilagring bara är två mått och inte ensamma visar kvartalets finansiella resultat.",
        "Därför blir intäkter, marginaler, kassaflöde och ledningens utsikter DivLabs viktigaste redaktionella kontrollpunkter. Inga slutsatser om dessa poster eller aktiens reaktion kan dras före rapporten.",
      ],
    },
    {
      heading: "IBM följer samma kväll",
      paragraphs: [
        "IBM håller sin rapportkonferens onsdagen den 21 oktober klockan 17.00 östkusttid, motsvarande 23.00 svensk tid. Resultatpressmeddelandet publiceras före webbsändningen.",
        "DivLabs redaktionella bedömning är att IBM blir ett kompletterande test av tekniksektorn: Netflix visar konsumentnära digital tillväxt, Tesla kombinerar fordon och energi, medan IBM ger en bild av företagens efterfrågan på mjukvara, infrastruktur och konsulttjänster.",
        "Det officiella beskedet innehåller ännu inga rapportsiffror. Artikeln föregriper därför varken resultat, guidning eller marknadsreaktion.",
      ],
    },
    {
      heading: "Två BLS-släpp kompletterar bolagsrapporterna",
      paragraphs: [
        "Bureau of Labor Statistics publicerar delstatlig sysselsättning och arbetslöshet för september på tisdagen den 20 oktober klockan 10.00 östkusttid, motsvarande 16.00 svensk tid.",
        "På onsdagen den 21 oktober klockan 10.00 östkusttid kommer statistik över vanliga veckolöner för löntagare under tredje kvartalet. Även det motsvarar 16.00 svensk tid.",
        "Det verifierade schemat gör arbetsmarknad och löner till veckans tydliga makroinslag. DivLabs bedömning är ändå att bolagsrapporterna står i centrum, eftersom de kommer direkt efter en fredagsnedgång där teknik och AI-relaterade aktier var särskilt pressade.",
      ],
    },
    {
      heading: "Det här bevakar vi när handeln öppnar",
      paragraphs: [
        "Först kommer måndagens faktiska marknadsreaktion på fredagens svaghet och helgens nyhetsflöde. Därefter flyttas fokus till Netflix på tisdag och den dubbla rapportkvällen med Tesla och IBM på onsdag.",
        "Tre frågor väger tyngst: om tekniksektorn stabiliseras, om bolagens utsikter stöder nuvarande värderingar och om arbetsmarknadsdata förändrar ränteläget. Det är bevakningsfrågor, inte prognoser.",
        "Alla kommande tider ovan är verifierade mot bolagen eller BLS. Resultat och kursreaktioner efter artikelns research-cutoff beskrivs först i senare publiceringar när de kan faktakontrolleras.",
      ],
    },
  ],
  sources: [
    {
      text: "Netflix Investor Relations: officiellt schema för resultat och ledningsintervju för tredje kvartalet 2026 den 20 oktober",
      href: "https://ir.netflix.net/investor-news-and-events/financial-releases/press-release-details/2026/Netflix-to-Announce-Third-Quarter-2026-Financial-Results/default.aspx",
    },
    {
      text: "Tesla Investor Relations: officiella leverans-, produktions- och energilagringssiffror för tredje kvartalet samt rapporttid den 21 oktober 2026",
      href: "https://ir.tesla.com/press-release/tesla-third-quarter-2026-production-deliveries-and-deployments",
    },
    {
      text: "IBM Newsroom: officiellt schema för resultat och rapportkonferens för tredje kvartalet 2026 den 21 oktober",
      href: "https://newsroom.ibm.com/2026-10-07-ibm-to-announce-third-quarter-2026-financial-results",
    },
    {
      text: "Bureau of Labor Statistics: officiellt publiceringsschema för delstatlig sysselsättning och veckolöner den 20–21 oktober 2026",
      href: "https://www.bls.gov/schedule/2026/10_sched_list.htm",
    },
    {
      text: "Reuters: verifierade slutnivåer för S&P 500, Nasdaq och Dow Jones samt marknadskontext från fredagen den 16 oktober 2026",
      href: "https://www.reuters.com/business/wall-st-futures-mixed-tech-wobbles-again-tesla-gains-2026-10-16/",
    },
  ],
};
