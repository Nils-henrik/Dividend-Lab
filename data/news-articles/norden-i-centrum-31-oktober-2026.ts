import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — 31 oktober 2026.
 * Editorial research cutoff: 2026-10-31T07:59:47+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.equinor.com/news/equinor-third-quarter-2026-results
 * P0_SOURCE[primary]: https://www.kongsberg.com/no/news/news-archive/2026/q3-2026-kongsberg-delivers-a-strong-third-quarter-with-a-record-high-order-backlog/
 * P0_SOURCE[primary]: https://danskebank.com/news-and-insights/news-archive/press-releases/2026/pr29102026
 * P0_SOURCE[primary]: https://stat.fi/en/publication/cmfoymm6r5e2u08ur7fzze798
 */
export const NORDEN_I_CENTRUM_31_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-31-oktober-2026",
  slug: "norden-i-centrum-31-oktober-2026",
  title: "Veckan som gått: Equinor höjer målet – Kongsbergs orderbok når 174 miljarder",
  summary:
    "Equinor höjer produktionsmålet, Kongsberg avslutar kvartalet med en orderbok på 174,2 miljarder norska kronor och Danske Bank snävar in vinstprognosen. Finland växer, men arbetsmarknaden släpar efter.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-31T07:59:47+01:00",
  url: "/news/norden-i-centrum-31-oktober-2026",
  featured: true,
  imageUrl: "/news/generated/norden-i-centrum-2026-10-31.png",
  thumbnailImageUrl: "/news/generated/norden-i-centrum-2026-10-31.png",
  imageAlt: "Norden i centrum 2026-10-31 – DivLabs morgonöversikt över nordiska börsnyheter.",
  readingMinutes: 5,
  seoTitle: "Nordiska börsveckan: Equinor höjer målet och Kongsberg växer",
  seoDescription:
    "Veckan som gått: Equinor höjer produktionsmålet, Kongsbergs orderbok når 174,2 miljarder och Danske Bank snävar in vinstprognosen.",
  seoKeywords: [
    "nordiska börsen veckan",
    "Equinor Q3 2026",
    "Kongsberg Q3 2026",
    "Danske Bank resultat 2026",
    "Finland BNP Q3 2026",
    "Norden i centrum",
    "veckan som gått"
  ],
  internalLinking: {
    topics: [
      "Norden",
      "veckan som gått",
      "rapportperiod",
      "energi",
      "försvarsindustri",
      "bank",
      "Finland",
      "konjunktur"
    ],
    companies: ["Equinor", "Kongsberg Gruppen", "Danske Bank"],
    tickers: ["EQNR", "KOG", "DANSKE"],
    relatedNewsSlugs: [
      "norden-i-centrum-30-oktober-2026",
      "norden-i-centrum-29-oktober-2026",
      "norden-i-centrum-28-oktober-2026",
      "norden-i-centrum-27-oktober-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Veckans tydligaste nordiska signal är att stora bolag går in i årets slutskede med hög produktion, växande orderböcker och god intjäning. Samtidigt blir kvaliteten i tillväxten allt viktigare: kassaflöde, leveransförmåga och arbetsmarknad avgör hur hållbar bilden är.",
    "Equinor höjde sin prognos för produktionsökningen 2026 från 3 procent till omkring 4 procent. Kongsberg Gruppen redovisade samtidigt en orderbok på 174,2 miljarder norska kronor efter ett kvartal där orderintaget mer än fördubblades jämfört med året före.",
    "Danske Bank ökade niomånadersvinsten och snävade in helårsprognosen. I Finland visar den preliminära statistiken tillväxt under tredje kvartalet, men färre sysselsatta och arbetade timmar gör återhämtningen ojämn."
  ],
  sections: [
    {
      heading: "Equinor höjer produktionsmålet",
      paragraphs: [
        "Equinors produktion uppgick till 2,166 miljoner fat oljeekvivalenter per dag under tredje kvartalet, 2 procent mer än ett år tidigare. Bolaget höjde samtidigt prognosen för produktionsökningen 2026 från 3 procent till omkring 4 procent.",
        "Justerat rörelseresultat blev 12,35 miljarder dollar och justerat nettoresultat 2,86 miljarder dollar. Kassaflödet efter skatt uppgick till 8,14 miljarder dollar, medan organiska investeringar var 3,28 miljarder.",
        "Den justerade nettoskulden som andel av kapitalet föll till 3,8 procent från 10,4 procent föregående kvartal. Nästa kontrollpunkt är om den högre produktionstakten också håller uppe kassaflödet när investeringarna fortsätter."
      ]
    },
    {
      heading: "Kongsbergs orderbok når 174,2 miljarder",
      paragraphs: [
        "Kongsberg Gruppens omsättning steg 50 procent till 11,3 miljarder norska kronor. EBIT ökade 66 procent till 1,9 miljarder kronor.",
        "Orderintaget blev 23,3 miljarder kronor, jämfört med 9,5 miljarder ett år tidigare. Det motsvarar en book-to-bill-kvot på 2,06, vilket innebär att nya order var mer än dubbelt så stora som kvartalets intäkter.",
        "Orderboken ökade med 16,7 miljarder under kvartalet och slutade på rekordhöga 174,2 miljarder kronor. För investerare flyttas därför huvudfrågan från efterfrågan till hur snabbt och lönsamt den stora orderboken kan levereras."
      ]
    },
    {
      heading: "Danske Bank växer och snävar in prognosen",
      paragraphs: [
        "Danske Banks nettoresultat för årets första nio månader ökade 9 procent till 18,3 miljarder danska kronor. Avkastningen på eget kapital blev 14,3 procent.",
        "Räntenettot ökade 4 procent till 28,3 miljarder kronor och provisionsnettot 14 procent till 12,0 miljarder. Rörelsekostnaderna ökade 2 procent till 19,4 miljarder, vilket sänkte kostnadsandelen till 44,2 procent från 45,6 procent.",
        "Helårsprognosen för nettoresultatet snävades in till 24–25 miljarder danska kronor. Kreditförlustnivån är fortsatt låg, men kommande kvartal behöver visa om intäktsökningen kan fortsätta när ränteläget förändras."
      ]
    },
    {
      heading: "Finland växer – men arbetsmarknaden försvagas",
      paragraphs: [
        "Finlands preliminära BNP-indikator för tredje kvartalet visar en ökning på 0,5 procent från föregående kvartal och 1,8 procent från samma period året före, kalenderkorrigerat.",
        "I september ökade den arbetsdagskorrigerade produktionen 2,0 procent jämfört med året före och den säsongsrensade produktionen 0,2 procent från augusti.",
        "Samtidigt minskade antalet sysselsatta 0,4 procent och arbetade timmar 0,9 procent från föregående kvartal. Mot året före var nedgångarna 0,8 respektive 3,6 procent. Det gör arbetsmarknaden till den tydligaste svagheten i den finländska återhämtningen."
      ]
    },
    {
      heading: "Vad veckan förändrade",
      paragraphs: [
        "Veckan gav svar på två frågor som stått öppna i rapportperioden. Equinor räknar nu med högre produktionstillväxt än tidigare, medan Kongsbergs rekordorderbok bekräftar att efterfrågan är starkare än den redan höga leveranstakten.",
        "Danske Banks insnävade prognos ger bättre precision om helårsresultatet, men bankens fortsatta utveckling avgörs mer av räntenetto och kreditkvalitet än av en enskild kvartalsvinst.",
        "Finlands tillväxttal visar att nordisk motståndskraft inte är jämnt fördelad. Produktion och BNP förbättras, men svagare sysselsättning och arbetade timmar begränsar hur starkt beskedet kan tolkas."
      ]
    },
    {
      heading: "Det följer vi härnäst",
      paragraphs: [
        "För Equinor följer vi om produktionsmålet på omkring 4 procents tillväxt håller och hur investeringarna påverkar fritt kassaflöde. För Kongsberg blir leveranstakt, marginaler och kapitalbindning centrala när orderboken ska omsättas i intäkter.",
        "För Danske Bank är räntenetto, kostnadsdisciplin och kreditförluster de viktigaste kontrollpunkterna mot helårsintervallet 24–25 miljarder danska kronor.",
        "Statistics Finland publicerar reviderade nationalräkenskaper för tredje kvartalet den 27 november. Då får den preliminära tillväxtbilden ett mer komplett underlag."
      ]
    }
  ],
  sources: [
    {
      text: "Equinor: officiellt Q3-meddelande med produktion, höjd produktionsprognos, justerat resultat, kassaflöde, investeringar och nettoskuld",
      href: "https://www.equinor.com/news/equinor-third-quarter-2026-results"
    },
    {
      text: "Kongsberg Gruppen: officiellt Q3-meddelande med omsättning, EBIT, orderintag, book-to-bill och orderbok",
      href: "https://www.kongsberg.com/no/news/news-archive/2026/q3-2026-kongsberg-delivers-a-strong-third-quarter-with-a-record-high-order-backlog/"
    },
    {
      text: "Danske Bank: officiellt niomånadersresultat med nettoresultat, avkastning, intäkter, kostnader och insnävad helårsprognos",
      href: "https://danskebank.com/news-and-insights/news-archive/press-releases/2026/pr29102026"
    },
    {
      text: "Statistics Finland: officiell preliminär produktions- och BNP-indikator för september och tredje kvartalet 2026",
      href: "https://stat.fi/en/publication/cmfoymm6r5e2u08ur7fzze798"
    }
  ]
};
