import type { NewsArticle } from "@/types/news";

/**
 * Approved Börsnyheter article — do not rewrite body copy.
 *
 * Verified figures (31 July 2026):
 * - Amazon Q2 2026 (IR, 30 July 2026): net sales $200.6B (+20% YoY);
 *   operating income $27.5B (+43%); AWS sales $42.2B (+37%, fastest in 18
 *   quarters); AWS operating income $16.6B; TTM free cash flow outflow $7.6B
 *   (vs +$18.2B prior year); 2026 capex guided ~$220B (CEO/earnings coverage);
 *   AWS backlog ~$496B (earnings call coverage).
 * - Amazon close 31 July 2026: +15.32% to $271.58 (Nasdaq/MarketScreener).
 * - Micron FQ3 2026 (ended 28 May 2026; IR/SEC 24 June 2026): revenue $41.46B;
 *   GAAP gross margin 84.6% / non-GAAP 84.9%; GAAP net income $28.24B.
 * - Micron 30 July 2026: +18.36% to $874.66; 31 July 2026: about −5.9% to
 *   ~$823 (market data feeds).
 * - Apple CEO Tim Cook (30 July 2026 earnings call): “100-year flood” on
 *   memory pricing; DRAM market concentrated around three suppliers.
 *
 * Cover: original DivLab editorial composite (AI background + official logos
 * + Inter typography). See amazon-rusar-micron-tvavander-ai.license.txt.
 */
