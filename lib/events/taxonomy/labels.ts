import type { EventCategoryId, EventTypeId } from "../types/taxonomy";

export const eventCategoryLabels: Record<EventCategoryId, string> = {
  dividend: "Utdelning",
  earnings: "Rapporter",
  "corporate-action": "Företagshändelse",
  governance: "Bolagsstyrning",
  communication: "Kommunikation",
  analyst: "Analytiker",
  insider: "Insider",
  "capital-structure": "Kapitalstruktur",
};

export const eventTypeLabels: Record<EventTypeId, string> = {
  "dividend.increase": "Utdelningshöjning",
  "dividend.cut": "Utdelningssänkning",
  "dividend.payment": "Utdelning",
  "dividend.ex-date": "Ex-datum",
  "dividend.announcement": "Utdelningsbesked",
  "dividend.maintained": "Oförändrad utdelning",
  "earnings.report": "Rapport",
  "earnings.guidance": "Prognos",
  "earnings.pre-announcement": "Förhandsmeddelande",
  "corporate-action.press-release": "Pressmeddelande",
  "corporate-action.interim-report": "Delårsrapport",
  "corporate-action.annual-report": "Årsredovisning",
  "corporate-action.announcement": "Bolagsmeddelande",
  "governance.agm": "Stämma",
  "governance.egm": "Extra bolagsstämma",
  "governance.board-change": "Styrelseförändring",
  "communication.investor-presentation": "Investerarpresentation",
  "communication.capital-markets-day": "Kapitalmarknadsdag",
  "communication.strategic-decision": "Strategiskt beslut",
  "analyst.target-price-up": "Höjt riktkurs",
  "analyst.target-price-down": "Sänkt riktkurs",
  "analyst.rating-change": "Ratingändring",
  "insider.buying": "Insiderköp",
  "insider.selling": "Insiderförsäljning",
  "capital-structure.stock-split": "Aktiesplit",
  "capital-structure.rights-issue": "Nyemission",
  "capital-structure.buyback": "Återköpsprogram",
};

export const eventTypeAbbreviations: Partial<Record<EventTypeId, string>> = {
  "dividend.increase": "Höj",
  "dividend.payment": "Utb",
  "dividend.ex-date": "Ex",
  "earnings.report": "Rap",
  "corporate-action.press-release": "PM",
  "corporate-action.interim-report": "Del",
  "governance.agm": "STM",
  "communication.investor-presentation": "Pres",
  "communication.capital-markets-day": "KMD",
};

export function getEventTypeLabel(typeId: EventTypeId): string {
  return eventTypeLabels[typeId];
}

export function getEventTypeAbbreviation(typeId: EventTypeId): string {
  return eventTypeAbbreviations[typeId] ?? typeId.split(".").pop()?.slice(0, 3).toUpperCase() ?? "EVT";
}
