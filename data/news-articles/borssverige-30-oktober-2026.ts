import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 30 oktober 2026.
 * Editorial research cutoff: 2026-10-30T08:24:37+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://investors.boliden.com/sites/boliden-ir/files/pr/202610291842-1.pdf?ts=1793275238
 * P0_SOURCE[primary]: https://www.astrazeneca.com/media-centre/press-releases/2026/9m-and-q3-2026-results.html
 */
export const BORSSVERIGE_30_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-30-oktober-2026",
  slug: "borssverige-30-oktober-2026",
  title: "Boliden lyfter rörelsevinsten 78 procent – AstraZeneca bekräftar prognosen",
  summary:
    "Boliden ökade Q3-rörelsevinsten exklusive omvärdering av processlager till 4,89 miljarder kronor, men sänkte kopparhaltsprognosen för Aitik. AstraZeneca ökade kvartalsintäkterna 7 procent och upprepade helårsprognosen.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-30T08:24:37+01:00",
  url: "/news/borssverige-30-oktober-2026",
  featured: true,
  imageAlt: "BörsSverige 30 oktober 2026 med Boliden och AstraZeneca i fokus.",
  readingMinutes: 5,
  seoTitle: "Boliden Q3 lyfter vinsten – AstraZeneca bekräftar prognosen",
  seoDescription:
    "Boliden ökar Q3-rörelsevinsten 78 procent men sänker Aitiks kopparhaltsprognos. AstraZeneca växer 7 procent och upprepar helårsutsikten.",
  seoKeywords: [
    "Boliden Q3 2026",
    "Boliden rapport",
    "AstraZeneca Q3 2026",
    "AstraZeneca rapport",
    "Stockholmsbörsen idag",
    "svenska börsen idag",
    "BörsSverige"
  ],
  internalLinking: {
    topics: ["Sverige", "Stockholmsbörsen", "rapportperiod", "gruvor", "metallpriser", "läkemedel", "guidance"],
    companies: ["Boliden", "AstraZeneca", "Sweco"],
    tickers: ["BOL", "AZN"],
    relatedNewsSlugs: [
      "borssverige-29-oktober-2026",
      "borssverige-27-oktober-2026",
      "norden-i-centrum-30-oktober-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Fredagens svenska rapportbild leds av två storbolag med olika budskap. Boliden redovisar ett kraftigt resultatlyft med stöd av högre metallpriser och bättre villkor, medan AstraZeneca fortsätter växa och bekräftar sin helårsprognos.",
    "Bolidens rörelsevinst exklusive omvärdering av processlager steg 78 procent till 4 894 miljoner kronor. Samtidigt sänker gruvbolaget prognosen för kopparhalten i Aitik, vilket gör produktionens kvalitet till en viktig motvikt mot det starka kvartalsresultatet.",
    "Stockholmsbörsen hade ännu inte öppnat vid artikelns redaktionella bryttid. Därför beskrivs ingen kursreaktion och inga orsakssamband mellan rapporterna och dagens handel."
  ],
  sections: [
    {
      heading: "Bolidens öppna fråga får ett starkt resultatsvar",
      paragraphs: [
        "Gårdagens BörsSverige pekade ut Bolidens produktion, kostnader och metallpriskänslighet som nästa kontrollpunkt. Rapporten visar att intäkterna steg till 30 442 miljoner kronor från 21 971 miljoner ett år tidigare.",
        "Rörelsevinsten exklusive omvärdering av processlager ökade till 4 894 miljoner kronor från 2 752 miljoner, motsvarande en ökning på cirka 78 procent. Den redovisade rörelsevinsten blev 5 416 miljoner kronor, jämfört med 3 237 miljoner.",
        "Boliden förklarar förbättringen mot föregående år främst med högre metallpriser och starkare villkor. Högre kostnader, bland annat kopplade till oljeprisets påverkan på kemikalier och transporter, drog åt andra hållet."
      ]
    },
    {
      heading: "Vinstlyftet kombineras med svagare kassaflöde",
      paragraphs: [
        "Nettoresultatet ökade till 3 888 miljoner kronor från 2 294 miljoner. Resultatet per aktie steg till 13,69 kronor från 8,07 kronor.",
        "Det fria kassaflödet minskade däremot till 1 121 miljoner kronor från 2 284 miljoner. Nettoskulden uppgick till 18 335 miljoner kronor, nära nivån 18 130 miljoner ett år tidigare.",
        "Resultatförbättringen är därför tydlig, men den omvandlades inte till ett lika starkt fritt kassaflöde som i jämförelsekvartalet. Det blir en central kvalitetsfråga när Boliden samtidigt driver stora investeringsprojekt."
      ]
    },
    {
      heading: "Aitik får lägre kopparhalt men högre volymmål",
      paragraphs: [
        "Boliden sänker prognosen för Aitiks genomsnittliga kopparhalt 2026 till 0,16 procent från tidigare 0,18 procent. Samtidigt höjs prognosen för mald volym till 42 miljoner ton från 41 miljoner ton.",
        "Bolaget hänvisar till större inblandning av gråberg än planerat. Investeringarna för upprätthållande av gruvdriften bedöms nu till 7 miljarder kronor, upp från 6,5 miljarder.",
        "Den beräknade helårseffekten från planerade underhållsstopp i smältverken är minus 500 miljoner kronor, jämfört med en tidigare prognos på minus 450 miljoner. För fjärde kvartalet väntas minus 100 miljoner kronor."
      ]
    },
    {
      heading: "AstraZeneca växer 7 procent och behåller utsikten",
      paragraphs: [
        "AstraZenecas totala intäkter i tredje kvartalet ökade 7 procent i fasta valutor till 16 209 miljoner dollar. Kärnresultatet per aktie steg 19 procent i fasta valutor till 2,79 dollar.",
        "För årets första nio månader nådde intäkterna 46 881 miljoner dollar, en ökning med 7 procent i fasta valutor. Kärnresultatet per aktie steg 14 procent till 8,00 dollar.",
        "Bolaget upprepar prognosen för 2026: intäkterna väntas öka med ett medelhögt till högt ensiffrigt procenttal och kärnresultatet per aktie med ett lågt tvåsiffrigt procenttal, båda i fasta valutor."
      ]
    },
    {
      heading: "Vad rapporterna betyder för svenska investerare",
      paragraphs: [
        "Boliden ger ett konkret svar på gårdagens öppna fråga: högre priser och bättre villkor lyfter resultatet kraftigt, men Aitiks lägre kopparhalt och högre investeringsbehov visar att produktion och kapitaldisciplin fortfarande är avgörande.",
        "AstraZenecas rapport ger en mer stabil signal. Tillväxten fortsätter och helårsprognosen ligger fast, samtidigt som onkologi, luftvägar och immunologi samt sällsynta sjukdomar växer snabbare än koncernen som helhet.",
        "Rapporterna innehåller inget verifierat analytikerkonsensus i DivLabs källunderlag. Utfallet jämförs därför med föregående år och bolagens egna prognoser, inte med obestyrkta marknadsförväntningar."
      ]
    },
    {
      heading: "Det följer vi härnäst",
      paragraphs: [
        "För Boliden blir nästa kontrollpunkter Aitiks malmkvalitet, kostnadsutvecklingen och hur snabbt investeringarna i Odda och Rönnskär når full effekt. Bolaget avser att publicera fullständig guidning för 2027 den 8 december.",
        "För AstraZeneca blir det viktigt om nuvarande försäljningstillväxt kan hålla i sig när patentutgångar pressar vissa äldre läkemedel och nya produkter ska ta större plats.",
        "Efter börsöppningen krävs separat färsk marknadsdata för att beskriva hur aktierna reagerar. Ingen sådan reaktion föregrips i denna morgonartikel."
      ]
    }
  ],
  sources: [
    {
      text: "Boliden: officiell delårsrapport för Q3 2026 med intäkter, resultat, kassaflöde, skuld, Aitik-guidning, investeringar och underhållsprognos, publicerad den 29 oktober 2026 klockan 13.00 CET",
      href: "https://investors.boliden.com/sites/boliden-ir/files/pr/202610291842-1.pdf?ts=1793275238"
    },
    {
      text: "AstraZeneca: officiellt resultatmeddelande för Q3 och januari–september 2026 med intäkter, resultat per aktie, terapiområden och bekräftad helårsprognos, publicerat den 30 oktober 2026",
      href: "https://www.astrazeneca.com/media-centre/press-releases/2026/9m-and-q3-2026-results.html"
    }
  ]
};
