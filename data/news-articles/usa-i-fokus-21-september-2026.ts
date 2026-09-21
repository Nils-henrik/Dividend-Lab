import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 21 september 2026.
 * Editorial research cutoff: 2026-09-21T14:48:00+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-st-futures-rise-ai-stocks-gain-oil-prices-slide-2026-09-21/
 */
export const USA_I_FOKUS_21_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-21-september-2026-ai-olja-fed",
  slug: "usa-i-fokus-21-september-2026-ai-olja-fed",
  title: "USA i fokus 21 september: AI-aktier lyfter – oljan faller",
  summary:
    "USA-terminerna stiger inför Wall Street när AI-aktier återhämtar sig och oljepriset faller. Nasdaq 100-terminen låg högst, medan Fed-räntan fortsätter prägla marknaden.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-09-21T14:48:30+02:00",
  url: "/news/usa-i-fokus-21-september-2026-ai-olja-fed",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-09-21.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-09-21.png",
  imageAlt: "USA i fokus 2026-09-21 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 4,
  seoTitle: "USA i fokus: Nasdaq-terminen upp när AI-aktier lyfter",
  seoDescription:
    "USA-börsen inför öppning 21 september: Nasdaq 100-terminen stiger 1,04 procent, AI-aktier lyfter och fallande olja ger stöd efter Fed-höjningen.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "Nasdaq terminer",
    "S&P 500 terminer",
    "Dow Jones terminer",
    "Intel aktie",
    "Meta aktie",
    "Accenture aktie",
    "Federal Reserve",
    "21 september 2026",
  ],
  internalLinking: {
    topics: ["Wall Street", "AI-aktier", "amerikanska terminer", "olja", "Federal Reserve"],
    companies: ["Intel", "Meta Platforms", "Accenture", "Delta Air Lines", "American Airlines"],
    tickers: ["INTC", "META", "ACN", "DAL", "AAL"],
    relatedNewsSlugs: [
      "usa-i-fokus-18-september-2026-fed-buffett-xenon",
      "usa-i-fokus-17-september-2026-wall-street-fed-olja",
    ],
  },
  showDisclaimer: true,
  intro: [
    "USA-terminerna pekar upp inför måndagens öppning på Wall Street. I Reuters verifierade förmarknadsbild klockan 07.09 lokal tid i New York var Dow-terminen upp 0,78 procent, S&P 500-terminen 0,67 procent och Nasdaq 100-terminen 1,04 procent.",
    "AI-relaterade aktier hör till vinnarna samtidigt som oljepriset faller omkring 2 procent. Kombinationen har lättat trycket på amerikanska marknadsräntor, men Federal Reserves räntehöjning förra veckan ligger kvar som en tydlig riskfaktor.",
  ],
  sections: [
    {
      heading: "Nasdaq-terminen leder inför öppning",
      paragraphs: [
        "Nasdaq 100-terminen låg starkast i den senaste verifierade ögonblicksbilden före DivLabs cutoff. Uppgången kom efter en stökig vecka för AI-relaterade aktier, där investerare åter riktade fokus mot fortsatta investeringar i tekniken.",
        "Terminsrörelser är inte samma sak som hur kontanthandeln faktiskt öppnar. Siffrorna kan ändras snabbt när nya besked kommer och ordinarie handel startar klockan 15.30 svensk tid.",
      ],
    },
    {
      heading: "Intel, Meta och Accenture stiger i förhandeln",
      paragraphs: [
        "Intel steg 5,3 procent i Reuters förmarknadsbild. Meta Platforms var upp 2,6 procent, Marvell 2,2 procent och Dell 2,3 procent.",
        "Accenture steg 6,1 procent efter besked om ett samarbete med Anthropic kring utvärdering av AI-modeller. Reuters uppger att satsningen omfattar investeringar på sammanlagt 2 miljarder dollar. Rörelserna är förmarknadsnoteringar och kan förändras efter öppning.",
      ],
    },
    {
      heading: "Fallande olja ger stöd åt riskaptiten",
      paragraphs: [
        "Oljepriset föll omkring 2 procent och nådde enligt Reuters den lägsta nivån på elva dagar. Samtidigt sjönk den amerikanska tioårsräntan under 5 procent.",
        "Lägre energi- och marknadsräntor kan ge stöd åt högt värderade tillväxtbolag. Flygbolagen Delta Air Lines och American Airlines steg båda mer än 1,5 procent i förhandeln när den direkta bränslekostnadsoron lättade.",
      ],
    },
    {
      heading: "Fed-höjningen håller ränteläget i fokus",
      paragraphs: [
        "Federal Reserve höjde den 16 september målintervallet för federal funds-räntan med 0,25 procentenheter till 3,75–4,00 procent. Beslutet fattades med röstsiffrorna 12–0.",
        "Fed beskrev den ekonomiska aktiviteten som fortsatt solid och inflationen som förhöjd. Det betyder att dagens lättnad från lägre olja inte tar bort ränterisken: nya tecken på stark efterfrågan eller seg inflation kan snabbt flytta obligationsräntor och teknikvärderingar igen.",
      ],
    },
    {
      heading: "DivLabs blick inför Wall Street",
      paragraphs: [
        "Måndagens förmarknad drivs av två tydliga krafter: återhämtning i AI-aktier och lägre oljepris. Nasdaq leder, medan energi- och ränteläget avgör hur uthållig riskaptiten blir efter öppning.",
        "Det viktigaste att följa är om uppgången breddas utanför de stora tekniknamnen och om den amerikanska tioårsräntan stannar under 5 procent. Förmarknadssiffrorna i artikeln är frysta vid redaktionens cutoff och uppdateras inte som om de vore slutkurser.",
      ],
    },
  ],
  sources: [
    {
      text: "Federal Reserve: FOMC höjer målintervallet till 3,75–4,00 procent, 16 september 2026",
      href: "https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm",
    },
    {
      text: "Reuters: USA-terminer stiger när AI-aktier lyfter och oljepriset faller, 21 september 2026",
      href: "https://www.reuters.com/business/wall-st-futures-rise-ai-stocks-gain-oil-prices-slide-2026-09-21/",
    },
  ],
};
