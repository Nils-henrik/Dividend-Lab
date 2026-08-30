import type { DivLabBankAnalystScenario } from "./bank-analyst-schema";

export const DIVLAB_BANK_SCENARIO_VERSION = "bank-scenarios-v1" as const;

export type DivLabBankScenarioValuation = {
  version: typeof DIVLAB_BANK_SCENARIO_VERSION;
  name: "bear" | "base" | "bull";
  label: string;
  currency: string;
  forecastYears: number;
  projectedEps: number | null;
  projectedBookValuePerShare: number | null;
  peValue: number | null;
  priceToBookValue: number | null;
  valuePerShare: number | null;
  upsideDownsidePct: number | null;
  methodsUsed: Array<"P/E" | "P/B">;
  assumptions: string[];
  sourceIds: string[];
};

export type DivLabBankScenarioSet = {
  version: typeof DIVLAB_BANK_SCENARIO_VERSION;
  currentPrice: number;
  currency: string;
  scenarios: DivLabBankScenarioValuation[];
  baseCaseValue: number | null;
  baseCaseUpsideDownsidePct: number | null;
};

function finitePositive(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function round(value: number | null, digits = 4): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function projected(start: number | null, growthPct: number | null, years: number): number | null {
  if (!finitePositive(start) || growthPct === null || !Number.isFinite(growthPct)) return null;
  const result = start * (1 + growthPct) ** years;
  return finitePositive(result) ? result : null;
}

function mean(values: readonly number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildBankScenarioSet(input: {
  currentPrice: number;
  currency: string;
  trailingEps: number | null;
  bookValuePerShare: number | null;
  scenarios: readonly DivLabBankAnalystScenario[];
}): DivLabBankScenarioSet {
  if (!finitePositive(input.currentPrice)) {
    throw new Error("bank_scenarios_current_price_required");
  }
  const currency = input.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("bank_scenarios_currency_required");
  }
  if (input.scenarios.length !== 3) {
    throw new Error("bank_scenarios_requires_three_scenarios");
  }

  const values = input.scenarios.map((scenario): DivLabBankScenarioValuation => {
    if (scenario.currency !== currency) {
      throw new Error(`bank_scenario_currency_mismatch:${scenario.name}`);
    }

    const projectedEps = projected(
      input.trailingEps,
      scenario.epsGrowthPct,
      scenario.forecastYears,
    );
    const projectedBookValuePerShare = projected(
      input.bookValuePerShare,
      scenario.bookValueGrowthPct,
      scenario.forecastYears,
    );
    const peValue =
      projectedEps !== null && finitePositive(scenario.peMultiple)
        ? projectedEps * scenario.peMultiple
        : null;
    const priceToBookValue =
      projectedBookValuePerShare !== null && finitePositive(scenario.priceToBookMultiple)
        ? projectedBookValuePerShare * scenario.priceToBookMultiple
        : null;
    const methodsUsed: Array<"P/E" | "P/B"> = [];
    const methodValues: number[] = [];
    if (finitePositive(peValue)) {
      methodsUsed.push("P/E");
      methodValues.push(peValue);
    }
    if (finitePositive(priceToBookValue)) {
      methodsUsed.push("P/B");
      methodValues.push(priceToBookValue);
    }
    const valuePerShare = round(mean(methodValues), 4);

    return {
      version: DIVLAB_BANK_SCENARIO_VERSION,
      name: scenario.name,
      label: scenario.label,
      currency,
      forecastYears: scenario.forecastYears,
      projectedEps: round(projectedEps, 6),
      projectedBookValuePerShare: round(projectedBookValuePerShare, 6),
      peValue: round(peValue, 4),
      priceToBookValue: round(priceToBookValue, 4),
      valuePerShare,
      upsideDownsidePct:
        valuePerShare === null ? null : round(valuePerShare / input.currentPrice - 1, 6),
      methodsUsed,
      assumptions: [...scenario.assumptions],
      sourceIds: [...scenario.sourceIds],
    };
  });
  const base = values.find((scenario) => scenario.name === "base") ?? null;

  return {
    version: DIVLAB_BANK_SCENARIO_VERSION,
    currentPrice: round(input.currentPrice, 4)!,
    currency,
    scenarios: values,
    baseCaseValue: base?.valuePerShare ?? null,
    baseCaseUpsideDownsidePct: base?.upsideDownsidePct ?? null,
  };
}
