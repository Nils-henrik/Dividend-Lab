/**
 * @deprecated Calendar data now flows through @/lib/events.
 * This file is retained only for backward compatibility during migration.
 */
export {
  calendarEventTypeAbbrev,
  calendarEventTypeLabels,
  intelligenceTypeLabels,
  portfolioChangeTypeLabels,
} from "@/lib/events";

export { calendarReferenceDate } from "@/lib/events/providers/mock/raw-events";