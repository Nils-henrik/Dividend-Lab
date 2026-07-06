import type { EventMapper } from "../types/provider-contracts";
import type { CompanyEvent, EventImportance } from "../types/company-event";
import type { EventTypeId } from "../types/taxonomy";
import { getCategoryFromTypeId } from "../types/taxonomy";
import type { MockProviderRawEvent } from "../providers/mock/raw-events";

const MOCK_PROVIDER_ID = "mock";

type TaxonomyMapping = {
  type: EventTypeId;
  importance: EventImportance;
};

const subtypeTaxonomyMap: Record<string, Record<string, TaxonomyMapping>> = {
  dividend: {
    increase: { type: "dividend.increase", importance: "high" },
    cut: { type: "dividend.cut", importance: "high" },
    payment: { type: "dividend.payment", importance: "normal" },
    ex_date: { type: "dividend.ex-date", importance: "normal" },
    announcement: { type: "dividend.announcement", importance: "normal" },
    maintained: { type: "dividend.maintained", importance: "normal" },
  },
  earnings: {
    report: { type: "earnings.report", importance: "high" },
    guidance: { type: "earnings.guidance", importance: "normal" },
    pre_announcement: { type: "earnings.pre-announcement", importance: "normal" },
  },
  corporate_action: {
    press_release: { type: "corporate-action.press-release", importance: "normal" },
    interim_report: { type: "corporate-action.interim-report", importance: "normal" },
    annual_report: { type: "corporate-action.annual-report", importance: "normal" },
    announcement: { type: "corporate-action.announcement", importance: "normal" },
  },
  governance: {
    agm: { type: "governance.agm", importance: "normal" },
    egm: { type: "governance.egm", importance: "normal" },
    board_change: { type: "governance.board-change", importance: "low" },
  },
  communication: {
    investor_presentation: {
      type: "communication.investor-presentation",
      importance: "normal",
    },
    capital_markets_day: {
      type: "communication.capital-markets-day",
      importance: "normal",
    },
    strategic_decision: {
      type: "communication.strategic-decision",
      importance: "normal",
    },
  },
  analyst: {
    target_price_up: { type: "analyst.target-price-up", importance: "normal" },
    target_price_down: { type: "analyst.target-price-down", importance: "normal" },
    rating_change: { type: "analyst.rating-change", importance: "low" },
  },
  insider: {
    buying: { type: "insider.buying", importance: "normal" },
    selling: { type: "insider.selling", importance: "normal" },
  },
  capital_structure: {
    stock_split: { type: "capital-structure.stock-split", importance: "normal" },
    rights_issue: { type: "capital-structure.rights-issue", importance: "high" },
    buyback: { type: "capital-structure.buyback", importance: "normal" },
  },
};

function mapPriorityToImportance(priority: number): EventImportance {
  if (priority >= 5) return "critical";
  if (priority >= 4) return "high";
  if (priority >= 2) return "normal";
  return "low";
}

function resolveTaxonomy(raw: MockProviderRawEvent): TaxonomyMapping {
  const mapping = subtypeTaxonomyMap[raw.event_class]?.[raw.event_subtype];

  if (mapping) {
    return mapping;
  }

  return {
    type: "corporate-action.announcement",
    importance: mapPriorityToImportance(raw.priority),
  };
}

function buildOccurredAt(raw: MockProviderRawEvent): string {
  if (raw.event_time) {
    return `${raw.event_date}T${raw.event_time}:00`;
  }

  return `${raw.event_date}T00:00:00`;
}

export class MockEventMapper implements EventMapper<MockProviderRawEvent> {
  readonly providerId = MOCK_PROVIDER_ID;

  map(raw: MockProviderRawEvent): CompanyEvent {
    const taxonomyMapping = resolveTaxonomy(raw);
    const typeId = taxonomyMapping.type;

    return {
      id: `dl-${raw.external_id}`,
      company: {
        companyId: `company-${raw.symbol.toLowerCase()}`,
        name: raw.company_name,
        ticker: raw.symbol,
      },
      taxonomy: {
        category: getCategoryFromTypeId(typeId),
        type: typeId,
      },
      title: raw.headline,
      summary: raw.body,
      importance:
        raw.priority >= 5
          ? "critical"
          : taxonomyMapping.importance ?? mapPriorityToImportance(raw.priority),
      occurredAt: buildOccurredAt(raw),
      scheduledAt: raw.event_date,
      scheduledTime: raw.event_time,
      inPortfolio: raw.in_user_portfolio,
      source: {
        providerId: this.providerId,
        providerEventId: raw.external_id,
        retrievedAt: new Date().toISOString(),
        originalUrl: raw.source_url,
      },
      ai: {
        brainReady: true,
        relevanceScore: raw.priority / 5,
      },
      metadata: {
        dividendAmount: raw.dividend_amount,
        dayLabel: raw.day_label,
        highlightMetric: raw.highlight_metric,
      },
    };
  }

  mapMany(rawEvents: MockProviderRawEvent[]): CompanyEvent[] {
    return rawEvents.map((raw) => this.map(raw));
  }
}

export const mockEventMapper = new MockEventMapper();
