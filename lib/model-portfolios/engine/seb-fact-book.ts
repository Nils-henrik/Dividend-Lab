export type SebFactBookQuarter = "Q1" | "Q2" | "Q3" | "Q4";

export type SebFactBookProjection = {
  reportPeriod: SebFactBookQuarter;
  reportYear: number;
  excerpt: string;
  values: {
    netEclLevelPct: number;
    costIncomeRatioPct: number;
    liquidityCoverageRatioPct: number;
    netStableFundingRatioPct: number;
  };
};

const SEB_ISSUER = /^Skandinaviska\s+Enskilda\s+Banken\s+AB(?:\s*\(publ\))?$/iu;
const FACT_BOOK_FILE = /\bfact\s*book\b/iu;

export function isSebIssuerName(value: string): boolean {
  return SEB_ISSUER.test(value.trim());
}

export function isSebFactBookFileName(value: string | null | undefined): boolean {
  return typeof value === "string" && FACT_BOOK_FILE.test(value);
}

function cleanLine(value: string): string {
  return value
    .replace(/\p{Cf}/gu, "")
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numericValues(value: string): number[] | null {
  const raw = value.match(/-?\d+(?:[.,]\d+)?/g) ?? [];
  if (raw.length !== 9) return null;
  const values = raw.map((token) => Number(token.replace(",", ".")));
  return values.every((item) => Number.isFinite(item)) ? values : null;
}

function quarterNumber(value: SebFactBookQuarter): number {
  return Number(value.slice(1));
}

function periodsAreContiguous(
  quarters: readonly SebFactBookQuarter[],
  years: readonly number[],
): boolean {
  if (quarters.length !== 9 || years.length !== 9) return false;
  for (let index = 1; index < 9; index += 1) {
    const previous = years[index - 1]! * 4 + quarterNumber(quarters[index - 1]!);
    const current = years[index]! * 4 + quarterNumber(quarters[index]!);
    if (current !== previous + 1) return false;
  }
  return true;
}

function rowValues(input: {
  lines: readonly string[];
  start: number;
  end: number;
  pattern: RegExp;
}): number[] | null {
  let matchValues: number[] | null = null;
  for (let index = input.start; index < input.end; index += 1) {
    const line = input.lines[index] ?? "";
    input.pattern.lastIndex = 0;
    const match = input.pattern.exec(line);
    input.pattern.lastIndex = 0;
    if (!match?.[1]) continue;
    const values = numericValues(match[1]);
    if (!values || matchValues) return null;
    matchValues = values;
  }
  return matchValues;
}

function boundedPercent(value: number, min: number, max: number): number | null {
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return Math.round(value * 10_000) / 10_000;
}

function formatNumber(value: number): string {
  return String(Math.round(value * 10_000) / 10_000);
}

/**
 * Project the current quarter from SEB's explicitly labelled nine-quarter Fact
 * Book table. This is confirmation-only table arithmetic: no LLM and no stale
 * fallback. The target period must be the ninth/final column of a contiguous
 * quarter sequence, and every required row must expose exactly nine values.
 */
export function projectSebFactBookCurrentPeriod(input: {
  text: string;
  reportPeriod: string | null;
  reportYear: number | null;
}): SebFactBookProjection | null {
  if (!/^Q[1-4]$/.test(input.reportPeriod ?? "")) return null;
  if (
    input.reportYear === null
    || !Number.isInteger(input.reportYear)
    || input.reportYear < 2000
    || input.reportYear > 2100
  ) {
    return null;
  }

  const reportPeriod = input.reportPeriod as SebFactBookQuarter;
  const reportYear = input.reportYear;
  const lines = input.text
    .replace(/\r/g, "")
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);

  const anchor = lines.findIndex((line) =>
    /^Key figures\s*-\s*SEB Group,\s*nine quarters$/iu.test(line),
  );
  if (anchor < 0) return null;

  let headerIndex = -1;
  let quarters: SebFactBookQuarter[] = [];
  for (let index = anchor + 1; index <= Math.min(anchor + 6, lines.length - 1); index += 1) {
    const found = lines[index]?.match(/\bQ[1-4]\b/g) ?? [];
    if (found.length !== 9) continue;
    headerIndex = index;
    quarters = found as SebFactBookQuarter[];
    break;
  }
  if (headerIndex < 0) return null;

  let years: number[] = [];
  for (let index = headerIndex + 1; index <= Math.min(headerIndex + 3, lines.length - 1); index += 1) {
    const found = (lines[index]?.match(/\b20\d{2}\b/g) ?? []).map(Number);
    if (found.length === 9) {
      years = found;
      break;
    }
  }
  if (!periodsAreContiguous(quarters, years)) return null;

  const targetIndexes = quarters
    .map((quarter, index) => ({ quarter, year: years[index], index }))
    .filter(({ quarter, year }) => quarter === reportPeriod && year === reportYear)
    .map(({ index }) => index);
  if (targetIndexes.length !== 1 || targetIndexes[0] !== 8) return null;
  const targetIndex = targetIndexes[0];

  const rowStart = headerIndex + 1;
  const rowEnd = Math.min(lines.length, headerIndex + 45);
  const costIncome = rowValues({
    lines,
    start: rowStart,
    end: rowEnd,
    pattern: /^Cost\/income ratio\s+(.+)$/iu,
  });
  const netEcl = rowValues({
    lines,
    start: rowStart,
    end: rowEnd,
    pattern: /^Net ECL level,\s*%\s+(.+)$/iu,
  });
  const lcr = rowValues({
    lines,
    start: rowStart,
    end: rowEnd,
    pattern: /^Liquidity Coverage Ratio\s*\(LCR\)\s*(?:\d+\))?,\s*%\s+(.+)$/iu,
  });
  const nsfr = rowValues({
    lines,
    start: rowStart,
    end: rowEnd,
    pattern: /^Net Stable Funding Ratio\s*\(NSFR\)\s*(?:\d+\))?,\s*%\s+(.+)$/iu,
  });
  if (!costIncome || !netEcl || !lcr || !nsfr) return null;

  const rawCostIncome = costIncome[targetIndex]!;
  if (rawCostIncome < 0 || rawCostIncome > 2) return null;
  const costIncomeRatioPct = boundedPercent(rawCostIncome * 100, 0, 150);
  const netEclLevelPct = boundedPercent(netEcl[targetIndex]!, -10, 30);
  const liquidityCoverageRatioPct = boundedPercent(lcr[targetIndex]!, 0, 1_000);
  const netStableFundingRatioPct = boundedPercent(nsfr[targetIndex]!, 0, 1_000);
  if (
    costIncomeRatioPct === null
    || netEclLevelPct === null
    || liquidityCoverageRatioPct === null
    || netStableFundingRatioPct === null
  ) {
    return null;
  }

  return {
    reportPeriod,
    reportYear,
    excerpt: [
      `Net ECL level ${formatNumber(netEclLevelPct)}%`,
      `Cost/income ratio ${formatNumber(costIncomeRatioPct)}%`,
      `Liquidity Coverage Ratio ${formatNumber(liquidityCoverageRatioPct)}%`,
      `Net Stable Funding Ratio ${formatNumber(netStableFundingRatioPct)}%`,
    ].join("\n"),
    values: {
      netEclLevelPct,
      costIncomeRatioPct,
      liquidityCoverageRatioPct,
      netStableFundingRatioPct,
    },
  };
}
