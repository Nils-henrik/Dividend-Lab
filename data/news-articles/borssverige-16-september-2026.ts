import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 16 september 2026.
 * Editorial research cutoff: 08:22 CEST, 16 september 2026, före Stockholmsbörsens öppning.
 * Separat faktakontroll: BioArctic/Eisai, ASSA ABLOY, Peab och Riksbankens
 * officiella bolagsmeddelanden och kalender kontrollerade mot datum, tid, belopp och villkor.
 * P0_FACT_GATE=PASS. Inga intradagskurser eller utfall efter cutoff har föregripits.
 *
 * Managed Autoredaktion v1.1 initial publication intentionally omits image fields.
 * GitHub owns deterministic image preparation and validation.
 */
export const BORSSVERIGE_16_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-16-september-2026",
  slug: "borssverige-16-september-2026",
  title: "BörsSverige 16 september: BioArctic får nytt Leqembi-godkännande i Japan",
  summary: "BioArctics partner Eisai har fått den subkutana Leqembi Pen godkänd i Japan. ASSA ABLOY köper amerikanska PACLOCK, Peab tar en order på 121 miljoner kronor och klockan 09.30 kommer Riksbankens företagsundersökning.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-09-16T08:24:00+02:00",
  url: "/news/borssverige-16-september-2026",
  featured: true,
  readingMinutes: 5,
  seoTitle: "BörsSverige 16 september: BioArctic och Leqembi",
  seoDescription: "BioArctic får ett nytt Leqembi-godkännande i Japan. ASSA ABLOY köper PACLOCK och Peab tar en order på 121 miljoner kronor.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen idag",
    "börsen idag Sverige",
    "svenska börsnyheter",
    "BioArctic",
    "BioArctic aktie",
    "Leqembi Pen Japan",
    "ASSA ABLOY förvärv",
    "Peab order",
    "Riksbankens företagsundersökning",
    "16 september 2026",
  ],
  internalLinking: {
    topics: ["Stockholmsbörsen", "läkemedel", "förvärv", "bygg", "Riksbanken"],
    companies: ["BioArctic", "ASSA ABLOY", "Peab"],
    tickers: ["BIOA B", "ASSA B", "PEAB B"],
    relatedNewsSlugs: [
      "borssverige-15-september-2026",
      "borssverige-14-september-2026-hemnet-omxs30",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Onsdagsmorgonen ger flera nya svenska bolagsbesked före börsöppningen. Det tydligaste kommer från BioArctic: partnern Eisai har fått Leqembi Pen godkänd i Japan som ett nytt sätt att ge behandlingen vid tidig Alzheimers sjukdom. Den subkutana formuleringen kan tas en gång i veckan och är ett alternativ till infusion på sjukhus varannan vecka.",
    "Samtidigt fortsätter två svenska storbolag att bygga sina order- och förvärvspipelines. ASSA ABLOY köper den amerikanska hänglåstillverkaren PACLOCK och Peab har fått ett bygguppdrag i Umeå värt 121 miljoner kronor. På makrosidan publicerar Riksbanken sin företagsundersökning för augusti klockan 09.30, efter den här artikelns research-cutoff.",
  ],
  sections: [
    {
      heading: "BioArctic: Leqembi Pen godkänns i Japan",
      paragraphs: [
        "BioArctic meddelade klockan 08.05 att partnern Eisai har fått den subkutana autoinjektorformuleringen Leqembi Pen godkänd i Japan för behandling av tidig Alzheimers sjukdom. Dosen är två injektioner, totalt 500 milligram, en gång i veckan. Den befintliga intravenösa formuleringen ges varannan vecka på sjukhus.",
        "Enligt bolaget tar varje injektion cirka 15 sekunder att ge. Japan är det tredje landet i världen som godkänner den subkutana formuleringen. Egenadministrering i hemmet förutsätter dock ytterligare inkludering i en japansk förteckning över injicerbara läkemedel och sker först efter utbildning samt under läkares ledning och uppföljning.",
        "Godkännandet bygger på data och modellering från fas 3-studien Clarity AD och efterföljande delstudier. BioArctic uppger att 500 milligram subkutant en gång i veckan gav liknande exponering som intravenös behandling varannan vecka. Det är en viktig praktisk förändring, men morgonens besked innehåller ingen ny försäljningsprognos.",
      ],
    },
    {
      heading: "Varför Japanbeskedet är viktigt för BioArctic",
      paragraphs: [
        "Leqembi är resultatet av BioArctics samarbete med Eisai. Eisai ansvarar för klinisk utveckling, myndighetsansökningar och global kommersialisering. BioArctic har rätt till betalningar vid försäljningsmilstolpar och royalty på den globala försäljningen samt förbereder nordisk kommersialisering tillsammans med Eisai.",
        "Ett enklare sätt att ge läkemedlet kan på sikt minska behovet av infusionskapacitet och göra behandlingen lättare att passa in i vardagen. Det betyder inte automatiskt en viss försäljningsökning. Upptag, ersättning, läkarbedömning och patienternas lämplighet avgör hur stor den kommersiella effekten blir.",
        "BörsSverige beskriver ingen kursreaktion i BioArctic som fakta före öppningen. Först när handeln har startat går det att se hur investerare faktiskt värderar godkännandet och villkoren kring egenadministrering.",
      ],
    },
    {
      heading: "ASSA ABLOY köper PACLOCK – bidrar positivt till vinsten från start",
      paragraphs: [
        "ASSA ABLOY har förvärvat Pacific Lock Company, PACLOCK, en amerikansk tillverkare av hänglås och säkerhetsprodukter. Bolaget grundades 1998, har omkring 40 anställda och blir en del av affärssegmentet Residential i division Americas.",
        "PACLOCK omsatte cirka 155 miljoner kronor, motsvarande 17 miljoner dollar, under 2025 och hade enligt ASSA ABLOY en stark rörelsemarginal. Förvärvet väntas bidra positivt till vinst per aktie från start. Köpeskillingen offentliggörs inte i pressmeddelandet.",
        "Affären är liten jämfört med ASSA ABLOYs årsomsättning på 152 miljarder kronor, men passar in i koncernens långvariga strategi att komplettera kärnverksamheten med lokala specialistbolag. För investerare blir integration och uthållig lönsamhet viktigare än den begränsade storleken på den enskilda affären.",
      ],
    },
    {
      heading: "Peab får byggorder på 121 miljoner kronor i Umeå",
      paragraphs: [
        "Peab har fått två totalentreprenader i den nya stadsdelen Hagaliden i Umeå. Uppdragen omfattar en Coopbutik och 45 bostadsrättslägenheter i två punkthus. Beställare är Bonava Hagamarket och Bonava Sverige, och den sammanlagda kontraktssumman är 121 miljoner kronor.",
        "Byggstart planeras till september 2026 och färdigställande till maj 2028. Projektet orderanmäls i Peabs affärsområde Bygg under Q3 2026. Det finns också en framtida option på en andra bostadsetapp, men den ingår inte i dagens bekräftade ordervärde.",
        "Ordern är konkret och tidssatt men ska sättas i relation till Peabs betydligt större koncernverksamhet. Det centrala i dagens besked är att 121 miljoner kronor förs in i orderbilden för tredje kvartalet; någon uppgift om projektets förväntade marginal lämnas inte.",
      ],
    },
    {
      heading: "Riksbanken klockan 09.30 – resultatet är ännu inte känt",
      paragraphs: [
        "Riksbankens officiella kalender anger att företagsundersökningen för augusti 2026 publiceras onsdagen den 16 september klockan 09.30. Undersökningen bygger på samtal med större svenska företag och kan ge information om efterfrågan, kostnader, prissättning och investeringsvilja.",
        "Publiceringen sker efter BörsSveriges research-cutoff och efter att handeln på Stockholmsbörsen har öppnat. Den här morgonartikeln tillskriver därför undersökningen inget utfall. När rapporten finns publicerad blir företagens syn på priser och efterfrågan särskilt intressant inför Riksbankens penningpolitiska beslut den 24 september.",
        "Inför öppningen är slutsatsen därför tydlig: BioArctic står för morgonens mest betydelsefulla bolagsbesked, medan ASSA ABLOY och Peab fyller på med verifierade affärer. Riksbankens undersökning är dagens bekräftade svenska makrohändelse, men innehållet måste bedömas först efter publiceringen.",
      ],
    },
  ],
  sources: [
    { text: "BioArctic: Leqembi Pen godkänd i Japan, 16 september 2026", href: "https://news.cision.com/se/bioarctic/r/subkutan-version-av-leqembi---leqembi-pen--godkand-i-japan,c4396611" },
    { text: "ASSA ABLOY: förvärv av PACLOCK i USA, 16 september 2026", href: "https://news.cision.com/se/assa-abloy/r/assa-abloy-forvarvar-paclock-i-usa,c4396576" },
    { text: "Peab: bostäder och handel i Umeå, 16 september 2026", href: "https://news.cision.com/se/peab/r/peab-bygger-bostader-och-handel-i-umea,c4395992" },
    { text: "Riksbanken: kalender 2026", href: "https://www.riksbank.se/sv/press-och-publicerat/kalender/kalender-2026/" },
  ],
};
