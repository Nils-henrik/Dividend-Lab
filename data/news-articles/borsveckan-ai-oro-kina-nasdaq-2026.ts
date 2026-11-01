import type { NewsArticle } from "@/types/news";

/**
 * Global börsfördjupning – veckan 26–30 oktober 2026.
 * Editorial research cutoff: 2026-11-01T10:05:00+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.intc.com/news-events/press-releases/detail/1786/intel-reports-third-quarter-2026-financial-results
 * P0_SOURCE[primary]: https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-Third-Quarter-Results/
 * P0_SOURCE[primary]: https://www.federalreserve.gov/newsevents/pressreleases/monetary20261028a.htm
 * P0_SOURCE[primary]: https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.mp261029~9a493adf17.en.html
 * P0_SOURCE[secondary]: https://apnews.com/article/a01d3551e794fed1a0c317c20bc3f0a2
 * P0_SOURCE[secondary]: https://www.reuters.com/business/nasdaq-futures-tumble-amazon-intel-results-deepen-ai-spending-woes-2026-10-30/
 * P0_SOURCE[secondary]: https://www.nordnet.se/marknaden/indikator/omxs30
 * P0_SOURCE[secondary]: https://returnsview.com/stock/CSI300/
 * P0_SOURCE[secondary]: https://www.investing.com/indices/csi300-historical-data
 */
