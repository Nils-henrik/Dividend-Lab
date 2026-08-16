import type { NewsArticle } from "@/types/news";

/**
 * Börsveckan 16 augusti 2026 — research verifierad inför publicering.
 *
 * Faktakontroller:
 * - Reuters 14 aug: S&P 500 -0,17 % på fredagen, +0,4 % för veckan; Nasdaq +0,1 % för veckan.
 * - Reuters/BLS 12–13 aug: USA KPI 3,4 % i juli, kärn-KPI 2,5 %; PPI oförändrat m/m och +4,7 % y/y.
 * - U.S. Census/Reuters 14 aug: amerikansk detaljhandel -0,6 % i juli.
 * - SCB: KPIF 1,3 % i juni; svensk inflation fortsatt låg inför Riksbankens augustimöte.
 * - Riksbanken: penningpolitiskt möte 19 aug, beslut publiceras 20 aug kl. 09.30; styrränta 1,75 % inför mötet.
 * - Federal Reserve: protokoll från mötet 28–29 juli publiceras 19 aug.
 * - Mowi: Q2 2026 publiceras 18 aug kl. 08.00.
 * - Latour: delårsrapport jan–jun 2026 publiceras 19 aug kl. 08.00.
 * - Carlsberg: H1 2026 publiceras 19 aug kl. 08.00 CET.
 * - Reuters 12–13 aug: Vestas +19,7 % efter höjd resultatutsikt; Embracer +9 % efter rapport.
 * - Veckans amerikanska detaljhandelsrapporter inkluderar Home Depot, Target och Walmart.
 *
 * Ingen synlig rå källista i artikeln enligt DivLabs redaktionella standard.
 */
