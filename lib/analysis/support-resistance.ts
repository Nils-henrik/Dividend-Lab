import type { DailyBar } from "@/lib/model-portfolios/engine/eodhd";

export type TechnicalZoneStrength = "weak" | "medium" | "strong";
export type ResistanceState =
  | "zones"
  | "no_validated_resistance_above"
  | "unresolved";

export type TechnicalPriceZone = {
  kind: "support" | "resistance";
  lower: number;
  upper: number;
  center: number;
  distancePct: number;
  strength: TechnicalZoneStrength;
  strengthScore: number;
  touches: number;
  supportTouches: number;
  resistanceTouches: number;
  roleReversal: boolean;
  firstSeen: string;
  lastSeen: string;
  averageVolumeRatio: number | null;
  reasons: string[];
};

export type SupportResistanceAnalysis = {
  asOf: string | null;
  currentPrice: number | null;
  sessions: number;
  zoneTolerancePct: number | null;
  supports: TechnicalPriceZone[];
  resistances: TechnicalPriceZone[];
  resistanceState: ResistanceState;
  priorHigh: number | null;
};

type Pivot = {
  kind: "support" | "resistance";
  price: number;
  date: string;
  index: number;
  volumeRatio: number | null;
};

type ZoneCluster = {
  prices: number[];
  pivots: Pivot[];
};

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Support/resistance uses raw OHLC prices on one coherent price plane.
 * `adjustedClose` is useful for return continuity, but mixing it with raw
 * high/low shifts technical levels after dividends/corporate actions.
 */
function closeOf(bar: DailyBar): number {
  return bar.close;
}

function average(values: readonly number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: readonly number[]): number | null {
  if (!values.length) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  if (ordered.length % 2 === 1) return ordered[middle] ?? null;
  const left = ordered[middle - 1];
  const right = ordered[middle];
  return finite(left) && finite(right) ? (left + right) / 2 : null;
}

function trueRange(current: DailyBar, previous: DailyBar): number {
  const previousClose = closeOf(previous);
  return Math.max(
    current.high - current.low,
    Math.abs(current.high - previousClose),
    Math.abs(current.low - previousClose),
  );
}

function estimateAtr14(bars: readonly DailyBar[]): number | null {
  if (bars.length < 15) return null;
  const ranges: number[] = [];
  for (let index = Math.max(1, bars.length - 30); index < bars.length; index += 1) {
    ranges.push(trueRange(bars[index]!, bars[index - 1]!));
  }
  const sample = ranges.slice(-14);
  return average(sample);
}

function rollingAverageVolume(bars: readonly DailyBar[], index: number, period = 20): number | null {
  const start = Math.max(0, index - period);
  const sample = bars
    .slice(start, index)
    .map((bar) => bar.volume)
    .filter((value) => Number.isFinite(value) && value > 0);
  return average(sample);
}

function identifyPivots(bars: readonly DailyBar[], window = 3): Pivot[] {
  const pivots: Pivot[] = [];

  // Historical pivots use the ordinary symmetric window. At the live right
  // edge, future sessions do not exist yet, so use every completed session that
  // is actually available. The existing zone acceptance still requires repeat
  // reactions or sufficient strength; no future confirmation is fabricated.
  for (let index = window; index < bars.length; index += 1) {
    const current = bars[index]!;
    const neighborhood = bars.slice(
      index - window,
      Math.min(bars.length, index + window + 1),
    );
    const localLow = Math.min(...neighborhood.map((bar) => bar.low));
    const localHigh = Math.max(...neighborhood.map((bar) => bar.high));
    const averageVolume = rollingAverageVolume(bars, index);
    const volumeRatio =
      averageVolume && averageVolume > 0 && current.volume > 0
        ? current.volume / averageVolume
        : null;

    if (current.low <= localLow) {
      pivots.push({
        kind: "support",
        price: current.low,
        date: current.date,
        index,
        volumeRatio,
      });
    }
    if (current.high >= localHigh) {
      pivots.push({
        kind: "resistance",
        price: current.high,
        date: current.date,
        index,
        volumeRatio,
      });
    }
  }
  return pivots;
}

