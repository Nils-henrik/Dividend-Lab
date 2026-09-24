import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — 24 september 2026.
 * Editorial research cutoff: 2026-09-24T09:43:45+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://hmgroup.com/news/h-m-hennes-mauritz-ab-nine-month-report-2026/
 * P0_SOURCE[secondary]: https://www.di.se/live/riksbanken-lamnar-styrrantan-oforandrad-IJ82U/
 * P0_SOURCE[primary]: https://www.ssb.no/en/bank-og-finansmarked/finansielle-indikatorer/statistikk/kredittindikator
 * P0_SOURCE[primary]: https://stat.fi/en/publication/cmfgj5cnd80co07vxcv52plyc
 */
export const NORDEN_I_CENTRUM_24_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-24-september-2026",
  slug: "norden-i-centrum-24-september-2026",
  title: "Norden i centrum 24 september: Riksbanken håller 1,75 % – H&M stärker lönsamheten",
  summary:
    "Riksbanken lämnar styrräntan oförändrad på 1,75 procent. H&M redovisar samtidigt ett tydligt högre rörelseresultat i Q3, medan nya data från Norge och Finland visar starkare kredit- respektive producentprisutveckling.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-09-24T09:44:00+02:00",
  url: "/news/norden-i-centrum-24-september-2026",
  featured: true,
  imageUrl: "/news/generated/norden-i-centrum-2026-09-24.png",
  thumbnailImageUrl: "/news/generated/norden-i-centrum-2026-09-24.png",
  imageAlt: "Norden i centrum 2026-09-24 – DivLabs morgonöversikt över nordiska börsnyheter.",
  readingMinutes: 5,
  seoTitle: "Norden i centrum 24 september: Riksbanken, H&M och nordisk makro",
  seoDescription:
    "Nordiska börsnyheter 24 september 2026: Riksbanken håller räntan på 1,75 procent, H&M förbättrar Q3-resultatet och ny makrodata kommer från Norge och Finland.",
  seoKeywords: [
    "Norden i centrum",
    "nordiska börsen idag",
    "Riksbanken ränta september 2026",
    "H&M rapport Q3 2026",
    "H&M aktie",
    "Norge kredit tillväxt augusti 2026",
    "Finland producentpriser augusti 2026",
    "börsen idag 24 september 2026",
  ],
  internalLinking: {
    topics: ["Norden", "Riksbanken", "styrränta", "detaljhandel", "kreditmarknad", "producentpriser"],
    companies: ["H&M"],
    tickers: ["HM B"],
    relatedNewsSlugs: ["norden-i-centrum-23-september-2026", "borssverige-23-september-2026"],
  },
  showDisclaimer: true,
  intro: [
    "Torsdagsmorgonen har redan gett två tunga svenska besked. Riksbanken lämnade styrräntan oförändrad på 1,75 procent, samtidigt som H&M rapporterade ett klart starkare rörelseresultat än under motsvarande kvartal i fjol.",
    "Utanför Sverige kom färska officiella siffror från både Norge och Finland. Norsk kredittillväxt ökade i augusti, framför allt bland icke-finansiella företag, medan finländska producentpriser steg tydligt jämfört med för ett år sedan.",
  ],
  sections: [
    {
      heading: "Riksbanken lämnar styrräntan på 1,75 procent",
      paragraphs: [
        "Riksbanken meddelade på torsdagen att styrräntan lämnas oförändrad på 1,75 procent. Beskedet publicerades klockan 09.30 och den nya räntenivån ska tillämpas från den 30 september.",
        "För börsen är beskedet viktigt eftersom styrräntan påverkar finansieringskostnader, värderingar och hushållens efterfrågan. DivLab beskriver inte någon exakt marknadsreaktion i den här versionen, eftersom en sådan kräver separat verifierad kursdata nära artikelns cutoff.",
      ],
    },
    {
      heading: "H&M lyfter rörelseresultatet till drygt 6 miljarder kronor",
      paragraphs: [
        "H&M:s nettoomsättning i det tredje kvartalet steg till 57 189 miljoner kronor från 57 017 miljoner kronor ett år tidigare. I lokala valutor ökade försäljningen med 1 procent.",
        "Rörelseresultatet ökade till 6 037 miljoner kronor från 4 914 miljoner kronor och rörelsemarginalen förbättrades till 10,6 procent från 8,6 procent. Bruttomarginalen steg samtidigt till 54,0 procent från 52,9 procent.",
        "Bolaget uppger att kvartalets marginaler påverkades positivt av engångseffekter på cirka 1,6 procentenheter kopplade till tullar och varuimport. Resultatet efter skatt steg till 4 098 miljoner kronor, motsvarande 2,58 kronor per aktie.",
      ],
    },
    {
      heading: "Norsk kredittillväxt stiger – företagen driver uppgången",
      paragraphs: [
        "Statistics Norway visar att den inhemska kredittillväxten, C2, för allmänheten ökade till 4,5 procent i årstakt i augusti från 4,3 procent i juli.",
        "Hushållens kredittillväxt låg kvar på 4,6 procent, medan icke-finansiella företag ökade till 4,8 procent från 4,0 procent månaden före. Kommunsektorns tillväxt sjönk samtidigt till 3,0 procent från 3,4 procent.",
      ],
    },
    {
      heading: "Finländska producentpriser upp 7,3 procent",
      paragraphs: [
        "Statistics Finland rapporterar att producentpriserna för tillverkade produkter steg med 7,3 procent i augusti jämfört med samma månad 2025.",
        "Priserna på hemmamarknaden steg med 6,0 procent och exportprodukterna med 8,6 procent. Myndigheten pekar bland annat på raffinerade petroleumprodukter och basmetaller som viktiga drivkrafter bakom årstakten.",
      ],
    },
    {
      heading: "DivLabs blick",
      paragraphs: [
        "Morgonens nordiska nyhetsbild kombinerar penningpolitik, bolagsrapport och makrodata. För svenska investerare ligger fokus naturligt på Riksbanken och H&M, men siffrorna från Norge och Finland visar samtidigt att kredit- och kostnadstrycket utvecklas olika i regionen.",
        "Nästa steg under dagen blir att följa hur räntor, valutor och enskilda aktier faktiskt reagerar. Eventuella intradagsrörelser efter den här artikelns cutoff måste verifieras separat innan de skrivs in som fakta.",
      ],
    },
  ],
  sources: [
    {
      text: "H&M Group: Nine-month report 2026, 24 september 2026",
      href: "https://hmgroup.com/news/h-m-hennes-mauritz-ab-nine-month-report-2026/",
    },
    {
      text: "Dagens industri: Riksbanken lämnar styrräntan oförändrad, 24 september 2026",
      href: "https://www.di.se/live/riksbanken-lamnar-styrrantan-oforandrad-IJ82U/",
    },
    {
      text: "Statistics Norway: Credit indicator, uppdaterad 24 september 2026",
      href: "https://www.ssb.no/en/bank-og-finansmarked/finansielle-indikatorer/statistikk/kredittindikator",
    },
    {
      text: "Statistics Finland: Producer prices for manufactured products, 24 september 2026",
      href: "https://stat.fi/en/publication/cmfgj5cnd80co07vxcv52plyc",
    },
  ],
};
