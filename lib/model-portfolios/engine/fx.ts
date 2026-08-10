export type SupportedTradeCurrency = "SEK" | "USD" | "EUR" | "DKK" | "NOK" | "GBP";

export type FxRateToSek = {
  /** Units of SEK per 1 unit of native currency (e.g. 10.50 for USD). */
  rate: number;
  asOf: string;
  sourcePublisher: string;
  pair: string;
};

export type FxConversionResult =
  | {
      ok: true;
      nativeCurrency: SupportedTradeCurrency;
      fxToSek: number;
      sekMinor: number;
      nativeMinor: number;
    }
  | {
      ok: false;
      reason: "unsupported_currency" | "fx_required" | "invalid_fx" | "invalid_amount";
    };

const SUPPORTED = new Set<string>(["SEK", "USD", "EUR", "DKK", "NOK", "GBP"]);

export function isSupportedTradeCurrency(value: string): value is SupportedTradeCurrency {
  return SUPPORTED.has(value);
}

/**
 * Convert a native minor-unit amount to SEK minor units.
 * Never silently assumes FX=1 unless currency is SEK.
 */
export function convertNativeMinorToSek(input: {
  nativeMinor: number;
  nativeCurrency: string;
  fxRateToSek?: FxRateToSek | null;
}): FxConversionResult {
  const { nativeMinor, nativeCurrency, fxRateToSek } = input;

  if (!Number.isFinite(nativeMinor) || nativeMinor < 0) {
    return { ok: false, reason: "invalid_amount" };
  }

  if (!isSupportedTradeCurrency(nativeCurrency)) {
    return { ok: false, reason: "unsupported_currency" };
  }

  if (nativeCurrency === "SEK") {
    return {
      ok: true,
      nativeCurrency,
      fxToSek: 1,
      sekMinor: Math.round(nativeMinor),
      nativeMinor: Math.round(nativeMinor),
    };
  }

  if (!fxRateToSek) {
    return { ok: false, reason: "fx_required" };
  }

  if (
    !Number.isFinite(fxRateToSek.rate) ||
    fxRateToSek.rate <= 0 ||
    !fxRateToSek.sourcePublisher.trim() ||
    !fxRateToSek.asOf.trim()
  ) {
    return { ok: false, reason: "invalid_fx" };
  }

  return {
    ok: true,
    nativeCurrency,
    fxToSek: fxRateToSek.rate,
    sekMinor: Math.round(nativeMinor * fxRateToSek.rate),
    nativeMinor: Math.round(nativeMinor),
  };
}

/**
 * Convert a major-unit native price (e.g. 12.34 USD) to SEK minor units per share.
 */
export function nativePriceMajorToSekMinor(
  nativePriceMajor: number,
  nativeCurrency: string,
  fxRateToSek?: FxRateToSek | null,
): FxConversionResult {
  if (!Number.isFinite(nativePriceMajor) || nativePriceMajor <= 0) {
    return { ok: false, reason: "invalid_amount" };
  }
  const nativeMinor = Math.round(nativePriceMajor * 100);
  return convertNativeMinorToSek({ nativeMinor, nativeCurrency, fxRateToSek });
}

/**
 * FX adapter contract. Production path must never fabricate rates.
 * When the provider cannot return a verified rate, callers must fail closed.
 */
export type FxRateProvider = {
  getRateToSek(nativeCurrency: Exclude<SupportedTradeCurrency, "SEK">, now: Date): Promise<FxRateToSek | null>;
};

export class FailClosedFxProvider implements FxRateProvider {
  async getRateToSek(): Promise<FxRateToSek | null> {
    return null;
  }
}
