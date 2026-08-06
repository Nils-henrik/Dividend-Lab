import Decimal from "decimal.js-light";
import type {
  GavCalculationInput,
  GavCalculationResult,
  GavEvent,
  GavFieldErrors,
  GavSummary,
  TargetGavInput,
  TargetGavResult,
} from "./types";

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

const ZERO = new Decimal(0);
const SWEDISH_NUMBER_PATTERN =
  /^[+-]?(?:\d{1,3}(?:[ \u00a0\u202f]\d{3})+|\d+)(?:[,.]\d+)?$/;

export function parseSwedishDecimal(value: string): Decimal | null {
  const trimmed = value.trim();
  if (!trimmed || !SWEDISH_NUMBER_PATTERN.test(trimmed)) {
    return null;
  }

  if (trimmed.includes(",") && trimmed.includes(".")) {
    return null;
  }

  const normalized = trimmed
    .replace(/[ \u00a0\u202f]/g, "")
    .replace(",", ".");

  try {
    const parsed = new Decimal(normalized);
    return parsed.isZero() ? ZERO : parsed;
  } catch {
    return null;
  }
}

function parseRequiredPositive(
  value: string,
  errorMessage: string,
): { value: Decimal | null; error?: string } {
  const parsed = parseSwedishDecimal(value);
  if (!parsed || parsed.lte(0)) {
    return { value: null, error: errorMessage };
  }
  return { value: parsed };
}

function parseOptionalFee(value: string): {
  value: Decimal | null;
  error?: string;
} {
  if (!value.trim()) {
    return { value: ZERO };
  }
  const parsed = parseSwedishDecimal(value);
  if (!parsed || parsed.lt(0)) {
    return { value: null, error: "Courtage kan inte vara negativt." };
  }
  return { value: parsed };
}

function isEventEmpty(event: GavEvent): boolean {
  if (event.type === "split" || event.type === "reverseSplit") {
    return !event.oldUnits.trim() && !event.newUnits.trim();
  }
  return (
    !event.quantity.trim() && !event.price.trim() && !event.fee.trim()
  );
}

function addFieldError(
  errors: Record<string, GavFieldErrors>,
  scope: string,
  field: string,
  message: string | undefined,
) {
  if (!message) {
    return;
  }
  errors[scope] = { ...errors[scope], [field]: message };
}

