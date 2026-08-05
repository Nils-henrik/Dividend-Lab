import type { NewsArticle } from "@/types/news";

/**
 * Approved Börsnyheter article — do not rewrite body copy.
 *
 * Verified before publication (2026-08-05):
 * - Asia: Nikkei ~+3%, Kospi ~+3–4%, MSCI Asia ex-Japan ~+1.5–2.3% (Reuters/Jakarta Post, Aug 5).
 * - Brent oil ~$79/bbl morning (Reuters, Aug 5).
 * - AMD −~9% after hours despite Q2 beat (Benzinga/Yahoo, Aug 4).
 * - Coffee Stain Q1 FY26/27: sales SEK 253m (+37%), organic +41%, cash EBIT SEK 95m
 *   (consensus sales 261–268m, cash EBIT 103–109m) — coffeestain.com interim report.
 * - W5 Solutions Q2: sales SEK 227.9m (+105%), organic +66%, EBIT −24.3m, adj EBIT −7.0m,
 *   op. cash flow +40.7m, order intake 234m, order book 865m — w5solutions.com.
 * - Orrön–Cloudberry: 27.01% stake, ~2.1 TWh production, ~EUR 93m loans assumed,
 *   EUR 4.2m cash — orron.com / Aug 5 interim report.
 * - Novo Nordisk Q2: adj sales DKK 78,488m (+7% CER), adj op profit DKK 33,389m (+11% CER),
 *   2026 guidance raised to 0% to −6% CER — novonordisk.com Aug 4 report; call 13:00 CEST Aug 5.
 * - Sweden PMI-services July: 54.2 (from 56.5); PMI-Composite 54.7 (from 56.9) —
 *   Swedbank/Silf, Aug 5 08:30.
 * - Avanza July stats: net inflow SEK 8,600m, customers 2,352,600 — investors.avanza.se Aug 5.
 * - Norway salmon week 31: fresh price NOK 73.57/kg, volume 26,958 t (Jul 27–Aug 2) — SSB Aug 5.
 *
 * Cover: DivLab editorial composite with embedded title and company panels.
 * See norden-i-centrum-5-augusti-2026.license.txt.
 */
