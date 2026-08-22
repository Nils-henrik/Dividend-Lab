import type { AnalysisSource } from "./quality-gate";
import {
  normalizeValuationInput,
  type AnalysisFxConversion,
  type NormalizedValuationInput,
} from "./fx";

export const DIVLAB_BANK_VALUATION_VERSION = "bank-valuation-v1" as const;

export type DivLabBankValuation = {
  version: typeof DIVLAB_BANK_VALUATION_VERSION;
  status: "unavailable" | "available_untraceable" | "traceable";
  currentPrice: number;
  marketCurrency: string;
  /** Raw book value per share before any FX conversion. */
  rawBookValuePerShare: number | null;
  rawBookValueCurrency: string | null;
  bookValueBasis: "statement_equity_per_share" | "provider_book_value_per_share" | null;
  /** Book value per share normalized into the listed share currency. */
  bookValuePerShare: NormalizedValuationInput;
  priceToBook: number | null;
  provenance: {
    available: boolean;
    traceable: boolean;
    sourceIds: string[];
    fxSourceIds: string[];
  };
  notes: string[];
};

function finitePositive(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function currency(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
}

function round(value: number | null, digits: number): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim()))].sort();
}

/**
 * Build a bank-appropriate trailing P/B without mutating raw accounting facts.
 *
 * Statement equity per share remains the preferred basis. When Yahoo cannot
 * expose usable equity/share statement rows for a bank, its explicit positive
 * `bookValue` per listed share may be used as a separate provider fact in the
 * quote currency. We never reconstruct equity by multiplying provider book
 * value with shares, and we never silently mix the two bases.
 *
 * This deliberately models reported book value, not tangible book value. A
 * future P/TBV measure requires verified goodwill/intangible adjustments and
 * must not be inferred from this output.
 */
export function buildBankValuation(input: {
  currentPrice: number;
  marketCurrency: string;
  equity?: number | null;
  sharesOutstanding?: number | null;
  reportingCurrency?: string | null;
  providerBookValuePerShare?: number | null;
  providerBookValuePerShareCurrency?: string | null;
  fxConversion?: AnalysisFxConversion | null;
  sources: readonly AnalysisSource[];
}): DivLabBankValuation {
  if (!finitePositive(input.currentPrice)) {
    throw new Error("bank_valuation_current_price_required");
  }
  const marketCurrency = currency(input.marketCurrency);
  if (!marketCurrency) throw new Error("bank_valuation_market_currency_required");
  const reportingCurrency = currency(input.reportingCurrency);
  const statementBookValuePerShare =
    finitePositive(input.equity) && finitePositive(input.sharesOutstanding)
      ? input.equity / input.sharesOutstanding
      : null;
  const statementNormalized = normalizeValuationInput({
    value: statementBookValuePerShare,
    sourceCurrency: reportingCurrency,
    marketCurrency,
    fxConversion: input.fxConversion,
  });

  const providerBookValuePerShare = finitePositive(input.providerBookValuePerShare)
    ? input.providerBookValuePerShare
    : null;
  const providerBookValueCurrency = currency(input.providerBookValuePerShareCurrency);
  const providerNormalized = normalizeValuationInput({
    value: providerBookValuePerShare,
    sourceCurrency: providerBookValueCurrency,
    marketCurrency,
    fxConversion: input.fxConversion,
  });

  const useStatement = finitePositive(statementNormalized.value);
  const useProvider = !useStatement && finitePositive(providerNormalized.value);
  const rawBookValuePerShare = useStatement
    ? statementBookValuePerShare
    : useProvider
      ? providerBookValuePerShare
      : statementBookValuePerShare ?? providerBookValuePerShare;
  const rawBookValueCurrency = useStatement
    ? reportingCurrency
    : useProvider
      ? providerBookValueCurrency
      : statementBookValuePerShare !== null
        ? reportingCurrency
        : providerBookValueCurrency;
  const bookValueBasis = useStatement
    ? "statement_equity_per_share" as const
    : useProvider
      ? "provider_book_value_per_share" as const
      : null;
  const bookValuePerShare = useStatement
    ? statementNormalized
    : useProvider
      ? providerNormalized
      : statementNormalized.value !== null
        ? statementNormalized
        : providerNormalized;
  const priceToBook =
    finitePositive(bookValuePerShare.value)
      ? input.currentPrice / bookValuePerShare.value
      : null;

  const marketSourceIds = input.sources
    .filter((source) => source.kind === "market_data")
    .map((source) => source.id);
  const fundamentalSourceIds = input.sources
    .filter((source) => source.kind === "fundamental_data")
    .map((source) => source.id);
  const sourceIds = unique([
    ...marketSourceIds,
    ...fundamentalSourceIds,
    ...bookValuePerShare.fxSourceIds,
  ]);
  const knownSourceIds = new Set(input.sources.map((source) => source.id));
  const available = priceToBook !== null;
  const traceable =
    available &&
    marketSourceIds.length > 0 &&
    fundamentalSourceIds.length > 0 &&
    bookValuePerShare.fxSourceIds.every((sourceId) => knownSourceIds.has(sourceId));

  return {
    version: DIVLAB_BANK_VALUATION_VERSION,
    status: !available ? "unavailable" : traceable ? "traceable" : "available_untraceable",
    currentPrice: round(input.currentPrice, 4)!,
    marketCurrency,
    rawBookValuePerShare: round(rawBookValuePerShare, 6),
    rawBookValueCurrency,
    bookValueBasis,
    bookValuePerShare: {
      ...bookValuePerShare,
      value: round(bookValuePerShare.value, 6),
      fxSourceIds: [...bookValuePerShare.fxSourceIds],
    },
    priceToBook: round(priceToBook, 3),
    provenance: {
      available,
      traceable,
      sourceIds,
      fxSourceIds: [...bookValuePerShare.fxSourceIds],
    },
    notes: [
      "P/B bygger på rapporterat eget kapital per aktie eller provider-rapporterat book value per listed share när statement-basen saknas. Det är inte P/TBV och justerar inte för goodwill eller andra immateriella tillgångar.",
    ],
  };
}