export function calculateGav(
  input: GavCalculationInput,
): GavCalculationResult {
  const errors: Record<string, GavFieldErrors> = {};
  let quantity = ZERO;
  let totalCostBasis = ZERO;
  let realizedResult = ZERO;
  let hasActivity = false;
  let coreIsValid = true;

  if (input.opening.enabled) {
    hasActivity = true;
    const openingQuantity = parseRequiredPositive(
      input.opening.quantity,
      "Ange ett antal större än noll.",
    );
    const openingGav = parseRequiredPositive(
      input.opening.gav,
      "Ange ett giltigt GAV större än noll.",
    );

    addFieldError(
      errors,
      "opening",
      "quantity",
      openingQuantity.error,
    );
    addFieldError(errors, "opening", "gav", openingGav.error);

    if (openingQuantity.value && openingGav.value) {
      quantity = openingQuantity.value;
      totalCostBasis = quantity.mul(openingGav.value);
    } else {
      coreIsValid = false;
    }
  }

  const steps: GavCalculationResult["steps"] = [];
  let eventNumber = 0;

  for (const event of input.events) {
    if (isEventEmpty(event)) {
      continue;
    }

    hasActivity = true;
    eventNumber += 1;
    let eventIsValid = true;
    let eventRealizedResult: Decimal | null = null;
    let disposedCostBasis: Decimal | null = null;
    let netSaleProceeds: Decimal | null = null;

    if (event.type === "purchase" || event.type === "sale") {
      const eventQuantity = parseRequiredPositive(
        event.quantity,
        "Ange ett antal större än noll.",
      );
      const eventPrice = parseRequiredPositive(
        event.price,
        "Ange ett giltigt pris.",
      );
      const eventFee = parseOptionalFee(event.fee);

      addFieldError(
        errors,
        event.id,
        "quantity",
        eventQuantity.error,
      );
      addFieldError(errors, event.id, "price", eventPrice.error);
      addFieldError(errors, event.id, "fee", eventFee.error);

      if (!eventQuantity.value || !eventPrice.value || !eventFee.value) {
        eventIsValid = false;
      } else if (event.type === "purchase") {
        const purchaseCost = eventQuantity.value
          .mul(eventPrice.value)
          .plus(eventFee.value);
        quantity = quantity.plus(eventQuantity.value);
        totalCostBasis = totalCostBasis.plus(purchaseCost);
      } else if (eventQuantity.value.gt(quantity)) {
        addFieldError(
          errors,
          event.id,
          "quantity",
          "Du kan inte sälja fler än du äger vid den här tidpunkten.",
        );
        eventIsValid = false;
      } else {
        const gavBeforeSale = totalCostBasis.div(quantity);
        disposedCostBasis = eventQuantity.value.mul(gavBeforeSale);
        netSaleProceeds = eventQuantity.value
          .mul(eventPrice.value)
          .minus(eventFee.value);
        eventRealizedResult =
          netSaleProceeds.minus(disposedCostBasis);
        realizedResult = realizedResult.plus(eventRealizedResult);

        if (eventQuantity.value.eq(quantity)) {
          quantity = ZERO;
          totalCostBasis = ZERO;
        } else {
          quantity = quantity.minus(eventQuantity.value);
          totalCostBasis = totalCostBasis.minus(disposedCostBasis);
        }
      }
    } else {
      const oldUnits = parseRequiredPositive(
        event.oldUnits,
        "Båda splitvärdena måste vara större än noll.",
      );
      const newUnits = parseRequiredPositive(
        event.newUnits,
        "Båda splitvärdena måste vara större än noll.",
      );
      addFieldError(errors, event.id, "oldUnits", oldUnits.error);
      addFieldError(errors, event.id, "newUnits", newUnits.error);

      if (!oldUnits.value || !newUnits.value) {
        eventIsValid = false;
      } else if (quantity.lte(0)) {
        addFieldError(
          errors,
          event.id,
          "oldUnits",
          "Det finns inget innehav att tillämpa händelsen på.",
        );
        eventIsValid = false;
      } else {
        quantity = quantity.mul(newUnits.value).div(oldUnits.value);
      }
    }

    if (!eventIsValid) {
      coreIsValid = false;
      continue;
    }

    const gav = quantity.gt(0) ? totalCostBasis.div(quantity) : null;
    steps.push({
      eventId: event.id,
      eventNumber,
      date: event.date,
      type: event.type,
      quantity,
      totalCostBasis,
      gav,
      realizedResult: eventRealizedResult,
      disposedCostBasis,
      netSaleProceeds,
      hasFractionalUnits: !quantity.eq(quantity.toDecimalPlaces(0)),
    });
  }

  if (!hasActivity) {
    return {
      isValid: false,
      hasActivity: false,
      errors,
      summary: null,
      steps: [],
    };
  }

  if (!coreIsValid) {
    return {
      isValid: false,
      hasActivity: true,
      errors,
      summary: null,
      steps,
    };
  }

  let marketValue: Decimal | null = null;
  let unrealizedResult: Decimal | null = null;
  let unrealizedPercent: Decimal | null = null;
  let breakEvenPrice: Decimal | null = null;
  let optionalFieldsAreValid = true;

  const saleFee = parseOptionalFee(input.estimatedSaleFee ?? "");
  addFieldError(errors, "market", "estimatedSaleFee", saleFee.error);
  if (!saleFee.value) {
    optionalFieldsAreValid = false;
  }

  const currentPriceInput = input.currentPrice?.trim() ?? "";
  if (currentPriceInput) {
    const currentPrice = parseRequiredPositive(
      currentPriceInput,
      "Ange ett giltigt pris.",
    );
    addFieldError(errors, "market", "currentPrice", currentPrice.error);

    if (currentPrice.value && saleFee.value) {
      marketValue = quantity.mul(currentPrice.value);
      unrealizedResult = marketValue
        .minus(saleFee.value)
        .minus(totalCostBasis);
      unrealizedPercent = totalCostBasis.gt(0)
        ? unrealizedResult.div(totalCostBasis).mul(100)
        : null;
      breakEvenPrice = quantity.gt(0)
        ? totalCostBasis.plus(saleFee.value).div(quantity)
        : null;
    } else {
      optionalFieldsAreValid = false;
    }
  } else if (quantity.gt(0) && saleFee.value?.gt(0)) {
    breakEvenPrice = totalCostBasis.plus(saleFee.value).div(quantity);
  }

  const summary: GavSummary = {
    quantity,
    totalCostBasis,
    gav: quantity.gt(0) ? totalCostBasis.div(quantity) : null,
    realizedResult,
    marketValue,
    unrealizedResult,
    unrealizedPercent,
    breakEvenPrice,
  };

  return {
    isValid: optionalFieldsAreValid,
    hasActivity: true,
    errors,
    summary,
    steps,
  };
}

