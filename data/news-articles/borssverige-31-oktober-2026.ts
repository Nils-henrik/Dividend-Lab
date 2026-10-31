import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 31 oktober 2026.
 * Editorial research cutoff: 2026-10-31T08:20:36+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://investors.boliden.com/sites/boliden-ir/files/pr/202610291842-1.pdf?ts=1793275238
 * P0_SOURCE[primary]: https://www.ssab.com/en/news/2026/10/report-for-q3-2026
 * P0_SOURCE[primary]: https://www.assaabloy.com/group/en/news-media/press-releases/id.30333d833dbf65af
 * P0_SOURCE[primary]: https://news.cision.com/alfa-laval/r/alfa-laval-ab--publ--interim-report-1-july---30-september-2026,c4415453
 */
export const BORSSVERIGE_31_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-31-oktober-2026",
  slug: "borssverige-31-oktober-2026",
  title: "Veckan som gått: Boliden och SSAB lyfter – Alfa Laval ser svagare Q4",
  summary:
    "Boliden och SSAB redovisar tydliga resultatlyft, ASSA ABLOY sätter nya rekord och Alfa Lavals orderingång ökar 33 procent organiskt. Samtidigt visar kassaflöde, marginaler och Q4-utsikter var riskerna finns.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-31T08:20:36+01:00",
  url: "/news/borssverige-31-oktober-2026",
  featured: true,
  imageUrl: "/news/generated/borssverige-2026-10-31.png",
  thumbnailImageUrl: "/news/generated/borssverige-2026-10-31.png",
  imageAlt: "BörsSverige 2026-10-31 – DivLabs morgonöversikt över svenska börsnyheter.",
  readingMinutes: 5,
  seoTitle: "Stockholmsbörsen veckan: Boliden, SSAB och Alfa Laval i fokus",
  seoDescription:
    "Veckan som gått: Boliden och SSAB lyfter resultaten, ASSA ABLOY slår rekord och Alfa Laval ser något lägre efterfrågan i Q4.",
  seoKeywords: [
    "Stockholmsbörsen veckan",
    "Boliden Q3 2026",
    "SSAB Q3 2026",
    "ASSA ABLOY Q3 2026",
    "Alfa Laval Q3 2026",
    "svenska rapporter",
    "Veckan som gått"
  ],
  internalLinking: {
    topics: [
      "Sverige",
      "Stockholmsbörsen",
      "veckan som gått",
      "rapportperiod",
      "gruvor",
      "stål",
      "verkstad",
      "orderingång"
    ],
    companies: ["Boliden", "SSAB", "ASSA ABLOY", "Alfa Laval"],
    tickers: ["BOL", "SSAB A", "ASSA B", "ALFA"],
    relatedNewsSlugs: [
      "borssverige-30-oktober-2026",
      "borssverige-29-oktober-2026",
      "borssverige-27-oktober-2026",
      "norden-i-centrum-28-oktober-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Veckans svenska rapporter visar en starkare industribild än rubriker om konjunkturoro antyder. Boliden och SSAB förbättrar resultaten, ASSA ABLOY redovisar rekordnivåer och Alfa Laval får in betydligt fler order än ett år tidigare.",
    "Det nya är samtidigt att kvaliteten i utvecklingen skiljer sig tydligt mellan bolagen. Bolidens fria kassaflöde minskar trots vinstlyftet, ASSA ABLOY kombinerar organisk tillväxt med rekordmarginal och Alfa Laval väntar sig något lägre efterfrågan i fjärde kvartalet.",
    "Lördagens sammanställning bygger på rapporter som publicerades under veckan. Stockholmsbörsen är stängd och inga kursrörelser eller orsakssamband för helgen beskrivs."
  ],
  sections: [
    {
      heading: "Boliden lyfter vinsten – men kassaflödet försvagas",
      paragraphs: [
        "Bolidens rörelsevinst exklusive omvärdering av processlager steg till 4 894 miljoner kronor från 2 752 miljoner ett år tidigare, en ökning på cirka 78 procent. Intäkterna ökade till 30 442 miljoner kronor från 21 971 miljoner.",
        "Det fria kassaflödet föll samtidigt till 1 121 miljoner kronor från 2 284 miljoner. Det gör skillnaden mellan redovisad lönsamhet och faktisk kassagenerering till en central del av rapportkvaliteten.",
        "Veckan gav också svar på den öppna frågan om produktion och kostnader. Boliden sänkte Aitiks prognos för genomsnittlig kopparhalt 2026 till 0,16 procent från 0,18 procent, men höjde prognosen för mald volym till 42 miljoner ton från 41 miljoner."
      ]
    },
    {
      heading: "SSAB får stöd av högre priser och leveranser",
      paragraphs: [
        "SSAB:s intäkter ökade till 25 632 miljoner kronor från 22 960 miljoner. Rörelseresultatet steg till 2 157 miljoner från 1 869 miljoner, med stöd av högre priser och högre leveranser.",
        "Resultatförbättringen kom trots planerade underhållskostnader på 810 miljoner kronor, jämfört med 390 miljoner ett år tidigare. Nettokassan var 8,4 miljarder kronor mot 10,8 miljarder.",
        "Bolaget ser tecken på en bättre balans mellan utbud och efterfrågan i Europa. Inför fjärde kvartalet väntas realiserade priser bli något högre, men även kostnaderna stiger och årets planerade underhåll ska slutföras."
      ]
    },
    {
      heading: "ASSA ABLOY sätter nya rekord",
      paragraphs: [
        "ASSA ABLOY ökade försäljningen med 7 procent. Den organiska tillväxten var 4 procent, nettoförvärv bidrog med 2 procent och valuta med 1 procent.",
        "Bolaget beskriver kvartalet som rekordstarkt för både försäljning, rörelseresultat och marginal. Rörelseresultatet översteg 7 miljarder kronor för första gången under ett enskilt kvartal.",
        "För investerare är kombinationen viktig: rekordnivåerna drevs inte enbart av förvärv, utan också av organisk försäljningstillväxt. Nästa test blir om marginalen kan försvaras när kostnader och efterfrågan förändras."
      ]
    },
    {
      heading: "Alfa Lavals order växer – men Q4-utsikten dämpas",
      paragraphs: [
        "Alfa Lavals orderingång ökade 36 procent till 23,2 miljarder kronor. Den organiska ökningen var 33 procent, medan omsättningen steg 8 procent till 18,6 miljarder.",
        "Justerat EBITA ökade 6 procent till 3,4 miljarder kronor. Marginalen sjönk däremot till 18,1 procent från 18,4 procent, och resultatet per aktie minskade till 5,40 kronor från 5,53 kronor.",
        "Kassaflödet från den löpande verksamheten förbättrades till 3,4 miljarder kronor från 2,2 miljarder. Samtidigt väntar sig bolaget att efterfrågan i fjärde kvartalet blir något lägre än i det tredje."
      ]
    },
    {
      heading: "Vad veckan förändrade",
      paragraphs: [
        "Rapporterna flyttar den svenska industribilden från en enkel fråga om konjunktur till en fråga om kvalitet. Boliden och SSAB visar högre resultat, men kapitalbehov, underhåll och kassaflöde begränsar hur långt slutsatserna kan dras.",
        "ASSA ABLOY visar att organisk tillväxt fortfarande kan kombineras med rekordmarginal. Alfa Laval visar den andra sidan: mycket stark orderingång och kassaflöde, men något lägre marginal och en försiktigare sekventiell efterfrågeutsikt.",
        "Den gemensamma signalen är därför positiv men inte entydig. Order, priser och leveranser håller uppe resultaten, medan marginalutveckling och kassakonvertering blir avgörande när marknaden går in i fjärde kvartalet."
      ]
    },
    {
      heading: "Det följer vi härnäst",
      paragraphs: [
        "Boliden publicerar fullständig guidning för 2027 den 8 december. Fram till dess ligger fokus på Aitiks kopparhalt, kostnaderna och hur investeringarna påverkar det fria kassaflödet.",
        "För SSAB blir högre realiserade priser, stigande kostnader och återstående underhåll centrala. För ASSA ABLOY blir organisk tillväxt och marginalförsvar de viktigaste kontrollpunkterna.",
        "För Alfa Laval följer vi om den något lägre efterfrågan i fjärde kvartalet syns i orderintaget och om serviceaffären kan stödja marginalen."
      ]
    }
  ],
  sources: [
    {
      text: "Boliden: officiell Q3-rapport med intäkter, rörelseresultat, kassaflöde, Aitik-guidning, investeringar och underhållsprognos",
      href: "https://investors.boliden.com/sites/boliden-ir/files/pr/202610291842-1.pdf?ts=1793275238"
    },
    {
      text: "SSAB: officiellt Q3-meddelande med intäkter, rörelseresultat, nettokassa, underhåll och utsikt för priser och kostnader",
      href: "https://www.ssab.com/en/news/2026/10/report-for-q3-2026"
    },
    {
      text: "ASSA ABLOY: officiellt Q3-meddelande med försäljningstillväxt, organiskt bidrag samt rekordnivåer för försäljning, rörelseresultat och marginal",
      href: "https://www.assaabloy.com/group/en/news-media/press-releases/id.30333d833dbf65af"
    },
    {
      text: "Alfa Laval: officiellt Q3-meddelande med orderingång, omsättning, justerat EBITA, marginal, kassaflöde och Q4-utsikt",
      href: "https://news.cision.com/alfa-laval/r/alfa-laval-ab--publ--interim-report-1-july---30-september-2026,c4415453"
    }
  ]
};
