import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 15 oktober 2026.
 * Editorial research cutoff: 2026-10-15T08:17:10+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://slproperty.se/wp-content/uploads/2026/10/SLP-Delarsrapport-Q3-2026.pdf
 */
export const BORSSVERIGE_15_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-15-oktober-2026",
  slug: "borssverige-15-oktober-2026",
  title: "SLP växer förvaltningsresultatet 27 procent – belåningen stiger",
  summary:
    "Swedish Logistic Property ökade hyresintäkter, driftnetto och förvaltningsresultat tydligt under årets nio första månader. Samtidigt steg belåningsgraden till 49,1 procent när fastighetsportföljen passerade 20 miljarder kronor.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-15T08:17:10+02:00",
  url: "/news/borssverige-15-oktober-2026",
  featured: true,
  readingMinutes: 4,
  seoTitle: "SLP ökar förvaltningsresultatet 27 procent",
  seoDescription:
    "SLP:s förvaltningsresultat steg 27 procent till 549 miljoner kronor januari–september. NAV per aktie ökade till 36,49 kronor och belåningsgraden var 49,1 procent.",
  seoKeywords: [
    "SLP rapport Q3 2026",
    "Swedish Logistic Property",
    "SLP förvaltningsresultat",
    "SLP substansvärde",
    "SLP belåningsgrad",
    "logistikfastigheter Sverige",
    "svenska börsen idag",
    "BörsSverige",
  ],
  internalLinking: {
    topics: [
      "Sverige",
      "Stockholmsbörsen",
      "kvartalsrapport",
      "fastigheter",
      "logistikfastigheter",
      "förvaltningsresultat",
      "substansvärde",
      "belåning",
    ],
    companies: ["Swedish Logistic Property"],
    tickers: ["SLP B"],
    relatedNewsSlugs: [
      "norden-i-centrum-15-oktober-2026",
      "borssverige-14-oktober-2026",
      "borssverige-13-oktober-2026",
      "borssverige-11-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Swedish Logistic Property, SLP, levererade bred tillväxt i rapporten för januari–september. Hyresintäkterna steg 24 procent och förvaltningsresultatet 27 procent, medan resultatet per aktie ökade till 2,54 kronor från 1,94 kronor.",
    "Tillväxten kommer tillsammans med en större balansräkning. Fastighetsvärdet var 20 544 miljoner kronor vid utgången av september och belåningsgraden hade stigit till 49,1 procent, från 48,4 procent ett år tidigare.",
    "Rapporten publicerades efter att dagens Norden i centrum redan hade låsts på Ericsson, Nordea och EQT. BörsSverige fokuserar därför på den nya svenska fastighetsrapporten. Stockholmsbörsen hade inte öppnat vid artikelns verifierade bryttid, så ingen kursreaktion anges.",
  ],
  sections: [
    {
      heading: "Tillväxt i samtliga centrala resultatmått",
      paragraphs: [
        "För årets nio första månader ökade hyresintäkterna till 920 miljoner kronor från 744 miljoner. Driftsnettot steg till 818 miljoner från 656 miljoner och förvaltningsresultatet till 549 miljoner från 430 miljoner.",
        "Förvaltningsresultatet per aktie ökade 18 procent till 1,95 kronor. Ökningen per aktie var därmed lägre än resultatökningen på bolagsnivå, men fortfarande tydlig.",
        "Kassaflödet från den löpande verksamheten före förändringar i rörelsekapital ökade 26 procent till 544 miljoner kronor. Det visar att resultatförbättringen också hade stöd i det löpande kassaflödet.",
      ],
    },
    {
      heading: "Tredje kvartalet förstärkte utvecklingen",
      paragraphs: [
        "Under juli–september uppgick hyresintäkterna till 313 miljoner kronor, jämfört med 255 miljoner samma kvartal i fjol. Driftsnettot ökade till 283 miljoner från 229 miljoner.",
        "Kvartalets förvaltningsresultat steg 25 procent till 188 miljoner kronor från 151 miljoner. Periodens resultat mer än fördubblades till 338 miljoner kronor från 151 miljoner, och resultat per aktie ökade till 1,20 kronor från 0,58 kronor.",
        "Förändringar i fastighetsvärden bidrog till det redovisade resultatet. Under januari–september uppgick värdeförändringarna för förvaltningsfastigheter till 277 miljoner kronor, jämfört med 264 miljoner året före.",
      ],
    },
    {
      heading: "NAV växer – men måltakten är ännu inte nådd",
      paragraphs: [
        "Substansvärdet, NAV, per aktie uppgick till 36,49 kronor vid periodens slut. Det motsvarar en ökning med 8 procent sedan årsskiftet.",
        "SLP:s övergripande mål är att över tid skapa en genomsnittlig årlig tillväxt om minst 15 procent per aktie i både NAV och förvaltningsresultat. Efter nio månader låg NAV-tillväxten alltså under målnivån, medan förvaltningsresultatet per aktie hade vuxit 18 procent.",
        "Rapporten ger därför en blandad bild mot bolagets egna långsiktiga mål: intjäningen per aktie utvecklas över måltakten, men substansvärdestillväxten behöver stärkas för att nå samma nivå för helåret.",
      ],
    },
    {
      heading: "Förvärv driver portföljen över 20 miljarder",
      paragraphs: [
        "SLP hade vid utgången av september 135 fastigheter med ett samlat värde på 20 544 miljoner kronor och en uthyrningsbar yta på 1,73 miljoner kvadratmeter. Under årets första nio månader hade sex fastigheter tillträtts till ett värde av 1 482 miljoner kronor.",
        "Bara under tredje kvartalet uppgick förvärven till 587 miljoner kronor. Den största affären var en fullt uthyrd logistikterminal i Göteborg i en sale-and-leaseback-transaktion med DSV, med nio års hyresduration.",
        "Nettouthyrningen var positiv och uppgick till 38,1 miljoner kronor för niomånadersperioden, jämfört med 6,2 miljoner. Uthyrningsgraden var samtidigt 96,2 procent, något lägre än 96,5 procent ett år tidigare.",
      ],
    },
    {
      heading: "Finansiellt utrymme finns, men riskmåtten måste följas",
      paragraphs: [
        "Belåningsgraden steg till 49,1 procent från 48,4 procent ett år tidigare och 47,9 procent vid årsskiftet. Räntetäckningsgraden var oförändrad mot jämförelsekvartalet på 3,2 gånger.",
        "Bolagets riskbegränsningar anger en långsiktig belåningsgrad på högst 55 procent och en räntetäckningsgrad på minst 2,5 gånger. SLP låg fortfarande inom båda gränserna, men avståndet till belåningstaket har minskat i takt med expansionen.",
        "Den genomsnittliga räntan var 3,5 procent vid kvartalets slut. Hållbar finansiering uppgick till 9 553 miljoner kronor och motsvarade 95 procent av låneportföljen.",
      ],
    },
    {
      heading: "Det här följer vi härnäst",
      paragraphs: [
        "Den viktigaste kontrollpunkten är balansen mellan fortsatt förvärvstillväxt och finansiell disciplin. En belåningsgrad på 49,1 procent ger utrymme mot bolagets tak, men marginalen är inte obegränsad om räntor, värderingar eller uthyrning skulle utvecklas svagare.",
        "Vi följer också om NAV-tillväxten per aktie kan närma sig målet på minst 15 procent och om den positiva nettouthyrningen fortsätter samtidigt som portföljen växer.",
        "SLP:s rapportpresentation hålls klockan 10.00 den 15 oktober. Eventuella nya uppgifter från presentationen låg efter artikelns redaktionella bryttid och har därför inte föregripits.",
      ],
    },
  ],
  sources: [
    {
      text: "Swedish Logistic Property: delårsrapport januari–september 2026 med resultat-, kassaflödes-, fastighets- och finansieringsuppgifter, publicerad 15 oktober 2026",
      href: "https://slproperty.se/wp-content/uploads/2026/10/SLP-Delarsrapport-Q3-2026.pdf",
    },
  ],
};
