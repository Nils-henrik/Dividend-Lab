import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 3 oktober 2026.
 * Editorial research cutoff: 2026-10-03T08:24:15+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.konj.se/publikationer/konjunkturbarometern/2026-09-29-kraftigt-forbattrat-stamningslage-hos-hushallen/
 * P0_SOURCE[primary]: https://www.riksbank.se/sv/press-och-publicerat/nyheter-och-pressmeddelanden/pressmeddelanden/2026/styrrantan-oforandrad-pa-175-procent6/
 * P0_SOURCE[primary]: https://news.cision.com/se/seb/r/finansinspektionens-arliga-beslut-om-pelare-2-krav-och-pelare-2-vagledning,c4403048
 * P0_SOURCE[primary]: https://news.cision.com/se/sweco/r/asa-bergman-avgar-som-vd-och-koncernchef-for-sweco-ab,c4403961
 */
export const BORSSVERIGE_3_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-3-oktober-2026",
  slug: "borssverige-3-oktober-2026",
  title: "BörsSverige: veckan som gått – hushållen stärks och räntan ligger kvar",
  summary: "Svenska hushåll blev mer positiva, Riksbankens styrränta låg kvar på 1,75 procent och SEB fick ett något lägre kapitalkrav. Veckan avslutades med ett vd-besked från Sweco.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-03T08:24:35+02:00",
  url: "/news/borssverige-3-oktober-2026",
  featured: true,
  imageUrl: "/news/generated/borssverige-2026-10-03.png",
  thumbnailImageUrl: "/news/generated/borssverige-2026-10-03.png",
  imageAlt: "BörsSverige 2026-10-03 – DivLabs morgonöversikt över svenska börsnyheter.",
  readingMinutes: 5,
  seoTitle: "BörsSverige veckan som gått: hushåll, ränta och Sweco",
  seoDescription: "Veckan som gått på svenska marknaden: KI:s barometer steg till 107,1, styrräntan låg kvar på 1,75 procent och Sweco inledde ett vd-skifte.",
  seoKeywords: [
    "BörsSverige veckan som gått",
    "Stockholmsbörsen vecka 40 2026",
    "Konjunkturbarometern september 2026",
    "Riksbanken styrränta 1,75 procent",
    "SEB kapitalkrav",
    "Sweco vd"
  ],
  internalLinking: {
    topics: ["Sverige", "Stockholmsbörsen", "Konjunkturbarometern", "Riksbanken", "banker", "vd-skifte"],
    companies: ["SEB", "Sweco"],
    tickers: ["SEB A", "SWEC B"],
    relatedNewsSlugs: [
      "borssverige-1-oktober-2026",
      "borssverige-30-september-2026",
      "borssverige-29-september-2026",
      "norden-i-centrum-3-oktober-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Veckan som gått gav en mer konstruktiv svensk konjunktursignal, men också en tydlig påminnelse om att ränteläget fortfarande präglar börsen. Konjunkturinstitutets barometerindikator steg till 107,1 i september och hushållens konfidensindikator nådde 102,2.",
    "Riksbanken lät samtidigt styrräntan ligga kvar på 1,75 procent. På bolagssidan fick SEB ett något lägre särskilt kapitalbaskrav, medan Sweco avslutade veckan med beskedet att vd Åsa Bergman lämnar när en efterträdare är på plats."
  ],
  sections: [
    {
      heading: "Hushållen gav veckans tydligaste tillväxtsignal",
      paragraphs: [
        "Konjunkturinstitutets barometerindikator steg från 105,1 i augusti till 107,1 i september. Det var femte månaden i rad med uppgång och innebar ett starkare stämningsläge än normalt.",
        "Hushållens konfidensindikator ökade från 98,4 till 102,2, den högsta nivån sedan december 2021. Förbättringen drevs främst av synen på den egna ekonomin och Sveriges ekonomi jämfört med tolv månader tidigare.",
        "Det är en positiv signal för efterfrågan, men inte ett försäljningsutfall för enskilda bolag. Barometern är en enkätbaserad tendensundersökning, och nästa kontrollpunkt blir om faktisk konsumtion och bolagens rapporter bekräftar förbättringen."
      ]
    },
    {
      heading: "Styrräntan ligger kvar på 1,75 procent",
      paragraphs: [
        "Riksbankens besked från den 24 september trädde i kraft under veckan: styrräntan är oförändrad på 1,75 procent. Centralbanken bedömde samtidigt att räntan behöver höjas mer än i juniprognosen om utsikterna för inflation och ekonomisk aktivitet står sig.",
        "Kombinationen av starkare stämningsläge och fortsatt högre prisplaner än normalt gör räntespåret relevant för Stockholmsbörsen. En högre ränta kan påverka finansieringskostnader och värderingar, men effekten skiljer sig mellan bolag och sektorer.",
        "Veckans verifierade slutsats är därför dubbel: efterfrågebild och framtidstro har stärkts, samtidigt som penningpolitiken inte ger något tydligt besked om snabba lättnader. Nya inflations- och aktivitetsdata får avgöra om Riksbankens förutsättningar håller."
      ]
    },
    {
      heading: "SEB fick en mindre lättnad i kapitalkravet",
      paragraphs: [
        "Finansinspektionens årliga beslut sänkte SEB:s särskilda kapitalbaskrav, P2R, till 2,0 procent på gruppnivå från 2,1 procent i motsvarande beslut 2025. Minst 1,4 procent ska uppfyllas med kärnprimärkapital, jämfört med 1,5 procent tidigare.",
        "Pelare 2-vägledningen ligger kvar på 0,5 procent av koncernens totala riskvägda exponeringsmått. De särskilda likviditetskraven för signifikanta valutor är också oförändrade.",
        "Det gör beskedet till en begränsad lättnad, inte en bred förändring av tillsynskraven. Pressmeddelandet innehöll inget nytt beslut om utdelning eller återköp, och nästa kontrollpunkt blir hur kravet förhåller sig till SEB:s faktiska kapitalbuffert och kapitalplanering."
      ]
    },
    {
      heading: "Sweco går in i ett vd-skifte",
      paragraphs: [
        "Sweco meddelade på fredagen att Åsa Bergman lämnar rollen som vd och koncernchef efter 35 år i bolaget och nära nio år som vd. Styrelsen har inlett rekryteringen av en efterträdare.",
        "Bergman kvarstår i tjänsten tills en ny vd är på plats. Beskedet fastställer därmed en ordnad övergång, men innehåller inget datum för bytet och inga nya finansiella mål.",
        "För aktieägare blir nästa viktiga punkt vem styrelsen utser och om ledningsskiftet medför ändrade prioriteringar. Fram till dess är den verifierade förändringen organisatorisk, inte en ny prognos för resultat eller efterfrågan."
      ]
    },
    {
      heading: "Det här följer vi nästa vecka",
      paragraphs: [
        "Veckans svenska berättelse har tre lager: bättre konjunkturstämning, en fortsatt restriktiv räntebild och bolagsspecifika förändringar i kapital- och ledningsfrågor. Ingen enskild signal räcker för att fastställa riktningen för hela Stockholmsbörsen.",
        "Nästa vecka följer DivLab faktiska konsumtions- och aktivitetsdata, nya inflationssignaler samt svenska bolagsrapporter och trading updates. För SEB väntar kapitaluppföljning, och för Sweco väntar besked om efterträdaren.",
        "Lördagens artikel beskriver veckan som gått och anger ingen kursreaktion för en stängd marknad. Nya rörelser kräver färsk marknadsdata när handeln åter öppnar."
      ]
    }
  ],
  sources: [
    {
      text: "Konjunkturinstitutet: Konjunkturbarometern september 2026 – barometerindikatorn 107,1 och hushållens konfidensindikator 102,2; publicerad 29 september 2026",
      href: "https://www.konj.se/publikationer/konjunkturbarometern/2026-09-29-kraftigt-forbattrat-stamningslage-hos-hushallen/"
    },
    {
      text: "Sveriges Riksbank: Styrräntan lämnades oförändrad på 1,75 procent och en högre räntebana presenterades; publicerat 24 september 2026",
      href: "https://www.riksbank.se/sv/press-och-publicerat/nyheter-och-pressmeddelanden/pressmeddelanden/2026/styrrantan-oforandrad-pa-175-procent6/"
    },
    {
      text: "SEB: Finansinspektionens årliga beslut – P2R 2,0 procent, P2G 0,5 procent och oförändrade likviditetskrav; publicerat 30 september 2026",
      href: "https://news.cision.com/se/seb/r/finansinspektionens-arliga-beslut-om-pelare-2-krav-och-pelare-2-vagledning,c4403048"
    },
    {
      text: "Sweco: Åsa Bergman lämnar som vd och koncernchef när en efterträdare är på plats; publicerat 2 oktober 2026",
      href: "https://news.cision.com/se/sweco/r/asa-bergman-avgar-som-vd-och-koncernchef-for-sweco-ab,c4403961"
    }
  ]
};
