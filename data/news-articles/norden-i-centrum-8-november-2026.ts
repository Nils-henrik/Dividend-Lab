import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — Veckan som kommer, 8 november 2026.
 * Editorial research cutoff: 2026-11-08T08:03:45+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.riksbank.se/en-gb/
 * P0_SOURCE[primary]: https://www.scb.se/en/finding-statistics/statistics-by-subject-area/prices-and-economic-trends/price-statistics/consumer-price-index-cpi/
 * P0_SOURCE[primary]: https://www.vestas.com/en/investor/reports-and-presentations/vestas-reporting
 * P0_SOURCE[primary]: https://www.mandatum.fi/en/group/investors
 */
export const NORDEN_I_CENTRUM_8_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-8-november-2026",
  slug: "norden-i-centrum-8-november-2026",
  title: "Veckan som kommer: Riksbanksprotokoll, svensk inflation och Vestas Q3",
  summary:
    "Riksbankens protokoll och svensk oktoberinflation sätter räntebilden på prov. Samtidigt rapporterar finska Mandatum och danska Vestas, två av veckans tydligaste nordiska bolagshändelser.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-08T08:03:50+01:00",
  url: "/news/norden-i-centrum-8-november-2026",
  featured: true,
  imageUrl: "/news/generated/norden-i-centrum-2026-11-08.png",
  thumbnailImageUrl: "/news/generated/norden-i-centrum-2026-11-08.png",
  imageAlt: "Norden i centrum 2026-11-08 – DivLabs morgonöversikt över nordiska börsnyheter.",
  readingMinutes: 5,
  seoTitle: "Nordiska börsen veckan: Riksbanken, inflation och Vestas Q3",
  seoDescription:
    "Veckan som kommer i Norden: Riksbankens protokoll, svensk oktoberinflation samt Q3-rapporter från Mandatum och Vestas står i centrum.",
  seoKeywords: [
    "nordiska börsen veckan",
    "veckan som kommer börsen",
    "Riksbanken protokoll november 2026",
    "svensk inflation oktober 2026",
    "Vestas Q3 2026",
    "Mandatum Q3 2026",
    "nordiska börser"
  ],
  internalLinking: {
    topics: [
      "Norden",
      "veckan som kommer",
      "ränta",
      "inflation",
      "rapportperiod",
      "vindkraft",
      "kapitalförvaltning",
      "Sverige",
      "Danmark",
      "Finland"
    ],
    companies: ["Vestas", "Mandatum"],
    tickers: ["VWS", "MANTA"],
    relatedNewsSlugs: [
      "norden-i-centrum-7-november-2026",
      "norden-i-centrum-6-november-2026",
      "norden-i-centrum-5-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Den nordiska börsveckan får två tydliga spår: svensk ränta och inflation samt flera kvarvarande Q3-rapporter. Riksbankens protokoll på tisdag visar hur direktionen resonerade bakom höjningen till 2 procent, och torsdagens definitiva oktober-CPI blir nästa kontroll av inflationsbilden.",
    "På bolagssidan publicerar finska Mandatum sin rapport för januari–september på tisdag. Danska Vestas följer på onsdag med Q3-rapport och presentation.",
    "Det här är en framåtblickande veckoplan. Inga rapportutfall eller marknadsreaktioner som ligger efter artikelns redaktionella cutoff har föregripits."
  ],
  sections: [
    {
      heading: "Riksbankens protokoll flyttar fokus till nästa steg",
      paragraphs: [
        "Riksbanken publicerar protokollet från det penningpolitiska mötet tisdagen den 10 november klockan 09.30. Beslutet att höja styrräntan med 0,25 procentenheter till 2 procent är redan känt; den nya nivån börjar gälla onsdagen den 11 november.",
        "Det nya den här veckan är därför inte själva höjningen utan ledamöternas argument och riskbedömningar. Protokollet kan visa hur direktionen väger en starkare ekonomi och kostnadstryck mot en inflation som nyligen har dämpats.",
        "För svenska och nordiska investerare blir frågan om resonemanget ger stöd för fler höjningar eller om direktionen ser större skäl att avvakta. Artikeln drar ingen slutsats om detta innan protokollet är publicerat."
      ]
    },
    {
      heading: "Definitiv oktoberinflation blir veckans svenska nyckeltal",
      paragraphs: [
        "SCB publicerar den ordinarie konsumentprisstatistiken för oktober torsdagen den 12 november. Snabbestimatet den 5 november visade att KPI-inflationen var 0,9 procent, ned från 1,1 procent i september, medan månadsförändringen var 0,0 procent.",
        "Den ordinarie publiceringen ger den fullständiga statistiken och blir viktig eftersom den kommer efter Riksbankens höjning. Det centrala är om detaljbilden bekräftar att pristrycket har dämpats eller visar komponenter som håller inflationstrycket uppe.",
        "Kombinationen av protokollet och den definitiva inflationen gör Sverige till veckans tydligaste nordiska makrotema. Först kommer centralbankens resonemang, därefter statistiken som marknaden kan ställa mot det."
      ]
    },
    {
      heading: "Mandatum öppnar veckans finska rapportspår",
      paragraphs: [
        "Mandatum publicerar sin delårsrapport för januari–september tisdagen den 10 november omkring klockan 08.30 EET, vilket motsvarar 07.30 svensk tid. Bolaget håller en presentation samma dag klockan 11.00 EET.",
        "Rapporten blir en kontrollpunkt för kapitalförvaltning och försäkring efter att Mandatum i oktober slutförde förvärvet av den svenska kapitalförvaltaren Cliens. Det viktiga blir vad rapporten faktiskt visar om resultat, kapital och hur affären utvecklas efter Cliens-förvärvet.",
        "Eftersom rapporten publiceras efter denna artikels cutoff finns inga resultat- eller prognossiffror med här. Utfallet måste verifieras separat på tisdag."
      ]
    },
    {
      heading: "Vestas Q3 blir veckans stora danska bolagshändelse",
      paragraphs: [
        "Vestas publicerar sin rapport för tredje kvartalet onsdagen den 11 november. Vd och finanschef presenterar resultatet i en webbsändning klockan 10.00 CET.",
        "Rapporten är viktig för den nordiska industribilden eftersom Vestas ger en direkt avläsning av efterfrågan, order, lönsamhet och projektgenomförande inom vindkraft. Särskilt relevant blir hur bolaget beskriver balansen mellan aktivitet och marginaler samt om utsikterna förändras.",
        "Några Q3-utfall finns ännu inte att redovisa. Först när rapporten är publicerad går det att bedöma om den förändrar bilden av sektorn eller Vestas finansiella utveckling."
      ]
    },
    {
      heading: "Veckans ordning – det följer vi",
      paragraphs: [
        "Tisdag morgon kommer Mandatums rapport, följd av Riksbankens protokoll. Onsdag riktas bolagsfokus mot Vestas, och torsdag kommer den definitiva svenska oktoberinflationen.",
        "Jämfört med förra veckan har frågan flyttats fram ett steg. Då fick marknaden själva räntebeskeden; nu ska protokollet och ny statistik visa hur hållbar den svenska räntebilden är.",
        "Utanför huvudspåren publiceras fler nordiska rapporter och statistikpunkter under veckan, men de tas inte med som utfyllnad innan deras materiella betydelse och fakta är verifierade. Nästa uppdatering bör prioritera faktiska avvikelser i rapporterna och vad inflationsdata förändrar, inte bara återge kalendern."
      ]
    }
  ],
  sources: [
    {
      text: "Sveriges Riksbank: officiell kalender med publicering av protokollet från det penningpolitiska mötet den 10 november 2026 klockan 09.30",
      href: "https://www.riksbank.se/en-gb/"
    },
    {
      text: "Statistiska centralbyrån: officiell CPI-sida med snabbestimatet för oktober och ordinarie publicering den 12 november 2026",
      href: "https://www.scb.se/en/finding-statistics/statistics-by-subject-area/prices-and-economic-trends/price-statistics/consumer-price-index-cpi/"
    },
    {
      text: "Vestas: officiell rapportsida med Q3-publicering den 11 november 2026 och presentation klockan 10.00 CET",
      href: "https://www.vestas.com/en/investor/reports-and-presentations/vestas-reporting"
    },
    {
      text: "Mandatum: officiell investerarsida med rapport för januari–september den 10 november 2026 cirka klockan 08.30 EET och rapportinformation",
      href: "https://www.mandatum.fi/en/group/investors"
    }
  ]
};
