import type { NewsArticle } from "@/types/news";

/**
 * Vecka 33 publiceringsunderlag verifierat 2026-08-10.
 *
 * Primära faktakontroller inför publicering:
 * - U.S. Bureau of Labor Statistics: KPI juli publiceras 12 aug, PPI juli 13 aug.
 * - U.S. Census Bureau: amerikansk detaljhandel för juli publiceras 14 aug.
 * - SCB: ordinarie svenskt KPI/KPIF för juli publiceras 13 aug kl. 08.00.
 * - Norges Bank: räntebesked 13 aug kl. 10.00; styrräntan var 4,25 % efter junibeslutet.
 * - SSB: norsk KPI för juli publiceras 10 aug.
 * - RBA: räntebesked och penningpolitisk rapport 11 aug.
 * - ONS: första brittiska BNP-estimatet för Q2 och BNP för juni publiceras 13 aug.
 * - Maersk: Q2 2026 publiceras 13 aug; bolaget höjde helårsprognosen 29 juni.
 * - Pandora: Q2 2026 publiceras 13 aug.
 * - Ørsted: halvårsrapport 2026 publiceras 13 aug.
 * - Supermicro: Q4/FY26-resultat och konferenssamtal 11 aug.
 * - Applied Materials: Q3 FY26-resultat 13 aug.
 * - Cisco och CoreWeave hör till veckans större amerikanska teknikrapporter.
 *
 * Artikeln har ingen synlig källförteckning enligt DivLabs etablerade redaktionella format.
 */
