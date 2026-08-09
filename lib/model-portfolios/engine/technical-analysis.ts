import type { DailyBar } from "./eodhd";

export const TECHNICAL_ANALYSIS_TOOLKIT_VERSION = "ta-v1" as const;

export const TECHNICAL_ANALYSIS_TOOLS = [
  "sma-20-50-200",
  "ema-12-26",
  "macd-12-26-9",
  "rsi-14",
  "adx-14",
  "atr-14",
  "bollinger-20-2",
  "stochastic-14",
  "roc-10-20",
  "trend-slope-20-60",
  "annualized-volatility-20",
  "max-drawdown-252",
  "volume-ratio-20",
  "volume-zscore-20",
  "obv-change-20",
  "chaikin-money-flow-20",
  "breakout-20-55",
  "52-week-range",
  "support-resistance",
  "mean-reversion-zscore-20",
  "volume-weighted-price-20",
  "candlestick-context",
] as const;

export type TechnicalAnalysisToolName = (typeof TECHNICAL_ANALYSIS_TOOLS)[number];

export type TechnicalRegime =
  | "strong_uptrend"
  | "uptrend"
  | "neutral"
  | "downtrend"
  | "strong_downtrend"
  | "insufficient_data";

export type TechnicalAnalysisSnapshot = {
  version: typeof TECHNICAL_ANALYSIS_TOOLKIT_VERSION;
  asOf: string | null;
  sessions: number;
  toolsUsed: TechnicalAnalysisToolName[];
  trend: {
    sma20?: number;
    sma50?: number;
    sma200?: number;
    ema12?: number;
    ema26?: number;
    macd?: number;
    macdSignal?: number;
    macdHistogram?: number;
    adx14?: number;
    slope20PctPerSession?: number;
    slope60PctPerSession?: number;
    priceVsSma20Pct?: number;
    priceVsSma50Pct?: number;
    priceVsSma200Pct?: number;
    regime: TechnicalRegime;
  };
  momentum: {
    rsi14?: number;
    stochastic14?: number;
    roc10?: number;
    roc20?: number;
  };
  volatility: {
    atr14?: number;
    atrPct14?: number;
    annualized20?: number;
    bollingerUpper20?: number;
    bollingerLower20?: number;
    bollingerWidthPct20?: number;
    maxDrawdown252?: number;
  };
  volume: {
    averageVolume20?: number;
    volumeRatio20?: number;
    volumeZScore20?: number;
    obvChange20?: number;
    chaikinMoneyFlow20?: number;
  };
  levels: {
    high20?: number;
    low20?: number;
    high55?: number;
    low55?: number;
    high252?: number;
    low252?: number;
    distanceFrom52WeekHighPct?: number;
    rangePosition20?: number;
    rangePosition55?: number;
    supportDistancePct?: number;
    resistanceDistancePct?: number;
  };
  meanReversion: {
    zScore20?: number;
    volumeWeightedPrice20?: number;
    priceVsVolumeWeighted20Pct?: number;
  };
  patterns: {
    doji: boolean;
    hammer: boolean;
    bullishEngulfing: boolean;
    bearishEngulfing: boolean;
  };
  scores: {
    trend: number;
    momentum: number;
    volume: number;
    breakout: number;
    meanReversion: number;
    stability: number;
    composite: number;
  };
  signals: string[];
};

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function closeOf(bar: DailyBar): number {
  return finite(bar.adjustedClose) && bar.adjustedClose > 0 ? bar.adjustedClose : bar.close;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function average(values: readonly number[]): number | undefined {
  if (!values.length) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values: readonly number[]): number | undefined {
  if (values.length < 2) return undefined;
  const mean = average(values);
  if (!finite(mean)) return undefined;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function sma(values: readonly number[], period: number): number | undefined {
  if (values.length < period || period <= 0) return undefined;
  return average(values.slice(-period));
}

function emaSeries(values: readonly number[], period: number): number[] {
  if (values.length < period || period <= 0) return [];
  const seed = average(values.slice(0, period));
  if (!finite(seed)) return [];
  const multiplier = 2 / (period + 1);
  const result = Array(period - 1).fill(Number.NaN) as number[];
  let previous = seed;
  result.push(previous);
  for (let index = period; index < values.length; index += 1) {
    previous = (values[index]! - previous) * multiplier + previous;
    result.push(previous);
  }
  return result;
}

function emaLast(values: readonly number[], period: number): number | undefined {
  const series = emaSeries(values, period);
  const value = series.at(-1);
  return finite(value) ? value : undefined;
}

function rsi(values: readonly number[], period = 14): number | undefined {
  if (values.length <= period) return undefined;
  const changes = values.slice(1).map((value, index) => value - values[index]!);
  let avgGain = 0;
  let avgLoss = 0;
  for (const change of changes.slice(0, period)) {
    if (change > 0) avgGain += change;
    if (change < 0) avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;
  for (const change of changes.slice(period)) {
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function trueRanges(bars: readonly DailyBar[]): number[] {
  const values: number[] = [];
  for (let index = 1; index < bars.length; index += 1) {
    const bar = bars[index]!;
    const previousClose = closeOf(bars[index - 1]!);
    values.push(
      Math.max(
        bar.high - bar.low,
        Math.abs(bar.high - previousClose),
        Math.abs(bar.low - previousClose),
      ),
    );
  }
  return values;
}

function wilderAverage(values: readonly number[], period: number): number | undefined {
  if (values.length < period) return undefined;
  let current = average(values.slice(0, period));
  if (!finite(current)) return undefined;
  for (const value of values.slice(period)) {
    current = (current * (period - 1) + value) / period;
  }
  return current;
}

function atr(bars: readonly DailyBar[], period = 14): number | undefined {
  return wilderAverage(trueRanges(bars), period);
}

function adx(bars: readonly DailyBar[], period = 14): number | undefined {
  if (bars.length < period * 2 + 1) return undefined;
  const tr: number[] = [];
  const plusDm: number[] = [];
  const minusDm: number[] = [];
  for (let index = 1; index < bars.length; index += 1) {
    const current = bars[index]!;
    const previous = bars[index - 1]!;
    const upMove = current.high - previous.high;
    const downMove = previous.low - current.low;
    plusDm.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDm.push(downMove > upMove && downMove > 0 ? downMove : 0);
    const previousClose = closeOf(previous);
    tr.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previousClose),
        Math.abs(current.low - previousClose),
      ),
    );
  }

  const dx: number[] = [];
  for (let end = period; end <= tr.length; end += 1) {
    const trAvg = wilderAverage(tr.slice(0, end), period);
    const plusAvg = wilderAverage(plusDm.slice(0, end), period);
    const minusAvg = wilderAverage(minusDm.slice(0, end), period);
    if (!finite(trAvg) || trAvg <= 0 || !finite(plusAvg) || !finite(minusAvg)) continue;
    const plusDi = (100 * plusAvg) / trAvg;
    const minusDi = (100 * minusAvg) / trAvg;
    const denominator = plusDi + minusDi;
    if (denominator <= 0) continue;
    dx.push((100 * Math.abs(plusDi - minusDi)) / denominator);
  }
  return wilderAverage(dx, period);
}

function roc(values: readonly number[], sessions: number): number | undefined {
  if (values.length <= sessions) return undefined;
  const current = values.at(-1)!;
  const previous = values.at(-(sessions + 1))!;
  if (previous <= 0) return undefined;
  return current / previous - 1;
}

function linearSlopePctPerSession(values: readonly number[], sessions: number): number | undefined {
  const sample = values.slice(-sessions);
  if (sample.length < Math.min(5, sessions)) return undefined;
  const n = sample.length;
  const meanX = (n - 1) / 2;
  const meanY = average(sample);
  if (!finite(meanY) || meanY === 0) return undefined;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < n; index += 1) {
    const dx = index - meanX;
    numerator += dx * (sample[index]! - meanY);
    denominator += dx * dx;
  }
  if (denominator === 0) return undefined;
  return numerator / denominator / meanY;
}

function dailyReturns(values: readonly number[]): number[] {
  const returns: number[] = [];
  for (let index = 1; index < values.length; index += 1) {
    const previous = values[index - 1]!;
    if (previous <= 0) continue;
    returns.push(values[index]! / previous - 1);
  }
  return returns;
}

function annualizedVolatility(values: readonly number[], sessions = 20): number | undefined {
  const returns = dailyReturns(values.slice(-(sessions + 1)));
  const daily = stdDev(returns);
  return finite(daily) ? daily * Math.sqrt(252) : undefined;
}

function maxDrawdown(values: readonly number[], sessions = 252): number | undefined {
  const sample = values.slice(-sessions);
  if (sample.length < 2) return undefined;
  let peak = sample[0]!;
  let worst = 0;
  for (const value of sample) {
    peak = Math.max(peak, value);
    if (peak <= 0) continue;
    worst = Math.min(worst, value / peak - 1);
  }
  return worst;
}

function range(values: readonly number[]): { min: number; max: number } | null {
  if (!values.length) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

function zScore(values: readonly number[], period: number): number | undefined {
  if (values.length < period) return undefined;
  const sample = values.slice(-period);
  const mean = average(sample);
  const deviation = stdDev(sample);
  if (!finite(mean) || !finite(deviation) || deviation === 0) return 0;
  return (sample.at(-1)! - mean) / deviation;
}

function volumeWeightedPrice(bars: readonly DailyBar[], period = 20): number | undefined {
  const sample = bars.slice(-period).filter((bar) => bar.volume > 0);
  if (!sample.length) return undefined;
  const denominator = sample.reduce((sum, bar) => sum + bar.volume, 0);
  if (denominator <= 0) return undefined;
  return sample.reduce((sum, bar) => {
    const typical = (bar.high + bar.low + closeOf(bar)) / 3;
    return sum + typical * bar.volume;
  }, 0) / denominator;
}

function obvChange(bars: readonly DailyBar[], period = 20): number | undefined {
  const sample = bars.slice(-(period + 1));
  if (sample.length < 2) return undefined;
  let obv = 0;
  const series = [0];
  for (let index = 1; index < sample.length; index += 1) {
    const current = closeOf(sample[index]!);
    const previous = closeOf(sample[index - 1]!);
    if (current > previous) obv += sample[index]!.volume;
    else if (current < previous) obv -= sample[index]!.volume;
    series.push(obv);
  }
  const avgVolume = average(sample.slice(1).map((bar) => bar.volume));
  if (!finite(avgVolume) || avgVolume <= 0) return undefined;
  return (series.at(-1)! - series[0]!) / (avgVolume * Math.max(1, sample.length - 1));
}

function chaikinMoneyFlow(bars: readonly DailyBar[], period = 20): number | undefined {
  const sample = bars.slice(-period);
  if (!sample.length) return undefined;
  let flow = 0;
  let volume = 0;
  for (const bar of sample) {
    const spread = bar.high - bar.low;
    const multiplier = spread > 0 ? ((closeOf(bar) - bar.low) - (bar.high - closeOf(bar))) / spread : 0;
    flow += multiplier * bar.volume;
    volume += bar.volume;
  }
  return volume > 0 ? flow / volume : undefined;
}

function stochastic(bars: readonly DailyBar[], period = 14): number | undefined {
  const sample = bars.slice(-period);
  if (sample.length < period) return undefined;
  const highest = Math.max(...sample.map((bar) => bar.high));
  const lowest = Math.min(...sample.map((bar) => bar.low));
  if (highest <= lowest) return 50;
  return (100 * (closeOf(sample.at(-1)!) - lowest)) / (highest - lowest);
}

function bollinger(values: readonly number[], period = 20, multiplier = 2) {
  const sample = values.slice(-period);
  if (sample.length < period) return null;
  const mean = average(sample);
  const deviation = stdDev(sample);
  if (!finite(mean) || !finite(deviation)) return null;
  return {
    middle: mean,
    upper: mean + multiplier * deviation,
    lower: mean - multiplier * deviation,
    widthPct: mean > 0 ? ((multiplier * 2 * deviation) / mean) : 0,
  };
}

function macd(values: readonly number[]) {
  if (values.length < 35) return null;
  const ema12 = emaSeries(values, 12);
  const ema26 = emaSeries(values, 26);
  const macdSeries: number[] = [];
  for (let index = 0; index < values.length; index += 1) {
    const fast = ema12[index];
    const slow = ema26[index];
    if (finite(fast) && finite(slow)) macdSeries.push(fast - slow);
  }
  if (macdSeries.length < 9) return null;
  const signal = emaLast(macdSeries, 9);
  const current = macdSeries.at(-1);
  if (!finite(current) || !finite(signal)) return null;
  return { value: current, signal, histogram: current - signal };
}

function candlestickPatterns(bars: readonly DailyBar[]) {
  const current = bars.at(-1);
  const previous = bars.at(-2);
  if (!current) {
    return { doji: false, hammer: false, bullishEngulfing: false, bearishEngulfing: false };
  }
  const currentClose = closeOf(current);
  const body = Math.abs(currentClose - current.open);
  const rangeSize = Math.max(current.high - current.low, Number.EPSILON);
  const upperWick = current.high - Math.max(current.open, currentClose);
  const lowerWick = Math.min(current.open, currentClose) - current.low;
  const doji = body / rangeSize <= 0.1;
  const hammer = lowerWick >= body * 2 && upperWick <= Math.max(body, rangeSize * 0.15);

  if (!previous) return { doji, hammer, bullishEngulfing: false, bearishEngulfing: false };
  const previousClose = closeOf(previous);
  const currentBullish = currentClose > current.open;
  const previousBearish = previousClose < previous.open;
  const currentBearish = currentClose < current.open;
  const previousBullish = previousClose > previous.open;
  const bullishEngulfing = currentBullish && previousBearish && current.open <= previousClose && currentClose >= previous.open;
  const bearishEngulfing = currentBearish && previousBullish && current.open >= previousClose && currentClose <= previous.open;
  return { doji, hammer, bullishEngulfing, bearishEngulfing };
}

function normalizedTrendScore(input: {
  current: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  macdHistogram?: number;
  adx14?: number;
  slope20?: number;
  slope60?: number;
}): number {
  const parts: number[] = [];
  if (finite(input.sma20)) parts.push(input.current > input.sma20 ? 0.75 : 0.25);
  if (finite(input.sma50)) parts.push(input.current > input.sma50 ? 0.75 : 0.25);
  if (finite(input.sma200)) parts.push(input.current > input.sma200 ? 0.8 : 0.2);
  if (finite(input.sma20) && finite(input.sma50)) parts.push(input.sma20 > input.sma50 ? 0.75 : 0.25);
  if (finite(input.sma50) && finite(input.sma200)) parts.push(input.sma50 > input.sma200 ? 0.8 : 0.2);
  if (finite(input.macdHistogram)) parts.push(clamp01(0.5 + input.macdHistogram / Math.max(input.current * 0.03, 0.01)));
  if (finite(input.slope20)) parts.push(clamp01(0.5 + input.slope20 / 0.01));
  if (finite(input.slope60)) parts.push(clamp01(0.5 + input.slope60 / 0.006));
  if (finite(input.adx14)) {
    const directional = average(parts) ?? 0.5;
    const strength = clamp01((input.adx14 - 15) / 30);
    parts.push(directional >= 0.5 ? 0.5 + strength * 0.5 : 0.5 - strength * 0.5);
  }
  return clamp01(average(parts) ?? 0.5);
}

function technicalRegime(input: {
  current: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  adx14?: number;
}): TechnicalRegime {
  if (!finite(input.sma50)) return "insufficient_data";
  const strong = finite(input.adx14) && input.adx14 >= 25;
  const bullish = input.current > input.sma50 && (!finite(input.sma200) || input.sma50 > input.sma200);
  const bearish = input.current < input.sma50 && (!finite(input.sma200) || input.sma50 < input.sma200);
  if (bullish && strong) return "strong_uptrend";
  if (bullish) return "uptrend";
  if (bearish && strong) return "strong_downtrend";
  if (bearish) return "downtrend";
  return "neutral";
}

export function analyzeTechnicalSignals(history: readonly DailyBar[]): TechnicalAnalysisSnapshot {
  const bars = history
    .filter((bar) =>
      Number.isFinite(bar.open) &&
      Number.isFinite(bar.high) &&
      Number.isFinite(bar.low) &&
      Number.isFinite(bar.close) &&
      Number.isFinite(bar.volume) &&
      bar.high >= bar.low &&
      closeOf(bar) > 0,
    )
    .slice(-320);
  const closes = bars.map(closeOf);
  const current = closes.at(-1);
  const currentBar = bars.at(-1);

  if (!finite(current) || !currentBar) {
    return {
      version: TECHNICAL_ANALYSIS_TOOLKIT_VERSION,
      asOf: null,
      sessions: 0,
      toolsUsed: [...TECHNICAL_ANALYSIS_TOOLS],
      trend: { regime: "insufficient_data" },
      momentum: {},
      volatility: {},
      volume: {},
      levels: {},
      meanReversion: {},
      patterns: { doji: false, hammer: false, bullishEngulfing: false, bearishEngulfing: false },
      scores: { trend: 0.5, momentum: 0.5, volume: 0.5, breakout: 0.5, meanReversion: 0.5, stability: 0.5, composite: 0.5 },
      signals: ["Otillräcklig prishistorik för teknisk analys."],
    };
  }

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const ema12 = emaLast(closes, 12);
  const ema26 = emaLast(closes, 26);
  const macdValue = macd(closes);
  const rsi14 = rsi(closes, 14);
  const adx14 = adx(bars, 14);
  const atr14 = atr(bars, 14);
  const bollinger20 = bollinger(closes, 20, 2);
  const stochastic14 = stochastic(bars, 14);
  const roc10 = roc(closes, 10);
  const roc20 = roc(closes, 20);
  const slope20 = linearSlopePctPerSession(closes, 20);
  const slope60 = linearSlopePctPerSession(closes, 60);
  const annualized20 = annualizedVolatility(closes, 20);
  const drawdown252 = maxDrawdown(closes, 252);

  const recent20Bars = bars.slice(-20);
  const recent20Volumes = recent20Bars.map((bar) => bar.volume);
  const averageVolume20 = average(recent20Volumes);
  const volumeDeviation20 = stdDev(recent20Volumes);
  const volumeRatio20 = finite(averageVolume20) && averageVolume20 > 0 ? currentBar.volume / averageVolume20 : undefined;
  const volumeZScore20 = finite(averageVolume20) && finite(volumeDeviation20) && volumeDeviation20 > 0
    ? (currentBar.volume - averageVolume20) / volumeDeviation20
    : undefined;
  const obvChange20 = obvChange(bars, 20);
  const chaikinMoneyFlow20 = chaikinMoneyFlow(bars, 20);

  const ranges20 = range(bars.slice(-20).map((bar) => closeOf(bar)));
  const ranges55 = range(bars.slice(-55).map((bar) => closeOf(bar)));
  const ranges252 = range(bars.slice(-252).map((bar) => closeOf(bar)));
  const high20 = bars.length >= 20 ? Math.max(...bars.slice(-20).map((bar) => bar.high)) : undefined;
  const low20 = bars.length >= 20 ? Math.min(...bars.slice(-20).map((bar) => bar.low)) : undefined;
  const high55 = bars.length >= 55 ? Math.max(...bars.slice(-55).map((bar) => bar.high)) : undefined;
  const low55 = bars.length >= 55 ? Math.min(...bars.slice(-55).map((bar) => bar.low)) : undefined;
  const high252 = bars.length >= 200 ? Math.max(...bars.slice(-252).map((bar) => bar.high)) : undefined;
  const low252 = bars.length >= 200 ? Math.min(...bars.slice(-252).map((bar) => bar.low)) : undefined;
  const rangePosition20 = ranges20 && ranges20.max > ranges20.min ? (current - ranges20.min) / (ranges20.max - ranges20.min) : undefined;
  const rangePosition55 = ranges55 && ranges55.max > ranges55.min ? (current - ranges55.min) / (ranges55.max - ranges55.min) : undefined;
  const distanceFrom52WeekHighPct = finite(high252) && high252 > 0 ? current / high252 - 1 : undefined;
  const supportDistancePct = finite(low20) && low20 > 0 ? current / low20 - 1 : undefined;
  const resistanceDistancePct = finite(high20) && high20 > 0 ? high20 / current - 1 : undefined;

  const zScore20 = zScore(closes, 20);
  const volumeWeightedPrice20 = volumeWeightedPrice(bars, 20);
  const priceVsVolumeWeighted20Pct = finite(volumeWeightedPrice20) && volumeWeightedPrice20 > 0
    ? current / volumeWeightedPrice20 - 1
    : undefined;

  const patterns = candlestickPatterns(bars);
  const trendScore = normalizedTrendScore({
    current,
    sma20,
    sma50,
    sma200,
    macdHistogram: macdValue?.histogram,
    adx14,
    slope20,
    slope60,
  });
  const momentumScore = clamp01(average([
    finite(rsi14) ? clamp01((rsi14 - 30) / 40) : 0.5,
    finite(stochastic14) ? clamp01(stochastic14 / 100) : 0.5,
    finite(roc10) ? clamp01(0.5 + roc10 / 0.2) : 0.5,
    finite(roc20) ? clamp01(0.5 + roc20 / 0.3) : 0.5,
  ]) ?? 0.5);
  const volumeScore = clamp01(average([
    finite(volumeRatio20) ? clamp01(volumeRatio20 / 2) : 0.5,
    finite(volumeZScore20) ? clamp01(0.5 + volumeZScore20 / 6) : 0.5,
    finite(obvChange20) ? clamp01(0.5 + obvChange20 / 2) : 0.5,
    finite(chaikinMoneyFlow20) ? clamp01(0.5 + chaikinMoneyFlow20) : 0.5,
  ]) ?? 0.5);
  const breakoutScore = clamp01(average([
    finite(rangePosition20) ? rangePosition20 : 0.5,
    finite(rangePosition55) ? rangePosition55 : 0.5,
    finite(distanceFrom52WeekHighPct) ? clamp01(1 + distanceFrom52WeekHighPct / 0.35) : 0.5,
  ]) ?? 0.5);
  const meanReversionScore = finite(zScore20)
    ? clamp01(0.5 - zScore20 / 6)
    : 0.5;
  const stabilityScore = clamp01(average([
    finite(annualized20) ? clamp01(1 - annualized20 / 0.8) : 0.5,
    finite(atr14) ? clamp01(1 - (atr14 / current) / 0.08) : 0.5,
    finite(drawdown252) ? clamp01(1 + drawdown252 / 0.5) : 0.5,
  ]) ?? 0.5);
  const composite = clamp01(
    trendScore * 0.3 +
      momentumScore * 0.2 +
      volumeScore * 0.15 +
      breakoutScore * 0.15 +
      meanReversionScore * 0.05 +
      stabilityScore * 0.15,
  );

  const regime = technicalRegime({ current, sma20, sma50, sma200, adx14 });
  const signals: string[] = [];
  if (regime === "strong_uptrend") signals.push("Stark stigande trend: kurs och glidande medelvärden är positivt ordnade med tydlig trendstyrka.");
  else if (regime === "uptrend") signals.push("Stigande trendbild enligt kurs och längre glidande medelvärden.");
  else if (regime === "strong_downtrend") signals.push("Stark fallande trend: teknisk risk är förhöjd.");
  else if (regime === "downtrend") signals.push("Fallande trendbild enligt glidande medelvärden.");
  if (finite(rsi14) && rsi14 >= 70) signals.push(`RSI14 ${rsi14.toFixed(1)} visar ett kortsiktigt överköpt läge.`);
  if (finite(rsi14) && rsi14 <= 30) signals.push(`RSI14 ${rsi14.toFixed(1)} visar ett kortsiktigt översålt läge.`);
  if (finite(macdValue?.histogram) && macdValue!.histogram > 0) signals.push("MACD-histogrammet är positivt och stödjer stigande momentum.");
  if (finite(macdValue?.histogram) && macdValue!.histogram < 0) signals.push("MACD-histogrammet är negativt och signalerar svagare momentum.");
  if (finite(volumeRatio20) && volumeRatio20 >= 1.5) signals.push(`Volymen är ${volumeRatio20.toFixed(1)}x 20-dagarssnittet, vilket gör prisrörelsen mer relevant.`);
  if (finite(rangePosition55) && rangePosition55 >= 0.95) signals.push("Kursen ligger nära ett 55-dagars utbrott uppåt.");
  if (finite(rangePosition55) && rangePosition55 <= 0.05) signals.push("Kursen ligger nära ett 55-dagars utbrott nedåt.");
  if (finite(zScore20) && zScore20 <= -2) signals.push("Kursen ligger mer än två standardavvikelser under sitt 20-dagarssnitt; mean-reversion-läge men fallande kniv-risk måste vägas in.");
  if (finite(zScore20) && zScore20 >= 2) signals.push("Kursen ligger mer än två standardavvikelser över sitt 20-dagarssnitt; kortsiktig rekylrisk är förhöjd.");
  if (finite(chaikinMoneyFlow20) && chaikinMoneyFlow20 > 0.1) signals.push("Chaikin Money Flow visar tydligt positivt köptryck över 20 dagar.");
  if (finite(chaikinMoneyFlow20) && chaikinMoneyFlow20 < -0.1) signals.push("Chaikin Money Flow visar tydligt negativt kapitalflöde över 20 dagar.");
  if (patterns.bullishEngulfing) signals.push("Senaste två dagsstaplarna bildar en bullish engulfing-signal.");
  if (patterns.bearishEngulfing) signals.push("Senaste två dagsstaplarna bildar en bearish engulfing-signal.");
  if (!signals.length) signals.push("Tekniska signaler är blandade utan en enskild dominant signal.");

  return {
    version: TECHNICAL_ANALYSIS_TOOLKIT_VERSION,
    asOf: currentBar.date,
    sessions: bars.length,
    toolsUsed: [...TECHNICAL_ANALYSIS_TOOLS],
    trend: {
      sma20,
      sma50,
      sma200,
      ema12,
      ema26,
      macd: macdValue?.value,
      macdSignal: macdValue?.signal,
      macdHistogram: macdValue?.histogram,
      adx14,
      slope20PctPerSession: slope20,
      slope60PctPerSession: slope60,
      priceVsSma20Pct: finite(sma20) && sma20 > 0 ? current / sma20 - 1 : undefined,
      priceVsSma50Pct: finite(sma50) && sma50 > 0 ? current / sma50 - 1 : undefined,
      priceVsSma200Pct: finite(sma200) && sma200 > 0 ? current / sma200 - 1 : undefined,
      regime,
    },
    momentum: { rsi14, stochastic14, roc10, roc20 },
    volatility: {
      atr14,
      atrPct14: finite(atr14) ? atr14 / current : undefined,
      annualized20,
      bollingerUpper20: bollinger20?.upper,
      bollingerLower20: bollinger20?.lower,
      bollingerWidthPct20: bollinger20?.widthPct,
      maxDrawdown252: drawdown252,
    },
    volume: { averageVolume20, volumeRatio20, volumeZScore20, obvChange20, chaikinMoneyFlow20 },
    levels: {
      high20,
      low20,
      high55,
      low55,
      high252,
      low252,
      distanceFrom52WeekHighPct,
      rangePosition20,
      rangePosition55,
      supportDistancePct,
      resistanceDistancePct,
    },
    meanReversion: { zScore20, volumeWeightedPrice20, priceVsVolumeWeighted20Pct },
    patterns,
    scores: {
      trend: trendScore,
      momentum: momentumScore,
      volume: volumeScore,
      breakout: breakoutScore,
      meanReversion: meanReversionScore,
      stability: stabilityScore,
      composite,
    },
    signals,
  };
}
