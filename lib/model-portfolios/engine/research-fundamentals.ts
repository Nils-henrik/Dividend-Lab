import type { DailyBar, DelayedQuote } from "./eodhd";
import type { ResearchCandidate } from "./research";
import type { TechnicalAnalysisSnapshot } from "./technical-analysis";

/**
 * Deterministic fundamental-style scores derived from verified market history / TA.
 * These are not GAAP accounting facts. They exist so strategy ranking and the
 * portfolio manager can distinguish high-risk vs dividend profiles when EODHD
 * fundamentals are unavailable within the call budget.
 *
 * Never invent missing values: return undefined when the underlying series is too short.
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

function average(values: readonly number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function priceAt(bars: readonly DailyBar[], offsetFromEnd: number): number | null {
  const bar = bars.at(-(offsetFromEnd + 1));
  if (!bar) return null;
  const price = bar.adjustedClose ?? bar.close;
  return Number.isFinite(price) && price > 0 ? price : null;
}

function momentumBetween(bars: readonly DailyBar[], shortSessions: number, longSessions: number): number | undefined {
  const short = priceAt(bars, 0);
  const mid = priceAt(bars, shortSessions);
  const long = priceAt(bars, longSessions);
  if (short === null || mid === null || long === null || mid <= 0 || long <= 0) return undefined;
  const shortMom = short / mid - 1;
  const longMom = short / long - 1;
  return shortMom - longMom / (longSessions / shortSessions);
}

export function deriveMarketFundamentalScores(input: {
  history: readonly DailyBar[];
  quote: DelayedQuote | null;
  technical?: TechnicalAnalysisSnapshot;
  fxToSek: number;
}): ResearchFundamentalScores | null {
  const { history, quote, technical, fxToSek } = input;
  if (!Number.isFinite(fxToSek) || fxToSek <= 0) return null;
  if (history.length < 25 && !technical) return null;

  const vol = technical?.volatility.annualized20;
  const drawdown = technical?.volatility.maxDrawdown252;
  const stability = technical?.scores.stability;
  const trend = technical?.scores.trend;
  const momentum = technical?.scores.momentum;
  const breakout = technical?.scores.breakout;
  const volume = technical?.scores.volume;
  const composite = technical?.scores.composite;
  const rangePosition = technical?.levels.rangePosition55;
  const zScore20 = technical?.meanReversion.zScore20;
  const rsi14 = technical?.momentum.rsi14;

  const lastClose = quote?.close ?? history.at(-1)?.adjustedClose ?? history.at(-1)?.close ?? null;
  const avgVolume20 =
    technical?.volume.averageVolume20 ??
    average(history.slice(-20).map((bar) => bar.volume));

  // Approximate free-float market value when shares outstanding are unknown:
  // use a liquidity-scaled turnover proxy only as a soft size signal for ranking gates.
  const marketCapSek =
    lastClose !== null && avgVolume20 !== null && Number.isFinite(lastClose) && Number.isFinite(avgVolume20)
      ? Math.round(lastClose * avgVolume20 * 60 * fxToSek)
      : undefined;

  const qualityScore = clamp01(
    0.45 * (stability ?? 0.5) +
      0.25 * (trend ?? 0.5) +
      0.2 * (Number.isFinite(vol) ? clamp01(1 - (vol as number) / 0.7) : 0.5) +
      0.1 * (Number.isFinite(drawdown) ? clamp01(1 - Math.abs(drawdown as number) / 0.55) : 0.5),
  );

  const valuationScore = clamp01(
    0.5 * (Number.isFinite(zScore20) ? clamp01(0.5 - (zScore20 as number) / 4) : 0.5) +
      0.3 * (Number.isFinite(rangePosition) ? 1 - (rangePosition as number) : 0.5) +
      0.2 * (Number.isFinite(rsi14) ? clamp01(1 - ((rsi14 as number) - 30) / 50) : 0.5),
  );

  const revisionAcceleration = momentumBetween(history, 20, 60);
  const earningsRevisionScore = clamp01(
    0.55 * (Number.isFinite(revisionAcceleration) ? clamp01(((revisionAcceleration as number) + 0.08) / 0.16) : 0.5) +
      0.45 * (momentum ?? 0.5),
  );

  const dividendQualityScore = clamp01(
    0.4 * (stability ?? 0.5) +
      0.25 * (Number.isFinite(vol) ? clamp01(1 - (vol as number) / 0.45) : 0.5) +
      0.2 * (Number.isFinite(drawdown) ? clamp01(1 - Math.abs(drawdown as number) / 0.4) : 0.5) +
      0.15 * (qualityScore),
  );

  const catalystScore = clamp01(
    0.35 * (breakout ?? 0.5) +
      0.25 * (volume ?? 0.5) +
      0.25 * (momentum ?? 0.5) +
      0.15 * (composite ?? 0.5),
  );

  const balanceSheetScore = clamp01(
    0.4 * (Number.isFinite(drawdown) ? clamp01(1 - Math.abs(drawdown as number) / 0.5) : 0.5) +
      0.35 * (stability ?? 0.5) +
      0.25 * (Number.isFinite(vol) ? clamp01(1 - (vol as number) / 0.55) : 0.5),
  );

  return {
    marketCapSek,
    qualityScore: Math.round(qualityScore * 10_000) / 10_000,
    valuationScore: Math.round(valuationScore * 10_000) / 10_000,
    earningsRevisionScore: Math.round(earningsRevisionScore * 10_000) / 10_000,
    dividendQualityScore: Math.round(dividendQualityScore * 10_000) / 10_000,
    catalystScore: Math.round(catalystScore * 10_000) / 10_000,
    balanceSheetScore: Math.round(balanceSheetScore * 10_000) / 10_000,
  };
}

function scorePe(value: number | null | undefined): number | undefined {
  if (!Number.isFinite(value) || (value as number) <= 0) return undefined;
  // Prefer moderate multiples; extreme cheap/expensive both score lower.
  const pe = value as number;
  if (pe < 6) return 0.45;
  if (pe > 55) return 0.25;
  return clamp01(1 - Math.abs(pe - 18) / 35);
}

function scoreYield(value: number | null | undefined): number | undefined {
  if (!Number.isFinite(value) || (value as number) < 0) return undefined;
  const y = value as number;
  // 2-5% is healthy for Nordic dividend names; >9% often signals stress.
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

export function scoreEodhdFundamentals(
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

  const dividendParts = [yieldScore, payoutScore, qualityScore].filter((value): value is number => value !== undefined);
  const dividendQualityScore = dividendParts.length
    ? dividendParts.reduce((sum, value) => sum + value, 0) / dividendParts.length
    : undefined;

  const catalystParts = [earningsGrowth, revenueGrowth, Number.isFinite(snapshot.pegRatio) && (snapshot.pegRatio as number) > 0
    ? clamp01(1 - Math.min(3, snapshot.pegRatio as number) / 3)
    : undefined].filter((value): value is number => value !== undefined);
  const catalystScore = catalystParts.length
    ? catalystParts.reduce((sum, value) => sum + value, 0) / catalystParts.length
    : undefined;

  const balanceParts = [roa, operating, payoutScore === undefined ? undefined : 1 - Math.abs((payoutScore ?? 0.5) - 0.55)].filter(
    (value): value is number => value !== undefined,
  );
  const balanceSheetScore = balanceParts.length
    ? balanceParts.reduce((sum, value) => sum + value, 0) / balanceParts.length
    : undefined;

  const marketCapSek =
    Number.isFinite(snapshot.marketCap) && (snapshot.marketCap as number) > 0 && Number.isFinite(fxToSek) && fxToSek > 0
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
