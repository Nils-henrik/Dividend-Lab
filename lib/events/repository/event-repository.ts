import type { CompanyEvent, CompanyEventFilter } from "../types/company-event";
import type { EventImportance } from "../types/company-event";
import type { EventRepositoryContract } from "./event-repository-contract";

const importanceRank: Record<EventImportance, number> = {
  low: 0,
  normal: 1,
  high: 2,
  critical: 3,
};

export class EventRepository implements EventRepositoryContract {
  private events: CompanyEvent[] = [];

  setEvents(events: CompanyEvent[]): void {
    this.events = [...events];
  }

  getAll(): CompanyEvent[] {
    return [...this.events];
  }

  getById(id: string): CompanyEvent | undefined {
    return this.events.find((event) => event.id === id);
  }

  query(filter: CompanyEventFilter = {}): CompanyEvent[] {
    const normalizedQuery = filter.query?.trim().toLowerCase();

    return this.events.filter((event) => {
      if (filter.portfolioOnly && !event.inPortfolio) {
        return false;
      }

      if (filter.category && event.taxonomy.category !== filter.category) {
        return false;
      }

      if (filter.type && event.taxonomy.type !== filter.type) {
        return false;
      }

      if (filter.fromDate && (event.scheduledAt ?? event.occurredAt.slice(0, 10)) < filter.fromDate) {
        return false;
      }

      if (filter.toDate && (event.scheduledAt ?? event.occurredAt.slice(0, 10)) > filter.toDate) {
        return false;
      }

      if (filter.minImportance) {
        if (importanceRank[event.importance] < importanceRank[filter.minImportance]) {
          return false;
        }
      }

      if (normalizedQuery) {
        const searchable = [
          event.company.name,
          event.company.ticker,
          event.title,
          event.summary,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    });
  }
}
