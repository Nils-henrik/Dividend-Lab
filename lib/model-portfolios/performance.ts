export type PortfolioValuationPoint = {
  snapshotAt: string;
  totalValueMinor: number;
  contributedCapitalMinor: number;
};

export type CashFlowAdjustedFields = {
  externalFlowMinor: number;
  performanceIndex: number;
  performancePct: number;
};

export type CashFlowAdjustedPoint<T extends PortfolioValuationPoint> = T &
  CashFlowAdjustedFields;

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

/**
 * Builds a time-weighted-return-like series from persisted valuations.
 * Changes in contributed capital are treated as external cash flows, while
 * market moves, dividends, fees and courtage remain part of performance.
 */
export function buildCashFlowAdjustedPerformanceSeries<
  T extends PortfolioValuationPoint,
>(points: readonly T[]): Array<CashFlowAdjustedPoint<T>> {
  const ordered = points
    .map((point, index) => ({ point, index }))
    .sort((left, right) => {
      const difference = timestamp(left.point.snapshotAt) - timestamp(right.point.snapshotAt);
      return difference === 0 ? left.index - right.index : difference;
    })
    .map(({ point }) => point);

  let performanceIndex = 1;

  return ordered.map((point, index) => {
    const previous = ordered[index - 1];
    let externalFlowMinor = 0;

    if (previous) {
      externalFlowMinor =
        Number(point.contributedCapitalMinor) -
        Number(previous.contributedCapitalMinor);

      const previousValue = Number(previous.totalValueMinor);
      const currentValue = Number(point.totalValueMinor);
      if (
        Number.isFinite(previousValue) &&
        Number.isFinite(currentValue) &&
        Number.isFinite(externalFlowMinor) &&
        previousValue > 0
      ) {
        const periodGrowth = (currentValue - externalFlowMinor) / previousValue;
        if (Number.isFinite(periodGrowth)) {
          performanceIndex *= periodGrowth;
        }
      }
    }

    return {
      ...point,
      externalFlowMinor,
      performanceIndex,
      performancePct: (performanceIndex - 1) * 100,
    };
  });
}

export function latestCashFlowAdjustedPerformancePct(
  points: readonly PortfolioValuationPoint[],
): number {
  return buildCashFlowAdjustedPerformanceSeries(points).at(-1)?.performancePct ?? 0;
}
