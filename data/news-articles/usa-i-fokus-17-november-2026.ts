import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 17 november 2026.
 * Editorial research cutoff: 2026-11-17T14:02:20+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[secondary]: https://www.reuters.com/commentary/reuters-open-interest/global-markets-view-usa-2026-11-17/
 * P0_SOURCE[secondary]: https://www.reuters.com/business/disney-beats-earnings-forecasts-plans-increase-content-spending-2026-11-17/
 * P0_SOURCE[primary]: https://ir.homedepot.com/news-releases/2026/11-17-2026-110221331
 * P0_SOURCE[primary]: https://www.census.gov/retail/release_schedule.html
 * P0_SOURCE[primary]: https://www.bls.gov/schedule/news_release/ximpim.htm
 * P0_SOURCE[primary]: https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Sets-Conference-Call-for-Third-Quarter-Financial-Results/
 */
export const USA_I_FOKUS_17_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-17-november-2026",
  slug: "usa-i-fokus-17-november-2026-disney-home-depot-nvidia",
  title: "USA i fokus 17 november: Disney slår förväntningarna – Nvidia rapporterar i kväll",
  summary:
    "Disney redovisar 16 procents intäktstillväxt och höjer utdelningen, medan Home Depot ökar försäljningen och uppdaterar helårsprognosen. Efter måndagens tekniknedgång väntar marknaden på detaljhandelsdata och Nvidias rapport.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-17T14:02:25+01:00",
  url: "/news/usa-i-fokus-17-november-2026-disney-home-depot-nvidia",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-11-17.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-11-17.png",
  imageAlt: "USA i fokus 2026-11-17 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 6,
  seoTitle: "USA-börsen idag: Disney, Home Depot och Nvidia i fokus",
  seoDescription:
    "USA-börsen 17 november: Disney slår förväntningarna, Home Depot ökar försäljningen och Nvidia rapporterar efter stängning. Detaljhandelsdata väntas före öppning.",
  seoKeywords: [
    "USA-börsen idag",
    "Wall Street idag",
    "Disney Q4 2026",
    "Home Depot Q3 2026",
    "Nvidia rapport idag",
    "USA detaljhandel oktober 2026",
    "importpriser USA",
    "Nasdaq"
  ],
  internalLinking: {
    topics: [
      "USA i fokus",
      "Wall Street",
      "Nasdaq",
      "bolagsrapporter",
      "detaljhandel",
      "konsumtion",
      "artificiell intelligens",
      "halvledare",
      "inflation"
    ],
    companies: ["Walt Disney", "Home Depot", "Nvidia"],
    tickers: ["DIS", "HD", "NVDA"],
    relatedNewsSlugs: [
      "usa-i-fokus-16-november-2026-teknikpress-nvidia-fed",
      "usa-i-fokus-15-november-2026-veckan-nvidia-detaljhandel-fed",
      "usa-i-fokus-14-november-2026-veckan-wall-street-nvidia-inflation",
      "usa-i-fokus-13-november-2026-nvidia-cisco-applied-materials"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går in i tisdagen med två färska konsumentrapporter och ett fortsatt pressat tekniksegment. Disney slog analytikernas resultatförväntningar, medan Home Depot ökade både total och jämförbar försäljning i sitt tredje kvartal.",
    "Samtidigt är måndagens tekniknedgång den viktigaste förändringen sedan gårdagens artikel. Reuters uppger att Philadelphia Semiconductor Index föll 5 procent och Nasdaq Composite mer än 2 procent, med skärpta amerikanska chiprestriktioner som en del av bakgrunden.",
    "Före öppningen väntar amerikansk detaljhandelsförsäljning och import- och exportpriser för oktober. Nvidias rapport kommer efter stängning. Samtliga dessa utfall ligger efter artikelns cutoff och föregrips inte."
  ],
  sections: [
    {
      heading: "Disney växer på parker, streaming och sport",
      paragraphs: [
        "Disneys intäkter steg 16 procent till 25,9 miljarder dollar under det fjärde kvartalet i räkenskapsåret 2026. Den justerade vinsten per aktie blev 1,77 dollar, jämfört med analytikernas genomsnittliga prognos på 1,67 dollar enligt LSEG-data som Reuters återger.",
        "Entertainment-segmentets intäkter ökade 17 procent till 11,9 miljarder dollar och rörelseresultatet steg 92 procent till 1,3 miljarder. Experiences nådde rekord för både intäkter och resultat: intäkterna ökade 15 procent till 10,1 miljarder dollar och rörelseresultatet 20 procent till nära 2,3 miljarder.",
        "Disney planerar att öka kontant innehållsinvestering med 9 procent till 26 miljarder dollar nästa räkenskapsår. Styrelsen höjer samtidigt den årliga utdelningen med 33 procent till 2 dollar per aktie. Aktien var upp omkring 2 procent i förhandeln vid Reuters senaste uppdatering."
      ]
    },
    {
      heading: "Home Depot höjer försäljningen men marginalen pressas",
      paragraphs: [
        "Home Depot redovisade en försäljning på 43,4 miljarder dollar i det tredje kvartalet, 4,9 procent mer än ett år tidigare. Den jämförbara försäljningen ökade 2,2 procent både totalt och i USA.",
        "Nettoresultatet blev 3,7 miljarder dollar, motsvarande 3,72 dollar per utspädd aktie. Den justerade vinsten per aktie steg till 3,86 dollar från 3,74 dollar.",
        "Den redovisade rörelsemarginalen sjönk samtidigt till 12,6 procent från 12,9 procent och den justerade marginalen till 13,0 från 13,3 procent. För helåret räknar bolaget nu med cirka 4,5 procents försäljningstillväxt, cirka 1,4 procents jämförbar tillväxt och justerad vinst per aktie som ökar omkring 2 procent från 14,69 dollar."
      ]
    },
    {
      heading: "Teknikpressen följer med in i rapportkvällen",
      paragraphs: [
        "Måndagens nedgång gav ett tydligt svar på gårdagens öppna fråga om teknikpressen skulle bestå när kontantmarknaden öppnade. Chipindexet SOX föll 5 procent och Nasdaq Composite mer än 2 procent enligt Reuters.",
        "Trycket kopplas i Reuters marknadsöversikt till skärpta amerikanska restriktioner för export av AI-chip till Kina och vissa asiatiska marknader, samtidigt som investerare väntar på Nvidias rapport och bolagets fortsatta hantering av vd-skiftet.",
        "Rörelsen gör Nvidias rapport viktig för mer än en enskild aktie. Datacenterförsäljning, marginaler, utsikter och ledningens budskap kan påverka hur investerare bedömer hela AI- och halvledarsektorn, men utfallet kommer först efter dagens handel."
      ]
    },
    {
      heading: "Detaljhandel och importpriser kommer klockan 14.30",
      paragraphs: [
        "U.S. Census Bureau publicerar den preliminära detaljhandelsförsäljningen för oktober klockan 08.30 amerikansk östkusttid, motsvarande 14.30 i Stockholm.",
        "Samtidigt publicerar Bureau of Labor Statistics import- och exportprisindex för oktober. Kombinationen ger nya datapunkter om hushållens nominella efterfrågan och pristrycket i varuflödena.",
        "Båda publiceringarna ligger efter artikelns research-cutoff. Artikeln innehåller därför inga påstådda utfall, jämförelser mot konsensus eller marknadsreaktioner från dessa statistiksläpp."
      ]
    },
    {
      heading: "Nvidia rapporterar efter stängning",
      paragraphs: [
        "Nvidia publicerar sitt resultat för tredje kvartalet i räkenskapsåret 2027 omkring klockan 13.20 Stillahavstid, motsvarande 22.20 i Stockholm. Konferenssamtalet börjar klockan 14.00 Stillahavstid.",
        "Kvartalet avslutades den 25 oktober. Bolaget uppger att skriftliga kommentarer från finanschefen och tillförordnade vd:n Colette Kress publiceras direkt efter resultatet och före samtalet.",
        "Efter dagens cutoff följer DivLab först 14.30-statistiken, därefter den faktiska handeln i Disney, Home Depot och tekniksektorn och slutligen Nvidias rapport. Inga framtida resultat eller kursreaktioner behandlas som kända."
      ]
    }
  ],
  sources: [
    {
      text: "Reuters Morning Bid: marknadsläget den 17 november 2026 med måndagens nedgång i SOX och Nasdaq, chiprestriktioner samt dagens USA-katalysatorer",
      href: "https://www.reuters.com/commentary/reuters-open-interest/global-markets-view-usa-2026-11-17/"
    },
    {
      text: "Reuters: Disneys Q4-resultat 2026 med intäkter, justerad vinst per aktie, segmentutveckling, utdelning, investeringsplan och verifierad förhandelsreaktion",
      href: "https://www.reuters.com/business/disney-beats-earnings-forecasts-plans-increase-content-spending-2026-11-17/"
    },
    {
      text: "Home Depot Investor Relations: officiell Q3-rapport 2026 med försäljning, jämförbar tillväxt, resultat, marginaler och uppdaterad helårsprognos",
      href: "https://ir.homedepot.com/news-releases/2026/11-17-2026-110221331"
    },
    {
      text: "U.S. Census Bureau: officiell publiceringskalender för preliminär detaljhandelsförsäljning avseende oktober 2026 den 17 november klockan 08.30 ET",
      href: "https://www.census.gov/retail/release_schedule.html"
    },
    {
      text: "U.S. Bureau of Labor Statistics: officiell publiceringskalender för import- och exportprisindex avseende oktober 2026 den 17 november klockan 08.30 ET",
      href: "https://www.bls.gov/schedule/news_release/ximpim.htm"
    },
    {
      text: "Nvidia Investor Relations: officiell tidplan för Q3-resultatet i räkenskapsåret 2027 den 17 november 2026 och efterföljande konferenssamtal",
      href: "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Sets-Conference-Call-for-Third-Quarter-Financial-Results/"
    }
  ]
};
