import type { EventCategoryId, EventTypeId } from "../types/taxonomy";

export const eventCategoryLabels: Record<EventCategoryId, string> = {
  dividend: "Dividend",
  earnings: "Earnings",
  "corporate-action": "Corporate Action",
  governance: "Governance",
  communication: "Communication",
  analyst: "Analyst",
  insider: "Insider",
  "capital-structure": "Capital Structure",
};

export const eventTypeLabels: Record<EventTypeId, string> = {
  "dividend.increase": "Dividend Increase",
  "dividend.cut": "Dividend Cut",
  "dividend.payment": "Dividend Payment",
  "dividend.ex-date": "Ex-Dividend Date",
  "dividend.announcement": "Dividend Announcement",
  "dividend.maintained": "Dividend Maintained",
  "earnings.report": "Earnings Report",
  "earnings.guidance": "Earnings Guidance",
  "earnings.pre-announcement": "Earnings Pre-Announcement",
  "corporate-action.press-release": "Press Release",
  "corporate-action.interim-report": "Interim Report",
  "corporate-action.annual-report": "Annual Report",
  "corporate-action.announcement": "Company Announcement",
  "governance.agm": "Annual General Meeting",
  "governance.egm": "Extraordinary General Meeting",
  "governance.board-change": "Board Change",
  "communication.investor-presentation": "Investor Presentation",
  "communication.capital-markets-day": "Capital Markets Day",
  "communication.strategic-decision": "Strategic Decision",
  "analyst.target-price-up": "Target Price Increase",
  "analyst.target-price-down": "Target Price Decrease",
  "analyst.rating-change": "Rating Change",
  "insider.buying": "Insider Buying",
  "insider.selling": "Insider Selling",
  "capital-structure.stock-split": "Stock Split",
  "capital-structure.rights-issue": "Rights Issue",
  "capital-structure.buyback": "Buyback Program",
};

export const eventTypeAbbreviations: Partial<Record<EventTypeId, string>> = {
  "dividend.increase": "Inc",
  "dividend.payment": "Pay",
  "dividend.ex-date": "Ex",
  "earnings.report": "Ern",
  "corporate-action.press-release": "PR",
  "corporate-action.interim-report": "IR",
  "governance.agm": "AGM",
  "communication.investor-presentation": "Pres",
  "communication.capital-markets-day": "CMD",
};

export function getEventTypeLabel(typeId: EventTypeId): string {
  return eventTypeLabels[typeId];
}

export function getEventTypeAbbreviation(typeId: EventTypeId): string {
  return eventTypeAbbreviations[typeId] ?? typeId.split(".").pop()?.slice(0, 3).toUpperCase() ?? "EVT";
}
