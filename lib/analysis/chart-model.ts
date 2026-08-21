import type { DailyBar } from "@/lib/model-portfolios/engine/eodhd";
import type {
  SupportResistanceAnalysis,
  TechnicalPriceZone,
} from "./support-resistance";

export const DIVLAB_ANALYSIS_CHART_VERSION = "analysis-chart-v1" as const;
export const DIVLAB_ANALYSIS_CHART_MAX_SESSIONS = 260;
export const DIVLAB_ANALYSIS_CHART_MAX_ZONES_PER_SIDE = 3;

export type DivLabAnalysisChartBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number | null;
  volume: number;
};

export type DivLabAnalysisChartPoint = {
  date: string;
  value: number;
};

export type DivLabAnalysisChartZone = {
  kind: "support" | "resistance";
  lower: number;
  upper: number;
  center: number;
  distancePct: number;
  strength: "weak" | "medium" | "strong";
  strengthScore: number;
  touches: number;
  roleReversal: boolean;
  firstSeen: string;
  lastSeen: string;
  averageVolumeRatio: number | null;
  reasons: string[];
  source: "technical_engine";
};

export type DivLabAnalysisChartModel = {
  version: typeof DIVLAB_ANALYSIS_CHART_VERSION;
  asOf: string | null;
  sessions: number;
  currentPrice: number | null;
  bars: DivLabAnalysisChartBar[];
  movingAverages: {
    sma20: DivLabAnalysisChartPoint[];
    sma50: DivLabAnalysisChartPoint[];
    sma200: DivLabAnalysisChartPoint[];
  };
  volume: {
    average20: DivLabAnalysisChartPoint[];
  };
  zones: {
    supports: DivLabAnalysisChartZone[];
    resistances: DivLabAnalysisChartZone[];
  };
  priorHigh: number | null;
};

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function dayKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? null;
}

function isValidBar(bar: DailyBar): boolean {
  const values = [bar.open, bar.high, bar.low, bar.close, bar.volume];
  if (!values.every((value) => Number.isFinite(value))) return false;
  if (bar.open <= 0 || bar.high <= 0 || bar.low <= 0 || bar.close <= 0) {
    return false;
  }
  if (bar.high < bar.low) return false;
  if (bar.high < Math.max(bar.open, bar.close)) return false;
  if (bar.low > Math.min(bar.open, bar.close)) return false;
  if (bar.volume < 0) return false;
  return dayKey(bar.date) !== null;
}

function sanitizeHistory(
  history: readonly DailyBar[],
  asOf: string | null | undefined,
): DivLabAnalysisChartBar[] {
  const asOfDay = dayKey(asOf);
  const byDate = new Map<string, DivLabAnalysisChartBar>();

  for (const bar of history) {
    if (!isValidBar(bar)) continue;
    const date = dayKey(bar.date)!;
    if (asOfDay && date > asOfDay) continue;
    byDate.set(date, {
      date,
      open: round(bar.open),
      high: round(bar.high),
      low: round(bar.low),
      close: round(bar.close),
      adjustedClose:
        finite(bar.adjustedClose) && bar.adjustedClose > 0
          ? round(bar.adjustedClose)
          : null,
      volume: Math.max(0, Math.round(bar.volume)),
    });
  }

  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-DIVLAB_ANALYSIS_CHART_MAX_SESSIONS);
}

function movingAverage(
  bars: readonly DivLabAnalysisChartBar[],
  period: number,
): DivLabAnalysisChartPoint[] {
  if (period <= 0 || bars.length < period) return [];
  const result: DivLabAnalysisChartPoint[] = [];
  let rolling = 0;
  const closes = bars.map((bar) =>
    finite(bar.adjustedClose) && bar.adjustedClose > 0
      ? bar.adjustedClose
      : bar.close,
  );

  for (let index = 0; index < closes.length; index += 1) {
    rolling += closes[index]!;
    if (index >= period) rolling -= closes[index - period]!;
    if (index < period - 1) continue;
    result.push({
      date: bars[index]!.date,
      value: round(rolling / period),
    });
  }
  return result;
}

