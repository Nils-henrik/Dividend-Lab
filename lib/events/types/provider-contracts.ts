import type { CompanyEvent } from "../types/company-event";

export interface EventProvider<TRaw = unknown> {
  readonly providerId: string;
  fetchRawEvents(): Promise<TRaw[]> | TRaw[];
}

export interface EventMapper<TRaw> {
  readonly providerId: string;
  map(raw: TRaw): CompanyEvent;
  mapMany(rawEvents: TRaw[]): CompanyEvent[];
}
