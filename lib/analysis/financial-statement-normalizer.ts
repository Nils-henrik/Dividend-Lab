import type { FundamentalPeriod, FundamentalSnapshot } from "./fundamental-analysis";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function records(value: unknown): UnknownRecord[] {
  return Array.isArray(value)
    ? value.map(record).filter((item): item is UnknownRecord => Boolean(item))
    : [];
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const wrapped = record(value);
  if (wrapped) return finiteNumber(wrapped.raw);
  return null;
}

function positive(value: unknown): number | null {
  const parsed = finiteNumber(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function firstNumber(row: UnknownRecord | null, keys: readonly string[]): number | null {
  if (!row) return null;
  for (const key of keys) {
    const value = finiteNumber(row[key]);
    if (value !== null) return value;
  }
  return null;
}

function epochDate(value: unknown): string | null {
  const raw = finiteNumber(value);
  if (raw === null || raw <= 0) return null;
  const date = new Date(raw * 1_000);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

function endDate(row: UnknownRecord): string | null {
  const value = row.endDate;
  const wrapped = record(value);
  if (wrapped) {
    const formatted = typeof wrapped.fmt === "string" ? wrapped.fmt : null;
    if (formatted && /^\d{4}-\d{2}-\d{2}$/.test(formatted)) return formatted;
    return epochDate(wrapped.raw);
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return epochDate(value);
}

function sumKnown(values: readonly (number | null)[], minimumKnown = values.length): number | null {
  const known = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (known.length < minimumKnown) return null;
  return known.reduce((sum, value) => sum + value, 0);
}

function lastFourSum(rows: readonly UnknownRecord[], keys: readonly string[]): number | null {
  const ordered = [...rows]
    .filter((row) => endDate(row))
    .sort((a, b) => (endDate(b) ?? "").localeCompare(endDate(a) ?? ""))
    .slice(0, 4);
  if (ordered.length < 4) return null;
  return sumKnown(ordered.map((row) => firstNumber(row, keys)), 4);
}

function capexSigned(row: UnknownRecord | null): number | null {
  return firstNumber(row, ["capitalExpenditures", "capitalExpenditure"]);
}

function deriveFreeCashFlow(operatingCashFlow: number | null, capex: number | null): number | null {
  if (operatingCashFlow === null || capex === null) return null;
  return capex <= 0 ? operatingCashFlow + capex : operatingCashFlow - capex;
}

function historyRows(module: UnknownRecord | null, key: string): UnknownRecord[] {
  return records(module?.[key]);
}

function moduleRecord(result: UnknownRecord, key: string): UnknownRecord | null {
  return record(result[key]);
}

function byDate(rows: readonly UnknownRecord[]): Map<string, UnknownRecord> {
  const map = new Map<string, UnknownRecord>();
  for (const row of rows) {
    const date = endDate(row);
    if (date) map.set(date, row);
  }
  return map;
}

function buildAnnualPeriods(input: {
  income: readonly UnknownRecord[];
  cashflow: readonly UnknownRecord[];
  balance: readonly UnknownRecord[];
}): FundamentalPeriod[] {
  const cashByDate = byDate(input.cashflow);
  const balanceByDate = byDate(input.balance);
  return [...input.income]
    .filter((row) => endDate(row))
    .sort((a, b) => (endDate(b) ?? "").localeCompare(endDate(a) ?? ""))
    .slice(0, 5)
    .map((incomeRow) => {
      const date = endDate(incomeRow)!;
      const cashRow = cashByDate.get(date) ?? null;
      const balanceRow = balanceByDate.get(date) ?? null;
      const operatingCashFlow = firstNumber(cashRow, [
        "totalCashFromOperatingActivities",
        "operatingCashFlow",
      ]);
      const capex = capexSigned(cashRow);
      const providedFcf = firstNumber(cashRow, ["freeCashFlow"]);
      const shares = firstNumber(balanceRow, [
        "ordinarySharesNumber",
        "shareIssued",
        "commonStockSharesOutstanding",
      ]);
      const netIncome = firstNumber(incomeRow, [
        "netIncome",
        "netIncomeCommonStockholders",
        "netIncomeApplicableToCommonShares",
      ]);
      const eps = firstNumber(incomeRow, ["dilutedEPS", "basicEPS"]);
      return {
        period: date,
        revenue: firstNumber(incomeRow, ["totalRevenue", "operatingRevenue"]),
        operatingIncome: firstNumber(incomeRow, ["operatingIncome"]),
        netIncome,
        operatingCashFlow,
        freeCashFlow: providedFcf ?? deriveFreeCashFlow(operatingCashFlow, capex),
        capex,
        eps: eps ?? (netIncome !== null && shares && shares > 0 ? netIncome / shares : null),
        sharesOutstanding: shares,
      };
    });
}

function yoyGrowth(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return current / previous - 1;
}

export function parseYahooFinancialStatements(input: {
  payload: unknown;
  symbol: string;
  currency: string;
  currentPrice: number;
  now?: Date;
}): FundamentalSnapshot | null {
  const root = record(input.payload);
  const quoteSummary = record(root?.quoteSummary);
  const result = records(quoteSummary?.result)[0] ?? null;
  if (!result) return null;

  const incomeAnnual = historyRows(moduleRecord(result, "incomeStatementHistory"), "incomeStatementHistory");
  const incomeQuarterly = historyRows(moduleRecord(result, "incomeStatementHistoryQuarterly"), "incomeStatementHistory");
  const cashAnnual = historyRows(moduleRecord(result, "cashflowStatementHistory"), "cashflowStatements");
  const cashQuarterly = historyRows(moduleRecord(result, "cashflowStatementHistoryQuarterly"), "cashflowStatements");
  const balanceAnnual = historyRows(moduleRecord(result, "balanceSheetHistory"), "balanceSheetStatements");
  const balanceQuarterly = historyRows(moduleRecord(result, "balanceSheetHistoryQuarterly"), "balanceSheetStatements");
  const financialData = moduleRecord(result, "financialData");
  const keyStats = moduleRecord(result, "defaultKeyStatistics");
  const price = moduleRecord(result, "price");
  const summary = moduleRecord(result, "summaryDetail");

  const historicalPeriods = buildAnnualPeriods({
    income: incomeAnnual,
    cashflow: cashAnnual,
    balance: balanceAnnual,
  });

  const revenueTtm = firstNumber(financialData, ["totalRevenue"]) ?? lastFourSum(incomeQuarterly, ["totalRevenue", "operatingRevenue"]);
  const operatingIncomeTtm = lastFourSum(incomeQuarterly, ["operatingIncome"]);
  const netIncomeTtm = lastFourSum(incomeQuarterly, [
    "netIncome",
    "netIncomeCommonStockholders",
    "netIncomeApplicableToCommonShares",
  ]);
  const operatingCashFlowTtm = firstNumber(financialData, ["operatingCashflow", "operatingCashFlow"]) ?? lastFourSum(cashQuarterly, ["totalCashFromOperatingActivities", "operatingCashFlow"]);
  const capexTtm = lastFourSum(cashQuarterly, ["capitalExpenditures", "capitalExpenditure"]);
  const freeCashFlowTtm = firstNumber(financialData, ["freeCashflow", "freeCashFlow"]) ?? deriveFreeCashFlow(operatingCashFlowTtm, capexTtm);

  const latestBalance = [...balanceQuarterly, ...balanceAnnual]
    .filter((row) => endDate(row))
    .sort((a, b) => (endDate(b) ?? "").localeCompare(endDate(a) ?? ""))[0] ?? null;

  const cash = firstNumber(financialData, ["totalCash"]) ?? firstNumber(latestBalance, [
    "cashCashEquivalentsAndShortTermInvestments",
    "cashAndCashEquivalents",
    "cash",
  ]);
  const totalDebt = firstNumber(financialData, ["totalDebt"]) ?? firstNumber(latestBalance, ["totalDebt"]);
  const equity = firstNumber(latestBalance, [
    "stockholdersEquity",
    "totalStockholderEquity",
    "totalEquityGrossMinorityInterest",
  ]);
  const sharesOutstanding = positive(keyStats?.sharesOutstanding) ?? positive(price?.sharesOutstanding) ?? positive(firstNumber(latestBalance, [
    "ordinarySharesNumber",
    "shareIssued",
    "commonStockSharesOutstanding",
  ]));

  const latestAnnualShares = historicalPeriods[0]?.sharesOutstanding ?? null;
  const previousAnnualShares = historicalPeriods[1]?.sharesOutstanding ?? null;
  const sharesOutstandingGrowthYoy = yoyGrowth(
    latestAnnualShares ?? null,
    previousAnnualShares ?? null,
  );

  const latestAnnualRevenue = historicalPeriods[0]?.revenue ?? null;
  const previousAnnualRevenue = historicalPeriods[1]?.revenue ?? null;
  const revenueGrowthYoy = firstNumber(financialData, ["revenueGrowth"]) ?? yoyGrowth(latestAnnualRevenue, previousAnnualRevenue);

  const operatingMarginTtm = firstNumber(financialData, ["operatingMargins"]) ?? (revenueTtm && operatingIncomeTtm !== null ? operatingIncomeTtm / revenueTtm : null);
  const profitMarginTtm = firstNumber(financialData, ["profitMargins"]) ?? (revenueTtm && netIncomeTtm !== null ? netIncomeTtm / revenueTtm : null);
  const ebitdaTtm = firstNumber(financialData, ["ebitda"]);
  const epsTtm = firstNumber(keyStats, ["trailingEps"]) ?? (netIncomeTtm !== null && sharesOutstanding ? netIncomeTtm / sharesOutstanding : null);

  const marketCap = positive(price?.marketCap) ?? positive(summary?.marketCap);
  const payoutRatio = firstNumber(summary, ["payoutRatio"]);
  const dividendRate = firstNumber(summary, ["dividendRate", "trailingAnnualDividendRate"]);

  const dates = [
    ...incomeQuarterly.map(endDate),
    ...cashQuarterly.map(endDate),
    ...balanceQuarterly.map(endDate),
    ...historicalPeriods.map((period) => period.period),
  ].filter((value): value is string => Boolean(value));
  const asOf = dates.sort((a, b) => b.localeCompare(a))[0] ?? (input.now ?? new Date()).toISOString().slice(0, 10);

  const useful = [revenueTtm, operatingCashFlowTtm, freeCashFlowTtm, totalDebt, sharesOutstanding, epsTtm]
    .some((value) => value !== null && Number.isFinite(value));
  if (!useful) return null;

  return {
    asOf,
    currency: input.currency.trim().toUpperCase(),
    price: input.currentPrice,
    marketCap,
    revenueTtm,
    revenueGrowthYoy,
    operatingMarginTtm,
    profitMarginTtm,
    ebitTtm: operatingIncomeTtm,
    ebitdaTtm,
    netIncomeTtm,
    epsTtm,
    operatingCashFlowTtm,
    freeCashFlowTtm,
    capexTtm,
    cash,
    totalDebt,
    netDebt: totalDebt !== null && cash !== null ? totalDebt - cash : null,
    equity,
    sharesOutstanding,
    sharesOutstandingGrowthYoy,
    returnOnEquity: firstNumber(financialData, ["returnOnEquity"]),
    returnOnAssets: firstNumber(financialData, ["returnOnAssets"]),
    returnOnInvestedCapital: null,
    payoutRatio,
    dividendPerShareTtm: dividendRate,
    historicalPeriods,
  };
}
