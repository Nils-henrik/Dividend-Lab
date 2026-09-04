import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 4 September 2026.
 *
 * Editorial research cutoff: 08:37 CEST, 4 September 2026.
 * Primary-source anchors:
 * - Sectra Q1 2026/27, published 08:15 CEST: sales SEK 963m (+25.8%),
 *   operating profit SEK 191m (+60.9%), operating margin 19.8% (15.5%).
 * - Sectra recurring revenue SEK 723m (+31.7%); cloud recurring revenue
 *   SEK 315m (+75.3%) and SEK 1,051m on a rolling 12-month basis.
 * - Contracted order bookings SEK 699m (-46.6%); cash flow from operations
 *   SEK 3m (118m).
 * - Prisma Properties: ten-year Lidl lease for about 1,900 sqm in Lysekil,
 *   conditional on the land acquisition and the detailed development plan.
 *
 * Market status at cutoff: Nasdaq Stockholm had not yet opened. No Sectra
 * share-price reaction is therefore stated as fact in this morning edition.
 *
 * Cover uploaded by editor:
 * public/news-demo/file_000000001f1c82108cddd2cc6bd51604.png
 */
export const BORSSVERIGE_4_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-4-september-2026-sectra",
  slug: "borssverige-4-september-2026-sectra",
  title:
    "BörsSverige 4 september: Sectra lyfter resultatet – molnintäkterna rusar",
  summary:
    "Sectra ökar omsättningen med 26 procent och rörelseresultatet med 61 procent i Q1. Samtidigt faller orderingången kraftigt och kassaflödet försvagas – två punkter som ger rapporten en tydlig motvikt inför börsöppningen.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-09-04T08:37:00+02:00",
  url: "/news/borssverige-4-september-2026-sectra",
  featured: true,
  imageUrl: "/news-demo/borssverige-2026-09-04-sectra.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "BörsSverige 4 september 2026 med Sectras Q1-rapport i fokus inför Stockholmsbörsens öppning.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 5,
  seoTitle: "BörsSverige 4 september: Sectra lyfter resultatet",
  seoDescription:
    "Sectra ökar omsättningen med 26 procent och rörelseresultatet med 61 procent i Q1 2026/27. Samtidigt faller orderingången kraftigt inför Stockholmsbörsens öppning.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen idag",
    "börsen idag",
    "svenska börsnyheter",
    "svenska aktier",
    "Sectra",
    "Sectra rapport",
    "Sectra Q1 2026/27",
    "Sectra aktie",
    "molntjänster",
    "Prisma Properties",
    "Lidl",
    "4 september 2026",
  ],
  internalLinking: {
    topics: [
      "Stockholmsbörsen",
      "kvartalsrapporter",
      "medicinsk IT",
      "molntjänster",
      "handelsfastigheter",
    ],
    companies: ["Sectra", "Prisma Properties"],
    tickers: ["SECT B", "PRISMA"],
    relatedNewsSlugs: [
      "norden-i-centrum-4-september-2026",
      "borssverige-2-september-2026",
      "norden-i-centrum-3-september-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Sectra står i centrum för fredagens BörsSverige efter en Q1-rapport med kraftig tillväxt i både försäljning och resultat. Nettoomsättningen steg 25,8 procent och rörelseresultatet 60,9 procent jämfört med samma kvartal förra året, samtidigt som återkommande intäkter från molntjänster ökade med 75,3 procent.",
    "Rapporten är samtidigt inte entydigt stark. Den kontrakterade orderingången föll 46,6 procent och kassaflödet från den löpande verksamheten sjönk till 3 miljoner kronor. Researchen för den här morgonupplagan stängdes klockan 08.37, före Stockholmsbörsens öppning, vilket betyder att någon kursreaktion på Sectra ännu inte går att slå fast.",
  ],
  sections: [
    {
      heading: "Sectra ökar omsättningen med 26 procent",
      paragraphs: [
        "Sectras första kvartal i räkenskapsåret 2026/27 omfattar maj till juli. Nettoomsättningen ökade till 963 miljoner kronor från 766 miljoner kronor ett år tidigare, en uppgång på 25,8 procent.",
        "Rörelseresultatet steg samtidigt till 191 miljoner kronor från 119 miljoner, motsvarande en ökning på 60,9 procent. Rörelsemarginalen förbättrades till 19,8 procent från 15,5 procent.",
        "Resultatet för perioden blev 158 miljoner kronor, jämfört med 103 miljoner kronor, och resultatet per aktie ökade till 0,82 kronor från 0,53 kronor.",
        "Det är framför allt Sectras verksamhet för medicinsk bildhantering som driver förbättringen. Imaging IT Solutions ökade omsättningen med 30,5 procent till 868 miljoner kronor och rörelseresultatet med 76,8 procent till 201 miljoner kronor.",
      ],
    },
    {
      heading: "Molntjänsterna passerar miljardgränsen",
      paragraphs: [
        "Den tydligaste långsiktiga förändringen i rapporten är hur snabbt de återkommande intäkterna växer. De uppgick till 723 miljoner kronor under kvartalet, 31,7 procent mer än ett år tidigare.",
        "Av dessa kom 315 miljoner kronor från molntjänster. Det är en ökning på 75,3 procent från 179 miljoner kronor i jämförelsekvartalet.",
        "Mätt över de senaste tolv månaderna uppgår de återkommande molnintäkterna nu till 1 051 miljoner kronor. Det är första gången Sectra passerar en miljard kronor på den nivån.",
        "För bolaget är utvecklingen viktig eftersom en större del av försäljningen då kommer från löpande tjänsteintäkter i stället för enskilda licenser och projektleveranser. Det kan på sikt göra intäkterna jämnare mellan kvartalen.",
        "Sectra uppger att fler stora kunder nu går från beställning till faktisk drift. Utrullningar fortsätter bland annat i Skottland, USA och Kanada, och bolaget har under det senaste halvåret förstärkt organisationen framför allt i USA för att kunna genomföra fler driftsättningar.",
      ],
    },
    {
      heading: "Orderingången faller – kassaflödet nära noll",
      paragraphs: [
        "Den största motvikten i rapporten är orderingången. Den kontrakterade orderingången minskade 46,6 procent till 699 miljoner kronor från 1 310 miljoner kronor. Den garanterade delen av orderingången sjönk samtidigt till knappt 600 miljoner kronor från 1 192 miljoner.",
        "Sectra betonar att stora och långvariga kundavtal gör orderingången ojämn mellan kvartalen. Sett över de senaste tolv månaderna uppgår den kontrakterade orderingången till 6 989 miljoner kronor, vilket fortfarande ligger klart över koncernens årsomsättning på 3 542 miljoner kronor för 2025/26.",
        "Det betyder att kvartalets nedgång är relevant att bevaka, men att den inte ensam beskriver efterfrågan eller storleken på den befintliga orderstocken.",
        "Även kassaflödet sticker ut. Kassaflödet från den löpande verksamheten föll till 3 miljoner kronor från 118 miljoner kronor ett år tidigare. Bolaget förklarar förändringen främst med mer kapital bundet i kortfristiga fordringar och reglering av kortfristiga skulder.",
        "Vid kvartalets slut hade Sectra 1 752 miljoner kronor i likvida medel. Resultaträkningen visar alltså en tydlig förbättring, medan kassaflödet just under det här kvartalet utvecklades betydligt svagare.",
      ],
    },
    {
      heading: "Secure Communications pressar åt andra hållet",
      paragraphs: [
        "Utvecklingen är betydligt svagare inom Secure Communications, Sectras verksamhet för säker kommunikation och cybersäkerhet.",
        "Omsättningen minskade 3,8 procent till 89 miljoner kronor. Rörelseresultatet föll från 11 miljoner kronor till 1 miljon och rörelsemarginalen sjönk från 11,7 till 0,9 procent.",
        "Sectra kopplar försämringen till framtidsinvesteringar och förseningar i ett pågående utvecklingsuppdrag efter ändrade kundkrav. Serieproduktionen i projektet har startat och bolaget uppger att produktionen nu successivt trappas upp.",
        "Det gör fredagens rapport tudelad. Medicinsk IT och molntjänster växer snabbt och lyfter koncernens resultat, medan Secure Communications och det svaga kassaflödet visar att alla delar inte utvecklas lika starkt.",
      ],
    },
    {
      heading: "Prisma tecknar tioårigt avtal med Lidl",
      paragraphs: [
        "Utanför rapportfloden kommer även ett nytt svenskt fastighetsbesked. Prisma Properties har tecknat ett tioårigt hyresavtal med Lidl för en ny livsmedelsbutik i Lysekil.",
        "Butiken planeras få en uthyrningsbar yta på cirka 1 900 kvadratmeter och blir enligt bolaget Lidls första etablering i kommunen.",
        "Avtalet är dock villkorat. Prismas köp av marken måste genomföras och den nya detaljplanen måste vinna laga kraft innan projektet kan gå vidare fullt ut.",
        "Nuvarande plan är byggstart under våren 2027 och färdigställande under Q2 2028. Beskedet är därför i första hand ett långsiktigt tillskott till Prismas projektportfölj, inte en färdig fastighet som omedelbart börjar bidra till intjäningen.",
      ],
    },
    {
      heading: "Det här blir viktigt när Stockholmsbörsen öppnar",
      paragraphs: [
        "Sectra är fredagsmorgonens tydligaste svenska rapportpunkt. På plus-sidan finns 26 procents omsättningstillväxt, 61 procents högre rörelseresultat och en mycket snabb ökning av de återkommande molnintäkterna.",
        "På den andra sidan står den nästan halverade orderingången, kassaflödet på endast 3 miljoner kronor och den svaga utvecklingen inom Secure Communications.",
        "Vilken del marknaden väljer att väga tyngst blir synligt först efter Stockholmsbörsens öppning klockan 09.00. Klockan 10.00 presenterar vd Torbjörn Kronander och finanschef Jessica Holmquist rapporten och svarar på frågor, vilket blir nästa naturliga hållpunkt för den som följer bolaget under förmiddagen.",
        "För dagens BörsSverige är slutsatsen därför mer nyanserad än att rapporten bara är stark eller svag: Sectras kärnverksamhet inom medicinsk IT växer snabbt och lönsamheten förbättras, men orderingång och kassaflöde ger investerare tydliga frågor att väga mot tillväxten.",
      ],
    },
  ],
};
