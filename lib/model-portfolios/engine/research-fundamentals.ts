import type { ResearchCandidate } from "./research";

/**
 * Normalized fundamental scores. Only real provider/accounting values may
 * populate these fields. Technical, price and volume proxies must never be
 * substituted for missing fundamentals.
 */
export type ResearchFundamentalScores = Pick<
  ResearchCandidate,
  | "marketCapSek"
  | "qualityScore"
  | "valuationScore"
  | "earningsRevisionScore"
  | "dividendQualityScore"
  | "catalystScore"
  | "balanceSheetScore"
>;

export type EodhdFundamentalsSnapshot = {
  marketCap?: number | null;
  peRatio?: number | null;
  pegRatio?: number | null;
  profitMargin?: number | null;
  operatingMarginTtm?: number | null;
  returnOnEquityTtm?: number | null;
  returnOnAssetsTtm?: number | null;
  quarterlyEarningsGrowthYoy?: number | null;
  quarterlyRevenueGrowthYoy?: number | null;
  dividendYield?: number | null;
  payoutRatio?: number | null;
  forwardAnnualDividendYield?: number | null;
  trailingPe?: number | null;
  priceBookMrq?: number | null;
  priceSalesTtm?: number | null;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

function scorePe(value: number | null | undefined): number | undefined {
  if (!Number.isFinite(value) || (value as number) <= 0) return undefined;
  const pe = value as number;
  if (pe < 6) return 0.45;
  if (pe > 55) return 0.25;
  return clamp01(1 - Math.abs(pe - 18) / 35);
}

function scoreYield(value: number | null | undefined): number | undefined {
  if (!Number.isFinite(value) || (value as number) <= 0) return undefined;
  const y = value as number;
  if (y > 0.09) return 0.25;
  if (y < 0.005) return 0.35;
  return clamp01((y - 0.005) / 0.045);
}

function scorePayout(value: number | null | undefined): number | undefined {
  if (!Number.isFinite(value) || (value as number) < 0) return undefined;
  const payout = value as number;
  if (payout > 1.1) return 0.2;
  if (payout > 0.85) return 0.4;
  return clamp01(1 - Math.abs(payout - 0.5) / 0.7);
}

function scoreGrowth(value: number | null | undefined): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  return clamp01(((value as number) + 0.15) / 0.45);
}

function scoreMargin(value: number | null | undefined): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  return clamp01(((value as number) + 0.05) / 0.35);
}

function scoreRoe(value: number | null | undefined): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  return clamp01((value as number) / 0.25);
}

export function scoreNormalizedFundamentals(
  snapshot: EodhdFundamentalsSnapshot,
  fxToSek: number,
): ResearchFundamentalScores {
  const yieldScore = scoreYield(snapshot.dividendYield ?? snapshot.forwardAnnualDividendYield);
  const payoutScore = scorePayout(snapshot.payoutRatio);
  const peScore = scorePe(snapshot.trailingPe ?? snapshot.peRatio);
  const earningsGrowth = scoreGrowth(snapshot.quarterlyEarningsGrowthYoy);
  const revenueGrowth = scoreGrowth(snapshot.quarterlyRevenueGrowthYoy);
  const roe = scoreRoe(snapshot.returnOnEquityTtm);
  const roa = scoreRoe(snapshot.returnOnAssetsTtm);
  const profit = scoreMargin(snapshot.profitMargin);
  const operating = scoreMargin(snapshot.operatingMarginTtm);

  const qualityParts = [roe, roa, profit, operating].filter((value): value is number => value !== undefined);
  const qualityScore = qualityParts.length
    ? qualityParts.reduce((sum, value) => sum + value, 0) / qualityParts.length
    : undefined;

  const valuationParts = [
    peScore,
    Number.isFinite(snapshot.priceBookMrq)
      ? clamp01(1 - Math.min(8, snapshot.priceBookMrq as number) / 8)
      : undefined,
    Number.isFinite(snapshot.priceSalesTtm)
      ? clamp01(1 - Math.min(12, snapshot.priceSalesTtm as number) / 12)
      : undefined,
  ].filter((value): value is number => value !== undefined);
  const valuationScore = valuationParts.length
    ? valuationParts.reduce((sum, value) => sum + value, 0) / valuationParts.length
    : undefined;

  const revisionParts = [earningsGrowth, revenueGrowth].filter((value): value is number => value !== undefined);
  const earningsRevisionScore = revisionParts.length
    ? revisionParts.reduce((sum, value) => sum + value, 0) / revisionParts.length
    : undefined;

  // A dividend score is only valid when the provider confirms a positive
  // current/forward yield. Payout or company quality alone must never make a
  // non-dividend stock eligible for the dividend mandate.
  const dividendParts = yieldScore === undefined
    ? []
    : [yieldScore, payoutScore, qualityScore].filter((value): value is number => value !== undefined);
  const dividendQualityScore = dividendParts.length
    ? dividendParts.reduce((sum, value) => sum + value, 0) / dividendParts.length
    : undefined;

  const catalystParts = [
    earningsGrowth,
    revenueGrowth,
    Number.isFinite(snapshot.pegRatio) && (snapshot.pegRatio as number) > 0
      ? clamp01(1 - Math.min(3, snapshot.pegRatio as number) / 3)
      : undefined,
  ].filter((value): value is number => value !== undefined);
  const catalystScore = catalystParts.length
    ? catalystParts.reduce((sum, value) => sum + value, 0) / catalystParts.length
    : undefined;

  const balanceParts = [
    roa,
    operating,
    payoutScore === undefined ? undefined : 1 - Math.abs((payoutScore ?? 0.5) - 0.55),
  ].filter((value): value is number => value !== undefined);
  const balanceSheetScore = balanceParts.length
    ? balanceParts.reduce((sum, value) => sum + value, 0) / balanceParts.length
    : undefined;

  const marketCapSek =
    Number.isFinite(snapshot.marketCap) &&
    (snapshot.marketCap as number) > 0 &&
    Number.isFinite(fxToSek) &&
    fxToSek > 0
      ? Math.round((snapshot.marketCap as number) * fxToSek)
      : undefined;

  const round = (value: number | undefined) =>
    value === undefined ? undefined : Math.round(value * 10_000) / 10_000;

  return {
    marketCapSek,
    qualityScore: round(qualityScore),
    valuationScore: round(valuationScore),
    earningsRevisionScore: round(earningsRevisionScore),
    dividendQualityScore: round(dividendQualityScore),
    catalystScore: round(catalystScore),
    balanceSheetScore: round(balanceSheetScore),
  };
}

