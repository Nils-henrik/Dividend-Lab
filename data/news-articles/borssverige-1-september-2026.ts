import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 1 September 2026.
 *
 * Editorial research cutoff: 07:22 CEST, 1 September 2026.
 * Verified editorial anchors:
 * - Mycronic: new 2032-2035 target of SEK 20bn net sales and ~25% EBIT margin;
 *   2026 sales outlook ~SEK 9.25bn; H1 order intake SEK 5,446m and EBIT SEK 1,636m.
 * - Mycronic market reaction: shares closed 31 Aug at SEK 325.80, down 3.67%.
 * - KEO Capital Q2: net operating income USD 1.597m; average outstanding portfolio
 *   USD 45.6m; TPV USD 51.4m; continuing-operations net loss USD 48.085m, heavily
 *   affected by stock-based compensation and share-settled expenses.
 * - Swedbank/Silf: July manufacturing PMI 55.8; August PMI scheduled 08:30 CEST today.
 * - Riksbank: policy rate 1.75% from 26 Aug; Per Jansson said 31 Aug that inflation
 *   risks have increased somewhat but there is scope to wait before adjusting policy.
 * - Netel: webcast 14:00 CEST today on the rights issue and planned merger with Infrea.
 *
 * Cover:
 * public/news-demo/borssverige-2026-09-01.png
 */
