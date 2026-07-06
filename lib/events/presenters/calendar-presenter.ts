import type { CompanyEvent } from "../types/company-event";
import type {
  CalendarEvent,
  CalendarEventType,
  CompanySearchResult,
  DailyOverviewMetric,
  IntelligenceItem,
  IntelligenceItemType,
  PortfolioChange,
  PortfolioChangeType,
  TodaysHighlight,
  UpcomingDividendPayment,
} from "@/types/calendar";
import type {
  DailyOverviewResult,
  TodaysHighlightResult,
  UpcomingDividendResult,
} from "../services/portfolio-event-service";
import type { CompanySearchSnapshot } from "../services/search-event-service";
import { getEventTypeAbbreviation, getEventTypeLabel } from "../taxonomy/labels";
import type { EventTypeId } from "../types/taxonomy";

const calendarEventTypeMap: Partial<Record<EventTypeId, CalendarEventType>> = {
  "dividend.ex-date": "ex-dividend",
  "dividend.payment": "dividend-payment",
  "earnings.report": "earnings",
  "governance.agm": "agm",
  "communication.capital-markets-day": "capital-markets-day",
  "communication.investor-presentation": "investor-presentation",
  "corporate-action.interim-report": "interim-report",
  "corporate-action.press-release": "press-release",
};

const intelligenceTypeMap: Partial<Record<EventTypeId, IntelligenceItemType>> = {
  "dividend.increase": "dividend-increase",
  "dividend.cut": "dividend-reduction",
  "dividend.maintained": "announcement",
  "earnings.report": "earnings",
  "corporate-action.press-release": "press-release",
  "corporate-action.announcement": "announcement",
  "communication.strategic-decision": "strategic-decision",
};

const portfolioChangeTypeMap: Partial<Record<EventTypeId, PortfolioChangeType>> = {
  "dividend.increase": "dividend-increase",
  "earnings.report": "earnings",
  "analyst.target-price-up": "target-price",
  "analyst.target-price-down": "target-price",
  "insider.buying": "insider-buying",
  "insider.selling": "insider-selling",
  "corporate-action.announcement": "announcement",
};

export function toCalendarEvent(event: CompanyEvent): CalendarEvent | null {
  const calendarType = calendarEventTypeMap[event.taxonomy.type];

  if (!calendarType) {
    return null;
  }

  return {
    id: event.id,
    company: event.company.name,
    ticker: event.company.ticker,
    type: calendarType,
    date: event.scheduledAt ?? event.occurredAt.slice(0, 10),
    time: event.scheduledTime,
    inPortfolio: event.inPortfolio,
  };
}

export function toCalendarEvents(events: CompanyEvent[]): CalendarEvent[] {
  return events
    .map((event) => toCalendarEvent(event))
    .filter((event): event is CalendarEvent => event !== null);
}

export function toIntelligenceItem(event: CompanyEvent): IntelligenceItem | null {
  const intelligenceType = intelligenceTypeMap[event.taxonomy.type];

  if (!intelligenceType) {
    return null;
  }

  return {
    id: event.id,
    company: event.company.name,
    ticker: event.company.ticker,
    type: intelligenceType,
    title: event.title,
    summary: event.summary,
    timestamp: event.occurredAt,
    inPortfolio: event.inPortfolio,
  };
}

export function toIntelligenceItems(events: CompanyEvent[]): IntelligenceItem[] {
  return events
    .map((event) => toIntelligenceItem(event))
    .filter((item): item is IntelligenceItem => item !== null);
}

export function toPortfolioChange(event: CompanyEvent): PortfolioChange | null {
  const changeType = portfolioChangeTypeMap[event.taxonomy.type];

  if (!changeType) {
    return null;
  }

  return {
    id: event.id,
    company: event.company.name,
    ticker: event.company.ticker,
    type: changeType,
    title: event.title,
    timestamp: event.occurredAt,
    inPortfolio: event.inPortfolio,
  };
}

export function toPortfolioChanges(events: CompanyEvent[]): PortfolioChange[] {
  return events
    .map((event) => toPortfolioChange(event))
    .filter((change): change is PortfolioChange => change !== null);
}

export function toUpcomingDividendPayment(
  payment: UpcomingDividendResult,
): UpcomingDividendPayment {
  return payment;
}

export function toDailyOverviewMetric(metric: DailyOverviewResult): DailyOverviewMetric {
  return metric;
}

export function toTodaysHighlight(highlight: TodaysHighlightResult): TodaysHighlight {
  return {
    company: highlight.company,
    ticker: highlight.ticker,
    headline: highlight.headline,
    metric: highlight.metric,
    ctaLabel: highlight.ctaLabel,
  };
}

export function toCompanySearchResult(snapshot: CompanySearchSnapshot): CompanySearchResult {
  return snapshot;
}

export function getCalendarEventTypeLabel(type: CalendarEventType): string {
  const entry = Object.entries(calendarEventTypeMap).find(([, value]) => value === type);
  if (!entry) return type;
  return getEventTypeLabel(entry[0] as EventTypeId);
}

export function getCalendarEventTypeAbbrev(type: CalendarEventType): string {
  const entry = Object.entries(calendarEventTypeMap).find(([, value]) => value === type);
  if (!entry) return type.slice(0, 3).toUpperCase();
  return getEventTypeAbbreviation(entry[0] as EventTypeId);
}

export const calendarEventTypeLabels = Object.fromEntries(
  Object.entries(calendarEventTypeMap).map(([typeId, calendarType]) => [
    calendarType,
    getEventTypeLabel(typeId as EventTypeId),
  ]),
) as Record<CalendarEventType, string>;

export const calendarEventTypeAbbrev = Object.fromEntries(
  Object.entries(calendarEventTypeMap).map(([typeId, calendarType]) => [
    calendarType,
    getEventTypeAbbreviation(typeId as EventTypeId),
  ]),
) as Record<CalendarEventType, string>;

export const intelligenceTypeLabels = {
  "dividend-increase": "Dividend Increase",
  "dividend-reduction": "Dividend Reduction",
  earnings: "Earnings Report",
  announcement: "Company Announcement",
  "strategic-decision": "Strategic Decision",
  "press-release": "Press Release",
} as const;

export const portfolioChangeTypeLabels = {
  "dividend-increase": "Dividend Increase",
  earnings: "Earnings Report",
  "target-price": "Target Price Update",
  "insider-buying": "Insider Buying",
  "insider-selling": "Insider Selling",
  announcement: "New Company Announcement",
} as const;
