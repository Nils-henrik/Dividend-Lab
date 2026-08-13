import type { NewsArticle } from "@/types/news";

/**
 * Börsnyheter — 13 August 2026.
 * Intraday article. Market levels are snapshots from Thursday afternoon and may
 * change before the US close.
 */
export const WALL_STREET_REKORDNIVA_SVALARE_INFLATION_TECHAKTIERNA_ARTICLE: NewsArticle = {
  id: "wall-street-rekordniva-svalare-inflation-techaktierna",
  slug: "wall-street-rekordniva-svalare-inflation-techaktierna",
  title: "Wall Street på rekordnivå – svalare inflation sätter fart på techaktierna",
  summary:
    "S&P 500 har nått en ny rekordnivå efter ett bättre inflationsbesked än väntat. Fallande oljepris och lägre marknadsräntor ger stöd åt börsen, medan Cisco rasar efter sin rapport.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-13T18:25:00+02:00",
  url: "/news/wall-street-rekordniva-svalare-inflation-techaktierna",
  featured: true,
  imageUrl: "/news-demo/file_000000000cd481f490eaf05c20ba7c0c.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  mobileHeadlineFirst: true,
  imageAlt:
    "Wall Street i New York med amerikanska flaggor, börsskärm och DivLab-omslag för rekordbörsen den 13 augusti 2026.",
  readingMinutes: 6,
  seoTitle: "Wall Street på rekordnivå – svalare inflation lyfter tech",
  seoDescription:
    "S&P 500 når ny rekordnivå när USA:s producentinflation blir lägre än väntat. Läs om Fed, oljepriset, Microsoft, Nvidia och Ciscos kursras.",
  seoKeywords: [
    "Wall Street",
    "S&P 500",
    "Nasdaq",
    "USA-börsen",
    "USA inflation",
    "PPI USA",
    "Federal Reserve",
    "Fed ränta",
    "Microsoft aktie",
    "Nvidia aktie",
    "Cisco aktie",
    "oljepris",
    "börsnyheter",
  ],
  showDisclaimer: true,
  intro: [
    "S&P 500 har nått en ny rekordnivå under torsdagens handel efter ännu ett inflationsbesked som var bättre än väntat. Fallande oljepris och lägre marknadsräntor gav ytterligare stöd åt börsen.",
    "Uppgången har samtidigt tappat lite fart under eftermiddagen i New York. S&P 500 låg omkring 0,5 procent högre och Nasdaq cirka 0,6 procent upp, medan Dow Jones hade vänt ned omkring 0,2 procent.",
    "Samtidigt sticker Cisco ut rejält på nedsidan. Aktien har fallit omkring 9 procent efter rapporten trots att bolaget räknar med högre intäkter än analytikerna tidigare väntat sig.",
  ],
  sections: [
    {
      heading: "Inflationen kom in bättre än väntat",
      paragraphs: [
        "USA:s producentprisindex, PPI, visade att priserna hos amerikanska producenter steg 4,7 procent i juli jämfört med samma månad förra året. Marknaden hade väntat sig omkring 4,9 procent.",
        "Det var dessutom en tydlig nedgång från juni, då producentinflationen låg på 5,5 procent.",
        "Det är fortfarande en hög nivå, men riktningen är viktig för börsen. Producentpriserna kan ge en tidig signal om hur kostnaderna utvecklas längre fram i ekonomin. Om företagens kostnadstryck minskar blir risken mindre för att inflationen fortsätter bita sig fast.",
        "Och det påverkar i sin tur Federal Reserve.",
      ],
    },
    {
      heading: "Marknaden tror allt mindre på en räntehöjning",
      paragraphs: [
        "Efter torsdagens inflationssiffra minskade förväntningarna på att den amerikanska centralbanken ska höja räntan vid sitt nästa möte i september.",
        "Marknaden prissätter nu ungefär 34 procents sannolikhet för en räntehöjning, vilket innebär att sannolikheten för oförändrad ränta ligger runt två tredjedelar. För bara två dagar sedan låg sannolikheten för en höjning omkring 50 procent.",
        "Även räntemarknaden reagerade. Räntan på den amerikanska tioåriga statsobligationen föll till omkring 4,64 procent, från 4,68 procent på onsdagen.",
        "Det är positivt för aktiemarknaden, och särskilt för högt värderade tillväxtbolag. När marknadsräntorna sjunker blir framtida vinster mer värdefulla i investerarnas kalkyler.",
      ],
    },
    {
      heading: "Tech lyfte börsen – men uppgången har svalnat",
      paragraphs: [
        "De stora teknikbolagen gav S&P 500 och Nasdaq en tydlig skjuts under början av handeln.",
        "Microsoft var tidigare upp omkring 1,4 procent medan Nvidia steg runt 0,6 procent. Under eftermiddagen i New York har rörelserna däremot blivit betydligt mindre.",
        "Microsoft handlas senare under dagen omkring 0,5 procent högre, medan Nvidia i princip ligger oförändrat för dagen.",
        "Det förändrar inte huvudbilden: stora teknikbolag var en viktig anledning till att S&P 500 kunde sätta nytt rekord. Men utvecklingen visar också att den första entusiasmen efter inflationsbeskedet har mattats något.",
      ],
    },
    {
      heading: "Oljepriset ger börsen hjälp",
      paragraphs: [
        "Ytterligare stöd kommer från oljemarknaden. Brentoljan föll under torsdagen tillbaka till omkring 88 dollar per fat efter flera dagar av uppgång.",
        "Det är extra viktigt just nu. Den kraftiga turbulensen på oljemarknaden under sommaren har ökat oron för att dyrare energi ska driva upp inflationen på nytt.",
        "När oljepriset i stället faller minskar en del av det trycket. För Federal Reserve blir kombinationen därför betydligt behagligare: lägre producentinflation samtidigt som energipriserna rör sig åt rätt håll.",
      ],
    },
    {
      heading: "Cisco-raset blir allt större",
      paragraphs: [
        "Mitt i den positiva börsdagen sticker Cisco ut rejält. Aktien föll omkring 7 procent tidigare under handeln men nedgången har därefter fördjupats till omkring 9 procent.",
        "Det sker trots att bolagets rapport på flera punkter var stark. Cisco räknar med intäkter på mellan 72,2 och 73,4 miljarder dollar under räkenskapsåret 2027, vilket är över analytikernas tidigare genomsnittliga prognos.",
        "Bolaget berättade dessutom att beställningarna på AI-infrastruktur från de största molnbolagen uppgick till 4 miljarder dollar under det senaste kvartalet.",
        "Problemet ligger snarare i lönsamheten. Cisco räknar med en justerad bruttomarginal på 65–66 procent under det kommande kvartalet, något under marknadens förväntningar. Högre komponentkostnader och en mer hårdvarutung försäljning pressar marginalerna.",
        "Kursreaktionen visar hur högt ribban ligger för AI-relaterade bolag. Bra resultat räcker inte alltid när mycket optimism redan finns inbakad i aktiekursen.",
      ],
    },
    {
      heading: "Rekordbörsen får stöd från flera håll",
      paragraphs: [
        "Torsdagens handel innehåller flera positiva pusselbitar samtidigt. Inflationen hos producenterna kom in lägre än väntat, marknaden tror mindre på en räntehöjning från Federal Reserve, den amerikanska tioårsräntan sjunker och oljepriset har vänt ned.",
        "Det har varit tillräckligt för att lyfta S&P 500 till en ny rekordnivå.",
        "Men handelsdagen visar också att investerarna fortfarande är kräsna. Cisco kan leverera stigande intäkter och miljardbeställningar kopplade till AI och ändå tappa omkring 9 procent när marginalerna inte imponerar.",
        "Det är kanske den tydligaste bilden av Wall Street just nu: indexen står på rekordnivå – men under ytan är kraven på bolagen fortfarande mycket höga.",
      ],
    },
  ],
};
