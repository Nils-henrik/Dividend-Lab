import { createEventCore } from "./create-event-core";

const eventCore = createEventCore();

export const eventRepository = eventCore.repository;
export const eventService = eventCore.eventService;
export const portfolioEventService = eventCore.portfolioEventService;
export const searchEventService = eventCore.searchEventService;
export const timelineEventService = eventCore.timelineEventService;
