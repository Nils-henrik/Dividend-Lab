import { mockEventMapper } from "./mappers/mock-event-mapper";
import { mockEventProvider } from "./providers/mock/mock-event-provider";
import type { MockProviderRawEvent } from "./providers/mock/raw-events";
import type { EventRepositoryContract } from "./repository/event-repository-contract";
import { EventRepository } from "./repository/event-repository";
import { EventService } from "./services/event-service";
import { PortfolioEventService } from "./services/portfolio-event-service";
import { SearchEventService } from "./services/search-event-service";
import { TimelineEventService } from "./services/timeline-event-service";
import type { EventMapper, EventProvider } from "./types/provider-contracts";

export type EventCore = {
  repository: EventRepositoryContract;
  eventService: EventService;
  portfolioEventService: PortfolioEventService;
  searchEventService: SearchEventService;
  timelineEventService: TimelineEventService;
};

type CreateEventCoreOptions = {
  provider?: EventProvider<MockProviderRawEvent>;
  mapper?: EventMapper<MockProviderRawEvent>;
  repository?: EventRepositoryContract;
};

/**
 * Composes Event Core from provider → mapper → repository → services.
 *
 * Used by runtime.ts for the application singleton. Accepts optional
 * dependencies so future providers or repositories can be injected
 * without changing service or UI code.
 */
export function createEventCore(options: CreateEventCoreOptions = {}): EventCore {
  const provider = options.provider ?? mockEventProvider;
  const mapper = options.mapper ?? mockEventMapper;
  const repository = options.repository ?? new EventRepository();

  const rawResult = provider.fetchRawEvents();

  if (rawResult instanceof Promise) {
    throw new Error(
      "Synchronous Event Core bootstrap requires a synchronous provider.",
    );
  }

  const companyEvents = mapper.mapMany(rawResult);
  repository.setEvents(companyEvents);

  const eventService = new EventService(repository);
  const portfolioEventService = new PortfolioEventService(repository, eventService);
  const searchEventService = new SearchEventService(repository);
  const timelineEventService = new TimelineEventService(repository);

  return {
    repository,
    eventService,
    portfolioEventService,
    searchEventService,
    timelineEventService,
  };
}
