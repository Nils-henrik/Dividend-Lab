export type VisibilityState = "Public" | "Friends" | "Private";

export type PortfolioRange =
  | "Private"
  | "Under 100k"
  | "100k-500k"
  | "500k-1M"
  | "1M-5M"
  | "5M+";

export type DividendIncomeRange =
  | "Private"
  | "Under 10k/year"
  | "10k-50k/year"
  | "50k-100k/year"
  | "100k+/year";

export type AccountIconName =
  | "award"
  | "briefcase"
  | "camera"
  | "cashflow"
  | "chart"
  | "compass"
  | "flag"
  | "globe"
  | "quote"
  | "shield"
  | "target"
  | "timer";

export type InvestorStatistic = {
  label: string;
  value: string;
  visibility: VisibilityState;
  detail: string;
  icon: AccountIconName;
};

export type PortfolioDisclosure = {
  label: string;
  range: PortfolioRange | DividendIncomeRange;
  detail: string;
  icon: AccountIconName;
};

export type ReputationMetric = {
  label: string;
  value: string;
  detail: string;
};

export type ProfileHighlight = {
  title: string;
  value: string;
  detail: string;
  icon: AccountIconName;
};

export const investorIdentity = {
  fullName: "Erik Holm",
  username: "dividendholm",
  memberSince: "Medlem sedan januari 2024",
  initials: "EH",
  avatarUrl: "",
  bio: "Utdelningsinvesterare med fokus på långsiktigt kassaflöde, robusta bolag och ekonomisk frihet genom disciplinerat månadssparande.",
};

export const investorStatistics: InvestorStatistic[] = [
  {
    label: "Utdelningsavkastning",
    value: "4,83 %",
    visibility: "Public",
    detail: "Viktad portföljavkastning",
    icon: "chart",
  },
  {
    label: "Investeringsår",
    value: "8",
    visibility: "Public",
    detail: "Utdelningsfokus sedan 2018",
    icon: "timer",
  },
  {
    label: "Investeringsstrategi",
    value: "Utdelningstillväxt",
    visibility: "Public",
    detail: "Kvalitetsinkomst och återinvestering",
    icon: "compass",
  },
  {
    label: "Land",
    value: "Sverige",
    visibility: "Friends",
    detail: "Primär investeringsregion",
    icon: "globe",
  },
];

export const portfolioDisclosure: PortfolioDisclosure[] = [
  {
    label: "Portföljstorlek",
    range: "1M-5M",
    detail: "Ungefärligt intervall i stället för exakt portföljvärde.",
    icon: "briefcase",
  },
  {
    label: "Årlig utdelningsinkomst",
    range: "50k-100k/year",
    detail: "Valfritt inkomstintervall för mer integritetsmedveten delning.",
    icon: "cashflow",
  },
];

export const portfolioPrivacyMessage =
  "Portföljinformation är valfri. Dividend Lab uppmuntrar att dela kunskap, konsekvens och genomtänkt bidrag snarare än förmögenhet.";

export const profileHighlights: Record<
  "currentGoal" | "favoriteQuote" | "favoriteSector" | "philosophy",
  ProfileHighlight
> = {
  philosophy: {
    title: "Investeringsfilosofi",
    value: "Jag köper verksamheter, inte aktiekurser.",
    detail: "Ett tålmodigt ramverk för kvalitet, kassaflöde och motståndskraft.",
    icon: "quote",
  },
  favoriteSector: {
    title: "Favoritsektor",
    value: "REITs",
    detail: "Inkomstgenererande tillgångar med långsiktig sammansatt avkastning.",
    icon: "shield",
  },
  currentGoal: {
    title: "Nuvarande mål",
    value: "Ekonomisk frihet till 2038",
    detail: "Bygga hållbar årlig utdelningsinkomst genom disciplinerat investerande.",
    icon: "target",
  },
  favoriteQuote: {
    title: "Favoritcitat",
    value:
      "Börsen är en mekanism för att flytta pengar från otåliga till tålmodiga.",
    detail: "Warren Buffett",
    icon: "flag",
  },
};

export const investorLevel = {
  current: "Analytiker",
  next: "Veteran",
  progress: 68,
  contributionSummary:
    "Intjänat genom genomtänkta forumbidrag, långsiktig portföljuppföljning och konsekvent utbildningsaktivitet.",
  hierarchy: ["Nybörjare", "Investerare", "Analytiker", "Veteran", "Utdelningsmästare"],
};

export const premiumMembership = {
  status: "PRO-medlem",
  description:
    "Premiumanalys, djupare användning av Dividend Brain och exklusiva utbildningsverktyg. Medlemskap är separat från investerarnivå.",
};

export const forumReputation: ReputationMetric[] = [
  {
    label: "Ryktespoäng",
    value: "4 820",
    detail: "Trovärdighet i gemenskapen",
  },
  {
    label: "Mottagna gillningar",
    value: "1 284",
    detail: "Signal från medlemmar",
  },
  {
    label: "Uppröster",
    value: "936",
    detail: "Bidrag med hög signal",
  },
  {
    label: "Hjälpsamma svar",
    value: "148",
    detail: "Accepterade av gemenskapen",
  },
];
