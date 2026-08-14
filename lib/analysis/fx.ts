import {
  isSupportedFxCurrency,
  type FxRateQuote,
} from "@/lib/model-portfolios/engine/fx";

export type AnalysisFxConversion = {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  asOf: string;
  sourcePublisher: string;
  provider: string;
  sourceIds: string[];
};

export type NormalizedValuationInput = {
  value: number | null;
  currency: string | null;
  sourceCurrency: string | null;
  converted: boolean;
  fxRate: number | null;
  fxAsOf: string | null;
  fxSourceIds: string[];
};

export type NormalizedValuationAmount = NormalizedValuationInput;

function currency(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
}

function finiteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function finitePositive(value: number | null | undefined): value is number {
  return finiteNumber(value) && value > 0;
}

function emptyNormalized(sourceCurrency: string | null): NormalizedValuationAmount {
  return {
    value: null,
    currency: null,
    sourceCurrency,
    converted: false,
    fxRate: null,
    fxAsOf: null,
    fxSourceIds: [],
  };
}

function earlierAsOf(a: string, b: string): string {
  const aTime = new Date(a).getTime();
  const bTime = new Date(b).getTime();
  if (!Number.isFinite(aTime)) return b;
  if (!Number.isFinite(bTime)) return a;
  return aTime <= bTime ? a : b;
}

function validQuote(
  quote: FxRateQuote | null | undefined,
  expectedBase: string,
): quote is FxRateQuote {
  return Boolean(
    quote &&
      quote.base === expectedBase &&
      quote.quote === "SEK" &&
      Number.isFinite(quote.rate) &&
      quote.rate > 0 &&
      quote.asOf.trim() &&
      quote.sourcePublisher.trim() &&
      quote.provider.trim(),
  );
}

/**
 * Derive an auditable reporting-currency -> market-currency cross rate from
 * existing ECB/Frankfurter base->SEK reference quotes.
 *
 * No quote is invented. Missing/unsupported inputs return null.
 */
export function deriveAnalysisFxConversion(input: {
  fromCurrency: string;
  toCurrency: string;
  fromToSek?: FxRateQuote | null;
  toToSek?: FxRateQuote | null;
  sourceIds: string[];
  now?: Date;
}): AnalysisFxConversion | null {
  const from = currency(input.fromCurrency);
  const to = currency(input.toCurrency);
  if (!from || !to || !isSupportedFxCurrency(from) || !isSupportedFxCurrency(to)) {
    return null;
  }

  if (from === to) {
    return {
      fromCurrency: from,
      toCurrency: to,
      rate: 1,
      asOf: (input.now ?? new Date()).toISOString(),
      sourcePublisher: "identity",
      provider: "identity",
      sourceIds: [],
    };
  }

  if (to === "SEK") {
    if (!validQuote(input.fromToSek, from)) return null;
    return {
      fromCurrency: from,
      toCurrency: to,
      rate: input.fromToSek.rate,
      asOf: input.fromToSek.asOf,
      sourcePublisher: input.fromToSek.sourcePublisher,
      provider: input.fromToSek.provider,
      sourceIds: [...input.sourceIds],
    };
  }

  if (from === "SEK") {
    if (!validQuote(input.toToSek, to)) return null;
    return {
      fromCurrency: from,
      toCurrency: to,
      rate: 1 / input.toToSek.rate,
      asOf: input.toToSek.asOf,
      sourcePublisher: input.toToSek.sourcePublisher,
      provider: input.toToSek.provider,
      sourceIds: [...input.sourceIds],
    };
  }

  if (!validQuote(input.fromToSek, from) || !validQuote(input.toToSek, to)) {
    return null;
  }

  return {
    fromCurrency: from,
    toCurrency: to,
    rate: input.fromToSek.rate / input.toToSek.rate,
    asOf: earlierAsOf(input.fromToSek.asOf, input.toToSek.asOf),
    sourcePublisher:
      input.fromToSek.sourcePublisher === input.toToSek.sourcePublisher
        ? input.fromToSek.sourcePublisher
        : `${input.fromToSek.sourcePublisher}; ${input.toToSek.sourcePublisher}`,
    provider:
      input.fromToSek.provider === input.toToSek.provider
        ? input.fromToSek.provider
        : `${input.fromToSek.provider}+${input.toToSek.provider}`,
    sourceIds: [...input.sourceIds],
  };
}

/**
 * Normalize an absolute accounting/market amount into the market currency.
 * Unlike per-share valuation inputs, zero and negative finite values are kept so
 * the caller can preserve legitimate net-cash / loss semantics and decide
 * whether a resulting multiple is meaningful.
 */
export function normalizeValuationAmount(input: {
  value: number | null | undefined;
  sourceCurrency: string | null | undefined;
  marketCurrency: string;
  fxConversion?: AnalysisFxConversion | null;
}): NormalizedValuationAmount {
  const sourceCurrency = currency(input.sourceCurrency);
  const marketCurrency = currency(input.marketCurrency);
  if (!finiteNumber(input.value) || !sourceCurrency || !marketCurrency) {
    return emptyNormalized(sourceCurrency);
  }

  if (sourceCurrency === marketCurrency) {
    return {
      value: input.value,
      currency: marketCurrency,
      sourceCurrency,
      converted: false,
      fxRate: null,
      fxAsOf: null,
      fxSourceIds: [],
    };
  }

  const fx = input.fxConversion;
  if (
    !fx ||
    fx.fromCurrency !== sourceCurrency ||
    fx.toCurrency !== marketCurrency ||
    !finitePositive(fx.rate)
  ) {
    return emptyNormalized(sourceCurrency);
  }

  return {
    value: input.value * fx.rate,
    currency: marketCurrency,
    sourceCurrency,
    converted: true,
    fxRate: fx.rate,
    fxAsOf: fx.asOf,
    fxSourceIds: [...fx.sourceIds],
  };
}

/** Normalize one positive per-share value into the market currency without mutating raw facts. */
export function normalizeValuationInput(input: {
  value: number | null | undefined;
  sourceCurrency: string | null | undefined;
  marketCurrency: string;
  fxConversion?: AnalysisFxConversion | null;
}): NormalizedValuationInput {
  const sourceCurrency = currency(input.sourceCurrency);
  if (!finitePositive(input.value)) return emptyNormalized(sourceCurrency);
  return normalizeValuationAmount(input);
}
