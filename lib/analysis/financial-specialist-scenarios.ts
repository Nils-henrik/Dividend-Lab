import type { DivLabFinancialSpecialistAnalystDraft } from "./financial-specialist-schema";
import type { DivLabFinancialSpecialistResearch } from "./financial-specialist-research";

export const DIVLAB_FINANCIAL_SPECIALIST_SCENARIO_VERSION =
  "financial-specialist-scenarios-v1" as const;

export type DivLabFinancialSpecialistScenario = {
  version: typeof DIVLAB_FINANCIAL_SPECIALIST_SCENARIO_VERSION;
  name: "bear" | "base" | "bull";
  label: string;
  currency: string;
  forecastYears: number;
  projectedNavPerShare: number | null;
  projectedEps: number | null;
  valuePerShare: number | null;
  upsideDownsidePct: number | null;
  method: "NAV_discount" | "P/E";
  assumptions: string[];
  sourceIds: string[];
};

export type DivLabFinancialSpecialistScenarioSet = {
  version: typeof DIVLAB_FINANCIAL_SPECIALIST_SCENARIO_VERSION;
  specialistType: "investment_company" | "asset_manager";
  currentPrice: number;
  currency: string;
  scenarios: DivLabFinancialSpecialistScenario[];
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

function projected(start: number, growth: number, years: number): number | null {
  const value = start * (1 + growth) ** years;
  return finitePositive(value) ? value : null;
}

export function buildFinancialSpecialistScenarioSet(input: {
  currentPrice: number;
  currency: string;
  research: DivLabFinancialSpecialistResearch;
  trailingEps: number | null;
  draft: DivLabFinancialSpecialistAnalystDraft;
}): DivLabFinancialSpecialistScenarioSet {
  if (!finitePositive(input.currentPrice)) {
    throw new Error("financial_specialist_scenarios_current_price_required");
  }
  const currency = input.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("financial_specialist_scenarios_currency_required");
  }
  if (input.draft.specialistType !== input.research.specialistType) {
    throw new Error("financial_specialist_scenario_type_mismatch");
  }

  const scenarios = input.draft.valuationScenarios.map((scenario): DivLabFinancialSpecialistScenario => {
    if (scenario.currency !== currency) {
      throw new Error(`financial_specialist_scenario_currency_mismatch:${scenario.name}`);
    }

    if (input.research.specialistType === "investment_company") {
      const nav = input.research.metrics.navPerShare.value;
      if (!finitePositive(nav) || scenario.navGrowthPct === null || scenario.discountPct === null) {
        throw new Error(`investment_company_scenario_basis_missing:${scenario.name}`);
      }
      const projectedNavPerShare = projected(nav, scenario.navGrowthPct, scenario.forecastYears);
      const valuePerShare = projectedNavPerShare === null
        ? null
        : projectedNavPerShare * (1 - scenario.discountPct);
      const roundedValue = round(valuePerShare, 4);
      return {
        version: DIVLAB_FINANCIAL_SPECIALIST_SCENARIO_VERSION,
        name: scenario.name,
        label: scenario.label,
        currency,
        forecastYears: scenario.forecastYears,
        projectedNavPerShare: round(projectedNavPerShare, 4),
        projectedEps: null,
        valuePerShare: roundedValue,
        upsideDownsidePct:
          roundedValue === null ? null : round(roundedValue / input.currentPrice - 1, 6),
        method: "NAV_discount",
        assumptions: [...scenario.assumptions],
        sourceIds: [...scenario.sourceIds],
      };
    }

    if (!finitePositive(input.trailingEps) || scenario.epsGrowthPct === null || !finitePositive(scenario.peMultiple)) {
      throw new Error(`asset_manager_scenario_basis_missing:${scenario.name}`);
    }
    const projectedEps = projected(input.trailingEps, scenario.epsGrowthPct, scenario.forecastYears);
    const valuePerShare = projectedEps === null ? null : projectedEps * scenario.peMultiple;
    const roundedValue = round(valuePerShare, 4);
    return {
      version: DIVLAB_FINANCIAL_SPECIALIST_SCENARIO_VERSION,
      name: scenario.name,
      label: scenario.label,
      currency,
      forecastYears: scenario.forecastYears,
      projectedNavPerShare: null,
      projectedEps: round(projectedEps, 6),
      valuePerShare: roundedValue,
      upsideDownsidePct:
        roundedValue === null ? null : round(roundedValue / input.currentPrice - 1, 6),
      method: "P/E",
      assumptions: [...scenario.assumptions],
      sourceIds: [...scenario.sourceIds],
    };
  });

  const values = scenarios.map((scenario) => scenario.valuePerShare);
  if (values.some((value) => !finitePositive(value))) {
    throw new Error("financial_specialist_scenario_values_missing");
  }
  if (!(values[0]! <= values[1]! && values[1]! <= values[2]!)) {
    throw new Error("financial_specialist_scenario_order_invalid");
  }

  const base = scenarios.find((scenario) => scenario.name === "base") ?? null;
  return {
    version: DIVLAB_FINANCIAL_SPECIALIST_SCENARIO_VERSION,
    specialistType: input.research.specialistType,
    currentPrice: round(input.currentPrice, 4)!,
    currency,
    scenarios,
    baseCaseValue: base?.valuePerShare ?? null,
    baseCaseUpsideDownsidePct: base?.upsideDownsidePct ?? null,
  };
}
