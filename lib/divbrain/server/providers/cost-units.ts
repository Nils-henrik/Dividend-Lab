/**
 * Integer money helpers for DivBrain Cost Guard / usage ledger (Issue #105 / #103).
 *
 * Accounting unit: micro-USD (1 USD = 1_000_000 micro-USD).
 * Never persist floating-point money in the ledger.
 *
 * This module must never be imported by client components.
 */

export const DIVBRAIN_MICRO_USD_PER_USD = 1_000_000 as const;

export type DivBrainMicroUsd = number;

export function isDivBrainMicroUsd(value: unknown): value is DivBrainMicroUsd {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    Number.isFinite(value) &&
    value > 0
  );
}

/** Convert a finite non-negative USD amount to integer micro-USD (ceil). */
export function usdToMicroUsdCeil(usd: number): DivBrainMicroUsd | null {
  if (typeof usd !== "number" || !Number.isFinite(usd) || usd < 0) {
    return null;
  }

  if (usd === 0) {
    return null;
  }

  // Stabilize binary floating error before ceil (e.g. 0.000123 * 1e6).
  const scaled = Number((usd * DIVBRAIN_MICRO_USD_PER_USD).toFixed(6));
  const micro = Math.ceil(scaled);
  if (!Number.isSafeInteger(micro) || micro <= 0) {
    return null;
  }

  return micro;
}

/**
 * Strict positive decimal USD string → integer micro-USD (ceil).
 *
 * Accepted: canonical finite positive decimals only, e.g. `"0.00849"`, `"12"`.
 * Rejected: whitespace, signs, exponents, trailing junk, empty, zero, negatives.
 */
export function decimalUsdStringToMicroUsdCeil(
  raw: string,
): DivBrainMicroUsd | null {
  if (typeof raw !== "string") {
    return null;
  }

  // No whitespace tricks, no exponent, no leading +, no leading zeros abuse.
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(raw)) {
    return null;
  }

  const [wholePart, fracPart = ""] = raw.split(".");
  if (wholePart === undefined) {
    return null;
  }

  // Zero with no positive fractional contribution.
  if (wholePart === "0" && !/[1-9]/.test(fracPart)) {
    return null;
  }

  const fracPadded = (fracPart + "000000").slice(0, 6);
  const discarded = fracPart.slice(6);
  let micro =
    BigInt(wholePart) * BigInt(DIVBRAIN_MICRO_USD_PER_USD) +
    BigInt(fracPadded.length > 0 ? fracPadded : "0");

  // Conservative ceil when truncating beyond micro-USD precision.
  if (discarded.length > 0 && /[1-9]/.test(discarded)) {
    micro += BigInt(1);
  }

  if (micro <= BigInt(0)) {
    return null;
  }

  if (micro > BigInt(Number.MAX_SAFE_INTEGER)) {
    return null;
  }

  return Number(micro);
}

/**
 * Estimate micro-USD from token counts and USD-per-token pricing.
 * Returns null when inputs are incomplete or non-finite.
 */
export function estimateCostMicroUsd(params: {
  inputTokens: number;
  outputTokens: number;
  pricingUsdPerToken: { readonly input: number; readonly output: number };
}): DivBrainMicroUsd | null {
  const { inputTokens, outputTokens, pricingUsdPerToken } = params;

  if (
    !Number.isFinite(inputTokens) ||
    !Number.isFinite(outputTokens) ||
    inputTokens < 0 ||
    outputTokens < 0 ||
    !Number.isFinite(pricingUsdPerToken.input) ||
    !Number.isFinite(pricingUsdPerToken.output) ||
    pricingUsdPerToken.input < 0 ||
    pricingUsdPerToken.output < 0
  ) {
    return null;
  }

  const usd =
    inputTokens * pricingUsdPerToken.input +
    outputTokens * pricingUsdPerToken.output;

  return usdToMicroUsdCeil(usd);
}
