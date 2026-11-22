import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — Veckan som kommer, 22 november 2026.
 * Editorial research cutoff: 2026-11-22T08:02:35+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary-cadeler]: https://ir.cadeler.com/events-presentations/ir-calendar
 * P0_SOURCE[primary-sectra]: https://investor.sectra.com/event/sectras-six-month-report-2026-2027/
 * P0_SOURCE[primary-scb]: https://www.scb.se/en/finding-statistics/publishing-calendar/?period=Forward1Year&prodKod=NR0103
 * P0_SOURCE[primary-statfin]: https://stat.fi/en/statistics/ntp
 * P0_SOURCE[secondary-finland-calendar]: https://www.salkunrakentaja.fi/sijoittajakalenteri/
 */
export const NORDEN_I_CENTRUM_22_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-22-november-2026",
  slug: "norden-i-centrum-22-november-2026",
  title: "Veckan som kommer: Cadeler och Sectra rapporterar – svensk och finsk BNP väntar",
  summary:
    "Cadeler öppnar den nordiska rapportveckan på måndag och Sectra följer på onsdag. På fredag flyttas fokus till Q3-BNP i Sverige och Finland, två datapunkter som kan ändra bilden av konjunkturen.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-22T08:02:36+01:00",
  url: "/news/norden-i-centrum-22-november-2026",
  featured: true,
  readingMinutes: 4,
  seoTitle: "Veckan som kommer i Norden: Cadeler, Sectra och Q3-BNP",
  seoDescription:
    "Nästa nordiska börsvecka: Cadeler rapporterar på måndag, Sectra på onsdag och Sverige samt Finland publicerar Q3-BNP på fredag.",
  seoKeywords: [
    "Veckan som kommer Norden",
    "Cadeler Q3 2026",
    "Sectra halvårsrapport 2026 2027",
    "Sverige BNP Q3 2026",
    "Finland BNP Q3 2026",
    "nordiska börser",
    "nordiska rapporter",
    "Norden i centrum"
  ],
  internalLinking: {
    topics: [
      "Norden i centrum",
      "Veckan som kommer",
      "rapportkalender",
      "offshore vindkraft",
      "medicinsk IT",
      "cybersäkerhet",
      "BNP",
      "nordisk konjunktur"
    ],
    companies: ["Cadeler", "Sectra"],
    tickers: ["CDLR", "SECT B"],
    relatedNewsSlugs: [
      "norden-i-centrum-20-november-2026",
      "norden-i-centrum-19-november-2026",
      "norden-i-centrum-18-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Nästa nordiska börsvecka har tre tydliga hållpunkter. Cadeler lämnar sin Q3-uppdatering på måndag, Sectra publicerar sin halvårsrapport på onsdag och på fredag kommer nationalräkenskaper för tredje kvartalet i både Sverige och Finland.",
    "Det är ett skifte från veckan som gick. Då dominerade redan realiserade bolagsbesked från bland andra Frontline, NKT och Better Collective. Nu flyttas frågan till vad nya rapporter och BNP-data säger om orderutförande, lönsamhet och den nordiska konjunkturen.",
    "Söndagens uppgift är inte att föregripa utfallen. Den är att ringa in vilka verifierade händelser som kan förändra marknadsbilden och vilka siffror som blir viktigast när materialet faktiskt publiceras."
  ],
  sections: [
    {
      heading: "Måndag: Cadeler öppnar rapportveckan",
      paragraphs: [
        "Cadeler har lagt sin Q3-presentation till måndagen den 23 november. Bolagets IR-kalender anger att presentationen av Q3 2026 är veckans första större verifierade rapporthändelse i urvalet.",
        "Cadeler är noterat i Oslo och New York och verkar i den kapitalintensiva marknaden för installation av havsbaserad vindkraft. Därför blir orderläge, projektgenomförande, fartygskapacitet och finansiering de naturliga kontrollpunkterna när rapporten publiceras.",
        "Det viktiga blir att skilja mellan kontrakterad aktivitet och resultat som redan har redovisats. En stark orderbok kan ge god synlighet, men lönsamheten avgörs också av leveransplaner, kostnader och hur effektivt flottan används."
      ]
    },
    {
      heading: "Onsdag: Sectra ger svar om tillväxt och lönsamhet",
      paragraphs: [
        "Sectra publicerar sin sexmånadersrapport för räkenskapsåret 2026/2027 onsdagen den 25 november klockan 08.15 CET. Ledningens presentation börjar klockan 10.00.",
        "Bolaget kombinerar medicinsk IT med cybersäkerhet. Rapporten blir därför en kontrollpunkt för två områden där efterfrågan kan vara strukturellt stark samtidigt som projektmix och leveranstid påverkar resultatet mellan kvartalen.",
        "Investerare behöver framför allt läsa hur orderingång, återkommande intäkter, omsättning och rörelsemarginal utvecklas. Något rapportutfall eller någon kursreaktion kan inte beskrivas innan siffrorna har publicerats och verifierats."
      ]
    },
    {
      heading: "Fredag: svensk Q3-BNP sätter konjunkturen på prov",
      paragraphs: [
        "SCB publicerar Sveriges nationalräkenskaper för tredje kvartalet fredagen den 27 november. Den officiella kalendern anger publicering klockan 08.00 som normal tid för ny statistik på myndighetens webbplats.",
        "BNP-utfallet blir viktigt för hur stark den svenska återhämtningen faktiskt var under sommaren och början av hösten. Det påverkar bedömningen av hushållens efterfrågan, investeringar och företagens försäljningsmiljö.",
        "Siffran behöver läsas tillsammans med sammansättningen. En positiv total BNP-förändring kan bygga på andra drivkrafter än privat konsumtion, och en svag totalsiffra kan dölja förbättringar i enskilda delar av ekonomin."
      ]
    },
    {
      heading: "Finland publicerar också BNP för tredje kvartalet",
      paragraphs: [
        "Finlands nästa nationalräkenskaper är också en av fredagens centrala nordiska datapunkter. Den finska investerarkalendern anger den 27 november för BNP-statistiken avseende tredje kvartalet.",
        "Statistikcentralens senaste publicerade kvartalsnivå visar att Finlands BNP ökade 0,3 procent från föregående kvartal under Q2, säsongrensat. Q3-utfallet visar om den försiktiga tillväxten fortsatte eller tappade fart.",
        "För nordiska investerare blir jämförelsen med Sverige användbar. Länderna möter delvis samma europeiska efterfrågan och räntemiljö, men industristruktur och hushållens läge gör att återhämtningen kan utvecklas olika."
      ]
    },
    {
      heading: "Vad har förändrats mot veckan som gick?",
      paragraphs: [
        "Förra veckans Norden-artiklar gav svar på flera bolagsfrågor: Frontline omsatte höga fraktrater i resultat och utdelning, medan NKT höll marginalen trots negativ organisk tillväxt.",
        "Nästa vecka börjar utan motsvarande verifierade utfall. Därför är den redaktionella prioriteringen framåtblickande: Cadeler först, Sectra därefter och nordisk BNP sist i veckan.",
        "Det nya är alltså inte en redan känd riktning för börsen. Det är en tydlig kalender över händelser som kan bekräfta eller försvaga bilden av operationell motståndskraft och förbättrad konjunktur."
      ]
    },
    {
      heading: "Så läser vi veckan",
      paragraphs: [
        "På måndag följer vi om Cadelers projektaktivitet också syns i intäkter, marginaler och kassaflöde. På onsdag flyttas fokus till Sectras tillväxtkvalitet och lönsamhet.",
        "På fredag jämför vi svensk och finsk BNP utan att göra ett enskilt kvartal till en permanent trend. Revideringar, lager och nettoexport kan påverka helhetsbilden.",
        "Inga framtida rapporttal, statistikutslag eller kursreaktioner ingår i söndagens artikel. Varje utfall kräver en ny kontroll mot respektive primärkälla när händelsen har inträffat."
      ]
    }
  ],
  sources: [
    {
      text: "Cadelers officiella IR-kalender med datum för presentationen av Q3 2026",
      href: "https://ir.cadeler.com/events-presentations/ir-calendar"
    },
    {
      text: "Sectras officiella evenemangssida med datum och tider för sexmånadersrapporten 2026/2027",
      href: "https://investor.sectra.com/event/sectras-six-month-report-2026-2027/"
    },
    {
      text: "SCB:s officiella publiceringskalender för Sveriges nationalräkenskaper avseende tredje kvartalet 2026",
      href: "https://www.scb.se/en/finding-statistics/publishing-calendar/?period=Forward1Year&prodKod=NR0103"
    },
    {
      text: "Statistikcentralens officiella sida för Finlands nationalräkenskaper med senaste kvartalsutfall och kommande statistikserie",
      href: "https://stat.fi/en/statistics/ntp"
    },
    {
      text: "SalkunRakentajas finska investerarkalender med publiceringsdatum för Finlands Q3-BNP",
      href: "https://www.salkunrakentaja.fi/sijoittajakalenteri/"
    }
  ]
};
