import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 19 november 2026.
 * Editorial research cutoff: 2026-11-19T14:00:25+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[secondary]: https://www.reuters.com/commentary/reuters-open-interest/global-markets-view-usa-2026-11-19/
 * P0_SOURCE[primary]: https://www.sec.gov/Archives/edgar/data/104169/000010416926000168/earningsreleasefy27q3.htm
 * P0_SOURCE[primary]: https://www.anthropic.com/news/anthropic-prices-initial-public-offering
 * P0_SOURCE[primary]: https://www.paloaltonetworks.com/company/press/2026/palo-alto-networks-reports-fiscal-first-quarter-2027-financial-results
 * P0_SOURCE[primary]: https://www.federalreserve.gov/monetarypolicy/fomcminutes20261028.htm
 */
export const USA_I_FOKUS_19_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-19-november-2026",
  slug: "usa-i-fokus-19-november-2026-anthropic-walmart-fed",
  title: "USA i fokus 19 november: Anthropic börsdebuterar – Walmart höjer prognosen",
  summary:
    "Nasdaq-terminen stiger omkring 2 procent inför Anthropics börsdebut. Walmart höjer helårsprognosen, Palo Alto Networks växer snabbt och Fed-protokollet visar fortsatt hökaktiga ränterisker.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-19T14:00:30+01:00",
  url: "/news/usa-i-fokus-19-november-2026-anthropic-walmart-fed",
  featured: true,
  imageAlt: "USA i fokus 19 november 2026 – Anthropic, Walmart och Federal Reserve inför Wall Streets öppning.",
  readingMinutes: 6,
  seoTitle: "USA-börsen idag: Anthropic debuterar och Walmart höjer prognosen",
  seoDescription:
    "USA-börsen 19 november: Nasdaq-terminen stiger inför Anthropics debut. Walmart höjer prognosen, Palo Alto rapporterar och Fed signalerar fler höjningar.",
  seoKeywords: [
    "USA-börsen idag",
    "Wall Street idag",
    "Anthropic IPO",
    "Anthropic börsnotering",
    "Walmart rapport",
    "Palo Alto Networks rapport",
    "Nasdaq terminer",
    "Fed protokoll"
  ],
  internalLinking: {
    topics: [
      "USA i fokus",
      "Wall Street",
      "Nasdaq",
      "börsnotering",
      "artificiell intelligens",
      "detaljhandel",
      "cybersäkerhet",
      "Federal Reserve",
      "räntor"
    ],
    companies: ["Anthropic", "Walmart", "Palo Alto Networks", "Nvidia"],
    tickers: ["ANT", "WMT", "PANW", "NVDA"],
    relatedNewsSlugs: [
      "usa-i-fokus-18-november-2026-nvidia-target-lowes",
      "usa-i-fokus-17-november-2026-disney-home-depot-nvidia",
      "usa-i-fokus-16-november-2026-teknikpress-nvidia-fed"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en tydlig teknikrekyl efter fem raka nedgångsdagar för S&P 500. Vid Reuters senaste uppdatering var Nasdaq-terminen upp omkring 2 procent inför Anthropics börsdebut.",
    "Anthropic har prissatt noteringen till 83 dollar per aktie och väntas börja handlas på Nasdaq under tickern ANT. Samtidigt visar Walmart fortsatt konsumtionsstyrka och höjer helårsprognosen efter ett kvartal med 188,8 miljarder dollar i intäkter.",
    "Bakom uppgången ligger fortfarande en tydlig ränterisk. Gårdagens Fed-protokoll visar att nästan alla ledamöter såg ytterligare höjningar som sannolika och att två ledamöter ville höja räntan redan vid oktobermötet."
  ],
  sections: [
    {
      heading: "Anthropic prissätter rekordstor AI-notering",
      paragraphs: [
        "Anthropic har prissatt sin börsintroduktion till 83 dollar per aktie. Erbjudandet omfattar 980 miljoner A-aktier, varav cirka 956,4 miljoner säljs av bolaget och cirka 23,6 miljoner av befintliga ägare.",
        "Aktien väntas börja handlas på Nasdaq Global Select Market den 19 november under tickern ANT. Erbjudandet väntas slutföras den 20 november, förutsatt att sedvanliga villkor uppfylls.",
        "Reuters anger en värdering på omkring 1,5 biljoner dollar och beskriver noteringen som den största hittills räknat i värdet på de sålda aktierna. Den första ordinarie handelsreaktionen har ännu inte inträffat vid artikelns cutoff och föregrips därför inte."
      ]
    },
    {
      heading: "Nasdaq-terminen stiger efter fem svaga börsdagar",
      paragraphs: [
        "Nasdaq-terminen var upp omkring 2 procent vid Reuters senaste uppdatering. Rörelsen kommer efter att S&P 500 fallit fem handelsdagar i följd och tappat mer än 3 procent hittills under veckan.",
        "Gårdagens uppföljning av Nvidia gav inget varaktigt svar på AI-oron: aktien föll trots rapporten, samtidigt som investerare fortsatte att väga stark efterfrågan mot höga värderingar och finansieringsbehov i AI-utbyggnaden.",
        "Dagens förhandsuppgång är därför främst ett nytt test av riskaptiten. Terminsnivåer kan ändras före öppningen och ska inte läsas som ett färdigt dagsutfall."
      ]
    },
    {
      heading: "Walmart höjer helårsprognosen",
      paragraphs: [
        "Walmarts intäkter ökade 5,2 procent till 188,8 miljarder dollar i det tredje kvartalet av räkenskapsåret 2027. Den justerade vinsten per aktie blev 0,65 dollar och den globala e-handeln växte 17 procent.",
        "I USA ökade nettoomsättningen 3,6 procent till 125,0 miljarder dollar. Den jämförbara försäljningen exklusive bränsle steg 2,9 procent, medan e-handeln i USA växte 23 procent.",
        "Bolaget höjer prognosen för helårets försäljningstillväxt i konstant valuta till 4,9–5,2 procent. Justerat rörelseresultat väntas öka 8,0–8,6 procent och justerad vinst per aktie väntas bli 2,84–2,89 dollar."
      ]
    },
    {
      heading: "Palo Alto Networks växer 39 procent",
      paragraphs: [
        "Palo Alto Networks ökade omsättningen 39 procent till 3,44 miljarder dollar i sitt första kvartal för räkenskapsåret 2027. Nästa generations säkerhets-ARR ökade 66 procent till 9,73 miljarder dollar.",
        "Den justerade vinsten per aktie blev 1,05 dollar och det justerade fria kassaflödet uppgick till 1,9 miljarder dollar, motsvarande en marginal på 56,2 procent.",
        "Bolaget räknar för helåret med intäkter på 14,52–14,57 miljarder dollar, 26–27 procents tillväxt, och en justerad rörelsemarginal på 29,5 procent. Palo Alto meddelade samtidigt avsikten att köpa Applied Compute."
      ]
    },
    {
      heading: "Fed-protokollet håller ränterisken levande",
      paragraphs: [
        "Protokollet från Federal Reserves möte den 27–28 oktober visar att nästan alla deltagare bedömde att ytterligare räntehöjningar sannolikt skulle behövas för att få inflationen tillbaka till 2 procent.",
        "Två ledamöter reserverade sig mot beslutet att lämna styrräntan oförändrad på 3,75–4,00 procent och föredrog en höjning med 0,25 procentenheter. Ett par deltagare öppnade dessutom för att mer än 25 punkter kunde övervägas vid nästa möte om inflationsdata blev ogynnsamma.",
        "För teknikaktier innebär det att dagens uppgång sker mot en fortsatt stram räntemiljö. Högre räntor pressar värderingar och gör finansieringen av stora AI- och datacenterinvesteringar dyrare."
      ]
    },
    {
      heading: "Vad följer marknaden efter cutoff?",
      paragraphs: [
        "Den första handeln i Anthropic blir dagens tydligaste kontrollpunkt. Det viktiga blir inte bara öppningskursen utan också om noteringen stärker eller försvagar riskaptiten i den bredare AI-sektorn.",
        "Walmarts ordinarie kursreaktion och ledningens kommentarer om konsumenten följs efter öppningen. Senare i dag väntas också rapporter från bland andra Intuit och Ross Stores efter börsens stängning.",
        "Dessa händelser ligger efter artikelns cutoff. Inga kursreaktioner eller rapportutfall efter cutoff föregrips."
      ]
    }
  ],
  sources: [
    {
      text: "Reuters Morning Bid: färsk USA-marknadskontext den 19 november 2026 med Nasdaq-terminen, Anthropics debut, veckans börsnedgång och Fed-risk",
      href: "https://www.reuters.com/commentary/reuters-open-interest/global-markets-view-usa-2026-11-19/"
    },
    {
      text: "Walmart och SEC: officiell Q3-rapport för räkenskapsåret 2027 med intäkter, e-handel, resultat och höjd helårsprognos",
      href: "https://www.sec.gov/Archives/edgar/data/104169/000010416926000168/earningsreleasefy27q3.htm"
    },
    {
      text: "Anthropic: officiellt besked om börsintroduktionens pris, aktieantal, Nasdaq-ticker och förväntad handelsstart",
      href: "https://www.anthropic.com/news/anthropic-prices-initial-public-offering"
    },
    {
      text: "Palo Alto Networks: officiell Q1-rapport 2027 med omsättning, ARR, resultat, kassaflöde och helårsprognos",
      href: "https://www.paloaltonetworks.com/company/press/2026/palo-alto-networks-reports-fiscal-first-quarter-2027-financial-results"
    },
    {
      text: "Federal Reserve: officiellt protokoll från FOMC-mötet den 27–28 oktober 2026 med räntebedömningar och omröstning",
      href: "https://www.federalreserve.gov/monetarypolicy/fomcminutes20261028.htm"
    }
  ]
};