export function calculateTargetGav(
  input: TargetGavInput,
): TargetGavResult {
  const errors: GavFieldErrors = {};
  const quantity = parseRequiredPositive(
    input.currentQuantity,
    "Ange ett antal större än noll.",
  );
  const currentGav = parseRequiredPositive(
    input.currentGav,
    "Ange ett giltigt GAV större än noll.",
  );
  const purchasePrice = parseRequiredPositive(
    input.purchasePrice,
    "Ange ett giltigt pris.",
  );
  const purchaseFee = parseOptionalFee(input.purchaseFee);
  const targetGav = parseRequiredPositive(
    input.targetGav,
    "Ange ett giltigt önskat GAV.",
  );

  if (quantity.error) errors.currentQuantity = quantity.error;
  if (currentGav.error) errors.currentGav = currentGav.error;
  if (purchasePrice.error) errors.purchasePrice = purchasePrice.error;
  if (purchaseFee.error) errors.purchaseFee = purchaseFee.error;
  if (targetGav.error) errors.targetGav = targetGav.error;

  const emptyResult: TargetGavResult = {
    isValid: false,
    errors,
    exactQuantity: null,
    quantityToBuy: null,
    orderValue: null,
    totalPurchaseCost: null,
    newTotalQuantity: null,
    resultingGav: null,
  };

  if (
    !quantity.value ||
    !currentGav.value ||
    !purchasePrice.value ||
    !purchaseFee.value ||
    !targetGav.value
  ) {
    return emptyResult;
  }

  const lowerBound = Decimal.min(currentGav.value, purchasePrice.value);
  const upperBound = Decimal.max(currentGav.value, purchasePrice.value);
  if (
    targetGav.value.lte(lowerBound) ||
    targetGav.value.gte(upperBound)
  ) {
    errors.targetGav =
      "Det önskade GAV:et måste ligga mellan ditt nuvarande GAV och köppriset. Ett köp till den angivna kursen kan annars inte nå målet.";
    return { ...emptyResult, errors };
  }

  const denominator = targetGav.value.minus(purchasePrice.value);
  if (denominator.isZero()) {
    errors.targetGav =
      "Det önskade GAV:et måste ligga mellan ditt nuvarande GAV och köppriset. Ett köp till den angivna kursen kan annars inte nå målet.";
    return { ...emptyResult, errors };
  }

  const exactQuantity = quantity.value
    .mul(currentGav.value.minus(targetGav.value))
    .plus(purchaseFee.value)
    .div(denominator);

  if (exactQuantity.lte(0)) {
    errors.targetGav =
      "Målet kan inte nås med ett positivt köp och det angivna courtaget.";
    return { ...emptyResult, errors };
  }

  const quantityToBuy = input.allowFractional
    ? exactQuantity.toDecimalPlaces(8)
    : exactQuantity.toDecimalPlaces(0, Decimal.ROUND_CEIL);
  const orderValue = quantityToBuy.mul(purchasePrice.value);
  const totalPurchaseCost = orderValue.plus(purchaseFee.value);
  const newTotalQuantity = quantity.value.plus(quantityToBuy);
  const resultingGav = quantity.value
    .mul(currentGav.value)
    .plus(totalPurchaseCost)
    .div(newTotalQuantity);

  return {
    isValid: true,
    errors,
    exactQuantity,
    quantityToBuy,
    orderValue,
    totalPurchaseCost,
    newTotalQuantity,
    resultingGav,
  };
}
