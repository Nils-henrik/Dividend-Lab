import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — 31 August 2026.
 *
 * Editorial research cutoff: 07:58 CEST, 31 August 2026.
 * Verified editorial anchors:
 * - AcadeMedia Q4 2025/26: net sales SEK 5,658m (+10.6%); adjusted EBITA SEK 552m;
 *   EBIT SEK 666m; average children/students 119,430; international operations plus
 *   Adult Education approximately 44% of Group pro forma revenue.
 * - Bakkafrost Q2 2026: operational EBIT DKK 273m (65m); Faroe Islands DKK 411m;
 *   Scotland DKK -139m; Faroe Islands harvest volume +67% YoY.
 * - Citycon: preliminary subsequent-offer result implies G City and Gazit Europe
 *   Netherlands together 91.05% of shares and votes; final result expected around 31 Aug.
 * - Freetrailer H1/Q2 2026: H1 revenue +26.2%; H1 EBIT DKK 10.2m; guidance raised to
 *   DKK 178-185m revenue and DKK 27-32m EBIT; buyback up to DKK 20m through year-end.
 *
 * Cover:
 * public/news-demo/file_00000000e4bc8210a8a3d0e7b259dc8b.png
 */
export const NORDEN_I_CENTRUM_31_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-31-augusti-2026",
  slug: "norden-i-centrum-31-augusti-2026",
  title:
    "Norden i centrum – 31 augusti: AcadeMedia växer och Bakkafrost lyfter resultatet kraftigt",
  summary:
    "AcadeMedia avslutar räkenskapsåret med högre omsättning och resultat samtidigt som Bakkafrost mer än fyrdubblar sitt operationella rörelseresultat i Q2. I Finland står Citycons ägarförändring i fokus och i Danmark går Freetrailer in i veckan med höjd prognos och återköpsprogram.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-31T07:58:00+02:00",
  url: "/news/norden-i-centrum-31-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/file_00000000e4bc8210a8a3d0e7b259dc8b.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "Norden i centrum 31 augusti 2026 med AcadeMedia, Bakkafrost, Citycon och Freetrailer i fokus.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 5,
  seoTitle:
    "Norden i centrum 31 augusti 2026 – AcadeMedia och Bakkafrost i fokus",
  seoDescription:
    "AcadeMedia avslutar året med högre resultat och Bakkafrost lyfter kraftigt i Q2. Samtidigt står Citycon och Freetrailer i fokus i Finland och Danmark.",
  seoKeywords: [
    "Norden i centrum",
    "nordiska börsen idag",
    "nordiska börser",
    "Stockholmsbörsen idag",
    "Oslo-börsen idag",
    "Helsingforsbörsen idag",
    "Köpenhamnsbörsen idag",
    "AcadeMedia Q4 2026",
    "Bakkafrost Q2 2026",
    "Citycon G City",
    "Freetrailer Q2 2026",
    "börsnyheter",
    "31 augusti 2026",
  ],
  internalLinking: {
    topics: ["Norden", "Q2 2026", "rapporter", "uppköp", "återköp"],
    companies: ["AcadeMedia", "Bakkafrost", "Citycon", "Freetrailer"],
    relatedNewsSlugs: [
      "norden-i-centrum-28-augusti-2026",
      "borssverige-28-augusti-2026",
      "borsvecka-36-2026-jobbrapport-broadcom-euroinflation",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Måndagen öppnar med två tydliga rapportbesked i Norden. Svenska AcadeMedia avslutar räkenskapsåret med högre omsättning och resultat, samtidigt som Oslo-noterade Bakkafrost mer än fyrdubblar sitt operationella rörelseresultat jämfört med samma kvartal i fjol.",
    "I Finland går Citycons uppköpsprocess in i ännu ett viktigt skede efter att G City preliminärt passerat 90-procentsnivån. I Danmark går Freetrailer samtidigt in i veckan med höjda helårsprognoser och ett nytt återköpsprogram. Det gör den sista börsdagen i augusti tydligt bolagsdriven.",
  ],
  sections: [
    {
      heading: "Sverige: AcadeMedia avslutar året starkt",
      paragraphs: [
        "AcadeMedia redovisar en omsättning på 5 658 miljoner kronor för det fjärde kvartalet, en ökning med 10,6 procent jämfört med samma period förra året. Den organiska försäljningstillväxten uppgick till 6,0 procent.",
        "Rörelseresultatet, EBIT, steg till 666 miljoner kronor från 578 miljoner. Det justerade EBITA-resultatet ökade samtidigt till 552 miljoner från 475 miljoner kronor, motsvarande en förbättring på drygt 16 procent.",
        "Även elevutvecklingen är tydligt positiv. Det genomsnittliga antalet barn och elever inom förskola, grundskola och gymnasium ökade med 5,2 procent till 119 430 under kvartalet.",
        "En viktig del av investeringscaset är att AcadeMedia blir allt mer internationellt. Den internationella verksamheten tillsammans med vuxenutbildningen motsvarar omkring 44 procent av koncernens proformaomsättning. För marknaden blir frågan därför inte bara hur det avslutade kvartalet såg ut, utan om expansionen utanför Sverige kan fortsätta bära tillväxten framåt.",
      ],
    },
    {
      heading: "Norge: Bakkafrost lyfter kraftigt – men Skottland fortsätter tynga",
      paragraphs: [
        "Oslo-noterade, färöiska Bakkafrost levererar morgonens tydligaste resultatförbättring. Det operationella rörelseresultatet steg till 273 miljoner danska kronor i Q2, från 65 miljoner under samma kvartal förra året.",
        "Det är framför allt verksamheten på Färöarna som ligger bakom förbättringen. Där ökade det operationella rörelseresultatet till 411 miljoner danska kronor från 211 miljoner. Skördevolymerna steg samtidigt med 67 procent och bolaget lyfter fram bättre biologiska förhållanden och lägre kostnader.",
        "Skottland är fortfarande problemet. Den skotska verksamheten redovisade ett operationellt rörelseresultat på minus 139 miljoner danska kronor, jämfört med minus 146 miljoner året före. Låga skördevolymer och biologiska problem i en grupp fisk fortsatte att belasta resultatet.",
        "Rapporten blir därmed tudelad: kärnverksamheten på Färöarna går betydligt bättre, men Bakkafrost har fortfarande arbete kvar i Skottland. Bolaget beskriver samtidigt marknadsutsikterna för andra halvåret som mer balanserade när tillväxten i det globala laxutbudet väntas bromsa.",
      ],
    },
    {
      heading: "Finland: Citycon-affären går in i nästa fas",
      paragraphs: [
        "I Finland riktas blickarna mot fastighetsbolaget Citycon. Den efterföljande budperioden i G Citys kontantbud avslutades förra veckan och det preliminära resultatet visar att ytterligare 2 180 672 aktier lämnades in.",
        "Tillsammans med de aktier som G City och det helägda dotterbolaget Gazit Europe Netherlands redan kontrollerar motsvarar det preliminärt 167 133 085 aktier, eller cirka 91,05 procent av samtliga aktier och röster i Citycon.",
        "Det slutliga resultatet från den efterföljande budperioden väntas omkring den 31 augusti. För kvarvarande aktieägare blir dagens besked därför en av de viktigaste finska bolagshändelserna att följa.",
        "Här handlar börsfrågan mindre om nästa kvartalsresultat och mer om vad den förändrade ägarbilden innebär när en dominerande ägare preliminärt har passerat 90-procentsnivån.",
      ],
    },
    {
      heading: "Danmark: Freetrailer höjer prognosen och startar återköp",
      paragraphs: [
        "Danska Freetrailer går in i veckan efter en rapport där tillväxten fortsätter samtidigt som investeringar pressar resultatet. Under årets första sex månader ökade omsättningen med 26,2 procent, medan EBIT minskade med 19,8 procent till 10,2 miljoner danska kronor.",
        "Bolaget kopplar den lägre vinsten till investeringar i fortsatt expansion, där den tyska marknaden är ett viktigt område. Trots resultattappet höjde Freetrailer sina prognoser för helåret.",
        "Bolaget räknar nu med en omsättning på 178–185 miljoner danska kronor under 2026, jämfört med tidigare 168–178 miljoner. Prognosen för EBIT höjdes samtidigt till 27–32 miljoner danska kronor från tidigare 20–30 miljoner.",
        "Freetrailer har dessutom beslutat om ett återköpsprogram på upp till 20 miljoner danska kronor som löper till årsskiftet. Nästa större hållpunkt är den 17 september, då bolaget planerar att presentera en ny tillväxtstrategi.",
      ],
    },
    {
      heading: "Fyra olika historier sätter tonen för Norden",
      paragraphs: [
        "Den sista handelsdagen i augusti saknar en enda gemensam nordisk huvudfråga. I stället är det bolagens egna besked som står i centrum.",
        "AcadeMedia visar fortsatt tillväxt och en allt större internationell verksamhet. Bakkafrost visar en kraftig återhämtning på Färöarna, men har fortfarande ett tydligt problem att lösa i Skottland. I Finland närmar sig Citycons ägarförändring ett nytt avgörande, medan Freetrailer kombinerar snabb försäljningstillväxt med höjda prognoser och återköp av egna aktier.",
        "När de nordiska börserna öppnar blir därför de första kursreaktionerna framför allt ett test på vad marknaden värderar högst: starkare resultat här och nu, eller möjligheten till fortsatt tillväxt längre fram.",
      ],
    },
  ],
  sources: [
    {
      text: "AcadeMedia – preliminära Q4-siffror 2025/26 samt bokslutskommuniké 31 augusti 2026",
      href: "https://mfn.se/a/academedia/academedia-offentliggor-preliminara-resultat-for-fjarde-kvartalet-2025-2026",
    },
    {
      text: "Bakkafrost – Strong Faroese performance lifts operational EBIT, 31 August 2026",
      href: "https://news.cision.com/bakkafrost/r/strong-faroese-performance-lifts-operational-ebit---improved-market-outlook,c4389582",
    },
    {
      text: "Citycon – Preliminary result of the subsequent offer period, 28 August 2026",
      href: "https://www.citycon.com/newsroom/preliminary-result-of-the-subsequent-offer-period-of-g-city-ltds-unconditional-voluntary-public-cash-tender-offer-for-all-the-issued-and-outstanding-2026",
    },
    {
      text: "Freetrailer – Q2 2026: Raises guidance and initiates share repurchase programme, 28 August 2026",
      href: "https://freetrailer.com/se/2026/08/q2-2026-raises-guidance-and-initiates-share-repurchase-programme/",
    },
  ],
};
