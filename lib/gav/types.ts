export const GAV_STORAGE_KEY = "divlab:gav-calculator:v1";
export const GAV_STORAGE_VERSION = 1;

export type GavEventType = "purchase" | "sale" | "split" | "reverseSplit";

export type PurchaseEvent = {
  id: string;
  type: "purchase";
  date: string;
  quantity: string;
  price: string;
  fee: string;
};

export type SaleEvent = {
  id: string;
  type: "sale";
  date: string;
  quantity: string;
  price: string;
  fee: string;
};

export type SplitEvent = {
  id: string;
  type: "split" | "reverseSplit";
  date: string;
  oldUnits: string;
  newUnits: string;
};

export type GavEvent = PurchaseEvent | SaleEvent | SplitEvent;

export type OpeningPosition = {
  enabled: boolean;
  quantity: string;
  gav: string;
};

export type GavCalculationInput = {
  opening: OpeningPosition;
  events: GavEvent[];
  currentPrice?: string;
  estimatedSaleFee?: string;
};

export type GavFieldErrors = Record<string, string>;

export type GavCalculationStep = {
  eventId: string;
  eventNumber: number;
  date: string;
  type: GavEventType;
  quantity: import("decimal.js-light").default;
  totalCostBasis: import("decimal.js-light").default;
  gav: import("decimal.js-light").default | null;
  realizedResult: import("decimal.js-light").default | null;
  disposedCostBasis: import("decimal.js-light").default | null;
  netSaleProceeds: import("decimal.js-light").default | null;
  hasFractionalUnits: boolean;
};

export type GavSummary = {
  quantity: import("decimal.js-light").default;
  totalCostBasis: import("decimal.js-light").default;
  gav: import("decimal.js-light").default | null;
  realizedResult: import("decimal.js-light").default;
  marketValue: import("decimal.js-light").default | null;
  unrealizedResult: import("decimal.js-light").default | null;
  unrealizedPercent: import("decimal.js-light").default | null;
  breakEvenPrice: import("decimal.js-light").default | null;
};

export type GavCalculationResult = {
  isValid: boolean;
  hasActivity: boolean;
  errors: Record<string, GavFieldErrors>;
  summary: GavSummary | null;
  steps: GavCalculationStep[];
};

export type TargetGavInput = {
  currentQuantity: string;
  currentGav: string;
  purchasePrice: string;
  purchaseFee: string;
  targetGav: string;
  allowFractional: boolean;
};

export type TargetGavResult = {
  isValid: boolean;
  errors: GavFieldErrors;
  exactQuantity: import("decimal.js-light").default | null;
  quantityToBuy: import("decimal.js-light").default | null;
  orderValue: import("decimal.js-light").default | null;
  totalPurchaseCost: import("decimal.js-light").default | null;
  newTotalQuantity: import("decimal.js-light").default | null;
  resultingGav: import("decimal.js-light").default | null;
};

export type GavCalculatorMode = "events" | "target";

export type GavTargetState = {
  currentQuantity: string;
  currentGav: string;
  purchasePrice: string;
  purchaseFee: string;
  targetGav: string;
  allowFractional: boolean;
};

export type GavCalculatorState = {
  version: 1;
  mode: GavCalculatorMode;
  securityName: string;
  opening: OpeningPosition;
  events: GavEvent[];
  currentPrice: string;
  estimatedSaleFee: string;
  target: GavTargetState;
  showMoreDecimals: boolean;
};
