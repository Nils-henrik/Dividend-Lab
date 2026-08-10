export type SupportedFxCurrency = "SEK" | "USD";

export type FxRateQuote = {
  base: SupportedFxCurrency;
  quote: "SEK";
  rate: number;
  asOf: string;
  sourcePublisher: string;
  provider: string;
};

export type FxConversionResult =
  | {
      ok: true;
      nativeCurrency: SupportedFxCurrency;
      nativeAmountMinor: number;
      fxRateToSek: number;
      fxAsOf: string;
      fxSourcePublisher: string;
      sekAmountMinor: number;
    }
  | {
      ok: false;
      reason: "unsupported_currency" | "invalid_amount" | "invalid_fx_rate" | "fx_unavailable";
    };

export function isSupportedFxCurrency(value: string): value is SupportedFxCurrency {
  return value === "SEK" || value === "USD";
}

export function currencyForExchange(exchange: string): SupportedFxCurrency | null {
  const normalized = exchange.trim().toUpperCase();
  if (normalized === "ST" || normalized === "STO" || normalized === "XSTO") return "SEK";
  if (normalized === "US" || normalized === "NYSE" || normalized === "NASDAQ") return "USD";
  return null;
}

export function convertNativeMinorToSek(input: {
  nativeCurrency: string;
  nativeAmountMinor: number;
  fxRateToSek: FxRateQuote | null;
}): FxConversionResult {
  if (!isSupportedFxCurrency(input.nativeCurrency)) {
    return { ok: false, reason: "unsupported_currency" };
  }
  if (
    !Number.isFinite(input.nativeAmountMinor) ||
    !Number.isInteger(input.nativeAmountMinor) ||
    input.nativeAmountMinor < 0
  ) {
    return { ok: false, reason: "invalid_amount" };
  }

  if (input.nativeCurrency === "SEK") {
    return {
      ok: true,
      nativeCurrency: "SEK",
      nativeAmountMinor: input.nativeAmountMinor,
      fxRateToSek: 1,
      fxAsOf: input.fxRateToSek?.asOf ?? new Date(0).toISOString(),
      fxSourcePublisher: "identity",
      sekAmountMinor: input.nativeAmountMinor,
    };
  }

  const fx = input.fxRateToSek;
  if (!fx || fx.base !== "USD" || fx.quote !== "SEK") {
    return { ok: false, reason: "fx_unavailable" };
  }
  if (!Number.isFinite(fx.rate) || fx.rate <= 0 || !fx.sourcePublisher.trim() || !fx.asOf.trim()) {
    return { ok: false, reason: "invalid_fx_rate" };
  }

  return {
    ok: true,
    nativeCurrency: "USD",
    nativeAmountMinor: input.nativeAmountMinor,
    fxRateToSek: fx.rate,
    fxAsOf: fx.asOf,
    fxSourcePublisher: fx.sourcePublisher,
    sekAmountMinor: Math.round(input.nativeAmountMinor * fx.rate),
  };
}