/** Backwards-compatible EODHD-specific name used by the existing adapter. */
export function scoreEodhdFundamentals(
  snapshot: EodhdFundamentalsSnapshot,
  fxToSek: number,
): ResearchFundamentalScores {
  return scoreNormalizedFundamentals(snapshot, fxToSek);
}

export function mergeFundamentalScores(
  base: ResearchFundamentalScores | null | undefined,
  overlay: ResearchFundamentalScores | null | undefined,
): ResearchFundamentalScores {
  return {
    marketCapSek: overlay?.marketCapSek ?? base?.marketCapSek,
    qualityScore: overlay?.qualityScore ?? base?.qualityScore,
    valuationScore: overlay?.valuationScore ?? base?.valuationScore,
    earningsRevisionScore: overlay?.earningsRevisionScore ?? base?.earningsRevisionScore,
    dividendQualityScore: overlay?.dividendQualityScore ?? base?.dividendQualityScore,
    catalystScore: overlay?.catalystScore ?? base?.catalystScore,
    balanceSheetScore: overlay?.balanceSheetScore ?? base?.balanceSheetScore,
  };
}

export function parseEodhdFundamentalsPayload(payload: unknown): EodhdFundamentalsSnapshot | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const highlights = (root.Highlights ?? root) as Record<string, unknown>;
  const valuation = (root.Valuation ?? {}) as Record<string, unknown>;
  const splits = (root.SplitsDividends ?? {}) as Record<string, unknown>;

  const numberOrNull = (value: unknown): number | null => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    marketCap: numberOrNull(highlights.MarketCapitalization),
    peRatio: numberOrNull(highlights.PERatio),
    pegRatio: numberOrNull(highlights.PEGRatio),
    profitMargin: numberOrNull(highlights.ProfitMargin),
    operatingMarginTtm: numberOrNull(highlights.OperatingMarginTTM),
    returnOnEquityTtm: numberOrNull(highlights.ReturnOnEquityTTM),
    returnOnAssetsTtm: numberOrNull(highlights.ReturnOnAssetsTTM),
    quarterlyEarningsGrowthYoy: numberOrNull(highlights.QuarterlyEarningsGrowthYOY),
    quarterlyRevenueGrowthYoy: numberOrNull(highlights.QuarterlyRevenueGrowthYOY),
    dividendYield: numberOrNull(highlights.DividendYield),
    payoutRatio: numberOrNull(splits.PayoutRatio),
    forwardAnnualDividendYield: numberOrNull(splits.ForwardAnnualDividendYield),
    trailingPe: numberOrNull(valuation.TrailingPE),
    priceBookMrq: numberOrNull(valuation.PriceBookMRQ),
    priceSalesTtm: numberOrNull(valuation.PriceSalesTTM),
  };
}
