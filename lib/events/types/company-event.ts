export type EventImportance = "low" | "normal" | "high" | "critical";

export type EventSourceMetadata = {
  providerId: string;
  providerEventId: string;
  retrievedAt: string;
  originalUrl?: string;
};

export type EventAIAnnotation = {
  summary?: string;
  relevanceScore?: number;
  brainReady: boolean;
};

export type CompanyRef = {
  companyId: string;
  name: string;
  ticker: string;
  isin?: string;
};

export type EventTaxonomyRef = {
  category: import("./taxonomy").EventCategoryId;
  type: import("./taxonomy").EventTypeId;
};

export type CompanyEvent = {
  id: string;
  company: CompanyRef;
  taxonomy: EventTaxonomyRef;
  title: string;
  summary: string;
  importance: EventImportance;
  occurredAt: string;
  scheduledAt?: string;
  scheduledTime?: string;
  inPortfolio: boolean;
  source: EventSourceMetadata;
  ai?: EventAIAnnotation;
  metadata?: Record<string, unknown>;
};

export type CompanyEventFilter = {
  portfolioOnly?: boolean;
  category?: import("./taxonomy").EventCategoryId;
  type?: import("./taxonomy").EventTypeId;
  fromDate?: string;
  toDate?: string;
  query?: string;
  minImportance?: EventImportance;
};