export const AMAZON_RUSAR_MICRON_TVAVANDER_AI_BOOMEN_WALL_STREET_ARTICLE: NewsArticle =
  {
    id: "amazon-rusar-micron-tvavander-ai-boomen-wall-street",
    slug: "amazon-rusar-micron-tvavander-ai-boomen-wall-street",
    title:
      "Amazon rusar – Micron tvärvänder när AI-boomen skakar Wall Street",
    summary:
      "Amazon rusar efter stark tillväxt i AWS samtidigt som Micron tvärvänder efter en våldsam uppgång. Båda aktierna påverkas av samma AI-boom – men marknaden bedömer riskerna helt olika.",
    category: "market",
    source: "DivLab",
    publishedAt: "2026-07-31T22:30:00+02:00",
    url: "/news/amazon-rusar-micron-tvavander-ai-boomen-wall-street",
    featured: true,
    imageUrl: "/news-demo/amazon-rusar-micron-tvavander-ai.png",
    thumbnailImageUrl:
      "/news-demo/amazon-rusar-micron-tvavander-ai-thumbnail.png",
    imageAlt:
      "Amazon- och Micron-logotyper framför datacenter och minneschip med stigande och fallande börskurvor.",
    imageCaption: "Illustration: DivLab.",
    readingMinutes: 4,
    seoTitle: "Amazon rusar och Micron faller – AI-boomen skakar Wall Street",
    seoDescription:
      "Amazon stiger kraftigt efter stark AWS-tillväxt medan Micron tvärvänder. Så hänger aktiernas dramatiska rörelser ihop med AI, datacenter och minnesbrist.",
    seoKeywords: [
      "Amazon",
      "AWS",
      "Micron",
      "AI",
      "Wall Street",
      "datacenter",
      "minneskretsar",
      "halvledare",
      "kvartalsrapport",
      "börsen",
    ],
    showDisclaimer: true,
    intro: [
      "Amazon rusar efter en rapport som gav nytt bränsle åt AI-handeln. Samtidigt faller minnestillverkaren Micron kraftigt – bara ett dygn efter en stor uppgång.",
      "Bakom de motsatta rörelserna finns egentligen samma fråga: Hur mycket är världens största teknikbolag beredda att betala för artificiell intelligens?",
      "Fredagens handel på Wall Street visar hur snabbt humöret kan förändras. Amazon belönas när bolaget kan visa att de enorma investeringarna i datacenter redan bidrar till växande intäkter. Micron pressas när investerarna börjar fundera över hur länge dagens extrema efterfrågan och höga minnespriser kan fortsätta.",
    ],
    sections: [
      {
        heading: "Samma AI-affär – två helt olika reaktioner",
        paragraphs: [
          "Bolagen befinner sig på varsin sida av samma affär.",
          "Amazon bygger datacenter och köper den avancerade utrustning som krävs för att driva AI-modeller. Micron tillverkar minneskretsar som hjälper servrarna att behandla stora mängder data snabbt.",
          "När Amazon investerar mer kan det därför innebära större efterfrågan på Microns produkter. Men just nu räcker det inte att bara vara en vinnare på AI. Marknaden vill också se bevis på att investeringarna ger resultat.",
          "På fredagen steg Amazon omkring 15 procent. Micron, som dagen innan rusat omkring 18 procent, vände ned med ungefär 6 procent.",
        ],
      },
      {
        heading: "Amazon visar att AI redan ger intäkter",
        paragraphs: [
          "Den viktigaste delen av Amazons rapport var utvecklingen inom Amazon Web Services, AWS.",
          "AWS är Amazons verksamhet för molntjänster. Företag och myndigheter hyr datorkraft, lagring och AI-tjänster från Amazons datacenter i stället för att själva behöva bygga all teknisk infrastruktur.",
          "Molnverksamheten ökade med 37 procent till 42,2 miljarder dollar – den snabbaste tillväxten på 18 kvartal. Det gav investerarna större förtroende för att Amazons AI-satsningar redan bidrar till ökade intäkter.",
          "Hela koncernens omsättning steg 20 procent till 200,6 miljarder dollar. Rörelseresultatet, det vill säga resultatet från den löpande verksamheten före räntor och skatt, ökade 43 procent till 27,5 miljarder dollar.",
          "AWS är dessutom betydligt mer lönsamt än stora delar av Amazons e-handel. När molnverksamheten växer snabbt får det därför stor betydelse för hela koncernens resultat.",
          "Oron har varit att teknikjättarnas kostnader för datacenter, AI-chip och minne ska öka snabbare än kundernas betalningsvilja. Amazons rapport gav stöd åt motsatsen: efterfrågan är fortsatt hög, samtidigt som bolaget fortfarande bygger ut kapacitet.",
        ],
      },
      {
        heading: "Investeringarna fortsätter att växa",
        paragraphs: [
          "Amazon planerar samtidigt att fortsätta investera kraftigt. Bolaget räknar med investeringar på omkring 220 miljarder dollar under 2026.",
          "Det innebär högre kostnader för servrar, nätverksutrustning, avancerade processorer och minneskretsar. Det fria kassaflödet – pengarna som blir kvar efter nödvändiga investeringar – var negativt med 7,6 miljarder dollar under de senaste tolv månaderna, jämfört med ett plus på 18,2 miljarder dollar året innan.",
          "Marknaden accepterar för tillfället den höga notan eftersom AWS fortsätter växa. Här blir kopplingen till Micron tydlig.",
          "AI-servrar behöver betydligt mer och snabbare minne än vanliga servrar. När Amazon, Microsoft, Google och andra molnbolag bygger ut sina datacenter ökar därför efterfrågan på Microns produkter.",
          "Micron konkurrerar framför allt med Samsung och SK Hynix på en marknad där det tar lång tid och kostar mycket pengar att bygga ny produktion. Om efterfrågan stiger snabbare än tillgången kan minnestillverkarna höja priserna kraftigt.",
        ],
      },
      {
        heading: "Micron har blivit en stor vinnare på AI-boomen",
        paragraphs: [
          "Microns verksamhet har förändrats dramatiskt när efterfrågan på avancerat minne har ökat.",
          "Bolaget säljer bland annat högbandbreddsminne, HBM, som används tillsammans med de kraftfulla processorer som driver AI-modeller. När datacentren byggs ut behöver kunderna både fler AI-chip och större mängder snabbt minne.",
          "I det senaste rapporterade kvartalet, som avslutades den 28 maj, redovisade Micron intäkter på 41,5 miljarder dollar. Bruttomarginalen – andelen av försäljningen som blir kvar efter de direkta tillverkningskostnaderna – låg omkring 85 procent.",
          "Aktien har därför blivit en av AI-handelns mest omtalade halvledaraktier. Men den snabba uppgången har också gjort förväntningarna mycket höga.",
          "Efter torsdagens kursrusning på omkring 18 procent vände Micron ned på fredagen. Nedgången betyder inte att efterfrågan på minne plötsligt har försvunnit. Den visar snarare hur känslig aktien har blivit när mycket optimism redan finns inbakad i värderingen.",
        ],
      },
      {
        heading: "Varför faller Micron när efterfrågan är stark?",
        paragraphs: [
          "En förklaring är vanlig vinsthemtagning efter en mycket kraftig uppgång. Men marknaden funderar också över hur länge dagens höga minnespriser kan hålla.",
          "För Micron är stigande priser mycket lönsamma. För kunder som Amazon, Apple och andra stora teknikköpare blir de samtidigt en växande kostnad.",
          "Apples vd Tim Cook beskrev i bolagets rapport den 30 juli läget som en extrem prispress på minnesmarknaden och pekade på att utbudet i praktiken styrs av ett fåtal stora leverantörer. När priserna stiger kraftigt ökar kundernas motivation att hitta fler leverantörer, förhandla hårdare eller använda minnet effektivare.",
          "Dagens starka efterfrågan kan därför tolkas på två sätt. Den visar att Micron har goda möjligheter att tjäna mycket pengar. Men den ökar också risken för att kunder, konkurrenter och nya investeringar på sikt förändrar balansen mellan tillgång och efterfrågan.",
          "Minnesmarknaden har historiskt rört sig i tydliga cykler. Perioder av brist och höga priser har ofta följts av utbyggd produktion, större utbud och pressade marginaler. Det är den risken marknaden försöker bedöma.",
        ],
      },
      {
        heading: "Två aktier i samma AI-ekonomi",
        paragraphs: [
          "Amazon och Micron representerar två olika delar av AI-boomen.",
          "Amazon investerar enorma belopp för att sälja datorkraft, molnkapacitet och AI-tjänster. Micron säljer en av komponenterna som gör utbyggnaden möjlig.",
          "Amazon belönas när bolaget kan visa tydlig tillväxt från AWS. Micron pressas när investerarna frågar hur länge den exceptionella lönsamheten på minnesmarknaden kan bestå.",
          "Framöver bevakas särskilt om Amazons molntillväxt håller i sig trots de stora utgifterna, och om Microns höga priser och marginaler klarar nästa rapportperiod.",
          "Så länge AI-datacentren fortsätter att byggas kommer båda bolagen att stå i centrum. Men veckans kursrörelser visar också hur höga förväntningarna har blivit – minsta tvekan kan flytta enorma börsvärden på bara några timmar.",
        ],
      },
    ],
  };
