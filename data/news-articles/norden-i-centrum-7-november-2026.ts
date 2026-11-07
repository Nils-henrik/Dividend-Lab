import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — Veckan som gått, 7 november 2026.
 * Editorial research cutoff: 2026-11-07T07:58:27+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.riksbank.se/en-gb/press-and-published/notices-and-press-releases/press-releases/2026/policy-rate-raised-to-2-per-cent
 * P0_SOURCE[primary]: https://www.norges-bank.no/en/topics/monetary-policy/Monetary-policy-meetings/2026/november-2026/
 * P0_SOURCE[primary]: https://www.orkla.com/investors/reports-presentations/2026/orkla-reports-results-for-the-third-quarter/
 * P0_SOURCE[primary]: https://www.outokumpu.com/en/news/2026/outokumpu-interim-report-january%E2%80%93september-2026-%E2%80%93-solid-third-quarter-profitability-and-evolve-strategy-progressing-well-3810941
 * P0_SOURCE[secondary]: https://www.reuters.com/markets/europe/european-shares-set-fall-global-ai-rout-gathers-pace-2026-11-06/
 */
export const NORDEN_I_CENTRUM_7_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-7-november-2026",
  slug: "norden-i-centrum-7-november-2026",
  title: "Veckan som gått: Riksbanken höjer – Orkla växer och Outokumpu bromsar",
  summary:
    "Riksbanken höjer styrräntan till 2 procent medan Norges Bank ligger kvar på 4,5 procent. Orkla visar bred vinsttillväxt, men Outokumpus Q4-prognos pekar mot en kraftig inbromsning.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-07T07:58:32+01:00",
  url: "/news/norden-i-centrum-7-november-2026",
  featured: true,
  imageUrl: "/news/generated/norden-i-centrum-2026-11-07.png",
  thumbnailImageUrl: "/news/generated/norden-i-centrum-2026-11-07.png",
  imageAlt: "Norden i centrum 2026-11-07 – DivLabs morgonöversikt över nordiska börsnyheter.",
  readingMinutes: 6,
  seoTitle: "Nordiska börsen veckan: Riksbanken höjer och Outokumpu bromsar",
  seoDescription:
    "Veckan som gått i Norden: Riksbanken höjer räntan, Norges Bank avvaktar, Orkla växer och Outokumpu guidar för ett betydligt svagare Q4.",
  seoKeywords: [
    "nordiska börsen veckan",
    "veckan som gått börsen",
    "Riksbanken ränta november 2026",
    "Norges Bank ränta",
    "Orkla Q3 2026",
    "Outokumpu Q3 2026",
    "nordiska börser"
  ],
  internalLinking: {
    topics: [
      "Norden",
      "veckan som gått",
      "ränta",
      "inflation",
      "rapportperiod",
      "konsumentvaror",
      "stålindustri",
      "Sverige",
      "Norge",
      "Finland"
    ],
    companies: ["Orkla", "Outokumpu", "Ørsted"],
    tickers: ["ORK", "OUT1V", "ORSTED"],
    relatedNewsSlugs: [
      "norden-i-centrum-6-november-2026",
      "norden-i-centrum-5-november-2026",
      "norden-i-centrum-4-november-2026",
      "borssverige-5-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Veckan avslutades med ett tydligt nordiskt vägskäl. Riksbanken beslutade att höja styrräntan med 0,25 procentenheter till 2 procent, medan Norges Bank lämnade sin ränta oförändrad på 4,5 procent.",
    "Rapportfloden gav samtidigt två olika bilder av konjunkturen. Norska Orkla redovisade volymtillväxt och bred vinstförbättring, medan finska Outokumpu varnade för lägre leveranser och ett betydligt svagare fjärde kvartal.",
    "Fredagens breda europeiska nedgång visade dessutom att oro kring AI-investeringar och värderingar fortsätter att sätta riskaptiten. Trots det lyckades det europeiska indexet STOXX 600 avsluta veckan med en mindre uppgång."
  ],
  sections: [
    {
      heading: "Riksbanken höjer till 2 procent",
      paragraphs: [
        "Riksbankens direktion beslutade den 4 november att höja styrräntan med 0,25 procentenheter till 2 procent. Den nya nivån börjar gälla den 11 november.",
        "Centralbanken pekar på en starkare svensk ekonomi, högre kostnadstryck från globala leveransstörningar och en krona som har försvagats under året. Om utsikterna håller bedömer Riksbanken att ytterligare höjningar sannolikt behövs under det kommande året.",
        "Beskedet ändrar veckans svenska räntebild: fokus flyttas från om höjningen skulle komma till hur många steg som återstår. Protokollet publiceras den 10 november och nästa räntebesked kommer den 16 december."
      ]
    },
    {
      heading: "Norges Bank avvaktar på 4,5 procent",
      paragraphs: [
        "Norges Bank valde i stället att lämna styrräntan oförändrad på 4,5 procent efter höjningen i september. Beslutet var enhälligt.",
        "Den norska tolvmånadersinflationen var 3,4 procent i september och kärninflationen KPI-JAE 3,0 procent. Banken bedömer därför att räntan behöver ligga högt under en tid och håller dörren öppen för en ny höjning om inflationsutsikterna försämras.",
        "Skillnaden mot Sverige handlar inte om att Norge har börjat lätta, utan om att den norska räntan redan ligger betydligt högre. Nya prognoser och nästa räntebesked publiceras den 17 december."
      ]
    },
    {
      heading: "Orkla växer med volym – valuta bromsar koncernen",
      paragraphs: [
        "Orklas rörelseintäkter uppgick till 17,5 miljarder norska kronor i tredje kvartalet. De konsoliderade portföljbolagens organiska tillväxt var 3,1 procent, varav volym och mix bidrog med 2,7 procentenheter.",
        "Underliggande justerat EBIT i portföljbolagen ökade 8,1 procent. För koncernen steg justerat EBIT med 1,9 procent till 2,1 miljarder kronor, där en starkare norsk krona förklarade en stor del av skillnaden.",
        "Justerad vinst per aktie ökade 4,9 procent till 1,94 kronor. Rapporten visar att Orkla får tillväxt från faktisk volym, inte bara prishöjningar, men Jotuns resultatbidrag sjönk 6,6 procent till 563 miljoner kronor. Nästa stora kontrollpunkt är kapitalmarknadsdagen den 1 december, då nya mål till 2030 ska presenteras."
      ]
    },
    {
      heading: "Outokumpu går från stabilt Q3 till svag Q4-prognos",
      paragraphs: [
        "Outokumpus omsättning ökade till 1 555 miljoner euro från 1 298 miljoner ett år tidigare. Justerad EBITDA steg till 101 miljoner euro från 34 miljoner och låg i nivå med andra kvartalets 100 miljoner.",
        "Bakom den stabila lönsamheten finns en svagare volymbild. Leveranserna av rostfritt stål minskade 7 procent från föregående kvartal, främst på grund av svag efterfrågan och höga kundlager i Europa.",
        "Kassaflödet från den löpande verksamheten var minus 83 miljoner euro och nettoskulden ökade till 348 miljoner. För fjärde kvartalet räknar bolaget med att leveranserna minskar ytterligare 5–15 procent och att justerad EBITDA hamnar kring de 10 miljoner euro som redovisades i Q4 2025.",
        "Det är veckans tydligaste industriella varningssignal. Q3-resultatet förbättrades kraftigt mot fjolåret, men guidningen visar att den europeiska efterfrågan ännu inte ger stöd för en uthållig återhämtning."
      ]
    },
    {
      heading: "Riskaptiten försvagades på fredagen",
      paragraphs: [
        "Europeiska aktier föll brett på fredagen. STOXX 600 backade 1 procent när oro för avkastningen på stora AI-investeringar och höga värderingar spred sig från USA till Europa.",
        "Nedgången raderade inte hela veckans uppgång; STOXX 600 slutade fortfarande veckan svagt på plus. För nordiska investerare innebär det att starka bolagsrapporter konkurrerar med ett mer försiktigt globalt sentiment.",
        "Ørsted gick mot strömmen och steg 1,2 procent på fredagen tillsammans med andra bolag inom ren energi. Det följde efter veckans rapport, där den underliggande EBITDA-utvecklingen förbättrades men stora nedskrivningar fortsatt tyngde det redovisade resultatet."
      ]
    },
    {
      heading: "Det följer vi nästa vecka",
      paragraphs: [
        "Tre av förra veckans öppna frågor fick svar: Maersk höjde sin helårsprognos, Ørsted visade bättre underliggande drift men fortsatta nedskrivningar och Norges Bank valde att ligga kvar på 4,5 procent.",
        "Nästa vecka blir Riksbankens protokoll den 10 november viktigt för att bedöma stödet bakom fler svenska räntehöjningar. För Orkla riktas blicken mot kapitalmarknadsdagen i december, medan Outokumpu behöver visa att kostnadsprogrammet kan motverka svaga leveranser och högre kostnader.",
        "Den större marknadsfrågan är om fredagens riskaversion var tillfällig eller om oro kring AI-investeringar fortsätter att pressa även nordiska aktier med höga värderingar."
      ]
    }
  ],
  sources: [
    {
      text: "Sveriges Riksbank: officiellt beslut den 4 november 2026 om att höja styrräntan med 0,25 procentenheter till 2 procent från den 11 november, inklusive inflationsbedömning och nästa beslutstillfälle",
      href: "https://www.riksbank.se/en-gb/press-and-published/notices-and-press-releases/press-releases/2026/policy-rate-raised-to-2-per-cent"
    },
    {
      text: "Norges Bank: officiellt räntebesked publicerat den 5 november 2026 med oförändrad styrränta på 4,5 procent, inflationsdata och nästa prognostillfälle",
      href: "https://www.norges-bank.no/en/topics/monetary-policy/Monetary-policy-meetings/2026/november-2026/"
    },
    {
      text: "Orkla: officiellt Q3-meddelande publicerat den 6 november 2026 med intäkter, organisk tillväxt, justerat EBIT, resultatbidrag från Jotun och vinst per aktie",
      href: "https://www.orkla.com/investors/reports-presentations/2026/orkla-reports-results-for-the-third-quarter/"
    },
    {
      text: "Outokumpu: officiell Q3-rapport publicerad den 6 november 2026 med omsättning, justerad EBITDA, leveranser, kassaflöde, nettoskuld och Q4-prognos",
      href: "https://www.outokumpu.com/en/news/2026/outokumpu-interim-report-january%E2%80%93september-2026-%E2%80%93-solid-third-quarter-profitability-and-evolve-strategy-progressing-well-3810941"
    },
    {
      text: "Reuters: europeisk marknadssammanfattning från den 6 november 2026 med fredagens breda nedgång, veckoutvecklingen och kursreaktionen i Ørsted",
      href: "https://www.reuters.com/markets/europe/european-shares-set-fall-global-ai-rout-gathers-pace-2026-11-06/"
    }
  ]
};
