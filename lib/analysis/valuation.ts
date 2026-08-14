export type ValuationScenarioInput = {
  name: "bear" | "base" | "bull";
  label: string;
  eps?: number | null;
  peMultiple?: number | null;
  freeCashFlowPerShare?: number | null;
  pFcfMultiple?: number | null;
  explicitValuePerShare?: number | null;
  assumptions: string[];
};

export type ValuationScenario = {
  name: "bear" | "base" | "bull";
  label: string;
  valuePerShare: number | null;
  upsideDownsidePct: number | null;
  methodsUsed: string[];
  assumptions: string[];
};

export type ValuationAnalysis = {
  currentPrice: number;
  currency: string;
  trailing: {
    pe: number | null;
    priceToFcf: number | null;
    fcfYield: number | null;
  };
  scenarios: ValuationScenario[];
  baseCaseValue: number | null;
  baseCaseUpsideDownsidePct: number | null;
};

function finitePositive(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function average(values: readonly number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number | null, digits = 4): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function calculateScenarioValue(input: ValuationScenarioInput): {
  value: number | null;
  methods: string[];
} {
  const values: number[] = [];
  const methods: string[] = [];

  if (finitePositive(input.eps) && finitePositive(input.peMultiple)) {
    values.push(input.eps * input.peMultiple);
    methods.push("P/E");
  }
  if (finitePositive(input.freeCashFlowPerShare) && finitePositive(input.pFcfMultiple)) {
    values.push(input.freeCashFlowPerShare * input.pFcfMultiple);
    methods.push("P/FCF");
  }
  if (finitePositive(input.explicitValuePerShare)) {
    values.push(input.explicitValuePerShare);
    methods.push("explicit scenario value");
  }

  return { value: average(values), methods };
}

export function buildValuationAnalysis(input: {
  currentPrice: number;
  currency: string;
  epsTtm?: number | null;
  freeCashFlowPerShareTtm?: number | null;
  scenarios: ValuationScenarioInput[];
}): ValuationAnalysis {
  if (!finitePositive(input.currentPrice)) {
    throw new Error("valuation_current_price_required");
  }

  const pe = finitePositive(input.epsTtm)
    ? input.currentPrice / input.epsTtm
    : null;
  const priceToFcf = finitePositive(input.freeCashFlowPerShareTtm)
    ? input.currentPrice / input.freeCashFlowPerShareTtm
    : null;
  const fcfYield = finitePositive(input.freeCashFlowPerShareTtm)
    ? input.freeCashFlowPerShareTtm / input.currentPrice
    : null;

  const scenarios = input.scenarios.map((scenario): ValuationScenario => {
    const calculated = calculateScenarioValue(scenario);
    const valuePerShare = round(calculated.value, 4);
    return {
      name: scenario.name,
      label: scenario.label,
      valuePerShare,
      upsideDownsidePct:
        valuePerShare === null
          ? null
          : round(valuePerShare / input.currentPrice - 1, 6),
      methodsUsed: calculated.methods,
      assumptions: [...scenario.assumptions],
    };
  });
  const base = scenarios.find((scenario) => scenario.name === "base") ?? null;

  return {
    currentPrice: round(input.currentPrice, 4)!,
    currency: input.currency,
    trailing: {
      pe: round(pe, 3),
      priceToFcf: round(priceToFcf, 3),
      fcfYield: round(fcfYield, 6),
    },
    scenarios,
    baseCaseValue: base?.valuePerShare ?? null,
    baseCaseUpsideDownsidePct: base?.upsideDownsidePct ?? null,
  };
}
