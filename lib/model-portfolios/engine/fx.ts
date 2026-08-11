export type SupportedFxCurrency = "SEK" | "USD" | "NOK" | "DKK" | "EUR";

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
  return value === "SEK" || value === "USD" || value === "NOK" || value === "DKK" || value === "EUR";
}

export function currencyForExchange(exchange: string): SupportedFxCurrency | null {
  const normalized = exchange.trim().toUpperCase();
  if (["ST", "STO", "XSTO", "STOCKHOLM", "NASDAQ STOCKHOLM"].includes(normalized)) return "SEK";
  if ([
    "US",
    "NYSE",
    "NEW YORK STOCK EXCHANGE",
    "NASDAQ",
    "NASDAQGS",
    "NASDAQGM",
    "NASDAQCM",
    "NYQ",
    "NMS",
    "NGM",
    "NCM",
  ].includes(normalized)) return "USD";
  if (["OL", "OSL", "XOSL", "OSLO", "OSLO BØRS", "OSLO BORS", "EURONEXT OSLO", "OSLO STOCK EXCHANGE"].includes(normalized)) return "NOK";
  if (["CO", "CPH", "XCSE", "COPENHAGEN", "NASDAQ COPENHAGEN"].includes(normalized)) return "DKK";
  if (["HE", "HEL", "XHEL", "HELSINKI", "NASDAQ HELSINKI"].includes(normalized)) return "EUR";
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
  if (!fx || fx.base !== input.nativeCurrency || fx.quote !== "SEK") {
    return { ok: false, reason: "fx_unavailable" };
  }
  if (!Number.isFinite(fx.rate) || fx.rate <= 0 || !fx.sourcePublisher.trim() || !fx.asOf.trim()) {
    return { ok: false, reason: "invalid_fx_rate" };
  }

  return {
    ok: true,
    nativeCurrency: input.nativeCurrency,
    nativeAmountMinor: input.nativeAmountMinor,
    fxRateToSek: fx.rate,
    fxAsOf: fx.asOf,
    fxSourcePublisher: fx.sourcePublisher,
    sekAmountMinor: Math.round(input.nativeAmountMinor * fx.rate),
  };
}
