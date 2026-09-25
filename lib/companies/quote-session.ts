export type SessionBar = {
  date: string;
  high: number;
  low: number;
  volume: number;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Day high, day low and volume are only the latest daily bar when that bar is
 * the same session as the delayed quote timestamp. A stale bar is not shown
 * as today's range.
 */
export function sessionExtremes(
  marketTimestamp: string | null,
  bar: SessionBar | null,
) {
  if (!marketTimestamp || !bar) {
    return { dayHigh: null, dayLow: null, sessionVolume: null };
  }

  const quoteDate = marketTimestamp.slice(0, 10);

  if (!DATE_PATTERN.test(quoteDate) || quoteDate !== bar.date) {
    return { dayHigh: null, dayLow: null, sessionVolume: null };
  }

  return {
    dayHigh: Number.isFinite(bar.high) ? bar.high : null,
    dayLow: Number.isFinite(bar.low) ? bar.low : null,
    sessionVolume: Number.isFinite(bar.volume) ? bar.volume : null,
  };
}
