import type { LearningArticle } from "../types";

const article: LearningArticle = {
  slug: "vad-bestammer-priset-pa-en-aktie",
  title: "Vad bestämmer priset på en aktie?",
  seoTitle: "Vad bestämmer priset på en aktie? Så sätts kursen",
  description:
    "Vad bestämmer priset på en aktie? Se hur utbud, efterfrågan, rapporter, räntor och förväntningar får aktiekursen att stiga eller falla.",
  excerpt:
    "Aktiekursen ändras när köpare och säljare möts på marknaden. Här förklarar vi enkelt vad som faktiskt får priset på en aktie att stiga eller falla.",
  category: "Aktier",
  level: "Nybörjare",
  publishedAt: "2026-09-17",
  updatedAt: "2026-09-17",
  authorName: "DivLab Redaktion",
  coverImage: "/learning/vad-bestammer-priset-pa-en-aktie.png",
  coverImageAlt:
    "Omslagsbild till DivLabs guide om vad som bestämmer priset på en aktie och hur aktiekursen sätts.",
  thumbnailObjectPosition: "left center",
  searchTerms: [
    "vad bestämmer priset på en aktie",
    "vad påverkar aktiekursen",
    "hur sätts aktiekursen",
    "vad styr aktiekursen",
    "varför stiger aktier",
    "varför faller aktier",
    "aktiepris",
    "aktiekurs",
    "hur fungerar orderboken",
  ],
  relatedArticleSlugs: [
    "vad-ar-en-aktie",
    "pe-tal-vad-betyder-det",
    "sa-laser-du-en-kvartalsrapport",
    "borsens-ordlista",
  ],
  showDefaultDisclaimer: true,
  intro: [
    "Priset på en aktie bestäms i grunden av utbud och efterfrågan. När en köpare och en säljare accepterar samma pris genomförs en affär, och det senaste avslutet visas normalt som aktiens aktuella kurs.",
    "Men varför är någon beredd att betala 105 kronor i dag när aktien kostade 100 kronor i går? Svaret finns ofta i nya förväntningar på företagets framtida vinster, räntor, konjunktur, nyheter eller hur investerare bedömer risken.",
    "Här går vi igenom hur aktiekursen sätts i praktiken och varför priset ibland rör sig kraftigt även när företaget i sig inte har förändrats över en natt.",
  ],
  sources: [
    {
      href: "https://www.konsumenternas.se/sparande--pension/sparande/sa-fungerar-vardepapper/handel-med-vardepapper/",
      text: "Konsumenternas — Handel med värdepapper",
    },
    {
      href: "https://www.fi.se/sv/for-konsumenter/spara/investera-i-aktier/",
      text: "Finansinspektionen — Investera i aktier",
    },
  ],
  sections: [
    {
      heading: "Aktiekursen sätts när köp och sälj möts",
      paragraphs: [
        "På börsen finns samtidigt investerare som vill köpa och investerare som vill sälja. De lägger order med ett visst antal aktier och ett visst pris. Orderna samlas i en orderbok.",
        "Om den högsta köpordern är 99,90 kronor och den lägsta säljordern är 100 kronor finns det ännu ingen affär på just de nivåerna. Om en köpare däremot accepterar att betala 100 kronor kan ordern matchas med säljaren och ett avslut genomföras.",
        "Det senaste genomförda avslutet används normalt som den kurs du ser i en börsapp. Det betyder att aktiekursen inte är ett pris som företaget självt bestämmer. Den uppstår i handeln mellan marknadens köpare och säljare.",
      ],
      relatedLinks: [
        {
          slug: "vad-ar-en-aktie",
          text: "Läs först Vad är en aktie? om du vill börja med grunderna",
        },
      ],
    },
    {
      heading: "Vad får köpare och säljare att ändra sina priser?",
      paragraphs: [
        "Utbud och efterfrågan förklarar hur priset sätts, men inte varför investerarna ändrar vad de är villiga att betala. Det handlar framför allt om nya förväntningar.",
      ],
      bullets: [
        "Bolagets resultat, försäljning och marginaler",
        "Prognoser och kommentarer om framtiden",
        "Räntor och inflation",
        "Konjunktur och efterfrågan i ekonomin",
        "Nya produkter, förvärv eller andra bolagshändelser",
        "Konkurrens och förändringar i branschen",
        "Politik, regler och valutor",
        "Marknadens riskvilja och allmänna börshumör",
      ],
      paragraphsAfterLists: [
        "När investerare tror att ett företag kan tjäna mer pengar i framtiden kan fler bli villiga att köpa aktien till ett högre pris. Om framtidsutsikterna försämras kan motsatsen hända.",
      ],
    },
    {
      heading: "Förväntningar är ofta viktigare än själva nyheten",
      paragraphs: [
        "En vanlig missuppfattning är att en bra rapport automatiskt ska få aktien att stiga. Så fungerar det inte alltid.",
        "Tänk dig att marknaden förväntar sig en vinst på 10 kronor per aktie men bolaget rapporterar 9 kronor. Vinsten kan vara högre än förra året och ändå uppfattas rapporten som en besvikelse, eftersom investerarna hade räknat med ännu mer.",
        "På samma sätt kan en svag rapport ibland följas av en stigande kurs om utfallet trots allt är bättre än vad marknaden befarade.",
        "Aktiekursen speglar därför inte bara vad som händer i dag. Den speglar också marknadens samlade förväntningar på framtiden.",
      ],
      relatedLinks: [
        {
          slug: "sa-laser-du-en-kvartalsrapport",
          text: "Lär dig läsa en kvartalsrapport steg för steg",
        },
      ],
    },
    {
      heading: "Varför påverkar räntan aktiekurser?",
      paragraphs: [
        "Räntan påverkar både företagen och investerarnas alternativ. Högre räntor kan göra lån dyrare för bolag och hushåll, vilket kan dämpa investeringar och efterfrågan.",
        "Samtidigt blir räntebärande placeringar mer attraktiva när räntan stiger. Investerare kan då kräva högre förväntad avkastning för att ta risken i aktier.",
        "För bolag vars värdering bygger mycket på vinster långt fram i tiden kan förändrade räntor få särskilt stor effekt på hur marknaden värderar framtida kassaflöden.",
      ],
    },
    {
      heading: "Aktiekurs är inte samma sak som bolagets värde",
      paragraphs: [
        "En aktie som kostar 500 kronor är inte automatiskt dyrare än en aktie som kostar 50 kronor. Styckpriset måste sättas i relation till hur många aktier bolaget har och hur mycket företaget tjänar eller förväntas tjäna.",
        "Ett vanligt mått är börsvärdet, som förenklat beräknas genom att multiplicera aktiekursen med antalet utestående aktier.",
      ],
      calculation: {
        title: "Börsvärde",
        lines: [
          "aktiekurs × antal utestående aktier",
          "100 kronor × 100 miljoner aktier = 10 miljarder kronor i börsvärde",
        ],
      },
      paragraphsAfterLists: [
        "För att bedöma om en aktie verkar högt eller lågt värderad används därför ofta nyckeltal som sätter priset i relation till bolagets resultat, kassaflöde eller andra ekonomiska mått.",
      ],
      relatedLinks: [
        {
          slug: "pe-tal-vad-betyder-det",
          text: "Läs hur P/E-talet sätter aktiekursen i relation till vinsten",
        },
      ],
    },
    {
      heading: "Varför kan aktien röra sig när inget har hänt i bolaget?",
      paragraphs: [
        "En aktiekurs kan stiga eller falla även en dag då företaget inte har publicerat någon nyhet. Det beror på att marknaden hela tiden tar in annan information.",
      ],
      bullets: [
        "räntor kan förändras",
        "konkurrenter kan lämna nya besked",
        "hela sektorn kan värderas om",
        "börsen som helhet kan stiga eller falla",
        "stora köp- eller säljorder kan påverka handeln, särskilt i mindre likvida aktier",
      ],
      paragraphsAfterLists: [
        "Det är alltså fullt möjligt att företaget är exakt samma verksamhet klockan 16 som klockan 09 samtidigt som marknadens pris på aktien har förändrats.",
      ],
    },
    {
      heading: "Ett enkelt exempel: från 100 till 105 kronor",
      paragraphs: [
        "Anta att en aktie handlas kring 100 kronor. Bolaget presenterar sedan en rapport som visar starkare försäljning och högre vinst än marknaden väntat sig.",
        "Fler investerare kan då vilja köpa aktien. Om säljarna samtidigt inte vill sälja för 100 kronor måste köparna erbjuda ett högre pris för att få till en affär. Nya avslut kanske sker på 102, 103 och till slut 105 kronor.",
        "Kursen har då stigit eftersom marknadens köpare och säljare har mötts på högre prisnivåer. Bakom rörelsen ligger en förändrad syn på bolagets framtid, men själva priset uppstår fortfarande genom handeln.",
      ],
    },
    {
      heading: "Kort sammanfattning",
      bullets: [
        "Aktiekursen är priset där köpare och säljare genomför affärer.",
        "Utbud och efterfrågan bestämmer priset i varje enskilt avslut.",
        "Rapporter, räntor, konjunktur, nyheter och förväntningar påverkar vad investerare är villiga att betala.",
        "Marknaden reagerar ofta på skillnaden mellan utfallet och vad som redan var förväntat.",
        "En akties styckpris säger inte i sig om bolaget är billigt eller dyrt värderat.",
      ],
      relatedLinks: [
        {
          slug: "vad-ar-en-aktie",
          text: "Fortsätt med grunderna i Vad är en aktie?",
        },
        {
          slug: "borsens-ordlista",
          text: "Slå upp fler börsbegrepp i Börsens ordlista",
        },
      ],
    },
  ],
};

export default article;
