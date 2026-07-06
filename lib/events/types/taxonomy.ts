export const EventCategories = {
  DIVIDEND: "dividend",
  EARNINGS: "earnings",
  CORPORATE_ACTION: "corporate-action",
  GOVERNANCE: "governance",
  COMMUNICATION: "communication",
  ANALYST: "analyst",
  INSIDER: "insider",
  CAPITAL_STRUCTURE: "capital-structure",
} as const;

export type EventCategoryId =
  (typeof EventCategories)[keyof typeof EventCategories];

export const EventTypes = {
  DIVIDEND: {
    INCREASE: "dividend.increase",
    CUT: "dividend.cut",
    PAYMENT: "dividend.payment",
    EX_DATE: "dividend.ex-date",
    ANNOUNCEMENT: "dividend.announcement",
    MAINTAINED: "dividend.maintained",
  },
  EARNINGS: {
    REPORT: "earnings.report",
    GUIDANCE: "earnings.guidance",
    PRE_ANNOUNCEMENT: "earnings.pre-announcement",
  },
  CORPORATE_ACTION: {
    PRESS_RELEASE: "corporate-action.press-release",
    INTERIM_REPORT: "corporate-action.interim-report",
    ANNUAL_REPORT: "corporate-action.annual-report",
    ANNOUNCEMENT: "corporate-action.announcement",
  },
  GOVERNANCE: {
    AGM: "governance.agm",
    EGM: "governance.egm",
    BOARD_CHANGE: "governance.board-change",
  },
  COMMUNICATION: {
    INVESTOR_PRESENTATION: "communication.investor-presentation",
    CAPITAL_MARKETS_DAY: "communication.capital-markets-day",
    STRATEGIC_DECISION: "communication.strategic-decision",
  },
  ANALYST: {
    TARGET_PRICE_UP: "analyst.target-price-up",
    TARGET_PRICE_DOWN: "analyst.target-price-down",
    RATING_CHANGE: "analyst.rating-change",
  },
  INSIDER: {
    BUYING: "insider.buying",
    SELLING: "insider.selling",
  },
  CAPITAL_STRUCTURE: {
    STOCK_SPLIT: "capital-structure.stock-split",
    RIGHTS_ISSUE: "capital-structure.rights-issue",
    BUYBACK: "capital-structure.buyback",
  },
} as const;

type EventTypeValues<T> = T extends Record<string, infer U>
  ? U extends Record<string, infer V>
    ? V
    : never
  : never;

export type EventTypeId = EventTypeValues<typeof EventTypes>;

export type EventTaxonomy = {
  category: EventCategoryId;
  type: EventTypeId;
};

export type ParsedEventType = {
  category: EventCategoryId;
  type: string;
};

export function parseEventTypeId(typeId: EventTypeId): ParsedEventType {
  const dotIndex = typeId.indexOf(".");

  return {
    category: typeId.slice(0, dotIndex) as EventCategoryId,
    type: typeId.slice(dotIndex + 1),
  };
}

export function getCategoryFromTypeId(typeId: EventTypeId): EventCategoryId {
  return parseEventTypeId(typeId).category;
}