export const NORDEN_I_CENTRUM_5_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-5-augusti-2026",
  slug: "norden-i-centrum-5-augusti-2026",
  title: "Norden i centrum, 5 Augusti",
  summary:
    "Novo Nordisk möter marknaden efter rapporten, Coffee Stain växer men missar förväntningarna och W5 Solutions dubblar försäljningen. Här är dagens nordiska börsbild.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-05T08:45:00+02:00",
  url: "/news/norden-i-centrum-5-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/norden-i-centrum-5-augusti-2026.webp",
  thumbnailObjectPosition: "center 34%",
  mobileThumbnailObjectPosition: "center 21%",
  imageAlt:
    "Omslagsbild för Norden i centrum den 5 augusti med Novo Nordisk, Coffee Stain, W5 Solutions och andra nordiska börsbolag.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 8,
  seoTitle: "Norden i centrum 5 augusti: Novo, Coffee Stain och W5",
  seoDescription:
    "Norden i centrum den 5 augusti 2026: Novo Nordisk, Coffee Stain, W5 Solutions, oljepriset och dagens viktigaste börshändelser i Norden.",
  seoKeywords: [
    "nordiska börsen idag",
    "Norden i centrum",
    "Stockholmsbörsen idag",
    "Oslobörsen idag",
    "Helsingforsbörsen idag",
    "Köpenhamnsbörsen idag",
    "börsen 5 augusti 2026",
    "Novo Nordisk rapport",
    "Coffee Stain rapport",
    "W5 Solutions rapport",
    "oljepris idag",
    "nordiska aktier idag",
  ],
  showDisclaimer: true,
  intro: [
    "De nordiska börserna går in i onsdagen med starka signaler från Asien, fallande oljepris och flera rapporter som kan skapa stora skillnader mellan Sverige, Norge, Finland och Danmark.",
    "I Sverige har Coffee Stain levererat kraftig tillväxt, men rapporten når inte hela vägen upp till marknadens förväntningar. Försvarsteknikbolaget W5 Solutions mer än fördubblar försäljningen, samtidigt som svag lönsamhet visar hur dyr den snabba expansionen har blivit.",
    "I Danmark riktas nästan all uppmärksamhet mot Novo Nordisk. Bolaget höjer sin helårsprognos, men investerarna oroas fortfarande av konkurrensen inom fetmaläkemedel och motgångar i läkemedelspipelinen.",
    "För Oslobörsen är oljeprisets fortsatta fall dagens viktigaste fråga. I Finland får Nokia och andra teknikbolag stöd av den starka asiatiska halvledarhandeln, men AMD:s kursfall efter rapporten påminner om hur högt förväntningarna har skruvats upp.",
    "Här är det viktigaste att bevaka på de nordiska börserna den 5 augusti 2026.",
  ],
  sections: [
    {
      heading: "Asien rusar samtidigt som oljepriset faller",
      paragraphs: [
        "Det internationella börsläget ger i grunden stöd åt den nordiska öppningen.",
        "Japans Nikkei steg omkring 3,5 procent under morgonen, Sydkoreas Kospi cirka 4,3 procent och det breda Asienindexet utanför Japan ungefär 2,3 procent. Uppgångarna drevs framför allt av halvledare, AI-investeringar och stark riskaptit efter nya rekordnivåer på Wall Street.",
        "Europeiska indexterminer pekade samtidigt mot mindre uppgångar inför öppningen.",
        "Men teknikbilden är inte odelat positiv. AMD föll omkring 9 procent i den amerikanska efterhandeln trots att både försäljningen och prognosen överträffade analytikernas förväntningar.",
        "Marknadens reaktion visar att det inte längre räcker att leverera stark tillväxt inom AI. Bolagen måste även överträffa mycket högt ställda förväntningar.",
        "Oljepriset fortsätter samtidigt nedåt. Brentoljan handlades under morgonen omkring 79 dollar per fat, långt under sommarens högsta nivåer.",
        "Bakom nedgången finns förhoppningar om framsteg i försöken att avsluta konflikten mellan USA och Iran och förbättra sjöfarten genom Hormuzsundet.",
        "Det lägre oljepriset minskar inflationsoron och pressar obligationsräntor, vilket normalt är positivt för tillväxtbolag, fastigheter och konsumentaktier.",
        "För de stora norska oljeproducenterna är effekten däremot negativ om prisnedgången består.",
      ],
    },
    {
      heading: "Sverige: Coffee Stain växer snabbt men missar förväntningarna",
      paragraphs: [
        "Coffee Stain är en av morgonens viktigaste svenska rapportaktier.",
        "Spelkoncernens nettoomsättning ökade med 37 procent till 253 miljoner kronor under det första kvartalet i det brutna räkenskapsåret 2026/2027. Den organiska tillväxten i konstanta valutor var 41 procent.",
        "Cash ebit steg från 36 till 95 miljoner kronor och marginalen förbättrades från 20 till 38 procent. Det fria kassaflödet efter rörelsekapital uppgick till 100 miljoner kronor.",
        "Tillväxten är stark, men utfallet ligger under konsensus. Analytikernas medianprognos var en omsättning på 261 miljoner kronor och cash ebit på 103 miljoner. Genomsnittsprognoserna låg ännu högre.",
        "Rapporten innehåller därför både tydliga styrkor och varningssignaler.",
        "Satisfactory fortsätter att vara en stabil motor och konsollanseringen har bidragit till försäljningen.",
        "Samtidigt har mottagandet av Deep Rock Galactic: Rogue Core varit blandat och spelarnas aktivitet föll snabbare än bolaget räknat med.",
        "Även Fellowship hade lägre aktivitet än målsättningen. Coffee Stain minskar därför utvecklingsteamet bakom spelet från 35 till 15 personer för att anpassa kostnaderna till den kommersiella utvecklingen.",
        "Det positiva är att den befintliga spelportföljen fortfarande genererar ett starkt kassaflöde.",
        "Risken är att marknaden fokuserar mer på prognosmissen och de svagare nya lanseringarna än på den höga tillväxten jämfört med föregående år.",
        "Coffee Stain håller sin rapportpresentation klockan 10.00.",
        "Ledningens kommentarer om Rogue Core, Fellowship, Satisfactory och den kommande lanseringen av Valheim 1.0 kan bli avgörande för hur aktien utvecklas under resten av dagen.",
      ],
    },
    {
      heading: "W5 Solutions dubblar försäljningen – men förlusten består",
      paragraphs: [
        "W5 Solutions levererar en av dagens mest dramatiska tillväxtrapporter.",
        "Nettoomsättningen steg med 105 procent till 227,9 miljoner kronor under det andra kvartalet. Den organiska tillväxten uppgick enligt bolaget till 66 procent.",
        "Orderingången blev 234 miljoner kronor och orderboken uppgick vid kvartalets slut till 865 miljoner kronor, jämfört med 597 miljoner ett år tidigare.",
        "Tillväxten är mycket stark, men resultaträkningen visar samtidigt tydliga problem.",
        "Rörelseresultatet blev minus 24,3 miljoner kronor.",
        "Justerat för engångskostnader kopplade till förvärvet av finländska KT-Shelter blev rörelseresultatet minus 7 miljoner kronor.",
        "Det operativa kassaflödet förbättrades däremot kraftigt till plus 40,7 miljoner kronor.",
        "Bolaget pekar på högre inköpspriser, leveransproblem, förvärvskostnader och pressat rörelsekapital som förklaringar till den svaga lönsamheten.",
        "Under andra halvåret ska fokus ligga på kostnadskontroll, effektivitet och högre bruttomarginal.",
        "W5 har samtidigt flera starka långsiktiga drivkrafter.",
        "Bolaget har slutfört förvärvet av KT-Shelter, tecknat ett ramavtal med Försvarsmakten som uppskattas kunna vara värt omkring 700 miljoner kronor över avtalets fulla löptid och fått ett kontrakt från FMV på cirka 46 miljoner kronor.",
        "Rapporten visar därmed exakt den konflikt som ofta finns i snabbt växande småbolag: efterfrågan och orderbok utvecklas starkt, men organisationen måste bevisa att tillväxten går att omvandla till uthållig vinst och kassaflöde.",
        "Presentation och frågestund börjar klockan 11.00.",
      ],
    },
    {
      heading: "Dagens mindre aktie: W5 kan växa – men måste lösa marginalerna",
      paragraphs: [
        "W5 Solutions är dagens mindre nordiska bolag att bevaka.",
        "Den europeiska upprustningen, högre försvarsbudgetar och behovet av träningssystem, kraftförsörjning, simulering och skyddade mobila lösningar ger bolaget en marknad som kan växa under lång tid.",
        "En orderbok på 865 miljoner kronor skapar dessutom bättre synlighet än vad många mindre industribolag har.",
        "Det innebär inte att aktien automatiskt är billig eller att kursen måste stiga.",
        "W5 verkar på Nasdaq First North och är betydligt mindre än exempelvis Saab, Kongsberg Gruppen och Rheinmetall.",
        "Förvärv, integrationsarbete, rörelsekapital och en ojämn projektmix kan därför ge stora svängningar mellan kvartalen.",
        "Den viktigaste frågan är inte längre om W5 kan växa. Dagens rapport visar att bolaget kan öka försäljningen snabbt.",
        "Den avgörande frågan är om ledningen kan förbättra bruttomarginalen, minska direktkostnaderna och föra det justerade rörelseresultatet från förlust till stabil vinst.",
        "W5 ska därför beskrivas som ett intressant men tydligt riskfyllt tillväxtcase – inte som en självklar vinnare eller köprekommendation.",
      ],
    },
    {
      heading: "Orrön Energy förändras genom Cloudberry-affären",
      paragraphs: [
        "Orrön Energy har också lämnat rapport under morgonen.",
        "Den viktigaste långsiktiga händelsen är inte ett enskilt kvartal, utan den planerade kombinationen av Orröns nordiska tillgångar, med undantag för Karskruv, och norska Cloudberry Clean Energy.",
        "När transaktionen slutförs ska Orrön bli Cloudberrys största ägare med 27,01 procent.",
        "Den sammanslagna plattformen väntas få en årlig proportionell elproduktion på omkring 2,1 terawattimmar.",
        "Cloudberry ska även ta över eller reglera omkring 93 miljoner euro i lån och upplupen ränta, samtidigt som Orrön får 4,2 miljoner euro kontant.",
        "Orrön har därför beskrivit den kvarvarande verksamheten som nära skuldfri efter genomförandet.",
        "För aktiemarknaden blir värdet på Cloudberry-innehavet, utvecklingen i Karskruv och Orröns projektportfölj inom datacenter, solenergi och batterilagring centrala frågor.",
        "Rapportpresentationen börjar klockan 14.00.",
      ],
    },
    {
      heading: "De svenska storbolagen följer räntor, teknik och försvar",
      paragraphs: [
        "Investor, Atlas Copco, Volvo, Sandvik och SKF får stöd av den starka internationella riskaptiten, men utvecklingen kan förändras när ny amerikansk statistik publiceras senare under dagen.",
        "Investor fungerar som en bred temperaturmätare genom sina stora innehav inom industri, läkemedel, telekom och finans.",
        "Ericsson påverkas av det starka teknikintresset, men AMD:s kursfall visar att investerare har blivit mindre förlåtande mot bolag som inte överträffar redan höga förväntningar.",
        "Saab kan fortsätta påverkas av Europas upprustning och geopolitik.",
        "W5:s rapport visar att efterfrågan finns även längre ned i försvarsindustrins leverantörskedja, men också att snabb expansion kan skapa kostnadsproblem.",
        "Avanza publicerade månadsstatistik för juli klockan 08.30. Nettoinflödet uppgick till 8,6 miljarder kronor och antalet kunder till 2,35 miljoner vid månadsskiftet.",
        "Samtidigt publicerades svenskt tjänste-PMI och sammanvägt PMI. PMI–tjänster sjönk till 54,2 i juli från 56,5 i juni, men ligger kvar i tillväxtzonen. PMI-Composite backade till 54,7 från 56,9. Det innebär fortsatt expansion, men i lugnare takt än i juni.",
      ],
    },
    {
      heading: "Norge: Equinor, Aker BP och Vår Energi pressas av oljan",
      paragraphs: [
        "På Oslobörsen är oljepriset dagens viktigaste marknadsfaktor.",
        "Brentoljan har fallit kraftigt på kort tid.",
        "Om nedgången håller i sig minskar de förväntade intäkterna för Equinor, Aker BP och Vår Energi, även om bolagens faktiska kassaflöden också påverkas av produktion, kostnader, valutor och prissäkringar.",
        "För Equinor är gaspriserna och den breda energimixen viktiga.",
        "Aker BP och Vår Energi har en mer direkt känslighet mot utvecklingen i norsk olje- och gasproduktion.",
        "Ett lägre oljepris kan samtidigt gynna andra delar av den norska marknaden genom lägre bränslekostnader och minskad inflation.",
        "Flyg, transport, konsumtion och vissa industribolag kan därmed få stöd även om energiindexet pressas.",
      ],
    },
    {
      heading: "Laxbolagen får nya exportdata",
      paragraphs: [
        "Mowi, SalMar och Lerøy Seafood är andra viktiga norska aktier att följa.",
        "Norsk statistikmyndighet har publicerat veckodata över exportpris och exportvolym för lax.",
        "För vecka 31 (27 juli–2 augusti) blev exportpriset på färsk eller kyld lax 73,57 norska kronor per kilo, en uppgång med 3,2 procent jämfört med föregående vecka. Exportvolymen ökade med 4,4 procent till 26 958 ton.",
        "Siffrorna är viktiga eftersom kombinationen av pris, volym, biologiska kostnader och slaktvikt påverkar lönsamheten i hela sektorn.",
        "Kongsberg Gruppen följer i stället försvarsmarknaden och den geopolitiska utvecklingen.",
        "Bolaget kan därför röra sig i en annan riktning än den oljeberoende delen av Oslobörsen.",
      ],
    },
    {
      heading: "Finland: Nokia får teknikstöd – Neste påverkas av oljefallet",
      paragraphs: [
        "Helsingforsbörsen har en tunnare lokal rapportkalender och kommer därför i hög grad att följa internationella signaler.",
        "Nokia kan få stöd av den starka asiatiska halvledarhandeln och den fortsatta investeringsviljan inom AI och datacenter.",
        "Samtidigt är Nokia främst beroende av teleoperatörernas investeringar i nätverksutrustning, inte av samma direkta drivkrafter som en chiptillverkare.",
        "AMD:s negativa efterhandsreaktion är därför en viktig varning.",
        "Tekniksektorn har starkt momentum, men värderingarna gör att mindre besvikelser kan ge stora kursfall.",
        "Kone och Metso påverkas mer av den globala industrikonjunkturen och investeringarna i Kina och Europa.",
        "UPM-Kymmene och Stora Enso följer efterfrågan på förpackningar, massa, papper och träprodukter.",
        "Lägre energipriser kan minska vissa kostnader, men svag efterfrågan kan väga tyngre.",
        "För Neste är ett fallande råoljepris inte automatiskt positivt.",
        "Bolagets resultat påverkas av råvarukostnader, produktpriser, raffinaderimarginaler och efterfrågan på förnybara bränslen.",
        "Det är marginalen mellan in- och utpriserna, snarare än oljepriset isolerat, som är avgörande.",
        "Sampo får i stället stöd om räntor faller utan att konjunkturoron ökar kraftigt.",
        "Försäkringsresultat och kapitalavkastning är viktigare än dagens råvarurörelser.",
      ],
    },
    {
      heading: "Danmark: Novo Nordisk höjer prognosen men marknaden tvekar",
      paragraphs: [
        "Novo Nordisk är dagens viktigaste nordiska storbolag.",
        "Bolagets justerade försäljning steg med 7 procent i konstanta valutor till 78,5 miljarder danska kronor under det andra kvartalet.",
        "Det justerade rörelseresultatet ökade med 11 procent till 33,4 miljarder kronor.",
        "Novo höjde samtidigt prognosen för 2026.",
        "Både den justerade försäljningstillväxten och tillväxten i justerat rörelseresultat väntas nu ligga mellan 0 och minus 6 procent i konstanta valutor.",
        "Den tidigare prognosen var minus 4 till minus 12 procent.",
        "Trots prognoshöjningen reagerade den USA-noterade aktien negativt.",
        "Investerarna fokuserar på att försäljningen av Wegovy i tablettform låg något under analytikernas förväntningar och på nya frågetecken kring läkemedelspipelinen.",
        "Bolaget tog också nedskrivningar på totalt 6,3 miljarder danska kronor för immateriella tillgångar, där monlunabant stod för 4 miljarder.",
        "Novo meddelade dessutom att fas 3-studien ZEUS med ziltivekimab inte nådde sitt primära mål.",
        "Rapporten visar därför två parallella bilder.",
        "Den kommersiella efterfrågan på GLP-1-behandlingar är fortsatt stark och ledningen ser tillräckligt hög försäljning för att höja helårsprognosen.",
        "Samtidigt har konkurrensen från Eli Lilly hårdnat och marknaden kräver tydliga bevis för att Novo har nästa generations framgångsrika behandlingar i sin pipeline.",
        "Investerarsamtalet klockan 13.00 blir centralt.",
        "Frågorna lär handla om Wegovy-tabletten, priser och rabatter i USA, konkurrensen, produktionskapaciteten, CagriSema och kommande forskningsprojekt.",
        "Novo Nordisk har en så stor vikt på Köpenhamnsbörsen att aktiens reaktion kan styra hela det danska indexet.",
      ],
    },
    {
      heading: "Maersk, DSV och Vestas följer andra drivkrafter",
      paragraphs: [
        "A.P. Møller-Mærsk och DSV kan få stöd av lägre bränslekostnader, men effekten beror även på fraktrater, transportvolymer och hur snabbt sjöfarten genom Mellanöstern normaliseras.",
        "Om Hormuzsundet öppnas mer kan tillgången på energi förbättras, samtidigt som delar av den geopolitiska riskpremien i fraktraterna försvinner.",
        "Vestas gynnas normalt av lägre obligationsräntor eftersom finansieringen av stora vindkraftsprojekt blir billigare.",
        "Orderkvalitet, projektkostnader och lönsamhet är dock viktigare än en enskild dags ränterörelse.",
      ],
    },
    {
      heading: "Tiderna som kan flytta Norden i dag",
      paragraphs: [
        "Klockan 08.30: Avanza publicerade månadsstatistik för juli. Svenskt tjänste-PMI sjönk till 54,2 och PMI-Composite till 54,7.",
        "Klockan 09.00: Börserna öppnar i Stockholm, Oslo, Helsingfors och Köpenhamn. De första rörelserna i Coffee Stain, W5 Solutions, Orrön Energy och Novo Nordisk visar hur marknaden väger tillväxt mot förväntningar och lönsamhet.",
        "Klockan 10.00: Coffee Stain presenterar rapporten och svarar på frågor.",
        "Klockan 11.00: W5 Solutions håller sin rapportpresentation. Samtidigt håller Eiendom Norge presskonferens om den norska bostadsprisstatistiken för juli, vilket kan påverka banker, fastighetsrelaterade bolag och synen på norsk ränta.",
        "Klockan 13.00: Novo Nordisk håller investerarsamtal om halvårsrapporten.",
        "Klockan 14.00: Orrön Energy presenterar sin rapport och Cloudberry-transaktionen.",
        "Klockan 14.15: USA publicerar ADP:s sysselsättningsstatistik för den privata sektorn.",
        "Under den amerikanska eftermiddagen: USA publicerar tjänste-PMI och ISM:s tjänsteindex. Siffrorna kan påverka dollarn, obligationsräntorna och nordiska teknik-, fastighets- och industribolag.",
        "Klockan 22.05: Federal Reserve-ledamoten Lisa Cook håller tal.",
      ],
    },
    {
      heading: "Tre möjliga scenarier för börsdagen",
      paragraphs: [
        "Positivt scenario: De nordiska börserna följer Asien uppåt. Lägre oljepris pressar inflation och räntor, samtidigt som investerarna väljer att fokusera på tillväxten i Coffee Stain, W5 och Novo Nordisk. Teknik, industri, fastigheter och konsumentbolag kan då väga upp en svagare norsk energisektor.",
        "Blandat scenario: Coffee Stain och W5 handlas volatilt när stark tillväxt ställs mot missade förväntningar och svag lönsamhet. Novo Nordisk pressar Köpenhamn, medan svenska och finska industribolag får stöd av den globala riskaptiten. De fyra nordiska marknaderna utvecklas då åt olika håll.",
        "Negativt scenario: Marknaden tolkar rapporterna som bevis på att höga förväntningar inte infrias. Novo Nordisk faller på pipelineoro, Coffee Stain straffas för prognosmissen och W5 pressas av förlusten. Om amerikansk tjänstestatistik samtidigt driver upp räntorna kan även högt värderade teknik- och tillväxtbolag falla tillbaka.",
      ],
    },
    {
      heading: "Norden i centrum – tillväxt räcker inte utan kvalitet",
      paragraphs: [
        "Dagens nordiska börs handlar om skillnaden mellan snabb tillväxt och hög kvalitet i tillväxten.",
        "Coffee Stain ökar försäljningen kraftigt och genererar mycket pengar, men nya spel har inte fått det mottagande bolaget hoppats på.",
        "W5 Solutions mer än fördubblar omsättningen och bygger en stor orderbok, men måste visa att expansionen går att omvandla till vinst.",
        "Novo Nordisk höjer helårsprognosen, men investerarna vill se starkare produktförsäljning och en pipeline som kan stå emot Eli Lilly.",
        "I Norge pressar oljeprisfallet energibolagen, medan Finland får stöd av den internationella teknikhandeln.",
        "Den gemensamma nämnaren är tydlig: i en marknad med höga förväntningar räcker det inte att växa.",
        "Bolagen måste växa snabbare än väntat, med god lönsamhet och en trovärdig väg framåt.",
        "Artikeln är allmän marknadsinformation och ska inte betraktas som personlig investeringsrådgivning. Historisk avkastning är ingen garanti för framtida avkastning. Aktier i mindre, illikvida eller snabbt växande bolag kan innebära mycket hög risk.",
      ],
    },
    {
      heading: "Vanliga frågor",
      paragraphs: [
        "Vad händer på Stockholmsbörsen i dag?",
        "Coffee Stain, W5 Solutions och Orrön Energy har rapporterat. Avanza publicerade månadsstatistik för juli och svenskt tjänste-PMI sjönk till 54,2, vilket kan påverka synen på konjunkturen och räntorna.",
        "Varför är Novo Nordisk i fokus?",
        "Novo Nordisk har höjt helårsprognosen men marknaden oroas av konkurrensen inom fetmaläkemedel, försäljningen av Wegovy och motgångar i läkemedelspipelinen. Bolaget håller investerarsamtal klockan 13.00.",
        "Hur påverkar oljepriset Oslobörsen?",
        "Ett lägre oljepris kan pressa Equinor, Aker BP och Vår Energi eftersom deras framtida intäkter påverkas av energipriserna. Samtidigt kan lägre bränslekostnader och inflation gynna andra norska sektorer.",
        "Är W5 Solutions en möjlig tillväxtaktie?",
        "W5 har stark försäljningstillväxt, stor orderbok och exponering mot ökade europeiska försvarsbudgetar. Bolaget redovisar samtidigt förlust och måste förbättra marginaler, kostnadskontroll och kassaflöde. Risken är därför hög.",
      ],
    },
  ],
};
