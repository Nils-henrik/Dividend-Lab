/**
 * Explicit execution-quote validation for simulated model settlement.
 * Distinct from research evidence — never reuse research-only prices without this step.
 */

export const MAX_SIMULATION_EXECUTION_QUOTE_AGE_MS = 20 * 60 * 1000;

export type SimulationExecutionQuoteInput = {
  symbol: string;
  exchange: string;
  instrumentName: string;
  nativeCurrency: string;
  /** Native share price in major units (e.g. 312.40). */
  nativePriceMajor: number;
  asOf: string;
  sourcePublisher: string;
  /** Must be an explicit execution fetch, not research snapshot reuse. */
  purpose: "execution";
  providerMode: "realtime_quote" | "delayed_validated";
};

export type ValidatedSimulationExecutionQuote = {
  symbol: string;
  exchange: string;
  instrumentName: string;
  nativeCurrency: string;
  nativePriceMinor: number;
  asOf: string;
  sourcePublisher: string;
  providerMode: "realtime_quote" | "delayed_validated";
};

export type SimulationQuoteValidationResult =
  | { ok: true; quote: ValidatedSimulationExecutionQuote }
  | {
      ok: false;
      reason:
        | "invalid_quote"
        | "stale_execution_quote"
        | "future_quote"
        | "research_reuse_forbidden"
        | "missing_purpose";
    };

export function validateSimulationExecutionQuote(
  input: SimulationExecutionQuoteInput,
  now: Date,
): SimulationQuoteValidationResult {
  if (input.purpose !== "execution") {
    return { ok: false, reason: "missing_purpose" };
  }

  if (
    !input.symbol.trim() ||
    !input.exchange.trim() ||
    !input.instrumentName.trim() ||
    !input.nativeCurrency.trim() ||
    !input.sourcePublisher.trim() ||
    !input.asOf.trim() ||
    !Number.isFinite(input.nativePriceMajor) ||
    input.nativePriceMajor <= 0
  ) {
    return { ok: false, reason: "invalid_quote" };
  }

  const marketMs = Date.parse(input.asOf);
  const nowMs = now.getTime();
  if (!Number.isFinite(marketMs) || !Number.isFinite(nowMs)) {
    return { ok: false, reason: "invalid_quote" };
  }

  const ageMs = nowMs - marketMs;
  if (ageMs < -60_000) return { ok: false, reason: "future_quote" };

  const maxAge =
    input.providerMode === "realtime_quote" ? 5_000 : MAX_SIMULATION_EXECUTION_QUOTE_AGE_MS;
  if (ageMs > maxAge) {
    return { ok: false, reason: "stale_execution_quote" };
  }

  return {
    ok: true,
    quote: {
      symbol: input.symbol.trim(),
      exchange: input.exchange.trim(),
      instrumentName: input.instrumentName.trim(),
      nativeCurrency: input.nativeCurrency.trim().toUpperCase(),
      nativePriceMinor: Math.round(input.nativePriceMajor * 100),
      asOf: new Date(marketMs).toISOString(),
      sourcePublisher: input.sourcePublisher.trim(),
      providerMode: input.providerMode,
    },
  };
}
