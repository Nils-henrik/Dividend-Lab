import type { CompanyEvent, CompanyEventFilter } from "../types/company-event";

/**
 * Storage and query contract for Event Core.
 *
 * Current implementation is in-memory. Future database-backed repositories
 * should implement this interface without changing services or UI.
 */
export interface EventRepositoryContract {
  setEvents(events: CompanyEvent[]): void;
  getAll(): CompanyEvent[];
  getById(id: string): CompanyEvent | undefined;
  query(filter?: CompanyEventFilter): CompanyEvent[];
}