function averageVolume(
  bars: readonly DivLabAnalysisChartBar[],
  period = 20,
): DivLabAnalysisChartPoint[] {
  if (period <= 0 || bars.length < period) return [];
  const result: DivLabAnalysisChartPoint[] = [];
  let rolling = 0;

  for (let index = 0; index < bars.length; index += 1) {
    rolling += bars[index]!.volume;
    if (index >= period) rolling -= bars[index - period]!.volume;
    if (index < period - 1) continue;
    result.push({
      date: bars[index]!.date,
      value: Math.round(rolling / period),
    });
  }
  return result;
}

function copyZone(zone: TechnicalPriceZone): DivLabAnalysisChartZone {
  return {
    kind: zone.kind,
    lower: round(zone.lower),
    upper: round(zone.upper),
    center: round(zone.center),
    distancePct: round(zone.distancePct, 6),
    strength: zone.strength,
    strengthScore: round(zone.strengthScore, 4),
    touches: zone.touches,
    roleReversal: zone.roleReversal,
    firstSeen: zone.firstSeen,
    lastSeen: zone.lastSeen,
    averageVolumeRatio:
      zone.averageVolumeRatio === null
        ? null
        : round(zone.averageVolumeRatio, 4),
    reasons: [...zone.reasons],
    source: "technical_engine",
  };
}

function selectZones(
  zones: readonly TechnicalPriceZone[],
  asOf: string | null | undefined,
): DivLabAnalysisChartZone[] {
  const asOfDay = dayKey(asOf);
  return zones
    .filter((zone) => {
      if (!finite(zone.lower) || !finite(zone.upper) || zone.lower <= 0) return false;
      if (zone.upper < zone.lower) return false;
      const lastSeen = dayKey(zone.lastSeen);
      if (asOfDay && lastSeen && lastSeen > asOfDay) return false;
      return true;
    })
    .sort((a, b) => {
      const strength = b.strengthScore - a.strengthScore;
      if (strength !== 0) return strength;
      const distance = Math.abs(a.distancePct) - Math.abs(b.distancePct);
      if (distance !== 0) return distance;
      return a.center - b.center;
    })
    .slice(0, DIVLAB_ANALYSIS_CHART_MAX_ZONES_PER_SIDE)
    .map(copyZone)
    .sort((a, b) => a.center - b.center);
}

/**
 * Builds the immutable, UI-ready price-chart payload used by DivLab Analys.
 *
 * Important integrity rule: bars and technical zones after `asOf` are removed.
 * This prevents a historical analysis from silently gaining future price data
 * when it is rendered later.
 */
export function buildDivLabAnalysisChartModel(input: {
  history: readonly DailyBar[];
  levels: SupportResistanceAnalysis;
  currentPrice?: number | null;
  asOf?: string | null;
}): DivLabAnalysisChartModel {
  const asOf = input.asOf ?? input.levels.asOf;
  const bars = sanitizeHistory(input.history, asOf);
  const lastBar = bars.at(-1);
  const currentPrice =
    finite(input.currentPrice) && input.currentPrice > 0
      ? round(input.currentPrice)
      : lastBar
        ? round(
            finite(lastBar.adjustedClose) && lastBar.adjustedClose > 0
              ? lastBar.adjustedClose
              : lastBar.close,
          )
        : finite(input.levels.currentPrice) && input.levels.currentPrice > 0
          ? round(input.levels.currentPrice)
          : null;

  return {
    version: DIVLAB_ANALYSIS_CHART_VERSION,
    asOf: lastBar?.date ?? dayKey(asOf),
    sessions: bars.length,
    currentPrice,
    bars,
    movingAverages: {
      sma20: movingAverage(bars, 20),
      sma50: movingAverage(bars, 50),
      sma200: movingAverage(bars, 200),
    },
    volume: {
      average20: averageVolume(bars, 20),
    },
    zones: {
      supports: selectZones(input.levels.supports, asOf),
      resistances: selectZones(input.levels.resistances, asOf),
    },
    priorHigh:
      finite(input.levels.priorHigh) && input.levels.priorHigh > 0
        ? round(input.levels.priorHigh)
        : null,
  };
}
