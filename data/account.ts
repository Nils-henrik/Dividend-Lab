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
  memberSince: "Member since January 2024",
  initials: "EH",
  avatarUrl: "",
  bio: "Dividend growth investor focused on long-term cash flow, resilient companies and financial independence through disciplined monthly investing.",
};

export const investorStatistics: InvestorStatistic[] = [
  {
    label: "Dividend Yield",
    value: "4.83%",
    visibility: "Public",
    detail: "Weighted portfolio yield",
    icon: "chart",
  },
  {
    label: "Years Investing",
    value: "8",
    visibility: "Public",
    detail: "Dividend-focused since 2018",
    icon: "timer",
  },
  {
    label: "Investment Strategy",
    value: "Dividend Growth",
    visibility: "Public",
    detail: "Quality income and reinvestment",
    icon: "compass",
  },
  {
    label: "Country",
    value: "Sweden",
    visibility: "Friends",
    detail: "Primary investor region",
    icon: "globe",
  },
];

export const portfolioDisclosure: PortfolioDisclosure[] = [
  {
    label: "Portfolio Range",
    range: "1M-5M",
    detail: "Approximate range shared instead of exact portfolio value.",
    icon: "briefcase",
  },
  {
    label: "Annual Dividend Income",
    range: "50k-100k/year",
    detail: "Optional income band selected for privacy-conscious sharing.",
    icon: "cashflow",
  },
];

export const portfolioPrivacyMessage =
  "Portfolio information is optional. Dividend Lab encourages sharing knowledge, consistency and thoughtful contribution rather than wealth.";

export const profileHighlights: Record<
  "currentGoal" | "favoriteQuote" | "favoriteSector" | "philosophy",
  ProfileHighlight
> = {
  philosophy: {
    title: "Investment Philosophy",
    value: "I buy businesses, not stock prices.",
    detail: "A patient framework for quality, cash flow and resilience.",
    icon: "quote",
  },
  favoriteSector: {
    title: "Favorite Sector",
    value: "REITs",
    detail: "Income-producing assets with long-term compounding potential.",
    icon: "shield",
  },
  currentGoal: {
    title: "Current Goal",
    value: "Financial Independence by 2038",
    detail: "Build durable annual dividend income through disciplined investing.",
    icon: "target",
  },
  favoriteQuote: {
    title: "Favorite Quote",
    value:
      "The stock market is a device for transferring money from the impatient to the patient.",
    detail: "Warren Buffett",
    icon: "flag",
  },
};

export const investorLevel = {
  current: "Analyst",
  next: "Veteran",
  progress: 68,
  contributionSummary:
    "Earned through thoughtful forum contributions, durable portfolio tracking and consistent educational activity.",
  hierarchy: ["Beginner", "Investor", "Analyst", "Veteran", "Dividend Master"],
};

export const premiumMembership = {
  status: "PRO Member",
  description:
    "Premium analytics, deeper Dividend Brain usage and exclusive educational tools. Membership is separate from investor level.",
};

export const forumReputation: ReputationMetric[] = [
  {
    label: "Reputation Score",
    value: "4 820",
    detail: "Community credibility",
  },
  {
    label: "Likes Received",
    value: "1 284",
    detail: "Signals from members",
  },
  {
    label: "Upvotes",
    value: "936",
    detail: "High-signal contributions",
  },
  {
    label: "Helpful Answers",
    value: "148",
    detail: "Accepted by the community",
  },
];
