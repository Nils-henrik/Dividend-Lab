import type { CompanyEvent } from "../types/company-event";
import type { EventService } from "./event-service";
import type { EventRepositoryContract } from "../repository/event-repository-contract";
import {
  calendarReferenceDate,
  mockBrainSummary,
} from "../providers/mock/raw-events";

const SCHEDULED_EVENT_TYPES = new Set([
  "dividend.payment",
  "dividend.ex-date",
  "earnings.report",
  "governance.agm",
  "communication.capital-markets-day",
  "communication.investor-presentation",
  "corporate-action.interim-report",
  "corporate-action.press-release",
]);

const INTELLIGENCE_TYPES = new Set([
  "dividend.increase",
  "dividend.cut",
  "dividend.maintained",
  "earnings.report",
  "corporate-action.press-release",
  "corporate-action.announcement",
  "communication.strategic-decision",
]);

const CHANGE_TYPES = new Set([
  "dividend.increase",
  "earnings.report",
  "analyst.target-price-up",
  "analyst.target-price-down",
  "insider.buying",
  "insider.selling",
  "corporate-action.announcement",
]);

export type DailyOverviewResult = {
  label: string;
  value: number;
  nextLabel: string;
  nextCompany: string;
  nextDetail: string;
};

export type TodaysHighlightResult = {
  company: string;
  ticker: string;
  headline: string;
  metric: string;
  ctaLabel: string;
  eventId: string;
};

export type UpcomingDividendResult = {
  id: string;
  company: string;
  ticker: string;
  dayLabel: string;
  amount: string;
  date: string;
};

export class PortfolioEventService {
  constructor(
    private readonly repository: EventRepositoryContract,
    private readonly eventService: EventService,
  ) {}

  getPortfolioEvents(portfolioOnly = true): CompanyEvent[] {
    return this.repository.query({ portfolioOnly });
  }

  getScheduledEvents(portfolioOnly = true): CompanyEvent[] {
    return this.repository
      .query({ portfolioOnly })
      .filter((event) => SCHEDULED_EVENT_TYPES.has(event.taxonomy.type));
  }

  getIntelligenceFeed(portfolioOnly = true): CompanyEvent[] {
    return this.repository
      .query({ portfolioOnly })
      .filter((event) => INTELLIGENCE_TYPES.has(event.taxonomy.type))
      .sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
      );
  }

  getRecentChanges(portfolioOnly = true): CompanyEvent[] {
    return this.repository
      .query({ portfolioOnly })
      .filter((event) => CHANGE_TYPES.has(event.taxonomy.type))
      .sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
      )
      .slice(0, 6);
  }

  getUpcomingDividendPayments(): UpcomingDividendResult[] {
    return this.repository
      .query({ portfolioOnly: true, type: "dividend.payment" })
      .filter((event) => event.metadata?.dividendAmount && event.metadata?.dayLabel)
      .sort((left, right) =>
        (left.scheduledAt ?? "").localeCompare(right.scheduledAt ?? ""),
      )
      .map((event) => ({
        id: event.id,
        company: event.company.name,
        ticker: event.company.ticker,
        dayLabel: String(event.metadata?.dayLabel ?? ""),
        amount: String(event.metadata?.dividendAmount ?? ""),
        date: event.scheduledAt ?? event.occurredAt.slice(0, 10),
      }));
  }

  getTodaysHighlight(): TodaysHighlightResult | null {
    const highlight =
      this.repository
        .query({ portfolioOnly: true, minImportance: "high" })
        .find((event) => event.taxonomy.type === "dividend.increase") ??
      this.repository
        .query({ portfolioOnly: true, minImportance: "high" })
        .sort(
          (left, right) =>
            new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
        )[0];

    if (!highlight) {
      return null;
    }

    return {
      company: highlight.company.name,
      ticker: highlight.company.ticker,
      headline: highlight.title,
      metric: String(highlight.metadata?.highlightMetric ?? ""),
      ctaLabel: "Read More",
      eventId: highlight.id,
    };
  }

  getDailyOverview(referenceDate = calendarReferenceDate): DailyOverviewResult[] {
    const portfolioEvents = this.getPortfolioEvents(true);
    const todayEvents = portfolioEvents.filter(
      (event) => (event.scheduledAt ?? event.occurredAt.slice(0, 10)) >= referenceDate,
    );

    const upcoming = todayEvents.filter((event) =>
      SCHEDULED_EVENT_TYPES.has(event.taxonomy.type),
    );
    const dividends = todayEvents.filter(
      (event) => event.taxonomy.type === "dividend.payment",
    );
    const earnings = todayEvents.filter(
      (event) => event.taxonomy.type === "earnings.report",
    );
    const news = this.getIntelligenceFeed(true).filter(
      (event) => event.occurredAt.slice(0, 10) >= referenceDate.slice(0, 8) + "01",
    );

    const nextUpcoming = upcoming.sort((left, right) =>
      (left.scheduledAt ?? "").localeCompare(right.scheduledAt ?? ""),
    )[0];
    const nextDividend = dividends.sort((left, right) =>
      (left.scheduledAt ?? "").localeCompare(right.scheduledAt ?? ""),
    )[0];
    const nextEarnings = earnings.sort((left, right) =>
      (left.scheduledAt ?? "").localeCompare(right.scheduledAt ?? ""),
    )[0];
    const latestNews = news[0];

    return [
      {
        label: "Upcoming Events",
        value: upcoming.length,
        nextLabel: "Next",
        nextCompany: nextUpcoming?.company.name ?? "—",
        nextDetail: nextUpcoming?.scheduledTime ?? nextUpcoming?.scheduledAt?.slice(5) ?? "—",
      },
      {
        label: "Dividend Payments",
        value: dividends.length,
        nextLabel: "Next",
        nextCompany: nextDividend?.company.name ?? "—",
        nextDetail: String(nextDividend?.metadata?.dayLabel ?? "—"),
      },
      {
        label: "Earnings Reports",
        value: earnings.length,
        nextLabel: "Next",
        nextCompany: nextEarnings?.company.name ?? "—",
        nextDetail: nextEarnings?.scheduledTime ?? "—",
      },
      {
        label: "Important News",
        value: Math.min(news.length, 3),
        nextLabel: "Latest",
        nextCompany: latestNews?.company.name ?? "—",
        nextDetail: latestNews?.taxonomy.type === "dividend.increase" ? "Dividend +5%" : "Today",
      },
    ];
  }

  getBrainSummary(): string {
    return mockBrainSummary;
  }

  getEventsForBrain(): CompanyEvent[] {
    return this.eventService.getBrainReadyEvents().filter((event) => event.inPortfolio);
  }
}
