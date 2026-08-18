import type { NewsArticle } from "@/types/news";

/**
 * Bahnhof Q2 / H1 2026 — published 18 Aug 2026.
 *
 * Primary source: Bahnhof AB (publ), interim report January–June 2026,
 * including the Q2 income statement and cash-flow statement.
 * Editorial angle: growth remains positive, while Q2 profit and margin soften.
 * No old Q1 report figures are used as filler.
 *
 * Cover image uploaded by the editor to public/news-demo/:
 * file_00000000bdfc81f496784f507593fadb.png
 */
export const BAHNHOF_Q2_2026_VAXER_MARGINALEN_PRESSAS_ARTICLE: NewsArticle = {
  id: "bahnhof-q2-2026-vaxer-marginalen-pressas",
  slug: "bahnhof-q2-2026-vaxer-marginalen-pressas",
  title: "Bahnhof växer – men marginalen pressas i Q2",
  summary:
    "Bahnhof fortsätter växa. Under första halvåret steg omsättningen och rörelseresultatet med 7 procent. I själva Q2 ökade intäkterna, men vinsten och vinstmarginalen backade något.",
  category: "company",
  source: "DivLab",
  publishedAt: "2026-08-18T09:32:00+02:00",
  url: "/news/bahnhof-q2-2026-vaxer-marginalen-pressas",
  featured: true,
  imageUrl: "/news-demo/file_00000000bdfc81f496784f507593fadb.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "Bahnhof Q2 2026 i en mörk datacentermiljö med rubriken växer men marginalen pressas.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 4,
  seoTitle: "Bahnhof Q2 2026: Växer – men marginalen pressas",
  seoDescription:
    "Bahnhof växer i Q2 2026 och håller fast vid helårsprognosen. Samtidigt backar vinsten något och marginalen pressas. Här är det viktigaste i rapporten.",
  seoKeywords: [
    "Bahnhof",
    "Bahnhof Q2",
    "Bahnhof rapport",
    "Q2 2026",
    "Bahnhof aktie",
    "Telenor Bahnhof",
    "Bahnhof Bunker",
    "börsnyheter",
    "Stockholmsbörsen",
  ],
  showDisclaimer: true,
  intro: [
    "Bahnhof fortsätter växa under 2026. Under årets första sex månader steg omsättningen till 1 158,4 miljoner kronor och rörelseresultatet till 150,1 miljoner kronor. Båda är upp 7 procent jämfört med samma period förra året.",
    "Men Q2 visar också en svagare sida. Intäkterna ökade under kvartalet, medan vinsten efter skatt sjönk något och vinstmarginalen backade. Samtidigt håller Bahnhof fast vid prognosen för helåret.",
  ],
  sections: [
    {
      heading: "Q2: högre intäkter – men något lägre vinst",
      paragraphs: [
        "Bahnhofs totala intäkter under Q2 uppgick till 575,9 miljoner kronor, jämfört med 548,6 miljoner under samma kvartal förra året.",
        "Rörelseresultatet, EBIT, steg samtidigt till 71,6 miljoner kronor från 70,1 miljoner.",
        "Längre ner i resultaträkningen var utvecklingen svagare. Resultatet efter skatt blev 55,7 miljoner kronor, jämfört med 56,7 miljoner ett år tidigare. Resultatet per aktie sjönk från 0,53 till 0,52 kronor.",
        "Vinstmarginalen minskade också, från 13,2 till 12,6 procent. Bahnhof växer alltså fortfarande, men varje extra intäktskrona ger inte riktigt samma effekt på vinsten som för ett år sedan.",
      ],
    },
    {
      heading: "Första halvåret: både omsättning och EBIT upp 7 procent",
      paragraphs: [
        "Sett över hela första halvåret är bilden tydligt positiv. Omsättningen steg till 1 158,4 miljoner kronor från 1 085,0 miljoner, en ökning på 7 procent.",
        "Rörelseresultatet ökade samtidigt med 7 procent till 150,1 miljoner kronor. Resultatet efter skatt blev 117,9 miljoner kronor och resultatet per aktie 1,10 kronor.",
        "Nettomarginalen för halvåret blev 13,1 procent, jämfört med 13,4 procent under motsvarande period 2025. Tillväxten finns alltså kvar, men rapporten visar samtidigt en viss marginalpress.",
      ],
    },
    {
      heading: "Företagsaffären går starkt",
      paragraphs: [
        "En av rapportens starkaste delar är företagsmarknaden i Sverige. Omsättningen där steg till 358,2 miljoner kronor under första halvåret, en ökning med 9,5 procent.",
        "Bahnhof beskriver en hög efterfrågan på driftsäkra nät, datacenter och infrastruktur där kunder vill ha svensk eller europeisk kontroll över sin data.",
        "Bolaget uppger också att flera större affärer har tagits som väntas ge effekt under kommande kvartal. Det stärker bilden av företagsmarknaden som en viktig tillväxtmotor framåt.",
      ],
    },
    {
      heading: "Norge och Finland sticker ut rejält",
      paragraphs: [
        "Den snabbaste tillväxten finns utanför Sverige. Bahnhofs verksamhet i Nordeuropa omsatte 58,9 miljoner kronor under första halvåret, jämfört med 24,7 miljoner förra året.",
        "Det motsvarar en ökning på 139 procent. Norge stod för 39,6 miljoner kronor och Finland för 16,5 miljoner. Danmark bidrog med 2,6 miljoner medan Tyskland fortfarande är mycket litet.",
        "Bahnhof skriver dessutom att tillväxttakten i Finland under Q2 var dubbelt så hög som under samma kvartal 2025. Norge och Finland börjar därmed bli allt viktigare delar av koncernen.",
      ],
    },
    {
      heading: "Privatmarknaden bromsar",
      paragraphs: [
        "På privatmarknaden är utvecklingen mer blandad. Bahnhof hade 498 550 anslutna hushåll i Sverige vid utgången av juni.",
        "Under Q2 ökade kundbasen med 648 hushåll netto. Under samma kvartal förra året var ökningen 1 297 hushåll. Nettotillväxten har alltså ungefär halverats.",
        "Bahnhof beskriver fortsatt stark utveckling inom villor och bostadsrättsföreningar, men kallar situationen i öppna stadsnät utmanande. Bolaget pekar bland annat på högre priser från stora nätägare.",
      ],
    },
    {
      heading: "Kassan minskar – men utdelningen förklarar mycket",
      paragraphs: [
        "Vid halvårsskiftet hade Bahnhof 519,5 miljoner kronor i likvida medel, jämfört med 606,9 miljoner vid årsskiftet.",
        "Det totala kassaflödet under Q2 blev -169,3 miljoner kronor. Samtidigt genererade den löpande verksamheten ett positivt kassaflöde på 72,0 miljoner kronor.",
        "Den stora förklaringen till att kassan minskade är utdelningen på 215,1 miljoner kronor. Bahnhof investerade dessutom 26,2 miljoner kronor under kvartalet.",
        "Det är därför viktigt att skilja på den löpande verksamheten, som fortsätter generera pengar, och det totala kassaflödet som påverkas kraftigt av utdelning och investeringar.",
      ],
    },
    {
      heading: "Bahnhof Bunker tar form i Göteborg",
      paragraphs: [
        "Bahnhof fortsätter samtidigt sin stora datacentersatsning Bahnhof Bunker i Göteborg. Anläggningen byggs i ett cirka 6 000 kvadratmeter stort bergrum och ska rikta sig mot kunder med höga krav på både digital och fysisk säkerhet.",
        "De första potentiella storkunderna har redan tagits emot på plats. Bahnhof planerar att ta de första delarna av anläggningen i drift under Q1 2027.",
        "Satsningen är en del av bolagets ambition att växa inom datacenter, molntjänster och avancerad infrastruktur för bland annat mer beräkningskrävande system.",
      ],
    },
    {
      heading: "Helårsprognosen står fast",
      paragraphs: [
        "Trots den något svagare marginalen gör Bahnhof ingen förändring av sin prognos för 2026.",
        "Bolaget räknar fortsatt med en omsättning på omkring 2,4 miljarder kronor och en EBIT-marginal på drygt 12 procent för helåret.",
        "Prognosen bygger på fortsatt stark tillväxt på företagsmarknaden och fortsatt expansion bland villa- och BRF-kunder.",
      ],
    },
    {
      heading: "Telenor väntar i bakgrunden",
      paragraphs: [
        "Rapporten kommer samtidigt i ett ovanligt läge. Efter kvartalets slut lade Telenor ett bud om att förvärva en majoritetsandel i Bahnhof.",
        "Affären kräver myndighetsgodkännande och Bahnhof skriver att ett besked kan komma under hösten 2026.",
        "Bolagets avsikt är att Bahnhof ska fortsätta drivas med sitt varumärke, sina snabba fibertjänster, nordiska datacenter och sin integritetsprofil även om affären genomförs. En ny ägare skulle samtidigt kunna öppna för kompletterande erbjudanden som mobiltelefoni och fler tv-tjänster.",
      ],
    },
    {
      heading: "DivLabs sammanfattning",
      paragraphs: [
        "Bahnhofs Q2 är i grunden stabil. Intäkterna och rörelseresultatet ökar, företagsaffären växer och expansionen i Norge och Finland sticker ut rejält.",
        "Men rapporten är inte stark på alla punkter. Vinsten efter skatt sjunker något i Q2, vinstmarginalen pressas och privatkundstillväxten är betydligt långsammare än för ett år sedan.",
        "Det viktigaste framåt blir därför om Bahnhof kan fortsätta växa samtidigt som marginalerna försvaras. Och över hela rapporten ligger förstås Telenoraffären, som kan förändra ägarbilden i bolaget redan under hösten.",
      ],
    },
  ],
};
