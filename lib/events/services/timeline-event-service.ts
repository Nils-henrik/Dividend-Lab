import type { CompanyEvent } from "../types/company-event";
import type { EventRepositoryContract } from "../repository/event-repository-contract";
import { calendarReferenceDate } from "../providers/mock/raw-events";

const TIMELINE_EVENT_TYPES = new Set([
  "dividend.payment",
  "dividend.ex-date",
  "earnings.report",
  "governance.agm",
  "communication.capital-markets-day",
  "communication.investor-presentation",
  "corporate-action.interim-report",
  "corporate-action.press-release",
]);

export class TimelineEventService {
  constructor(private readonly repository: EventRepositoryContract) {}

  getReferenceDate(): string {
    return calendarReferenceDate;
  }

  getTimelineEvents(portfolioOnly = true): CompanyEvent[] {
    return this.repository
      .query({ portfolioOnly })
      .filter((event) => TIMELINE_EVENT_TYPES.has(event.taxonomy.type))
      .sort((left, right) =>
        (left.scheduledAt ?? left.occurredAt).localeCompare(
          right.scheduledAt ?? right.occurredAt,
        ),
      );
  }

  getEventsForDate(date: string, portfolioOnly = true): CompanyEvent[] {
    return this.getTimelineEvents(portfolioOnly).filter(
      (event) => (event.scheduledAt ?? event.occurredAt.slice(0, 10)) === date,
    );
  }

  getEventsInRange(
    fromDate: string,
    toDate: string,
    portfolioOnly = true,
  ): CompanyEvent[] {
    return this.repository.query({ portfolioOnly, fromDate, toDate });
  }
}