export const BORSVECKA_33_ARTICLE: NewsArticle = {
  id: "borsvecka-33",
  slug: "borsvecka-33",
  title: "Börsvecka 33",
  summary:
    "Vecka 33 samlar flera av månadens viktigaste börshändelser på bara några dagar: inflation i Sverige och USA, norskt räntebesked och tunga rapporter från både Norden och tekniksektorn.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-10T07:30:00+02:00",
  url: "/news/borsvecka-33",
  featured: true,
  imageUrl: "/news-demo/borsvecka-33.svg",
  thumbnailObjectPosition: "center 45%",
  mobileThumbnailObjectPosition: "center 34%",
  imageAlt:
    "Redaktionell DivLab-bild med kalender, börsgraf och rubriken Börsvecka 33 för 10–16 augusti 2026.",
  imageCaption: "Grafik: DivLab.",
  readingMinutes: 7,
  seoTitle: "Börsvecka 33: inflation, räntor och rapporter att bevaka",
  seoDescription:
    "Börsvecka 33, 10–16 augusti 2026: svensk och amerikansk inflation, Norges Banks räntebesked samt rapporter från Maersk, Pandora, Ørsted, Supermicro och Applied Materials.",
  seoKeywords: [
    "börsvecka 33",
    "börsen vecka 33",
    "Stockholmsbörsen",
    "inflation USA",
    "svensk inflation",
    "Norges Bank",
    "Maersk rapport",
    "Pandora rapport",
    "Ørsted rapport",
    "Supermicro",
    "Applied Materials",
    "börsen augusti 2026",
  ],
  showDisclaimer: true,
  intro: [
    "Vecka 33 ser på förhand ut som en av augustis viktigaste börsveckor. Inte för att kalendern är full från morgon till kväll, utan för att flera besked som kan flytta räntor, valutor och aktier ligger tätt samlade mellan onsdag och fredag.",
    "Den stora frågan är inflationen. Först kommer amerikanska konsumentpriser på onsdagen. På torsdagen följer svensk inflation, Norges Banks räntebesked och amerikanska producentpriser. På fredagen får marknaden dessutom ett nytt mått på den amerikanska konsumenten genom detaljhandeln för juli.",
    "Samtidigt fortsätter rapportperioden. I Norden står bland andra Maersk, Pandora och Ørsted på tur. I USA riktas blickarna mot teknik- och halvledarbolag som Supermicro, Cisco, CoreWeave och Applied Materials.",
    "För svenska sparare blir veckan därför en ovanligt tydlig prövning av tre saker samtidigt: hur snabbt prisökningarna avtar, hur centralbankerna reagerar och om bolagens vinster kan bära de höga förväntningarna på börsen.",
  ],
  sections: [
    {
      heading: "Måndag: norsk inflation öppnar veckan",
      paragraphs: [
        "Veckan inleds med norsk inflation för juli. Siffran får större betydelse än vanligt eftersom Norges Bank lämnar nytt räntebesked redan på torsdag.",
        "Den norska styrräntan ligger på 4,25 procent efter att banken höjde räntan i maj och därefter lämnade den oförändrad i juni. Norges Bank har därmed gått en annan väg än flera centralbanker som tidigare kunnat lätta på penningpolitiken.",
        "Om prisökningarna visar sig vara fortsatt sega ökar trycket på banken att hålla fast vid en stram linje. Ett tydligare inflationsfall skulle i stället kunna ge marknaden större utrymme att börja diskutera när nästa lättnad kan komma.",
        "För Oslo-börsen är sambandet direkt. Kronan, bankerna, fastighetsbolagen och räntekänsliga aktier kan reagera redan före torsdagens besked.",
      ],
    },
    {
      heading: "Tisdag: Australien sätter räntetonen – Supermicro testar AI-handeln",
      paragraphs: [
        "På tisdagen kommer räntebesked från Australiens centralbank tillsammans med en ny penningpolitisk rapport. Australien är inte avgörande för Stockholmsbörsen, men beskedet blir ännu en pusselbit i den globala räntebilden inför veckans tyngre inflationssiffror.",
        "Efter USA-börsens stängning hamnar i stället tekniksektorn i centrum när Supermicro presenterar resultat för sitt fjärde kvartal och helåret.",
        "Bolaget är en viktig leverantör av servrar och datacentersystem till AI-utbyggnaden. Inför rapporten har Supermicro redan sagt att kvartalsomsättningen väntas hamna nära den nedre delen av tidigare prognos, samtidigt som bruttomarginalen väntas bli betydligt bättre än bolaget tidigare räknat med.",
        "Det gör rapporten intressant långt utanför den egna aktien. Investerare kommer att leta efter tecken på hur snabbt efterfrågan på AI-infrastruktur faktiskt växer och hur mycket av den efterfrågan som kan omvandlas till lönsamhet.",
      ],
    },
    {
      heading: "Onsdag: veckans första stora test – amerikansk inflation",
      paragraphs: [
        "Onsdagens amerikanska KPI för juli är veckans första riktigt stora marknadshändelse.",
        "Efter förra veckans svaga amerikanska jobbsiffra har ränteläget blivit ännu känsligare. Marknaden vill veta om Federal Reserve kan fokusera mer på den svalare arbetsmarknaden eller om inflationen fortfarande tvingar centralbanken att vara försiktig.",
        "En mjuk inflationssiffra skulle normalt ge stöd åt obligationsmarknaden och räntekänsliga tillväxtaktier. En oväntat hög siffra skulle däremot skapa en mer besvärlig kombination: svagare arbetsmarknad samtidigt som prisökningarna inte ger med sig.",
        "Det är just den kombinationen som kan ge stora rörelser. Börsen har under sommaren fått stöd av lägre marknadsräntor, och därför kan små avvikelser i KPI få större genomslag än själva decimalen antyder.",
        "Under veckan rapporterar även Cisco och CoreWeave. För Cisco ligger fokus på nätverksutrustning, AI-beställningar och marginaler. För CoreWeave handlar det framför allt om hur snabbt den kapitalkrävande AI-molnverksamheten kan fortsätta växa utan att kostnaderna springer ifrån intäkterna.",
      ],
    },
    {
      heading: "Torsdag: vecka 33:s mest laddade börsdag",
      paragraphs: [
        "Torsdagen är den dag då flest viktiga besked kommer på kort tid.",
        "Redan på morgonen publiceras Storbritanniens första BNP-estimat för andra kvartalet och BNP för juni. Kort därefter kommer den ordinarie svenska inflationsstatistiken för juli.",
        "Den svenska siffran blir viktig inför Riksbankens nästa besked den 20 augusti. Riksbankens styrränta ligger på 1,75 procent och banken har samtidigt markerat att riskerna för högre inflation framöver har ökat. Därför kommer marknaden att granska både KPIF och de mer underliggande prisrörelserna noga.",
        "Klockan 10.00 lämnar Norges Bank sitt räntebesked. Då får marknaden facit på hur banken väger den färska norska inflationen mot konjunkturen och den höga räntenivån.",
        "Senare under dagen kommer amerikanska producentpriser, PPI. Måttet ligger ett steg tidigare i priskedjan än konsumentpriserna och kan ge signaler om framtida kostnadstryck för företag.",
        "Det räcker för att göra torsdagen viktig på makrosidan. Men rapportkalendern gör dagen ännu tyngre.",
      ],
    },
    {
      heading: "Maersk, Pandora och Ørsted – tre danska rapporter med helt olika frågor",
      paragraphs: [
        "Maersk publicerar sin rapport för andra kvartalet på torsdagen. Det sker efter att bolaget i slutet av juni höjde sin helårsprognos kraftigt med hänvisning till starkare efterfrågan på containertransporter och högre spotpriser.",
        "Därför blir själva resultatet bara en del av rapporten. Minst lika viktigt blir vad Maersk säger om fraktpriser, volymer och hur uthållig styrkan i containertrafiken är. För Norden fungerar Maersk dessutom som en temperaturmätare på global handel.",
        "Pandora rapporterar samma dag. Efter ett första kvartal med låg jämförbar tillväxt men fortsatt god lönsamhet ligger fokus på om smyckesbolaget kan försvara marginalerna samtidigt som konsumenterna blivit mer försiktiga på flera marknader.",
        "Ørsted lämnar halvårsrapport. Här kommer investerarna främst att följa kassaflöde, projektgenomförande och finansiering. Havsbaserad vindkraft är kapitalkrävande, och små förändringar i räntor, byggkostnader eller projektplaner kan få stor effekt på värderingen.",
        "Tre bolag, tre olika branscher – men samma grundfråga: håller den framtidsbild som aktiekurserna redan räknar med?",
      ],
    },
    {
      heading: "Applied Materials blir veckans halvledartest",
      paragraphs: [
        "Efter torsdagens amerikanska börsstängning rapporterar Applied Materials. Bolaget säljer utrustning som används för att tillverka avancerade halvledare och skärmar och är därför en central länk i den globala investeringskedjan kring AI och datacenter.",
        "Rapporten kan säga mycket om hur chipproducenterna ser på investeringstakten framåt. Det är särskilt viktigt efter en period då stora delar av teknikbörsen har drivits av förväntningar på fortsatt mycket höga investeringar i AI-kapacitet.",
        "Om orderläge och prognos fortsätter att stärkas får halvledarsektorn stöd för berättelsen om en lång investeringscykel. Om efterfrågan däremot börjar plana ut kan reaktionen bli större än för ett mer normalt industribolag, eftersom värderingarna i sektorn redan är höga.",
      ],
    },
    {
      heading: "Fredag: amerikansk detaljhandel visar om konsumenten håller",
      paragraphs: [
        "Veckan avslutas med amerikansk detaljhandel för juli.",
        "Siffran är viktig eftersom den amerikanska hushållskonsumtionen fortfarande är en av världsekonomins viktigaste motorer. Efter tecken på en svagare arbetsmarknad vill marknaden veta om hushållen också börjat dra ned på tempot.",
        "Stark försäljning kan lugna tillväxtoron men samtidigt hålla liv i inflations- och räntefrågan. Svag försäljning kan i stället förstärka bilden av en ekonomi som tappar fart.",
        "Det betyder att fredagens besked kan få en dubbel effekt. Samma svaga siffra som pressar räntorna nedåt kan också väcka oro för bolagens framtida försäljning. Den balansen blir central när veckan summeras.",
      ],
    },
    {
      heading: "Veckans rapporter att hålla extra öga på",
      paragraphs: [
        "Supermicro blir ett direkt test av AI-servermarknaden. Cisco ger en bredare bild av nätverk, datacenter och företagens teknikbudgetar. CoreWeave visar hur investerarna värderar extrem tillväxt när kapitalbehovet samtidigt är stort.",
        "Maersk blir viktig för global handel och frakt. Pandora blir en temperaturmätare på premiumkonsumtion. Ørsted visar hur den gröna energiomställningen klarar ett fortsatt krävande finansieringsläge. Applied Materials blir slutligen en av veckans tydligaste signaler från halvledarindustrin.",
        "Det är en ovanligt bra blandning för att läsa av världsekonomin: transporter, konsumtion, energi, datacenter och chipinvesteringar – allt på samma vecka.",
      ],
    },
    {
      heading: "Det viktigaste att bevaka under Börsvecka 33",
      paragraphs: [
        "Först inflationen. Onsdagens amerikanska KPI och torsdagens svenska KPI och amerikanska PPI kan tillsammans flytta hela räntebilden.",
        "Sedan centralbankerna. Norges Bank ger veckans viktigaste nordiska räntebesked, medan Riksbanken ligger bara en vecka bort och kommer att få färsk svensk inflation att väga in.",
        "Till sist bolagens framtidsutsikter. Efter en stark börssommar räcker det inte alltid att resultatet är bra. Marknaden vill se att tillväxten fortsätter, att marginalerna håller och att ledningarnas prognoser motiverar värderingarna.",
        "Vecka 33 har därför potential att bli betydligt mer rörlig än kalendern först ser ut. Fram till onsdag kan handeln vara avvaktande. Därefter kommer flera besked i snabb följd – och då kan räntor, valutor och aktier börja dra åt olika håll.",
      ],
    },
    {
      heading: "Vecka 33 i korthet",
      paragraphs: [
        "Måndag 10 augusti: norsk inflation för juli.",
        "Tisdag 11 augusti: räntebesked från Australiens centralbank och rapport från Supermicro.",
        "Onsdag 12 augusti: amerikansk KPI för juli. Cisco och CoreWeave hör till veckans stora teknikrapporter.",
        "Torsdag 13 augusti: brittisk BNP, svensk KPI, Norges Banks räntebesked, amerikansk PPI samt rapporter från Maersk, Pandora, Ørsted och Applied Materials.",
        "Fredag 14 augusti: amerikansk detaljhandel för juli.",
        "Lördag–söndag 15–16 augusti: marknaden summerar en vecka där inflation och ränta sannolikt har satt tonen inför nästa veckas svenska räntebesked.",
      ],
    },
  ],
};
