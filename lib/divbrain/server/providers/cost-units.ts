/**
 * Integer money helpers for DivBrain Cost Guard / usage ledger (Issue #103).
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

  const micro = Math.ceil(usd * DIVBRAIN_MICRO_USD_PER_USD);
  if (!Number.isSafeInteger(micro) || micro <= 0) {
    return null;
  }

  return micro;
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