export const BORSSVERIGE_1_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-1-september-2026",
  slug: "borssverige-1-september-2026",
  title:
    "BörsSverige 1 september: Mycronic siktar på 20 miljarder – KEO Capital redovisar stor Q2-förlust",
  summary:
    "Mycronic har satt målet att nå 20 miljarder kronor i omsättning med fortsatt hög lönsamhet. Samtidigt redovisar KEO Capital en Q2-förlust på 48,1 miljoner dollar, medan svensk industri-PMI väntas klockan 08.30.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-09-01T07:22:00+02:00",
  url: "/news/borssverige-1-september-2026",
  featured: true,
  imageUrl: "/news-demo/borssverige-2026-09-01.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "BörsSverige 1 september 2026 med Stockholm i morgonljus inför dagens handel på Stockholmsbörsen.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 5,
  seoTitle:
    "BörsSverige 1 september 2026 – Mycronic, KEO Capital och svensk PMI",
  seoDescription:
    "Mycronic siktar på 20 miljarder i omsättning, KEO Capital redovisar en stor Q2-förlust och svensk industri-PMI publiceras klockan 08.30.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen idag",
    "börsnyheter idag",
    "svenska aktier",
    "Mycronic",
    "Mycronic finansiella mål",
    "KEO Capital Q2 2026",
    "KEO Capital",
    "svensk PMI",
    "inköpschefsindex Sverige",
    "Riksbanken",
    "Netel Infrea",
    "1 september 2026",
  ],
  internalLinking: {
    topics: [
      "Stockholmsbörsen",
      "svensk industri",
      "Q2 2026",
      "Riksbanken",
      "kapitalmarknadsdag",
    ],
    companies: ["Mycronic", "KEO Capital", "Netel", "Infrea"],
    tickers: ["MYCR", "KEOC", "NETEL", "INFREA"],
    relatedNewsSlugs: [
      "borssverige-31-augusti-2026",
      "norden-i-centrum-1-september-2026",
      "borsvecka-36-2026-jobbrapport-broadcom-euroinflation",
    ],
  },
  showDisclaimer: true,
  intro: [
    "September börjar med flera tydliga svenska hållpunkter. Mycronic har satt ett långsiktigt mål om 20 miljarder kronor i omsättning, medan KEO Capital efter måndagens börsstängning redovisade en Q2-förlust på 48,1 miljoner dollar. Klockan 08.30 kommer dessutom augustis inköpschefsindex för svensk industri.",
    "Det här är en morgonartikel och researchen stängdes klockan 07.22, före både PMI-siffran och Stockholmsbörsens öppning. Därför gör DivLab inga antaganden om dagens kursrörelser. I stället ligger fokus på de besked som redan är kända och de svenska frågor som faktiskt kan sätta tonen under dagen.",
  ],
  sections: [
    {
      heading: "Mycronic siktar på 20 miljarder – och vill behålla hög lönsamhet",
      paragraphs: [
        "Mycronic presenterade i samband med måndagens kapitalmarknadsdag nya finansiella mål för perioden fram till 2032–2035. Nettoomsättningen ska nå 20 miljarder kronor och rörelsemarginalen ska ligga kvar kring 25 procent. Kravet att varje division ska nå en rörelsemarginal över 10 procent ligger också fast.",
        "Målet är offensivt i förhållande till dagens storlek. Mycronic räknar med en omsättning på omkring 9,25 miljarder kronor under 2026. Under första halvåret uppgick omsättningen till 4 919 miljoner kronor, orderingången till 5 446 miljoner och rörelseresultatet till 1 636 miljoner kronor. Rörelsemarginalen var 33 procent.",
        "Det innebär att bolaget vill mer än fördubbla årsomsättningen under de kommande åren utan att släppa den höga lönsamheten. För marknaden blir det därför lika viktigt att följa marginalerna som själva tillväxttakten när Mycronic investerar för att bli större.",
        "Aktien föll 3,67 procent på måndagen och stängde på 325,80 kronor. Nedgången kom samma dag som de nya målen presenterades, men det går inte att slå fast att målen ensamma orsakade kursrörelsen. Aktien hade samtidigt stigit under flera handelsdagar inför kapitalmarknadsdagen.",
      ],
    },
    {
      heading: "KEO Capital redovisar 48,1 miljoner dollar i Q2-förlust",
      paragraphs: [
        "KEO Capital publicerade sin Q2-rapport klockan 18.15 på måndagen, alltså efter Stockholmsbörsens stängning. Rapporten blir därför en av tisdagens färskaste svenska bolagshändelser.",
        "Bolaget redovisar ett rörelsebaserat nettointäktsmått på 1,597 miljoner dollar för kvartalet. Den genomsnittliga utestående kreditportföljen uppgick till 45,6 miljoner dollar och var 50,7 miljoner vid kvartalets slut. Den totala betalningsvolymen nådde 51,4 miljoner dollar.",
        "Samtidigt blev nettoresultatet från den kvarvarande verksamheten minus 48,1 miljoner dollar. Den siffran behöver förklaras: resultatet belastades med 18,3 miljoner dollar i aktiebaserad ersättning och 25,7 miljoner dollar i kostnader som reglerades med aktier. KEO Capital uppger att förlusten hade varit cirka 4,0 miljoner dollar om dessa två poster räknades bort.",
        "Q2 är det första kvartalet för den nuvarande kvarvarande verksamheten efter samgåendet med KEO World, vilket gör vanliga jämförelser med föregående år svårare. Bolaget håller en presentation av rapporten och den senaste utvecklingen klockan 14.00 i dag. Där blir utvecklingen i kreditportföljen, kostnaderna och separationen mellan fintech- och energiverksamheten viktiga frågor.",
      ],
    },
    {
      heading: "Svensk industri testas klockan 08.30",
      paragraphs: [
        "Dagens viktigaste svenska makrosiffra kommer klockan 08.30 när Swedbank och Silf publicerar inköpschefsindex, PMI, för industrin i augusti. Indexet ger en snabb bild av aktivitet, orderingång, produktion, sysselsättning och företagens inköpskostnader.",
        "I juli sjönk industri-PMI till 55,8 från 58,0 i juni. Det var den första nedgången på fem månader, men nivån låg fortfarande tydligt över 50. Ett värde över 50 signalerar att industrin växer, medan ett värde under 50 pekar på minskad aktivitet.",
        "Även industrins kostnader blir viktiga. Indexet för rå- och insatsvarupriser föll i juli till 67,3 från 80,4 i juni. Om augustis rapport visar fortsatt stark aktivitet utan ett nytt tydligt kostnadslyft skulle det vara en mer bekväm kombination för svensk ekonomi än om både aktivitet och pristryck stiger samtidigt.",
        "Augustiutfallet publiceras efter den här artikelns researchstopp och finns därför inte med i texten. Det är medvetet: DivLab skriver hellre vad som är känt än gissar en siffra som kommer efter publicering.",
      ],
    },
    {
      heading: "Riksbanken har utrymme att avvakta – men inflationen är inte avskriven",
      paragraphs: [
        "Vice riksbankschef Per Jansson gav på måndagen en tydlig bild av hur han ser på läget efter det senaste räntebeslutet. Enligt Jansson har risken för en förhöjd inflation framöver ökat något, men Riksbanken har fortfarande utrymme att avvakta innan penningpolitiken behöver ändras.",
        "Styrräntan ligger på 1,75 procent sedan den 26 augusti. Jansson pekade samtidigt på att arbetsmarknaden fortfarande är ganska svag och att han inte ser tydliga tecken på att svensk ekonomi är på väg mot en snabb överhettning.",
        "Det gör dagens industri-PMI extra relevant. En enskild PMI-siffra avgör naturligtvis inte räntan, men den bidrar till bilden av om svensk aktivitet fortsätter förbättras och om företagens kostnadstryck är på väg åt rätt håll inför Riksbankens nästa möte i slutet av september.",
      ],
    },
    {
      heading: "Netel ger mer information om fusionen med Infrea",
      paragraphs: [
        "Även Netel har en tydlig svensk hållpunkt under eftermiddagen. Klockan 14.00 håller bolaget en webbsänd presentation om företrädesemissionen inför den planerade fusionen med Infrea. Martin Reinholdsson, vd för Infrea och tilltänkt vd för den nya koncernen, deltar tillsammans med Netels finanschef Fredrik Helenius.",
        "Teckningsperioden i Netels företrädesemission pågår från den 27 augusti till den 10 september. Fyra teckningsrätter ger rätt att teckna tre nya aktier till 3,50 kronor per aktie. Emissionen kan omfatta högst 36 383 904 nya aktier.",
        "Fusionen innebär dessutom att upp till 119 585 679 nya Netel-aktier kan ges ut som fusionsvederlag till Infreas aktieägare. För befintliga Netel-ägare är dagens presentation därför viktig för att förstå både den större verksamheten som ska byggas och hur den kraftigt förändrade aktiestrukturen ska motiveras.",
      ],
    },
    {
      heading: "Tre svenska frågor sätter tonen för septemberstarten",
      paragraphs: [
        "Dagens BörsSverige handlar inte om en enda stor rapport. I stället finns tre tydliga svenska frågor att bära med sig genom dagen.",
        "Mycronic har satt ett långsiktigt mål som kräver mer än en fördubbling av försäljningen med fortsatt hög lönsamhet. KEO Capital går in i den första handelsdagen efter en rapport där den redovisade förlusten är mycket stor, men där merparten förklaras av aktierelaterade poster. Och klockan 08.30 får vi en ny temperaturmätare på svensk industri.",
        "Därtill ligger Riksbankens budskap i bakgrunden: inflationen är inte helt avskriven som problem, men centralbanken ser fortfarande möjlighet att avvakta. Det gör septemberstarten till en svensk balans mellan bolagens tillväxtambitioner, industrins faktiska fart och frågan om hur mycket kostnadstryck ekonomin klarar utan att ränteläget behöver ändras.",
      ],
    },
  ],
  sources: [
    {
      text: "Mycronic – Nya finansiella mål, 31 augusti 2026",
      href: "https://www.mycronic.com/sv/nyheter-event/pressmeddelanden/mycronic-presenterar-nya-finansiella-mal/",
    },
    {
      text: "Mycronic – Delårsrapport januari–juni 2026",
      href: "https://www.mycronic.com/sv/nyheter-event/pressmeddelanden/delarsrapport-januari-juni-2026/",
    },
    {
      text: "KEO Capital – Rapport för sexmånadersperioden som avslutades 30 juni 2026, 31 augusti 2026",
      href: "https://www.mfn.se/a/keo-capital/rapport-for-sexmanadersperioden-som-avslutades-30-juni-2026",
    },
    {
      text: "Silf/Swedbank – PMI industri, juli 2026 och nästa publicering 1 september 2026",
      href: "https://silf.se/silf-network/pmi-inkopschefsindex-industrisektorn/",
    },
    {
      text: "Sveriges Riksbank – Jansson: Inflationen riskerar att bli förhöjd, men utrymme att avvakta, 31 augusti 2026",
      href: "https://www.riksbank.se/sv/press-och-publicerat/tal-och-presentationer/2026/jansson-inflationen-riskerar-att-bli-forhojd-men-utrymme-att-avvakta/",
    },
    {
      text: "Netel – Webbsändning om företrädesemissionen inför fusionen med Infrea, 1 september 2026",
      href: "https://www.mfn.se/a/netel-holding/netel-bjuder-in-till-webbsandning-1-september-med-anledning-av-foretradesemissionen-dar-teckningsperioden-inleds-27-augusti",
    },
  ],
};
