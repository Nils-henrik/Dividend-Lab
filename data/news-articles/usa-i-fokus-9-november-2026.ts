import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 9 november 2026.
 * Editorial research cutoff: 2026-11-09T14:00:23+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-st-futures-rise-after-rough-week-nvidia-unsettles-investors-2026-11-09/
 * P0_SOURCE[primary]: https://www.sec.gov/Archives/edgar/data/1404912/000140491226000030/q326earningsrelease_vf.htm
 * P0_SOURCE[primary]: https://investors.constellationenergy.com/events/event-details/q3-2026-constellation-energy-corporation-earnings-conference-call
 * P0_SOURCE[primary]: https://www.bls.gov/schedule/2026/11_sched_list.htm
 * P0_SOURCE[primary]: https://www.federalreserve.gov/newsevents/2026-november.htm
 */
export const USA_I_FOKUS_9_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-9-november-2026-terminer-kkr-nvidia",
  slug: "usa-i-fokus-9-november-2026-terminer-kkr-nvidia",
  title: "USA i fokus 9 november: Terminer stiger – KKR sätter rekord",
  summary:
    "Wall Street-terminerna stiger efter förra veckans nedgång, men Nvidia pressas i förhandeln. KKR redovisar rekordhög avgiftsrelaterad vinst och 804 miljarder dollar i förvaltat kapital.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-09T14:00:24+01:00",
  url: "/news/usa-i-fokus-9-november-2026-terminer-kkr-nvidia",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-11-09.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-11-09.png",
  imageAlt: "USA i fokus 2026-11-09 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 5,
  seoTitle: "Wall Street idag: Terminer stiger, KKR sätter rekord",
  seoDescription:
    "Wall Street-terminerna stiger den 9 november medan Nvidia faller i förhandeln. KKR rapporterar rekord och marknaden väntar på USA:s KPI.",
  seoKeywords: [
    "Wall Street idag",
    "USA börsen idag",
    "Nasdaq terminer",
    "S&P 500 terminer",
    "Nvidia aktie",
    "KKR rapport",
    "USA inflation",
    "USA KPI",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "S&P 500",
      "Nasdaq 100",
      "artificiell intelligens",
      "kapitalförvaltning",
      "USA inflation",
      "Federal Reserve",
    ],
    companies: ["Nvidia", "KKR", "Constellation Energy"],
    tickers: ["NVDA", "KKR", "CEG"],
    relatedNewsSlugs: [
      "usa-i-fokus-8-november-2026-veckan-som-kommer-inflation-ai",
      "usa-i-fokus-7-november-2026-veckan-som-gatt-jobb-ai",
      "usa-i-fokus-6-november-2026-nasdaq-humana-jobbrapport",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en positiv start efter förra veckans breda nedgång. Vid Reuters senaste verifierade mätpunkt klockan 06.39 amerikansk östkusttid steg Dow-terminen 1,06 procent, S&P 500-terminen 0,66 procent och Nasdaq 100-terminen 0,42 procent.",
    "Uppgången är samtidigt ojämn. Nvidia föll 4,8 procent i förhandeln efter uppgifter om en intern utredning kring ett möjligt utländskt underrättelseförsök riktat mot vd Jensen Huang, medan flera stora moln- och plattformsbolag steg.",
    "På rapportsidan har KKR redan publicerat sitt tredje kvartal. Kapitalförvaltaren redovisar rekordnivåer för avgiftsrelaterad vinst, total rörelsevinst och justerad nettovinst per aktie, vilket ger dagens uppgång en konkret bolagskrok utanför tekniksektorn.",
  ],
  sections: [
    {
      heading: "Terminsrekylen leds av Dow",
      paragraphs: [
        "Skillnaden mellan indexterminerna visar en mer selektiv riskaptit än en bred teknikrekyl. Dow-terminens uppgång var tydligt större än Nasdaq 100-terminens vid Reuters mätpunkt.",
        "Microsoft, Alphabet och Meta steg mellan 1,5 och 1,8 procent i förhandeln, medan Intel, Marvell och Qualcomm föll mellan 0,5 och 1 procent. Philadelphia Semiconductor Index avslutade samtidigt förra veckan med sin största veckonedgång sedan mars 2025.",
        "Det som förändrats sedan fredagens stängning är därför främst att köpare återvänder till delar av marknaden, inte att AI-oron har försvunnit. Dagens öppning får visa om terminsuppgången håller när kontanthandeln börjar.",
      ],
    },
    {
      heading: "Nvidia bryter mot den positiva indexbilden",
      paragraphs: [
        "Nvidias nedgång på 4,8 procent i förhandeln gör bolaget till den tydligaste motvikten mot de stigande terminerna. Reuters kopplar rörelsen till bolagets interna utredning av uppgifter om att Jensen Huang kan ha varit mål för ett utländskt underrättelseförsök.",
        "Artikeln drar ingen slutsats om utredningens utfall eller om Huangs framtid. Den verifierade marknadsfaktan är den aktuella premarketreaktionen vid den angivna tidpunkten och att osäkerheten uppstod efter en redan svag vecka för halvledarsektorn.",
        "För Nasdaq blir frågan därmed om uppgångar i andra megabolag kan väga upp pressen på Nvidia och den fortsatt försiktiga handeln i flera chipaktier.",
      ],
    },
    {
      heading: "KKR redovisar rekord och 804 miljarder dollar i AUM",
      paragraphs: [
        "KKR:s avgiftsrelaterade vinst uppgick till 1,316 miljarder dollar under tredje kvartalet, 27 procent högre än ett år tidigare. Den justerade nettovinsten var 1,645 miljarder dollar, motsvarande 1,78 dollar per justerad aktie och en ökning på 29 procent.",
        "Det förvaltade kapitalet uppgick till 804 miljarder dollar, 11 procent mer än ett år tidigare. Avgiftsgenererande förvaltat kapital var 648 miljarder dollar, även det 11 procent högre, och KKR tog in 25 miljarder dollar i nytt kapital under kvartalet.",
        "Bolaget räknar med att återföra mer än 40 miljarder dollar till kunder under 2026, vilket skulle överstiga det tidigare årsrekordet med mer än 50 procent. KKR:s resultatkonferens börjar klockan 10.00 östkusttid, motsvarande klockan 16.00 svensk tid, efter artikelns cutoff.",
      ],
    },
    {
      heading: "Efter cutoff: Constellation, Fed och tisdagens KPI",
      paragraphs: [
        "Constellation Energy har schemalagt sin konferens om tredje kvartalet till klockan 09.00 östkusttid, motsvarande klockan 15.00 svensk tid. Utfallet och en eventuell marknadsreaktion ligger efter artikelns cutoff och föregrips inte.",
        "Federal Reserves vice tillsynschef Michelle Bowman deltar i ett samtal om tillsyn och reglering klockan 12.15 östkusttid, motsvarande klockan 18.15 svensk tid. Det är ett verifierat kalenderinslag, inte ett förhandsbesked om penningpolitiken.",
        "Nästa stora makrotest kommer på tisdag den 10 november klockan 08.30 östkusttid, motsvarande klockan 14.30 svensk tid, när BLS publicerar konsumentprisindex och reala inkomster för oktober. Inga inflationsutfall eller efterföljande marknadsrörelser anges i förväg.",
      ],
    },
  ],
  sources: [
    {
      text: "Reuters: verifierad amerikansk termins- och premarketbild klockan 06.39 ET den 9 november 2026",
      href: "https://www.reuters.com/business/wall-st-futures-rise-after-rough-week-nvidia-unsettles-investors-2026-11-09/",
    },
    {
      text: "U.S. Securities and Exchange Commission: KKR:s officiella resultatbilaga för tredje kvartalet 2026",
      href: "https://www.sec.gov/Archives/edgar/data/1404912/000140491226000030/q326earningsrelease_vf.htm",
    },
    {
      text: "Constellation Energy Investor Relations: officiell tid för resultatkonferensen den 9 november 2026",
      href: "https://investors.constellationenergy.com/events/event-details/q3-2026-constellation-energy-corporation-earnings-conference-call",
    },
    {
      text: "U.S. Bureau of Labor Statistics: officiell publiceringskalender för KPI och reala inkomster i november 2026",
      href: "https://www.bls.gov/schedule/2026/11_sched_list.htm",
    },
    {
      text: "Federal Reserve Board: officiell kalender för Michelle Bowmans framträdande den 9 november 2026",
      href: "https://www.federalreserve.gov/newsevents/2026-november.htm",
    },
  ],
};
