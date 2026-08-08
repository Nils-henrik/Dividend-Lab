import type { NewsArticle } from "@/types/news";

/**
 * Weekend recap verified before publication (2026-08-08).
 *
 * Primary factual checks:
 * - Reuters 2026-08-07: US payrolls -23k in July vs +80k consensus; May/June
 *   revisions -103k; unemployment 4.1%; participation 61.4%; markets rallied
 *   and Treasury yields fell after the release.
 * - Reuters 2026-08-07: STOXX 600 closed at record 660.25, +2% for the week;
 *   technology +1.9% and healthcare +1.2% on Friday; Novo Nordisk +3.9%.
 * - Reuters 2026-08-05: Novo Nordisk -4.3% despite raised outlook as investors
 *   focused on a sales miss and CagriSema trial delay.
 * - DivLab's already-verified Norden i centrum 4-7 Aug source notes/company
 *   reports for Asmodee, Coffee Stain, W5 Solutions, Yubico, Lundin Mining,
 *   Nordic Semiconductor and Hexagon Composites.
 *
 * This is an after-the-week recap. It intentionally does not repeat the
 * pre-week article `borsvecka-32-investor-inflation-usa-jobb`.
 */
export const BORSVECKAN_SOM_GICK_VECKA_32_2026_ARTICLE: NewsArticle = {
  id: "borsveckan-som-gick-vecka-32-2026",
  slug: "borsveckan-som-gick-vecka-32-2026",
  title: "Börsveckan som gick: rekordjakt, rapportvinnare och USA:s jobbchock",
  summary:
    "Vecka 32 började med rekordhumör och starka rapporter men slutade med oväntat svaga USA-jobb som snabbt ändrade räntespelet. Samtidigt bjöd Norden på stora rapportsvängningar.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-08T22:45:00+02:00",
  url: "/news/borsveckan-som-gick-vecka-32-2026",
  featured: true,
  imageUrl: "/news-demo/borsveckan-som-gick-vecka-32-2026.svg",
  thumbnailObjectPosition: "center 42%",
  mobileThumbnailObjectPosition: "center 34%",
  imageAlt:
    "Mörk redaktionell börsbild med stadssiluett, marknadsgraf och rubriken Börsveckan som gick – vecka 32.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 6,
  seoTitle: "Börsveckan som gick vecka 32: jobbchock och rapportvinnare",
  seoDescription:
    "Vecka 32 i korthet: rekordnivåer i Europa, svaga USA-jobb och nordiska rapporter från bland andra Asmodee, Yubico, Novo Nordisk och Nordic Semiconductor.",
  seoKeywords: [
    "börsveckan som gick",
    "börsvecka 32",
    "Stockholmsbörsen",
    "USA jobb",
    "ränta",
    "Novo Nordisk",
    "Asmodee",
    "Yubico",
    "Nordic Semiconductor",
    "W5 Solutions",
    "STOXX 600",
    "börsen augusti 2026",
  ],
  showDisclaimer: true,
  intro: [
    "Vecka 32 började med samma känsla som präglat stora delar av sommaren: stark riskaptit, nya rekordnivåer och investerare som varit beredda att belöna bolag som levererar över förväntan.",
    "Sedan kom fredagens amerikanska jobbrapport.",
    "USA förlorade oväntat 23 000 jobb i juli. Marknaden hade räknat med ungefär 80 000 nya jobb. Dessutom reviderades de två föregående månaderna ned med sammanlagt 103 000 jobb. På några minuter föll amerikanska marknadsräntor och börserna steg när investerare började räkna med en mindre hökaktig Federal Reserve.",
    "Det blev en passande avslutning på en vecka som hela tiden handlade om samma sak: höga förväntningar. Starka rapporter kunde fortfarande ge kraftiga kurslyft, men en mindre miss räckte för att skapa stora fall. I Norden syntes det i allt från Asmodee och Yubico till Novo Nordisk och Coffee Stain.",
  ],
  sections: [
    {
      heading: "Stockholm gick in i veckan från rekordnivå",
      paragraphs: [
        "Stockholmsbörsen gick in i vecka 32 från ett mycket starkt utgångsläge. På måndagen noterades nya rekordnivåer och optimismen fick stöd av en internationell teknikuppgång och ett fortsatt starkt rapportsentiment.",
        "Men veckans svenska signaler var inte odelat starka. Swedbank och Silfs tjänste-PMI för juli sjönk till 54,2 från 56,5 och det sammansatta PMI-indexet föll till 54,7 från 56,9. Nivåer över 50 pekar fortfarande på expansion, men tempot mattades.",
        "Det skapade en klassisk sensommarbörs: indexnivåerna var höga samtidigt som konjunktursignalerna blev mer blandade. Därmed ökade betydelsen av varje enskild rapport.",
      ],
    },
    {
      heading: "Asmodee satte tonen – stark rapport blev belönad",
      paragraphs: [
        "Asmodee levererade en av veckans tydligaste positiva svenska rapporter. Nettoomsättningen steg 26,6 procent till 442 miljoner euro och den organiska tillväxten blev 20,2 procent.",
        "Justerad ebitda uppgick till 61,9 miljoner euro, tydligt över marknadens förväntningar. Rapporten kombinerade därmed det investerare helst ville se: hög tillväxt, bättre resultat och stöd från flera produktkategorier och regioner.",
        "Veckans rapporthandel visade samtidigt hur snabbt ribban höjs när ett bolag väl har fått marknadens förtroende. En stark siffra räcker inte alltid; kvaliteten i tillväxten och nästa prognos blir minst lika viktiga.",
      ],
    },
    {
      heading: "Coffee Stain och W5 visade baksidan av snabb tillväxt",
      paragraphs: [
        "Coffee Stain växte kraftigt. Omsättningen ökade 37 procent till 253 miljoner kronor och cash ebit steg till 95 miljoner kronor. Problemet var att båda nivåerna låg under analytikernas förväntningar.",
        "Rapporten blev därför en påminnelse om att marknaden handlar på skillnaden mellan förväntan och utfall – inte bara på om siffrorna är bättre än förra året.",
        "W5 Solutions visade samma konflikt i ännu tydligare form. Försäljningen steg 105 procent till 227,9 miljoner kronor och orderboken nådde 865 miljoner. Samtidigt var det justerade rörelseresultatet minus 7 miljoner kronor.",
        "Efterfrågan finns alltså där. Nästa bevispunkt för W5 är om den snabba expansionen kan omvandlas till stabil lönsamhet och kassaflöde.",
      ],
    },
    {
      heading: "Yubico och Lundin Mining levererade det marknaden ville se",
      paragraphs: [
        "På torsdagen kom två rapporter med en tydligare lönsamhetsprofil.",
        "Yubicos omsättning steg 9 procent till 543,9 miljoner kronor, men den stora förändringen fanns i marginalen. Rörelseresultatet steg från 21,2 till 78,5 miljoner kronor och ebit-marginalen förbättrades från 4,2 till 14,4 procent efter genomförda kostnadsbesparingar.",
        "Lundin Mining redovisade samtidigt 1,21 miljarder dollar i omsättning och 658 miljoner dollar i justerad ebitda. Det justerade fria kassaflödet från verksamheten steg till 395,9 miljoner dollar och bolaget avslutade kvartalet med nettokassa trots fortsatt investeringstakt.",
        "I båda fallen var budskapet liknande: när värderingarna är höga vill marknaden se att tillväxt faktiskt når sista raden eller kassaflödet.",
      ],
    },
    {
      heading: "Norge fick två rapporter som stack ut",
      paragraphs: [
        "Nordic Semiconductor ökade omsättningen med 33 procent till 218,6 miljoner dollar och förbättrade bruttomarginalen till 53,1 procent. Justerad ebitda steg nästan 75 procent till 36,3 miljoner dollar och bolaget guidar för fortsatt tillväxt i tredje kvartalet.",
        "Hexagon Composites levererade en annan typ av förbättring. Omsättningen sjönk, men ebitda steg från 12 till 69 miljoner norska kronor. Bolaget höjde dessutom helårsprognosen för ebitda från tidigare över 200 miljoner till omkring 300 miljoner norska kronor.",
        "Det var två exempel på varför rapportperioden fortfarande kan skapa stora bolagsspecifika rörelser även när den breda börsen står nära rekordnivåer.",
      ],
    },
    {
      heading: "Novo Nordisk blev veckans tydligaste förväntningsaktie",
      paragraphs: [
        "Novo Nordisks rapport var på pappret stark. Justerad försäljning ökade 7 procent i konstanta valutor och justerat rörelseresultat steg 11 procent. Bolaget höjde samtidigt sin helårsprognos till en utveckling på 0 till minus 6 procent i konstanta valutor.",
        "Ändå föll aktien 4,3 procent på onsdagen. Investerarna fokuserade bland annat på en försäljningsmiss och en försenad studie för nästa generations fetmaläkemedel CagriSema.",
        "På fredagen steg Novo i stället 3,9 procent när europeiska hälsovårdsaktier gick starkt.",
        "Det sammanfattar veckan väl. Novo hade inte blivit ett sämre bolag på två dagar. Marknadens bedömning av förväntningar, konkurrens och framtida tillväxt flyttades däremot snabbt.",
      ],
    },
    {
      heading: "Fredagens jobbchock ändrade räntespelet",
      paragraphs: [
        "Veckans viktigaste makrosiffra kom efter lunch på fredagen svensk tid.",
        "Den amerikanska ekonomin förlorade 23 000 jobb i juli. Konsensus låg kring plus 80 000. Samtidigt reviderades jobbtillväxten för maj och juni ned med sammanlagt 103 000 jobb.",
        "Arbetslösheten sjönk visserligen från 4,2 till 4,1 procent, men en viktig förklaring var att 264 000 personer lämnade arbetskraften. Deltagandegraden föll till 61,4 procent, den lägsta nivån på ungefär fem och ett halvt år.",
        "Marknadsreaktionen var tydlig. Amerikanska aktier steg, statsobligationsräntorna föll och dollarn försvagades. Svagare arbetsmarknad minskade sannolikheten för att Federal Reserve snabbt ska behöva strama åt penningpolitiken ytterligare.",
        "Det är positivt för aktievärderingar på kort sikt, men en svagare arbetsmarknad är inte odelat goda nyheter. Om jobbförsvagningen fortsätter kan fokus snabbt flyttas från lägre räntor till oro för tillväxten.",
      ],
    },
    {
      heading: "Europa avslutade veckan på rekord",
      paragraphs: [
        "Trots geopolitisk oro och stora rapportsvängningar avslutade Europa veckan starkt.",
        "Det breda STOXX 600-indexet stängde fredagen på rekordnivån 660,25 punkter och steg omkring 2 procent under veckan. Teknik och hälsovård hörde till fredagens starkaste sektorer.",
        "Även i USA nådde stora index nya rekord under veckan, med kraftigt stöd från teknik- och halvledaraktier. S&P 500 hade sin starkaste fyradagarsperiod sedan april 2025.",
        "Det betyder att vecka 32 slutade i ett märkligt men inte ovanligt börsläge: aktier steg både på starka bolagsvinster och på svagare makrodata, eftersom den senare samtidigt pressade ned ränteförväntningarna.",
      ],
    },
    {
      heading: "Tre saker att ta med sig in i vecka 33",
      paragraphs: [
        "För det första har marknaden fortfarande låg tolerans för besvikelser. Novo Nordisk och Coffee Stain visade att en i grunden stark rapport kan ge en svag kursreaktion om förväntningarna varit ännu högre.",
        "För det andra är räntan tillbaka som den centrala börsvariabeln. Efter fredagens svaga jobbsiffra blir kommande amerikanska inflationsdata extra viktiga. En hög inflation skulle skapa en obekväm kombination av svagare arbetsmarknad och fortsatt pristryck.",
        "För det tredje är geopolitiken fortfarande närvarande. Oljepriset svängde kraftigt under veckan i takt med nya besked kring Iran och Hormuzsundet. För Norden påverkar det både energibolag, inflation och räntesyn.",
        "Vecka 32 slutade alltså starkt på indexnivå. Men under ytan blev marknaden mer selektiv. Det är sannolikt den viktigaste signalen att bära med sig vidare.",
      ],
    },
  ],
};
