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
    epsCurrency: string | null;
    freeCashFlowPerShareCurrency: string | null;
    epsCurrencyCompatible: boolean;
    freeCashFlowCurrencyCompatible: boolean;
  };
  scenarios: ValuationScenario[];
  baseCaseValue: number | null;
  baseCaseUpsideDownsidePct: number | null;
};

function finitePositive(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function normalizedCurrency(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
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
  epsCurrency?: string | null;
  freeCashFlowPerShareTtm?: number | null;
  freeCashFlowPerShareCurrency?: string | null;
  scenarios: ValuationScenarioInput[];
}): ValuationAnalysis {
  if (!finitePositive(input.currentPrice)) {
    throw new Error("valuation_current_price_required");
  }

  const priceCurrency = normalizedCurrency(input.currency);
  const epsCurrency =
    input.epsCurrency === undefined
      ? priceCurrency
      : normalizedCurrency(input.epsCurrency);
  const freeCashFlowPerShareCurrency =
    input.freeCashFlowPerShareCurrency === undefined
      ? priceCurrency
      : normalizedCurrency(input.freeCashFlowPerShareCurrency);
  const epsCurrencyCompatible = Boolean(
    priceCurrency && epsCurrency && priceCurrency === epsCurrency,
  );
  const freeCashFlowCurrencyCompatible = Boolean(
    priceCurrency &&
      freeCashFlowPerShareCurrency &&
      priceCurrency === freeCashFlowPerShareCurrency,
  );

  const pe = epsCurrencyCompatible && finitePositive(input.epsTtm)
    ? input.currentPrice / input.epsTtm
    : null;
  const priceToFcf =
    freeCashFlowCurrencyCompatible && finitePositive(input.freeCashFlowPerShareTtm)
      ? input.currentPrice / input.freeCashFlowPerShareTtm
      : null;
  const fcfYield =
    freeCashFlowCurrencyCompatible && finitePositive(input.freeCashFlowPerShareTtm)
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
    currency: priceCurrency ?? input.currency,
    trailing: {
      pe: round(pe, 3),
      priceToFcf: round(priceToFcf, 3),
      fcfYield: round(fcfYield, 6),
      epsCurrency,
      freeCashFlowPerShareCurrency,
      epsCurrencyCompatible,
      freeCashFlowCurrencyCompatible,
    },
    scenarios,
    baseCaseValue: base?.valuePerShare ?? null,
    baseCaseUpsideDownsidePct: base?.upsideDownsidePct ?? null,
  };
}
