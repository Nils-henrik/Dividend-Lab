export type CalendarView = "day" | "week" | "month";

export type PortfolioFilterMode = "portfolio" | "market";

export type CalendarEventType =
  | "ex-dividend"
  | "dividend-payment"
  | "earnings"
  | "agm"
  | "capital-markets-day"
  | "investor-presentation"
  | "interim-report"
  | "press-release";

export type CalendarEvent = {
  id: string;
  company: string;
  ticker: string;
  type: CalendarEventType;
  date: string;
  time?: string;
  inPortfolio: boolean;
};

export type IntelligenceItemType =
  | "dividend-increase"
  | "dividend-reduction"
  | "earnings"
  | "announcement"
  | "strategic-decision"
  | "press-release";

export type IntelligenceItem = {
  id: string;
  company: string;
  ticker: string;
  type: IntelligenceItemType;
  title: string;
  summary: string;
  timestamp: string;
  inPortfolio: boolean;
};

export type PortfolioChangeType =
  | "dividend-increase"
  | "earnings"
  | "target-price"
  | "insider-buying"
  | "insider-selling"
  | "announcement";

export type PortfolioChange = {
  id: string;
  company: string;
  ticker: string;
  type: PortfolioChangeType;
  title: string;
  timestamp: string;
  inPortfolio: boolean;
};

export type UpcomingDividendPayment = {
  id: string;
  company: string;
  ticker: string;
  dayLabel: string;
  amount: string;
  date: string;
};

export type DailyOverviewMetric = {
  label: string;
  value: number;
  nextLabel: string;
  nextCompany: string;
  nextDetail: string;
};

export type TodaysHighlight = {
  company: string;
  ticker: string;
  headline: string;
  metric: string;
  ctaLabel: string;
};

export type CompanySearchResult = {
  ticker: string;
  company: string;
  latestNews: string;
  upcomingEvent: string;
  latestDividend: string;
  earningsDate: string;
  dividendHistory?: string;
};
