export type FinancialHistoryStatus = "available" | "empty" | "unavailable";

export type FreeCashFlowBasis = "provider" | "operating_plus_capex";

export type AnnualFinancialPoint = {
  fiscalYear: number;
  endDate: string;
  currency: string | null;
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  eps: number | null;
  freeCashFlow: number | null;
  freeCashFlowBasis: FreeCashFlowBasis | null;
  cash: number | null;
  debt: number | null;
  netDebt: number | null;
  operatingMargin: number | null;
  profitMargin: number | null;
};

const YEAR_LIMIT = 5;

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object" && "raw" in value) {
    return readNumber((value as { raw?: unknown }).raw);
  }
  return null;
}

function readDate(value: unknown): string | null {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const raw = readNumber(value && typeof value === "object" && "raw" in value ? (value as { raw?: unknown }).raw : value);
  if (raw === null || raw <= 0) return null;
  const date = new Date(raw > 10_000_000_000 ? raw : raw * 1000);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function rowsFrom(value: unknown, keys: readonly string[]): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
  }
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      return candidate.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
    }
  }
  return [];
}

function margin(numerator: number | null, revenue: number | null): number | null {
  if (numerator === null || revenue === null || revenue <= 0) return null;
  return numerator / revenue;
}

function freeCashFlow(row: Record<string, unknown>): { value: number | null; basis: FreeCashFlowBasis | null } {
  const explicit = readNumber(row.freeCashFlow);
  if (explicit !== null) return { value: explicit, basis: "provider" };
  const operating = readNumber(row.totalCashFromOperatingActivities);
  const capex = readNumber(row.capitalExpenditures);
  if (operating === null || capex === null || capex > 0) return { value: null, basis: null };
  return { value: operating + capex, basis: "operating_plus_capex" };
}

function debt(row: Record<string, unknown>): number | null {
  const total = readNumber(row.totalDebt);
  if (total !== null) return total;
  const shortDebt = readNumber(row.shortLongTermDebt);
  const longDebt = readNumber(row.longTermDebt);
  if (shortDebt === null || longDebt === null) return null;
  return shortDebt + longDebt;
}

function hasSignal(point: AnnualFinancialPoint) {
  return [
    point.revenue,
    point.operatingIncome,
    point.netIncome,
    point.eps,
    point.freeCashFlow,
    point.cash,
    point.debt,
    point.netDebt,
    point.operatingMargin,
    point.profitMargin,
  ].some((value) => value !== null);
}

const REPORTING_CURRENCY = /^[A-Za-z]{3}$/;

function readCurrencyCode(value: unknown): string | null {
  if (typeof value === "string" && REPORTING_CURRENCY.test(value.trim())) {
    return value.trim().toUpperCase();
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("raw" in record) return readCurrencyCode(record.raw);
    if ("fmt" in record) return readCurrencyCode(record.fmt);
  }
  return null;
}

/**
 * Reporting currency from an explicit Yahoo financialCurrency field.
 * Quote, price and chart currencies are ignored. Missing means null.
 */
export function readYahooReportingCurrency(statements: unknown): string | null {
  if (!statements || typeof statements !== "object") return null;
  const root = statements as Record<string, unknown>;
  const financialData = root.financialData;
  if (financialData && typeof financialData === "object") {
    const fromModule = readCurrencyCode((financialData as Record<string, unknown>).financialCurrency);
    if (fromModule) return fromModule;
  }
  return readCurrencyCode(root.financialCurrency);
}

/**
 * Annual figures from a Yahoo quoteSummary payload.
 * Missing years are omitted. Nothing is filled with zero.
 * Operating income is only the provider's operatingIncome field.
 * Currency is the verified reporting currency, never the listing currency.
 */
export function parseYahooAnnualFinancials(statements: unknown): AnnualFinancialPoint[] {
  if (!statements || typeof statements !== "object") return [];
  const root = statements as Record<string, unknown>;
  const currency = readYahooReportingCurrency(statements);
  const incomeRows = rowsFrom(root.incomeStatementHistory, ["incomeStatementHistory"]);
  const balanceRows = rowsFrom(root.balanceSheetHistory, ["balanceSheetStatements", "balanceSheetHistory"]);
  const cashRows = rowsFrom(root.cashflowStatementHistory, ["cashflowStatements", "cashflowStatementHistory"]);
  const byEndDate = new Map<string, AnnualFinancialPoint>();

  function pointFor(endDate: string): AnnualFinancialPoint {
    const existing = byEndDate.get(endDate);
    if (existing) return existing;
    const created: AnnualFinancialPoint = {
      fiscalYear: Number(endDate.slice(0, 4)),
      endDate,
      currency,
      revenue: null,
      operatingIncome: null,
      netIncome: null,
      eps: null,
      freeCashFlow: null,
      freeCashFlowBasis: null,
      cash: null,
      debt: null,
      netDebt: null,
      operatingMargin: null,
      profitMargin: null,
    };
    byEndDate.set(endDate, created);
    return created;
  }

  for (const row of incomeRows) {
    const endDate = readDate(row.endDate);
    if (!endDate) continue;
    const point = pointFor(endDate);
    point.revenue = readNumber(row.totalRevenue);
    point.operatingIncome = readNumber(row.operatingIncome);
    point.netIncome = readNumber(row.netIncome);
    point.eps = readNumber(row.dilutedEPS) ?? readNumber(row.basicEPS);
    point.operatingMargin = margin(point.operatingIncome, point.revenue);
    point.profitMargin = margin(point.netIncome, point.revenue);
  }

  for (const row of balanceRows) {
    const endDate = readDate(row.endDate);
    if (!endDate) continue;
    const point = pointFor(endDate);
    point.cash = readNumber(row.totalCash) ?? readNumber(row.cash);
    point.debt = debt(row);
    point.netDebt = point.debt !== null && point.cash !== null ? point.debt - point.cash : null;
  }

  for (const row of cashRows) {
    const endDate = readDate(row.endDate);
    if (!endDate) continue;
    const point = pointFor(endDate);
    const cashFlow = freeCashFlow(row);
    point.freeCashFlow = cashFlow.value;
    point.freeCashFlowBasis = cashFlow.basis;
  }

  const latestByYear = new Map<number, AnnualFinancialPoint>();
  for (const point of byEndDate.values()) {
    const current = latestByYear.get(point.fiscalYear);
    if (!current || point.endDate > current.endDate) latestByYear.set(point.fiscalYear, point);
  }

  return [...latestByYear.values()]
    .filter(hasSignal)
    .sort((left, right) => left.fiscalYear - right.fiscalYear)
    .slice(-YEAR_LIMIT);
}
