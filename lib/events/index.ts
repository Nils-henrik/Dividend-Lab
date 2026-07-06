/**
 * Event Core — Dividend Lab's domain for company events.
 *
 * All company event data flows through this module. UI and features
 * consume services from this package, never providers or raw data.
 *
 * Domain layout: lib/{domain}/ (see docs/project/CORE_DOMAINS.md)
 */

export type {
  CompanyEvent,
  CompanyEventFilter,
  CompanyRef,
  EventAIAnnotation,
  EventImportance,
  EventSourceMetadata,
} from "./types/company-event";

export type {
  EventCategoryId,
  EventTaxonomy,
  EventTypeId,
  ParsedEventType,
} from "./types/taxonomy";

export { EventCategories, EventTypes, getCategoryFromTypeId, parseEventTypeId } from "./types/taxonomy";

export type { EventMapper, EventProvider } from "./types/provider-contracts";

export {
  eventCategoryLabels,
  eventTypeAbbreviations,
  eventTypeLabels,
  getEventTypeAbbreviation,
  getEventTypeLabel,
} from "./taxonomy/labels";

export type { EventRepositoryContract } from "./repository/event-repository-contract";
export { EventRepository } from "./repository/event-repository";
export { EventService } from "./services/event-service";
export { PortfolioEventService } from "./services/portfolio-event-service";
export { SearchEventService } from "./services/search-event-service";
export { TimelineEventService } from "./services/timeline-event-service";

export {
  calendarEventTypeAbbrev,
  calendarEventTypeLabels,
  intelligenceTypeLabels,
  portfolioChangeTypeLabels,
  toCalendarEvent,
  toCalendarEvents,
  toCompanySearchResult,
  toDailyOverviewMetric,
  toIntelligenceItem,
  toIntelligenceItems,
  toPortfolioChange,
  toPortfolioChanges,
  toTodaysHighlight,
  toUpcomingDividendPayment,
} from "./presenters/calendar-presenter";

export { createEventCore } from "./create-event-core";
export type { EventCore } from "./create-event-core";

export {
  eventService,
  portfolioEventService,
  searchEventService,
  timelineEventService,
} from "./runtime";