function clusterPivots(pivots: readonly Pivot[], absoluteTolerance: number): ZoneCluster[] {
  const ordered = [...pivots].sort((a, b) => a.price - b.price);
  const clusters: ZoneCluster[] = [];

  // Support/resistance is a price zone, not an exact line. The raw tolerance is
  // still volatility-bounded below; this modest envelope only allows nearby
  // pivot bands to join when their market-noise ranges overlap. A hard spread
  // cap prevents chain-merging unrelated levels into one oversized zone.
  const overlapTolerance = absoluteTolerance * 1.35;
  const maxClusterSpread = absoluteTolerance * 2.4;

  for (const pivot of ordered) {
    const closest = clusters
      .map((cluster, index) => ({
        index,
        center: average(cluster.prices) ?? pivot.price,
        min: Math.min(...cluster.prices, pivot.price),
        max: Math.max(...cluster.prices, pivot.price),
      }))
      .filter(
        (candidate) =>
          Math.abs(candidate.center - pivot.price) <= overlapTolerance &&
          candidate.max - candidate.min <= maxClusterSpread,
      )
      .sort(
        (a, b) =>
          Math.abs(a.center - pivot.price) - Math.abs(b.center - pivot.price),
      )[0];

    if (!closest) {
      clusters.push({ prices: [pivot.price], pivots: [pivot] });
      continue;
    }

    clusters[closest.index]!.prices.push(pivot.price);
    clusters[closest.index]!.pivots.push(pivot);
  }

  return clusters;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function zoneStrengthLabel(score: number): TechnicalZoneStrength {
  if (score >= 0.72) return "strong";
  if (score >= 0.48) return "medium";
  return "weak";
}

function buildZone(input: {
  cluster: ZoneCluster;
  currentPrice: number;
  bars: readonly DailyBar[];
  absoluteTolerance: number;
}): TechnicalPriceZone | null {
  const { cluster, currentPrice, bars, absoluteTolerance } = input;
  const center = average(cluster.prices);
  if (!center || center <= 0) return null;

  const lower = Math.min(...cluster.prices, center - absoluteTolerance * 0.45);
  const upper = Math.max(...cluster.prices, center + absoluteTolerance * 0.45);
  const kind = center <= currentPrice ? "support" : "resistance";
  const supportTouches = cluster.pivots.filter((pivot) => pivot.kind === "support").length;
  const resistanceTouches = cluster.pivots.length - supportTouches;
  const roleReversal = supportTouches > 0 && resistanceTouches > 0;
  const lastIndex = Math.max(...cluster.pivots.map((pivot) => pivot.index));
  const firstIndex = Math.min(...cluster.pivots.map((pivot) => pivot.index));
  const recency = clamp01(lastIndex / Math.max(1, bars.length - 1));
  const touchScore = clamp01(cluster.pivots.length / 5);
  const roleReversalScore = roleReversal ? 1 : 0;
  const volumeRatios = cluster.pivots
    .map((pivot) => pivot.volumeRatio)
    .filter((value): value is number => finite(value) && value > 0);
  const averageVolumeRatio = average(volumeRatios);
  const volumeScore = averageVolumeRatio === null
    ? 0.45
    : clamp01((averageVolumeRatio - 0.7) / 1.1);
  const timeSpanScore = clamp01((lastIndex - firstIndex) / 100);
  const strengthScore = clamp01(
    touchScore * 0.38 +
      recency * 0.22 +
      volumeScore * 0.18 +
      roleReversalScore * 0.12 +
      timeSpanScore * 0.1,
  );

  const reasons: string[] = [];
  if (cluster.pivots.length >= 3) reasons.push(`${cluster.pivots.length} historiska reaktioner i området`);
  else reasons.push(`${cluster.pivots.length} historisk${cluster.pivots.length === 1 ? " reaktion" : "a reaktioner"} i området`);
  if (roleReversal) reasons.push("området har agerat både stöd och motstånd");
  if (averageVolumeRatio !== null && averageVolumeRatio >= 1.25) {
    reasons.push("vändpunkterna har haft tydlig volymbekräftelse");
  }
  if (recency >= 0.8) reasons.push("nivån har testats relativt nyligen");

  return {
    kind,
    lower,
    upper,
    center,
    distancePct: center / currentPrice - 1,
    strength: zoneStrengthLabel(strengthScore),
    strengthScore,
    touches: cluster.pivots.length,
    supportTouches,
    resistanceTouches,
    roleReversal,
    firstSeen: bars[firstIndex]?.date ?? cluster.pivots[0]!.date,
    lastSeen: bars[lastIndex]?.date ?? cluster.pivots.at(-1)!.date,
    averageVolumeRatio,
    reasons,
  };
}

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function roundZone(zone: TechnicalPriceZone): TechnicalPriceZone {
  return {
    ...zone,
    lower: round(zone.lower, 4),
    upper: round(zone.upper, 4),
    center: round(zone.center, 4),
    distancePct: round(zone.distancePct, 6),
    strengthScore: round(zone.strengthScore, 4),
    averageVolumeRatio:
      zone.averageVolumeRatio === null ? null : round(zone.averageVolumeRatio, 4),
  };
}

export function analyzeSupportResistance(
  history: readonly DailyBar[],
  options: { maxZonesPerSide?: number; pivotWindow?: number } = {},
): SupportResistanceAnalysis {
  const bars = history
    .filter(
      (bar) =>
        Number.isFinite(bar.high) &&
        Number.isFinite(bar.low) &&
        Number.isFinite(bar.close) &&
        Number.isFinite(bar.volume) &&
        bar.high >= bar.low &&
        closeOf(bar) > 0,
    )
    .slice(-420);
  const current = bars.at(-1);
  const currentPrice = current ? closeOf(current) : null;
  const priorBars = bars.slice(0, -1);
  const priorHigh = priorBars.length
    ? Math.max(...priorBars.map((bar) => bar.high))
    : null;
  const priorClosingHigh = priorBars.length
    ? Math.max(...priorBars.map((bar) => closeOf(bar)))
    : null;

  if (!current || !currentPrice || bars.length < 30) {
    return {
      asOf: current?.date ?? null,
      currentPrice,
      sessions: bars.length,
      zoneTolerancePct: null,
      supports: [],
      resistances: [],
      resistanceState: "unresolved",
      priorHigh: priorHigh === null ? null : round(priorHigh, 4),
    };
  }

  const atr14 = estimateAtr14(bars);
  const medianDailyRange = median(
    bars.slice(-60).map((bar) => Math.max(0, bar.high - bar.low)),
  );
  const absoluteTolerance = Math.max(
    currentPrice * 0.009,
    (atr14 ?? medianDailyRange ?? currentPrice * 0.012) * 0.65,
  );
  const pivots = identifyPivots(bars, options.pivotWindow ?? 3);
  const clusters = clusterPivots(pivots, absoluteTolerance);
  const zones = clusters
    .map((cluster) => buildZone({ cluster, currentPrice, bars, absoluteTolerance }))
    .filter((zone): zone is TechnicalPriceZone => Boolean(zone))
    .filter((zone) => zone.touches >= 2 || zone.strengthScore >= 0.42)
    .map(roundZone);

  const maxZones = Math.max(1, Math.min(5, options.maxZonesPerSide ?? 3));
  const supports = zones
    .filter((zone) => zone.center <= currentPrice)
    .sort((a, b) => {
      const distance = Math.abs(a.distancePct) - Math.abs(b.distancePct);
      return Math.abs(distance) > 0.015 ? distance : b.strengthScore - a.strengthScore;
    })
    .slice(0, maxZones);
  const resistances = zones
    .filter((zone) => zone.center > currentPrice)
    .sort((a, b) => {
      const distance = Math.abs(a.distancePct) - Math.abs(b.distancePct);
      return Math.abs(distance) > 0.015 ? distance : b.strengthScore - a.strengthScore;
    })
    .slice(0, maxZones);

  // A single historical intraday wick must not by itself prevent a legitimate
  // price-discovery state. Robust wick-based resistance is already represented
  // by a validated zone above. When no such zone exists, use the prior closing
  // high to determine whether price has effectively cleared historical supply.
  const noValidatedResistanceAbove =
    resistances.length === 0 &&
    priorClosingHigh !== null &&
    currentPrice >= priorClosingHigh - absoluteTolerance;
  const resistanceState: ResistanceState = resistances.length > 0
    ? "zones"
    : noValidatedResistanceAbove
      ? "no_validated_resistance_above"
      : "unresolved";

  return {
    asOf: current.date,
    currentPrice: round(currentPrice, 4),
    sessions: bars.length,
    zoneTolerancePct: round(absoluteTolerance / currentPrice, 6),
    supports,
    resistances,
    resistanceState,
    priorHigh: priorHigh === null ? null : round(priorHigh, 4),
  };
}