export const BORSVECKAN_VECKA_33_34_2026_ARTICLE: NewsArticle = {
  id: "borsveckan-vecka-33-34-2026",
  slug: "borsveckan-vecka-33-34-2026",
  title: "Börsveckan som gått – och veckan som kommer",
  summary:
    "Vecka 33 bjöd på nya rekord på Wall Street, lugnare inflationssignaler och stora rapportreaktioner i Norden. Nu väntar Riksbanken, Fed-protokoll och nya rapporter under vecka 34.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-16T22:30:00+02:00",
  url: "/news/borsveckan-vecka-33-34-2026",
  featured: true,
  imageUrl: "/news-demo/ChatGPT Image 16 aug. 2026 22_25_40.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "left 50%",
  mobileHeadlineFirst: true,
  imageAlt:
    "Börsveckan 16 augusti 2026 med Stockholms skärgård och rubriken veckan som gått och veckan som kommer.",
  imageCaption: "Bild: DivLab.",
  readingMinutes: 7,
  seoTitle: "Börsveckan: veckan som gått och veckan som kommer",
  seoDescription:
    "Summering av börsvecka 33 och det viktigaste inför vecka 34: Wall Street, inflation, Riksbanken, Fed-protokoll samt rapporter från Mowi, Latour och Carlsberg.",
  seoKeywords: [
    "börsveckan",
    "börsvecka 33",
    "börsvecka 34",
    "börsen nästa vecka",
    "Stockholmsbörsen",
    "Riksbanken augusti 2026",
    "Fed protokoll",
    "Mowi rapport",
    "Latour rapport",
    "Carlsberg rapport",
    "USA inflation",
    "Wall Street",
  ],
  showDisclaimer: true,
  intro: [
    "Det blev till slut en ganska händelserik börsvecka. Inflationsoron lättade på flera håll samtidigt som rapporterna fortsatte att flytta enskilda aktier kraftigt.",
    "I USA nådde S&P 500 nya rekordnivåer under veckan. Men fredagens svaga detaljhandel påminde marknaden om att lägre inflation inte bara behöver vara goda nyheter. Om hushållen börjar dra ned på konsumtionen kan även bolagens vinster påverkas.",
    "För investerarna börjar frågan därför förändras. Från 'måste räntorna upp?' till 'hur stark är ekonomin egentligen?'. Det är ungefär där vi går in i vecka 34.",
  ],
  sections: [
    {
      heading: "Inflationen lugnade Wall Street",
      paragraphs: [
        "Veckans stora internationella tema var inflationen i USA. Konsumentpriserna steg med 3,4 procent på årsbasis i juli, ned från 3,5 procent i juni. Kärninflationen, där mat och energi räknas bort, låg på 2,5 procent.",
        "Dagen efter kom ytterligare en lugnande signal. Producentpriserna stod stilla i juli, vilket var mjukare än marknaden hade väntat sig. På årsbasis steg producentpriserna med 4,7 procent, ned från 5,5 procent i juni.",
        "De siffrorna minskade oron för att Federal Reserve snabbt skulle behöva strama åt penningpolitiken ytterligare. Det gav stöd åt börsen och S&P 500 nådde ännu en rekordstängning under veckan.",
        "När veckan summerades hade S&P 500 stigit omkring 0,4 procent och Nasdaq omkring 0,1 procent. Det är inga stora rörelser, men de kom från redan höga nivåer.",
      ],
    },
    {
      heading: "Svag detaljhandel väckte en ny fråga",
      paragraphs: [
        "På fredagen förändrades humöret något. Den amerikanska detaljhandeln föll med 0,6 procent i juli, trots att marknaden hade räknat med en betydligt starkare utveckling.",
        "Det är viktigt eftersom hushållens konsumtion är en central del av den amerikanska ekonomin. En svagare konsument kan pressa inflationen, men kan samtidigt bli ett problem för bolagens försäljning och vinster.",
        "Det är den balans marknaden brottas med just nu. Svagare ekonomiska siffror kan minska trycket på räntorna, men blir ekonomin för svag är det förstås inte heller bra för börsen.",
        "Nästa vecka får vi fler ledtrådar när flera av USA:s största butikskedjor öppnar böckerna.",
      ],
    },
    {
      heading: "Stora rapportreaktioner i Norden",
      paragraphs: [
        "På bolagssidan fanns det gott om rörelse även i Norden.",
        "Danska Vestas stod för en av veckans tydligaste rapportreaktioner. Vindkraftsbolaget höjde sin resultatutsikt och aktien steg närmare 20 procent efter rapporten.",
        "I Sverige kom Embracer med ett resultat som slog marknadens förväntningar. Det justerade rörelseresultatet landade på 151 miljoner kronor, mot väntade omkring 69 miljoner, och aktien steg omkring 9 procent.",
        "Veckan blev därmed ännu en påminnelse om hur hårt marknaden belönar bolag som kan överraska positivt när förväntningarna redan är höga.",
      ],
    },
    {
      heading: "Sverige går mot ett nytt räntebesked",
      paragraphs: [
        "I Sverige ligger inflationen fortsatt på låga nivåer jämfört med Riksbankens mål. Den senast fullt verifierade KPIF-siffran från SCB låg på 1,3 procent i juni.",
        "Styrräntan ligger på 1,75 procent. Vid junimötet lämnade Riksbanken räntan oförändrad och betonade samtidigt att riskerna för högre inflation längre fram hade ökat.",
        "Därför blir veckans kommande besked extra intressant. Riksbankens direktion håller sitt penningpolitiska möte på onsdagen och beslutet om styrräntan publiceras på torsdag klockan 09.30.",
        "Marknaden kommer inte bara att titta på själva räntan. Minst lika viktigt blir hur Riksbanken beskriver inflationen, konjunkturen och risken för nya prisuppgångar under hösten.",
      ],
    },
    {
      heading: "Tisdag: Mowi och den amerikanska konsumenten",
      paragraphs: [
        "Vecka 34 börjar relativt lugnt, men på tisdagen kommer flera rapporter som kan sätta tonen.",
        "Norska laxjätten Mowi presenterar sin rapport för andra kvartalet klockan 08.00. Bolaget är en tung aktör på Oslo-börsen och rapporten blir viktig för hela den nordiska laxsektorn.",
        "I USA rapporterar Home Depot. Efter fredagens oväntat svaga detaljhandel blir kommentarerna om kundernas köplust extra intressanta.",
        "Home Depot följs senare under veckan av bland andra Target och Walmart. Tillsammans kan de ge en tydligare bild av hur den amerikanska konsumenten faktiskt mår.",
      ],
    },
    {
      heading: "Onsdag: Latour, Carlsberg och Fed-protokoll",
      paragraphs: [
        "Onsdagen blir betydligt tätare.",
        "Svenska investmentbolaget Latour publicerar sin delårsrapport för januari till juni klockan 08.00. Samma morgon kommer halvårsrapporten från danska Carlsberg.",
        "Senare under dagen flyttar fokus över Atlanten när Federal Reserve publicerar protokollet från räntemötet den 28–29 juli.",
        "Där letar marknaden efter ledtrådar om hur centralbanken ser på inflationen och hur stor oron är för att ekonomin bromsar. Efter veckans inflations- och detaljhandelssiffror kan små förändringar i tonen få stor uppmärksamhet.",
      ],
    },
    {
      heading: "Torsdag: veckans stora svenska dag",
      paragraphs: [
        "För Stockholmsbörsen kan torsdagen bli veckans viktigaste dag.",
        "Klockan 09.30 publicerar Riksbanken sitt nya penningpolitiska beslut. Styrräntan ligger inför mötet på 1,75 procent.",
        "Själva beslutet är förstås viktigt, men formuleringarna om resten av året kan bli minst lika betydelsefulla för kronan, bankerna, fastighetsbolagen och andra räntekänsliga aktier.",
        "I USA rapporterar samtidigt Walmart. Det ger ännu en viktig temperaturmätare på världens största konsumentmarknad.",
      ],
    },
    {
      heading: "Tre frågor inför vecka 34",
      paragraphs: [
        "Den första frågan är vad Riksbanken säger om räntan och inflationsriskerna. Marknaden vill veta om den låga inflationen väger tyngre än risken för nya prisuppgångar.",
        "Den andra är om den amerikanska konsumenten verkligen börjar bromsa. Fredagens detaljhandel väckte frågan, och rapporterna från de stora butikskedjorna kan ge ett tydligare svar.",
        "Den tredje är om bolagen kan fortsätta leverera. Vestas och Embracer visade under veckan hur snabbt marknaden kan belöna positiva överraskningar. Nu går stafettpinnen vidare till bland andra Mowi, Latour och Carlsberg.",
        "Vecka 33 gav marknaden lite mindre inflationsoro. Vecka 34 ska visa vad centralbankerna och företagen gör med den informationen.",
      ],
    },
  ],
};
