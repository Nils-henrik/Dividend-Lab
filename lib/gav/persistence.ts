import {
  GAV_STORAGE_VERSION,
  type GavCalculatorState,
  type GavEvent,
  type GavEventType,
} from "./types";

const EVENT_TYPES = new Set<GavEventType>([
  "purchase",
  "sale",
  "split",
  "reverseSplit",
]);
const MAX_EVENTS = 500;

export function createGavEvent(
  type: GavEventType,
  id: string,
): GavEvent {
  if (type === "split" || type === "reverseSplit") {
    return {
      id,
      type,
      date: "",
      oldUnits: "",
      newUnits: "",
    };
  }

  return {
    id,
    type,
    date: "",
    quantity: "",
    price: "",
    fee: "",
  };
}

export function createInitialGavState(): GavCalculatorState {
  return {
    version: GAV_STORAGE_VERSION,
    mode: "events",
    securityName: "",
    opening: {
      enabled: false,
      quantity: "",
      gav: "",
    },
    events: [
      createGavEvent("purchase", "initial-purchase-1"),
      createGavEvent("purchase", "initial-purchase-2"),
    ],
    currentPrice: "",
    estimatedSaleFee: "",
    target: {
      currentQuantity: "",
      currentGav: "",
      purchasePrice: "",
      purchaseFee: "",
      targetGav: "",
      allowFractional: false,
    },
    showMoreDecimals: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasString<Key extends string>(
  record: Record<string, unknown>,
  key: Key,
): record is Record<string, unknown> & Record<Key, string> {
  return typeof record[key] === "string";
}

function sanitizeEvent(value: unknown): GavEvent | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    !hasString(value, "id") ||
    !value.id ||
    !hasString(value, "type") ||
    !EVENT_TYPES.has(value.type as GavEventType) ||
    !hasString(value, "date")
  ) {
    return null;
  }

  const type = value.type as GavEventType;
  if (type === "split" || type === "reverseSplit") {
    if (!hasString(value, "oldUnits") || !hasString(value, "newUnits")) {
      return null;
    }
    return {
      id: value.id,
      type,
      date: value.date,
      oldUnits: value.oldUnits,
      newUnits: value.newUnits,
    };
  }

  if (
    !hasString(value, "quantity") ||
    !hasString(value, "price") ||
    !hasString(value, "fee")
  ) {
    return null;
  }
  return {
    id: value.id,
    type: type as "purchase" | "sale",
    date: value.date,
    quantity: value.quantity,
    price: value.price,
    fee: value.fee,
  };
}

export function sanitizePersistedGavState(
  value: unknown,
): GavCalculatorState | null {
  if (
    !isRecord(value) ||
    value.version !== GAV_STORAGE_VERSION ||
    (value.mode !== "events" && value.mode !== "target") ||
    !hasString(value, "securityName") ||
    !isRecord(value.opening) ||
    typeof value.opening.enabled !== "boolean" ||
    !hasString(value.opening, "quantity") ||
    !hasString(value.opening, "gav") ||
    !Array.isArray(value.events) ||
    value.events.length > MAX_EVENTS ||
    !hasString(value, "currentPrice") ||
    !hasString(value, "estimatedSaleFee") ||
    !isRecord(value.target) ||
    !hasString(value.target, "currentQuantity") ||
    !hasString(value.target, "currentGav") ||
    !hasString(value.target, "purchasePrice") ||
    !hasString(value.target, "purchaseFee") ||
    !hasString(value.target, "targetGav") ||
    typeof value.target.allowFractional !== "boolean" ||
    typeof value.showMoreDecimals !== "boolean"
  ) {
    return null;
  }

  const events = value.events.map(sanitizeEvent);
  if (events.some((event) => event === null)) {
    return null;
  }
  const safeEvents = events as GavEvent[];
  const ids = new Set(safeEvents.map((event) => event.id));
  if (ids.size !== safeEvents.length) {
    return null;
  }

  return {
    version: GAV_STORAGE_VERSION,
    mode: value.mode,
    securityName: value.securityName.slice(0, 200),
    opening: {
      enabled: value.opening.enabled,
      quantity: value.opening.quantity,
      gav: value.opening.gav,
    },
    events: safeEvents,
    currentPrice: value.currentPrice,
    estimatedSaleFee: value.estimatedSaleFee,
    target: {
      currentQuantity: value.target.currentQuantity,
      currentGav: value.target.currentGav,
      purchasePrice: value.target.purchasePrice,
      purchaseFee: value.target.purchaseFee,
      targetGav: value.target.targetGav,
      allowFractional: value.target.allowFractional,
    },
    showMoreDecimals: value.showMoreDecimals,
  };
}

export function parsePersistedGavState(
  serialized: string | null,
): GavCalculatorState | null {
  if (!serialized) {
    return null;
  }
  try {
    return sanitizePersistedGavState(JSON.parse(serialized));
  } catch {
    return null;
  }
}