export const GLOBAL_AI_KINA_VECKA_44_2026_ARTICLE: NewsArticle = {
  id: "borsveckan-ai-oro-kina-nasdaq-2026",
  slug: "borsveckan-ai-oro-kina-nasdaq-2026",
  title: "Veckan som gått: AI-oron skakar Wall Street – Kina har tappat nästan 14 procent i år",
  summary: "Nasdaq föll 2 procent under veckan när investerare ifrågasatte AI-satsningarnas avkastning. Kinas CSI 300 har tappat nästan 14 procent i år – men OMXS30 gick mot strömmen.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-01T10:08:00+01:00",
  url: "/news/borsveckan-ai-oro-kina-nasdaq-2026",
  featured: true,
  imageUrl: "/news-demo/borsveckan-ai-oro-kina-2026-11-01.jpg",
  thumbnailImageUrl: "/news-demo/borsveckan-ai-oro-kina-2026-11-01.jpg",
  imageAlt: "DivLab börsveckan 26–30 oktober 2026: AI-oro på Wall Street, nedgång för Kina och skillnaden mot Stockholmsbörsen.",
  imageCaption: "Illustration: DivLab. Redaktionell bildkomposition, inte en faktisk skärmbild från börshandeln.",
  readingMinutes: 8,
  seoTitle: "AI-oro på börsen: Nasdaq faller och Kina tappar 2026",
  seoDescription: "Nasdaq föll kraftigt, Kina har tappat nästan 14 procent under 2026 och AI-oron växer. DivLab analyserar börsveckan 26–30 oktober.",
  seoKeywords: [
    "AI-aktier", "börsen vecka 44", "Nasdaq", "Kina börsen 2026",
    "CSI 300", "Nvidia", "Intel Q3 2026", "Stockholmsbörsen", "OMXS30", "veckan som gått"
  ],
  internalLinking: {
    topics: ["Veckan som gått", "global börs", "AI", "teknikaktier", "Kina", "USA", "räntor", "Stockholmsbörsen"],
    companies: ["Intel", "Nvidia", "AMD", "Amazon", "Meta", "Alphabet"],
    tickers: ["Nasdaq Composite", "S&P 500", "CSI 300", "OMXS30", "INTC", "NVDA", "AMD", "AMZN"],
    relatedNewsSlugs: [
      "borssverige-31-oktober-2026",
      "norden-i-centrum-31-oktober-2026",
      "usa-i-fokus-25-oktober-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Det har varit en vecka där det nästan känts som att varje ny teknikrapport har skapat fler frågor än svar. Nasdaq föll 2,0 procent under veckan och nästan 2,9 procent bara på fredagen, medan investerarna började diskutera priset för den enorma AI-utbyggnaden.",
    "I Kina är nedgången betydligt större: CSI 300 har tappat omkring 13,9 procent sedan årsskiftet och föll cirka 8,5 procent under oktober. Men det finns en viktig motbild. Stockholmsbörsens OMXS30 steg faktiskt 3,0 procent under veckan.",
    "Har marknaden börjat tappa förtroendet för AI-boomen, eller är det förväntningarna på bolagen som blivit för höga? Vi tittar på vad som verkligen har hänt – och på vad det kan betyda för oss som sparar långsiktigt."
  ],
  sections: [
    {
      heading: "Wall Street avslutade veckan i rött",
      paragraphs: [
        "Fredagen den 30 oktober blev en riktigt tung avslutning på handelsveckan i USA. Nasdaq Composite föll 2,9 procent under fredagen och avslutade veckan med en nedgång på 2,0 procent. S&P 500 tappade 0,6 procent under veckan, medan Dow Jones backade 0,9 procent.",
        "Enligt Reuters låg Nasdaq vid fredagens stängning 7,8 procent under rekordnoteringen den 6 oktober. Men vi behöver skilja mellan att teknikaktier faller och att hela ekonomin försämras. Många stora bolag rapporterar fortfarande god försäljning och starka vinster.",
        "Problemet är snarare hur mycket investerarna redan har betalat för den tillväxt som väntas i framtiden. Det är inte riktigt samma sak."
      ]
    },
    {
      heading: "AI-boomen möter sin kanske svåraste fråga",
      paragraphs: [
        "Under flera år har berättelsen kring artificiell intelligens varit ganska enkel: efterfrågan växer, datacenter byggs och bolagen som levererar tekniken kan fortsätta expandera. Nu blir frågan mer komplicerad.",
        "Flera av världens största teknikföretag fortsätter att investera mycket stora belopp i AI-infrastruktur. Men investerarna vill också se när investeringarna ska börja betala sig. När anläggningar, chip och datacenter slukar pengar pressas det fria kassaflödet – pengarna som blir kvar efter löpande kostnader och investeringar.",
        "Det är pengar som annars hade kunnat användas till utdelningar, återköp eller minskade skulder. Marknadens fråga blir därför: hur lång tid dröjer det innan de här satsningarna faktiskt ger en rimlig avkastning?"
      ]
    },
    {
      heading: "Intel blev veckans tydligaste varning",
      paragraphs: [
        "Intel föll hela 28,6 procent under fredagen efter sin Q3-rapport. Bolagets omsättning ökade faktiskt 21 procent till 16,5 miljarder dollar jämfört med året före, men prognosen för fjärde kvartalet gjorde marknaden besviken.",
        "Intel räknar med en omsättning på 15–16 miljarder dollar under årets sista kvartal. Trots försäljningstillväxten gav utsikterna inte investerarna det förtroende de sökte.",
        "Även Nvidia föll 4,2 procent under fredagen och AMD tappade 10,9 procent, enligt Reuters. Oro kring avkastningen på AI-investeringar hade alltså spridit sig längre än till ett enskilt bolag.",
        "Det här visar hur krävande marknaden har blivit. Det räcker inte alltid att växa. Man måste också leva upp till redan högt ställda förväntningar."
      ]
    },
    {
      heading: "Kina har tappat nästan 14 procent i år",
      paragraphs: [
        "Samtidigt som Wall Street börjat tveka kring AI-investeringarna har kinesiska aktier haft en betydligt svagare utveckling. Kinas CSI 300, som omfattar stora bolag noterade i Shanghai och Shenzhen, hade vid oktober månads slut tappat ungefär 13,9 procent sedan årsskiftet.",
        "Bara under oktober föll indexet omkring 8,5 procent, och under handelsveckan 26–30 oktober tappade det cirka 2,9 procent. Den 30 oktober slutade indexet på 3 985,50 punkter.",
        "Siffrorna gäller CSI 300 och ska inte förväxlas med alla kinesiska aktier. Bolag noterade i Hongkong och olika kinesiska teknikindex kan ha en helt annan utveckling.",
        "Vad driver nedgången? En möjlig förklaring är att tidigare höga värderingar inom AI och teknik blivit svårare att försvara. Men kinesisk konjunktur, inhemsk efterfrågan och internationella handelsbegränsningar är också viktiga delar av bilden. Det vore för enkelt att lägga allt på en och samma AI-oro."
      ]
    },
    {
      heading: "Är det början på en större tekniknedgång?",
      paragraphs: [
        "Det är förmodligen frågan många sparare ställer sig. Men vi ska komma ihåg att några av världens största teknikföretag fortfarande har verksamheter som genererar mycket stora intäkter.",
        "Amazon rapporterade till exempel att molntjänsten AWS ökade försäljningen med 39,3 procent under tredje kvartalet. Det var den snabbaste tillväxten på nästan fem år, enligt bolaget självt.",
        "Ändå pressades teknikaktierna. Det illustrerar en viktig skillnad: en aktie kan falla trots starka resultat om investerarna hade räknat med ännu bättre siffror eller oroar sig för framtida kostnader.",
        "Vi behöver därför skilja på två frågor: Tror vi fortfarande på AI som teknik? Och är dagens aktievärderingar rimliga i förhållande till hur mycket pengar företagen faktiskt kan tjäna? Det första behöver inte förändras bara för att svaret på det andra gör det."
      ]
    },
    {
      heading: "Stockholmsbörsen gick faktiskt mot strömmen",
      paragraphs: [
        "Trots de stora nedgångarna inom amerikansk och kinesisk teknik blev veckan betydligt bättre på Stockholmsbörsen. OMXS30 steg 3,01 procent under veckan och stängde fredagen på 3 271,40 punkter, enligt Nordnets marknadsdata.",
        "Det är en tydlig kontrast mot Nasdaq och CSI 300. En möjlig förklaring är att den svenska börsen har en annan sammansättning, med stor vikt för industri, verkstad och banker snarare än amerikanska teknikjättar.",
        "Det betyder inte att Sverige är skyddat från en internationell nedgång. Svenska företag påverkas fortfarande av global efterfrågan, konjunktur och investerarnas vilja att ta risk.",
        "För den som äger indexfonder är skillnaden särskilt relevant. En globalfond med stor andel amerikansk teknik kan utvecklas helt annorlunda än en svensk indexfond under samma vecka. Det viktiga är att veta vad man faktiskt äger."
      ]
    },
    {
      heading: "Räntorna gör situationen mer komplicerad",
      paragraphs: [
        "Samtidigt som teknikbolagen pressades kom nya räntebesked. Federal Reserve lämnade den 28 oktober det amerikanska styrränteintervallet oförändrat på 3,75–4,00 procent. Centralbanken beskrev aktiviteten som stark men inflationen som fortsatt förhöjd.",
        "Dagen efter valde Europeiska centralbanken att också lämna sina styrräntor oförändrade. ECB:s inlåningsränta ligger kvar på 2,50 procent, och centralbanken pekade särskilt på högre energipriser som en risk för både inflation och tillväxt.",
        "Ränteläget spelar roll för snabbväxande teknikbolag. Höga finansieringskostnader och ett högre avkastningskrav gör att vinster långt fram i tiden värderas mindre i dag. Om stora AI-projekt tar längre tid att betala sig kan det förstärka marknadens tvekan."
      ]
    },
    {
      heading: "Vad betyder detta för oss som sparar långsiktigt?",
      paragraphs: [
        "Det är lätt att börja fundera på om man borde göra något när börsen färgas röd. Men först behöver vi förstå vad som faktiskt har förändrats. Har bolagens möjligheter blivit sämre, eller har aktiekurserna bara börjat anpassas till rimligare förväntningar?",
        "Det är också värt att titta på hur mycket amerikansk teknik man äger indirekt. Att ha många olika fonder behöver inte betyda att portföljen är särskilt spridd om samma stora teknikbolag finns i nästan alla.",
        "Samtidigt innebär en kursnedgång inte automatiskt att en långsiktig idé har fallit. Företagens resultat, skulder, kassaflöden och värderingar är mer användbara att följa än enbart färgen på dagens börsskärm."
      ]
    },
    {
      heading: "Vad behöver vi följa nästa vecka?",
      paragraphs: [
        "När börserna öppnar igen måndagen den 2 november blir den första frågan om säljtrycket i teknikaktier fortsätter eller om investerarna kommer tillbaka efter fredagens fall.",
        "Den andra frågan är om Kina kan stabiliseras efter en svag oktober. Några gröna handelsdagar skulle i sig inte bevisa att den längre nedgången har vänt, men hur bred en eventuell återhämtning blir kan säga en hel del om riskviljan.",
        "Den tredje frågan gäller räntorna och de kommande makrobeskeden. Marknaden behöver få en tydligare bild av om tillväxten och inflationen går åt håll som gör det lättare – eller svårare – för centralbankerna att sänka räntor längre fram."
      ]
    },
    {
      heading: "DivLabs analys: AI är inte dött, men marknaden har blivit mer krävande",
      paragraphs: [
        "Min bild efter veckan är inte att AI-utvecklingen plötsligt har stannat av. Däremot börjar vi se en marknad som går från att belöna nästan varje ny AI-satsning till att kräva tydligare bevis på lönsamhet.",
        "Kina visar hur snabbt värderingarna kan falla när flera orosmoln samlas. USA visar att även stora och framgångsrika teknikbolag kan pressas när investerarna börjar granska kostnaderna. Samtidigt påminner den svenska börsens uppgång oss om att världen inte rör sig åt exakt samma håll.",
        "Det är kanske den viktigaste lärdomen från veckan: det är skillnad på att tro på framtidens teknik och att betala vilket pris som helst för den.",
        "Så vad tror du själv? Är det här början på en längre omvärdering av tekniksektorn, eller skapar nedgångarna nya möjligheter för långsiktiga investerare?"
      ]
    }
  ],
  sources: [
    {text: "Intel – officiellt Q3 2026-resultat och Q4-prognos", href: "https://www.intc.com/news-events/press-releases/detail/1786/intel-reports-third-quarter-2026-financial-results"},
    {text: "Amazon – Q3 2026-resultat och AWS-tillväxt", href: "https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-Third-Quarter-Results/"},
    {text: "Federal Reserve – räntebeslut den 28 oktober 2026", href: "https://www.federalreserve.gov/newsevents/pressreleases/monetary20261028a.htm"},
    {text: "Europeiska centralbanken – räntebeslut den 29 oktober 2026", href: "https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.mp261029~9a493adf17.en.html"},
    {text: "AP – amerikanska index och utvecklingen under börsveckan 26–30 oktober", href: "https://apnews.com/article/a01d3551e794fed1a0c317c20bc3f0a2"},
    {text: "Reuters – teknikbörsens fall och bolagsreaktioner den 30 oktober", href: "https://www.reuters.com/business/nasdaq-futures-tumble-amazon-intel-results-deepen-ai-spending-woes-2026-10-30/"},
    {text: "Nordnet – OMXS30, veckoutveckling och fredagens stängning", href: "https://www.nordnet.se/marknaden/indikator/omxs30"},
    {text: "ReturnsView – CSI 300, kursutveckling under 2026 och oktober", href: "https://returnsview.com/stock/CSI300/"},
    {text: "Investing.com – CSI 300, historiska stängningskurser veckan 26–30 oktober", href: "https://www.investing.com/indices/csi300-historical-data"}
  ]
};
