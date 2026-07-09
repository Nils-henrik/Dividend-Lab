export type LearningArticleSection = {
  heading?: string;
  paragraphs: string[];
};

export type LearningArticle = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  readingMinutes: number;
  sections: LearningArticleSection[];
};

export const learningDisclaimer =
  "Endast utbildande innehåll. Inte finansiell rådgivning.";

export const learningArticles: LearningArticle[] = [
  {
    slug: "tid-till-ekonomisk-frihet",
    title: "Vad påverkar tiden till ekonomisk frihet mest?",
    description:
      "En lugn genomgång av vad som oftast driver resan mot utdelningsbaserad frihet över tid.",
    excerpt:
      "Månadssparande, tålamod och realistiska antaganden påverkar ofta mer än små skillnader i avkastning tidigt.",
    readingMinutes: 5,
    sections: [
      {
        paragraphs: [
          "När investerare planerar för ekonomisk frihet genom utdelningar är det lätt att fokusera på den perfekta direktavkastningen eller det snabbaste bolaget. I praktiken påverkar några grundläggande faktorer ofta resans längd mer än små optimeringar.",
          "Tid i marknaden, konsekvent sparande och rimliga förväntningar på avkastning och utdelningstakt bildar tillsammans en mer realistisk bild än enskilda prognoser.",
        ],
      },
      {
        heading: "Sparandet som motor",
        paragraphs: [
          "I början av resan är dina egna insättningar ofta den största drivkraften bakom kapitaltillväxt. Det betyder att en stabil sparrutin kan ha större effekt än att jaga några extra procentenheter i avkastning.",
          "Ju längre horisont du har, desto mer får ränta-på-ränta och återinvesterade utdelningar tid att arbeta. Men utan regelbundna insättningar tar den processen längre tid att komma igång.",
        ],
      },
      {
        heading: "Realistiska antaganden",
        paragraphs: [
          "Frihetskalkyler blir mer trovärdiga när du skiljer mellan önskat utfall och sannolikt utfall. Direktavkastning, tillväxt och utdelningssäkerhet varierar mellan perioder och sektorer.",
          "En lugn plan utgår därför hellre från konservativa antaganden och uppdateras över tid, i stället för att låsa sig vid ett enda optimistiskt scenario.",
        ],
      },
      {
        heading: "Disciplin och risk",
        paragraphs: [
          "Koncentration i få höga avkastare kan öka inkomstpotentialen kortfattat, men också öka risken för sänkta utdelningar. Diversifiering och kvalitet tenderar att ge en mer jämn resa.",
          "Ekonomisk frihet handlar sällan om att maximera varje kvartal. Det handlar om att bygga ett kapital som kan bära en hållbar utdelningsnivå genom olika marknadslägen.",
        ],
      },
    ],
  },
  {
    slug: "direktavkastning-och-utdelningssakerhet",
    title: "Direktavkastning och utdelningssäkerhet",
    description:
      "Varför hög avkastning inte räcker — och vad som ofta avgör om en utdelning är hållbar.",
    excerpt:
      "Hållbar utdelning bygger på kassaflöde, affärskvalitet och förmågan att behålla utdelningen över tid.",
    readingMinutes: 6,
    sections: [
      {
        paragraphs: [
          "Direktavkastning är ett enkelt mått: årlig utdelning i relation till aktiekurs. Det gör det lätt att jämföra bolag, men säger lite om hur säker utdelningen är framåt.",
          "Två bolag med samma avkastning kan ha helt olika riskprofil beroende på skuldsättning, bransch, vinstutveckling och historik av utdelningsbeslut.",
        ],
      },
      {
        heading: "Kvalitet före siffra",
        paragraphs: [
          "Utdelningssäkerhet handlar ofta om hur väl vinst och kassaflöde stödjer utdelningen. Ett bolag som delar ut mer än verksamheten rimligen klarar kan se attraktivt ut tills utdelningen justeras.",
          "Långsiktiga utdelningsinvesterare brukar därför väga stabilitet, affärsmodell och historik tyngre än en tillfälligt hög avkastning.",
        ],
      },
      {
        heading: "Utdelningstillväxt kontra hög nivå",
        paragraphs: [
          "En måttlig men växande utdelning kan över tid ge mer planerbar inkomst än en hög utdelning utan tillväxt. Det beror på att återinvesterade utdelningar och stigande utbetalningar kan stärka det långsiktiga kassaflödet.",
          "Det innebär inte att hög avkastning alltid är fel — men att förstå varför avkastningen är hög är minst lika viktigt som själva siffran.",
        ],
      },
      {
        heading: "Risk och diversifiering",
        paragraphs: [
          "Sektorskoncentration, valutaexponering och enskilda bolagsrisker påverkar hur stabil din totala utdelningsström blir. Spridning över bolag, branscher och regioner minskar beroendet av en enskild utdelare.",
          "Målet är inte att eliminera risk, utan att förstå den och bygga en utdelningsplan som klarar normala marknadssvängningar.",
        ],
      },
    ],
  },
  {
    slug: "sparande-i-borjan",
    title: "Varför sparandet betyder mest i början",
    description:
      "Hur insättningar, vanor och tålamod formar resan innan portföljen vuxit sig stor.",
    excerpt:
      "När kapitalet är relativt litet påverkar dina egna beslut mer än passiv avkastning.",
    readingMinutes: 4,
    sections: [
      {
        paragraphs: [
          "Många investerare underskattar hur mycket de första åren av sparande betyder. När portföljen fortfarande är liten är det dina insättningar — inte marknadens dagliga rörelser — som oftast avgör hur snabbt kapitalet växer.",
          "Det kan kännas långsamt i början, men vanor som etableras tidigt blir ofta de mest värdefulla över decennier.",
        ],
      },
      {
        heading: "Insättningar slår avkastning tidigt",
        paragraphs: [
          "Om du sparar regelbundet varje månad ökar kapitalet även när marknaden är flat eller svag. Det skapar ett momentum som senare förstärks av ränta-på-ränta och utdelningar.",
          "Att höja sparandet med små steg — till exempel efter löneförändring — kan ha större effekt än att jaga marginellt högre avkastning i ett litet kapital.",
        ],
      },
      {
        heading: "Psykologi och tålamod",
        paragraphs: [
          "I början är det lätt att jämföra sig med mer erfarna investerare eller stora portföljer online. Det skapar onödig stress och kan leda till förhastade beslut.",
          "En lugn strategi fokuserar på det du kan kontrollera: sparfrekvens, riskspridning, lärande och konsekvent långsiktighet.",
        ],
      },
      {
        heading: "Bygg grunden först",
        paragraphs: [
          "När kapitalet växer får avkastning och utdelningar gradvis större roll. Men grunden läggs i början: tydliga mål, realistiska förväntningar och en plan som du faktiskt kan följa genom olika marknadslägen.",
          "Det är därför utbildning, planering och community ofta är särskilt värdefullt innan portföljen blir komplex — inte efteråt.",
        ],
      },
    ],
  },
];

export function getLearningArticle(slug: string) {
  return learningArticles.find((article) => article.slug === slug) ?? null;
}

export function getDashboardLearningInsights() {
  return learningArticles.map((article) => ({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
  }));
}
