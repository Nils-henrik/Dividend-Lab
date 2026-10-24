import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — 24 oktober 2026.
 * Editorial research cutoff: 2026-10-24T08:00:40+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.home.sandvik/en/news-and-media/news/2026/10/interim-report-third-quarter-2026/
 * P0_SOURCE[primary]: https://www.ir.dnb.no/press-and-reports/financial-reports/solid-results-across-operations-nordics
 * P0_SOURCE[primary]: https://www.nokia.com/newsroom/nokia-corporation-interim-report-for-q3-2026/
 * P0_SOURCE[primary]: https://investor.dsv.com/news-releases/news-release-details/dsv-1175-interim-financial-report-q3-2026
 */
export const NORDEN_I_CENTRUM_24_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-24-oktober-2026",
  slug: "norden-i-centrum-24-oktober-2026",
  title: "Veckan som gått: Sandvik och Nokia lyfter – DSV-integrationen visar riskerna",
  summary:
    "Sandvik nådde 22,5 procents justerad EBITA-marginal, Nokia ökade jämförbart rörelseresultat 35 procent och DNB höll avkastningen över 14 procent. Samtidigt visar DSV och Nokias kassaflödesutsikter varför genomförandet blir nästa veckas nyckelfråga.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-24T08:01:00+02:00",
  url: "/news/norden-i-centrum-24-oktober-2026",
  featured: true,
  imageUrl: "/news/generated/norden-i-centrum-2026-10-24.png",
  thumbnailImageUrl: "/news/generated/norden-i-centrum-2026-10-24.png",
  imageAlt: "Norden i centrum 2026-10-24 – DivLabs morgonöversikt över nordiska börsnyheter.",
  readingMinutes: 5,
  seoTitle: "Nordiska rapportveckan: Sandvik, DNB, Nokia och DSV",
  seoDescription:
    "Veckan som gått i Norden: Sandviks marginal, Nokias AI-tillväxt, DNB:s avkastning och DSV:s Schenker-integration – siffrorna och nästa kontrollpunkter.",
  seoKeywords: [
    "nordiska rapporter 2026",
    "Sandvik Q3 2026",
    "Nokia Q3 2026",
    "DNB Q3 2026",
    "DSV Q3 2026",
    "Veckan som gått",
    "Norden i centrum"
  ],
  internalLinking: {
    topics: ["Norden", "rapportperiod", "industrikonjunktur", "AI-infrastruktur", "bank", "logistik"],
    companies: ["Sandvik", "Nokia", "DNB", "DSV"],
    tickers: ["SAND", "NOKIA", "DNB", "DSV"],
    relatedNewsSlugs: [
      "norden-i-centrum-23-oktober-2026",
      "norden-i-centrum-22-oktober-2026",
      "norden-i-centrum-21-oktober-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Veckans nordiska rapportflöde gav fyra tydliga besked från Sverige, Finland, Norge och Danmark: industriefterfrågan höll bättre än väntat i Sandviks orderbok, Nokias AI- och molnaffär växte snabbt, DNB försvarade hög avkastning och DSV höjde precisionen i helårsprognosen.",
    "Den gemensamma nämnaren är att tillväxten nu måste omvandlas till uthålligt kassaflöde. Sandvik levererade redan starkt fritt operativt kassaflöde, medan Nokia sänkte sitt antagande om kassaflödeskonvertering och DSV fortfarande arbetar igenom Schenker-integrationen.",
    "Detta är lördagens sammanfattning av veckan som gått. De nordiska kontantmarknaderna är stängda, så artikeln beskriver rapporterade resultat och utsikter men ingen aktuell kursreaktion."
  ],
  sections: [
    {
      heading: "Sandvik sätter veckans industriella ribba",
      paragraphs: [
        "Sandviks orderingång steg organiskt 17 procent i tredje kvartalet till 36 948 miljoner kronor. Intäkterna ökade organiskt 25 procent till 37 728 miljoner kronor.",
        "Justerat EBITA steg till 8 477 miljoner kronor från 5 539 miljoner, samtidigt som den justerade EBITA-marginalen förbättrades till 22,5 procent från 19,0 procent. Fritt operativt kassaflöde ökade till 7 167 miljoner kronor från 5 603 miljoner.",
        "Det gör Sandvik till veckans tydligaste exempel på att högre aktivitet också kan ge bättre marginal och kassaflöde. Nästa kontrollpunkt är om den organiska orderingången kan fortsätta bära tillväxten när jämförelsetalen blir tuffare."
      ]
    },
    {
      heading: "Nokia gör AI-order till konkret tillväxt",
      paragraphs: [
        "Nokias nettoomsättning steg 9 procent i konstant valuta till 5 154 miljoner euro. Network Infrastructure växte 15 procent i konstant valuta, med 43 procents tillväxt i IP Networks och 18 procent i Optical Networks.",
        "AI & Cloud ökade nettoomsättningen 123 procent och orderingången 118 procent. Affären tog in nya order om 1,5 miljarder euro under kvartalet.",
        "Det jämförbara rörelseresultatet ökade 35 procent till 605 miljoner euro och den jämförbara rörelsemarginalen steg 2,2 procentenheter till 11,7 procent. Samtidigt sänkte Nokia antagandet för årets fria kassaflödeskonvertering till 35–55 procent, bland annat på grund av ytterligare cirka 400 miljoner euro i rörelsekapital och snabbare omstrukturering."
      ]
    },
    {
      heading: "DSV växer – men Schenker-integrationen är tudelad",
      paragraphs: [
        "DSV:s omsättning ökade till 80 702 miljoner danska kronor och EBIT före särskilda poster till 6 606 miljoner, jämfört med 5 434 miljoner ett år tidigare. I EBIT ingick 300 miljoner danska kronor i vinster från fastighetsförsäljningar.",
        "Road-divisionens EBIT föll 35,1 procent till 526 miljoner danska kronor, medan Contract Logistics ökade EBIT 50,3 procent till 1 673 miljoner. DSV uppgav att produktivitet och volymer i Road normaliserades mot kvartalets slut.",
        "Bolaget står fast vid synergimålet på 9 miljarder danska kronor, men vissa synergier inom Road och koncernfunktioner har flyttats till 2027. Prognosintervallet för årets EBIT före särskilda poster smalnades av till 24–25 miljarder danska kronor från 23,5–25,5 miljarder."
      ]
    },
    {
      heading: "DNB håller avkastningen över 14 procent",
      paragraphs: [
        "DNB redovisade ett kvartalsresultat på 9,8 miljarder norska kronor, ned från 10,7 miljarder ett år tidigare. Avkastningen på eget kapital blev 14,5 procent och kärnprimärkapitalrelationen 17,3 procent.",
        "DNB Carnegie ökade intäkterna 25 procent till 2,8 miljarder norska kronor. Intäkterna inom investment banking steg 44 procent till 1,1 miljarder.",
        "Bankens utlåning ökade 1,3 procent till 989 miljarder norska kronor och inlåningen 3,8 procent till 653 miljarder. Nästa fråga är om tillväxten i kundvolymer och kapitalmarknadsintäkter kan väga upp lägre totalvinst och en kostnads-/intäktskvot som steg till 39,8 procent."
      ]
    },
    {
      heading: "Veckans signal: kvaliteten i genomförandet avgör",
      paragraphs: [
        "Veckans rapporter visar inte en enhetlig nordisk konjunktur, men de pekar åt samma håll i en viktig fråga: starkare efterfrågan räcker inte om integration, rörelsekapital eller kostnader äter upp resultatet.",
        "Sandvik kombinerade ordertillväxt med marginal och kassaflöde. Nokia visade snabb AI-relaterad tillväxt men också större kassaflödesbindning. DSV höjde prognosprecisionen samtidigt som Road-integrationens förseningar blev synliga, och DNB höll hög avkastning trots lägre vinst.",
        "Inför nästa vecka följer vi därför Sandviks orderuthållighet, Nokias kassaflödeskonvertering, DSV:s produktivitet i Road och DNB:s kostnadsutveckling. Det är där veckans starka rubriksiffror ska bevisa sin kvalitet."
      ]
    }
  ],
  sources: [
    {
      text: "Sandvik: officiell delårsrapport för tredje kvartalet 2026 med orderingång, intäkter, justerat EBITA, marginal och kassaflöde, publicerad 22 oktober 2026 klockan 08.00 CEST",
      href: "https://www.home.sandvik/en/news-and-media/news/2026/10/interim-report-third-quarter-2026/"
    },
    {
      text: "DNB: officiell rapportkommuniké för tredje kvartalet 2026 med resultat, avkastning, kapitalrelation, volymer och DNB Carnegie-intäkter, publicerad 21 oktober 2026 klockan 07.30 CET",
      href: "https://www.ir.dnb.no/press-and-reports/financial-reports/solid-results-across-operations-nordics"
    },
    {
      text: "Nokia: officiell delårsrapport för tredje kvartalet 2026 med omsättning, segmenttillväxt, AI & Cloud-order, marginal, utsikter och kassaflödesantagande, publicerad 22 oktober 2026 klockan 08.00 EEST",
      href: "https://www.nokia.com/newsroom/nokia-corporation-interim-report-for-q3-2026/"
    },
    {
      text: "DSV: officiell delårsrapport för tredje kvartalet 2026 med omsättning, EBIT, divisionsresultat, synergier, prognos och kassaflöde, publicerad 21 oktober 2026",
      href: "https://investor.dsv.com/news-releases/news-release-details/dsv-1175-interim-financial-report-q3-2026"
    }
  ]
};
