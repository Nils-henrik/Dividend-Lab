import type { CompanyEvent, CompanyEventFilter } from "../types/company-event";
import type { EventCategoryId, EventTypeId } from "../types/taxonomy";
import type { EventRepositoryContract } from "../repository/event-repository-contract";

export class EventService {
  constructor(private readonly repository: EventRepositoryContract) {}

  getAllEvents(): CompanyEvent[] {
    return this.repository.getAll();
  }

  getEventById(id: string): CompanyEvent | undefined {
    return this.repository.getById(id);
  }

  queryEvents(filter: CompanyEventFilter = {}): CompanyEvent[] {
    return this.repository.query(filter);
  }

  getEventsByCategory(category: EventCategoryId): CompanyEvent[] {
    return this.repository.query({ category });
  }

  getEventsByType(type: EventTypeId): CompanyEvent[] {
    return this.repository.query({ type });
  }

  getBrainReadyEvents(): CompanyEvent[] {
    return this.repository
      .getAll()
      .filter((event) => event.ai?.brainReady === true);
  }
}
