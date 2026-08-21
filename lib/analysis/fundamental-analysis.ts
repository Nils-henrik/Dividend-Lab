export type FundamentalPeriod = {
  period: string;
  revenue?: number | null;
  operatingIncome?: number | null;
  netIncome?: number | null;
  operatingCashFlow?: number | null;
  freeCashFlow?: number | null;
  capex?: number | null;
  eps?: number | null;
  sharesOutstanding?: number | null;
};

export type FundamentalSnapshot = {
  asOf: string;
  currency: string;
  price?: number | null;
  marketCap?: number | null;
  revenueTtm?: number | null;
  revenueGrowthYoy?: number | null;
  operatingMarginTtm?: number | null;
  profitMarginTtm?: number | null;
  ebitTtm?: number | null;
  ebitdaTtm?: number | null;
  netIncomeTtm?: number | null;
  epsTtm?: number | null;
  operatingCashFlowTtm?: number | null;
  freeCashFlowTtm?: number | null;
  capexTtm?: number | null;
  cash?: number | null;
  totalDebt?: number | null;
  netDebt?: number | null;
  equity?: number | null;
  sharesOutstanding?: number | null;
  sharesOutstandingGrowthYoy?: number | null;
  returnOnEquity?: number | null;
  returnOnAssets?: number | null;
  returnOnInvestedCapital?: number | null;
  payoutRatio?: number | null;
  dividendPerShareTtm?: number | null;
  historicalPeriods?: FundamentalPeriod[];
};

export type FundamentalScorecard = {
  growth: number | null;
  profitability: number | null;
  cashFlow: number | null;
  balanceSheet: number | null;
  capitalAllocation: number | null;
  overall: number | null;
  coverage: number;
};

export type FundamentalTrendAnalysis = {
  periodsAnalyzed: number;
  yearsCovered: number | null;
  revenueCagr: number | null;
  epsCagr: number | null;
  freeCashFlowPerShareCagr: number | null;
  sharesOutstandingCagr: number | null;
  operatingMarginChange: number | null;
};

export type FundamentalAnalysis = {
  asOf: string;
  currency: string;
  scorecard: FundamentalScorecard;
  metrics: {
    revenueGrowthYoy: number | null;
    operatingMarginTtm: number | null;
    profitMarginTtm: number | null;
    freeCashFlowMargin: number | null;
    cashConversion: number | null;
    netDebtToEbitda: number | null;
    netDebtToFcf: number | null;
    returnOnEquity: number | null;
    returnOnAssets: number | null;
    returnOnInvestedCapital: number | null;
    sharesOutstandingGrowthYoy: number | null;
    payoutRatio: number | null;
    freeCashFlowPerShare: number | null;
    epsTtm: number | null;
  };
  trends: FundamentalTrendAnalysis;
  strengths: string[];
  concerns: string[];
  unknowns: string[];
};

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function ratio(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (!finite(numerator) || !finite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreLinear(value: number | null, low: number, high: number): number | null {
  if (!finite(value) || high <= low) return null;
  return clamp(((value - low) / (high - low)) * 10, 0, 10);
}

function inverseScore(value: number | null, good: number, bad: number): number | null {
  if (!finite(value) || bad <= good) return null;
  return clamp((1 - (value - good) / (bad - good)) * 10, 0, 10);
}

function weightedAverage(parts: ReadonlyArray<readonly [number | null, number]>): number | null {
  let weighted = 0;
  let weight = 0;
  for (const [value, itemWeight] of parts) {
    if (!finite(value) || itemWeight <= 0) continue;
    weighted += value * itemWeight;
    weight += itemWeight;
  }
  return weight > 0 ? weighted / weight : null;
}

function round(value: number | null, digits = 4): number | null {
  if (!finite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function knownCoverage(values: readonly (number | null)[]): number {
  if (!values.length) return 0;
  return values.filter(finite).length / values.length;
}

function validPeriodDate(period: FundamentalPeriod): Date | null {
  const parsed = new Date(period.period);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function historicalPeriods(snapshot: FundamentalSnapshot): FundamentalPeriod[] {
  return (snapshot.historicalPeriods ?? [])
    .filter((period) => validPeriodDate(period))
    .sort((a, b) => validPeriodDate(a)!.getTime() - validPeriodDate(b)!.getTime())
    .slice(-5);
}

function yearsBetween(first: FundamentalPeriod, last: FundamentalPeriod): number | null {
  const start = validPeriodDate(first);
  const end = validPeriodDate(last);
  if (!start || !end || end <= start) return null;
  const years = (end.getTime() - start.getTime()) / (365.25 * 86_400_000);
  return years >= 0.75 ? years : null;
}

function cagr(first: number | null | undefined, last: number | null | undefined, years: number | null): number | null {
  if (!finite(first) || !finite(last) || first <= 0 || last <= 0 || !finite(years) || years <= 0) {
    return null;
  }
  return (last / first) ** (1 / years) - 1;
}

function periodFcfPerShare(period: FundamentalPeriod): number | null {
  return ratio(period.freeCashFlow, period.sharesOutstanding);
}

function periodOperatingMargin(period: FundamentalPeriod): number | null {
  return ratio(period.operatingIncome, period.revenue);
}

function analyzeHistoricalTrends(snapshot: FundamentalSnapshot): FundamentalTrendAnalysis {
  const periods = historicalPeriods(snapshot);
  const first = periods[0];
  const last = periods.at(-1);
  if (!first || !last || first === last) {
    return {
      periodsAnalyzed: periods.length,
      yearsCovered: null,
      revenueCagr: null,
      epsCagr: null,
      freeCashFlowPerShareCagr: null,
      sharesOutstandingCagr: null,
      operatingMarginChange: null,
    };
  }

  const years = yearsBetween(first, last);
  const firstMargin = periodOperatingMargin(first);
  const lastMargin = periodOperatingMargin(last);
  return {
    periodsAnalyzed: periods.length,
    yearsCovered: round(years, 2),
    revenueCagr: round(cagr(first.revenue, last.revenue, years), 6),
    epsCagr: round(cagr(first.eps, last.eps, years), 6),
    freeCashFlowPerShareCagr: round(
      cagr(periodFcfPerShare(first), periodFcfPerShare(last), years),
      6,
    ),
    sharesOutstandingCagr: round(
      cagr(first.sharesOutstanding, last.sharesOutstanding, years),
      6,
    ),
    operatingMarginChange:
      finite(firstMargin) && finite(lastMargin) ? round(lastMargin - firstMargin, 6) : null,
  };
}

export function analyzeFundamentals(snapshot: FundamentalSnapshot): FundamentalAnalysis {
  const freeCashFlowMargin = ratio(snapshot.freeCashFlowTtm, snapshot.revenueTtm);
  const cashConversion = ratio(snapshot.freeCashFlowTtm, snapshot.netIncomeTtm);
  const netDebt = finite(snapshot.netDebt)
    ? snapshot.netDebt
    : finite(snapshot.totalDebt) && finite(snapshot.cash)
      ? snapshot.totalDebt - snapshot.cash
      : null;
  const netDebtToEbitda = ratio(netDebt, snapshot.ebitdaTtm);
  const netDebtToFcf = ratio(netDebt, snapshot.freeCashFlowTtm);
  const freeCashFlowPerShare = ratio(snapshot.freeCashFlowTtm, snapshot.sharesOutstanding);
  const trends = analyzeHistoricalTrends(snapshot);

  const growth = weightedAverage([
    [scoreLinear(finite(snapshot.revenueGrowthYoy) ? snapshot.revenueGrowthYoy : null, -0.08, 0.18), 0.35],
    [scoreLinear(trends.revenueCagr, -0.04, 0.16), 0.25],
    [scoreLinear(trends.epsCagr, -0.05, 0.2), 0.2],
    [scoreLinear(trends.freeCashFlowPerShareCagr, -0.05, 0.2), 0.2],
  ]);

  const profitability = weightedAverage([
    [scoreLinear(finite(snapshot.operatingMarginTtm) ? snapshot.operatingMarginTtm : null, 0.02, 0.25), 0.3],
    [scoreLinear(finite(snapshot.profitMarginTtm) ? snapshot.profitMarginTtm : null, 0, 0.2), 0.2],
    [scoreLinear(finite(snapshot.returnOnEquity) ? snapshot.returnOnEquity : null, 0.05, 0.25), 0.2],
    [scoreLinear(finite(snapshot.returnOnInvestedCapital) ? snapshot.returnOnInvestedCapital : null, 0.04, 0.2), 0.3],
  ]);

  const cashFlow = weightedAverage([
    [scoreLinear(freeCashFlowMargin, 0, 0.18), 0.45],
    [scoreLinear(cashConversion, 0.5, 1.2), 0.4],
    [inverseScore(ratio(Math.abs(snapshot.capexTtm ?? Number.NaN), snapshot.operatingCashFlowTtm), 0.15, 0.75), 0.15],
  ]);

  const balanceSheet = weightedAverage([
    [inverseScore(netDebtToEbitda, 0.5, 4), 0.65],
    [inverseScore(netDebtToFcf, 1, 7), 0.35],
  ]);

  const dilutionRate = finite(trends.sharesOutstandingCagr)
    ? trends.sharesOutstandingCagr
    : finite(snapshot.sharesOutstandingGrowthYoy)
      ? snapshot.sharesOutstandingGrowthYoy
      : null;
  const capitalAllocation = weightedAverage([
    [inverseScore(dilutionRate, 0, 0.08), 0.45],
    [snapshot.payoutRatio === null || snapshot.payoutRatio === undefined
      ? null
      : snapshot.payoutRatio <= 0.75
        ? 8
        : snapshot.payoutRatio <= 1
          ? 5
          : 2, 0.25],
    [scoreLinear(finite(snapshot.returnOnInvestedCapital) ? snapshot.returnOnInvestedCapital : null, 0.04, 0.2), 0.3],
  ]);

  const scoreParts: ReadonlyArray<readonly [number | null, number]> = [
    [growth, 0.18],
    [profitability, 0.27],
    [cashFlow, 0.25],
    [balanceSheet, 0.18],
    [capitalAllocation, 0.12],
  ];
  const overall = weightedAverage(scoreParts);
  const coverage = knownCoverage(scoreParts.map(([value]) => value));

  const strengths: string[] = [];
  const concerns: string[] = [];
  const unknowns: string[] = [];

  if (finite(snapshot.revenueGrowthYoy) && snapshot.revenueGrowthYoy >= 0.08) {
    strengths.push("Omsättningen växer i en tydlig takt jämfört med föregående år.");
  }
  if (finite(trends.revenueCagr) && trends.revenueCagr >= 0.06) {
    strengths.push("Omsättningen visar uthållig flerårig tillväxt.");
  }
  if (finite(trends.epsCagr) && trends.epsCagr >= 0.08) {
    strengths.push("Vinst per aktie har vuxit tydligt över den analyserade flerårsperioden.");
  }
  if (finite(trends.freeCashFlowPerShareCagr) && trends.freeCashFlowPerShareCagr >= 0.08) {
    strengths.push("Fritt kassaflöde per aktie har vuxit tydligt över den analyserade flerårsperioden.");
  }
  if (finite(snapshot.operatingMarginTtm) && snapshot.operatingMarginTtm >= 0.15) {
    strengths.push("Rörelsemarginalen är stark på nuvarande nivå.");
  }
  if (finite(trends.operatingMarginChange) && trends.operatingMarginChange >= 0.02) {
    strengths.push("Rörelsemarginalen har förbättrats tydligt över flerårsperioden.");
  }
  if (finite(freeCashFlowMargin) && freeCashFlowMargin >= 0.1) {
    strengths.push("Fritt kassaflöde är starkt relativt omsättningen.");
  }
  if (finite(cashConversion) && cashConversion >= 0.85) {
    strengths.push("Redovisad vinst har god täckning av fritt kassaflöde.");
  }
  if (finite(snapshot.returnOnInvestedCapital) && snapshot.returnOnInvestedCapital >= 0.12) {
    strengths.push("Avkastningen på investerat kapital är hög.");
  }

  if (finite(snapshot.revenueGrowthYoy) && snapshot.revenueGrowthYoy < 0) {
    concerns.push("Omsättningen minskar jämfört med föregående år.");
  }
  if (
    finite(trends.revenueCagr) &&
    trends.revenueCagr >= 0.05 &&
    finite(trends.epsCagr) &&
    trends.epsCagr < 0
  ) {
    concerns.push("Omsättningen har vuxit över flera år utan att tillväxten nått vinst per aktie.");
  }
  if (finite(trends.freeCashFlowPerShareCagr) && trends.freeCashFlowPerShareCagr < -0.03) {
    concerns.push("Fritt kassaflöde per aktie har försämrats över den analyserade flerårsperioden.");
  }
  if (finite(trends.operatingMarginChange) && trends.operatingMarginChange <= -0.02) {
    concerns.push("Rörelsemarginalen har försvagats tydligt över flerårsperioden.");
  }
  if (finite(cashConversion) && cashConversion < 0.6) {
    concerns.push("Fritt kassaflöde släpar tydligt efter den redovisade vinsten.");
  }
  if (finite(netDebtToEbitda) && netDebtToEbitda > 3) {
    concerns.push("Nettoskulden är hög relativt EBITDA och ökar finansieringsrisken.");
  }
  if (finite(dilutionRate) && dilutionRate > 0.04) {
    concerns.push("Aktieantalet växer snabbt och utspädningen behöver följas noga.");
  }
  if (finite(snapshot.payoutRatio) && snapshot.payoutRatio > 1) {
    concerns.push("Utdelningen överstiger redovisad vinst och kan vara svår att upprätthålla.");
  }

  const required: Array<[string, number | null | undefined]> = [
    ["omsättning", snapshot.revenueTtm],
    ["omsättningstillväxt", snapshot.revenueGrowthYoy],
    ["rörelsemarginal", snapshot.operatingMarginTtm],
    ["fritt kassaflöde", snapshot.freeCashFlowTtm],
    ["nettoskuld", netDebt],
    ["aktieantal", snapshot.sharesOutstanding],
    ["EPS", snapshot.epsTtm],
  ];
  for (const [label, value] of required) {
    if (!finite(value)) unknowns.push(`${label} saknas i det verifierade underlaget`);
  }
  if (trends.periodsAnalyzed < 2) {
    unknowns.push("flerårig fundamental trend saknar minst två jämförbara årsperioder");
  }

  return {
    asOf: snapshot.asOf,
    currency: snapshot.currency,
    scorecard: {
      growth: round(growth, 2),
      profitability: round(profitability, 2),
      cashFlow: round(cashFlow, 2),
      balanceSheet: round(balanceSheet, 2),
      capitalAllocation: round(capitalAllocation, 2),
      overall: round(overall, 2),
      coverage: round(coverage, 4) ?? 0,
    },
    metrics: {
      revenueGrowthYoy: round(finite(snapshot.revenueGrowthYoy) ? snapshot.revenueGrowthYoy : null, 6),
      operatingMarginTtm: round(finite(snapshot.operatingMarginTtm) ? snapshot.operatingMarginTtm : null, 6),
      profitMarginTtm: round(finite(snapshot.profitMarginTtm) ? snapshot.profitMarginTtm : null, 6),
      freeCashFlowMargin: round(freeCashFlowMargin, 6),
      cashConversion: round(cashConversion, 6),
      netDebtToEbitda: round(netDebtToEbitda, 4),
      netDebtToFcf: round(netDebtToFcf, 4),
      returnOnEquity: round(finite(snapshot.returnOnEquity) ? snapshot.returnOnEquity : null, 6),
      returnOnAssets: round(finite(snapshot.returnOnAssets) ? snapshot.returnOnAssets : null, 6),
      returnOnInvestedCapital: round(
        finite(snapshot.returnOnInvestedCapital) ? snapshot.returnOnInvestedCapital : null,
        6,
      ),
      sharesOutstandingGrowthYoy: round(
        finite(snapshot.sharesOutstandingGrowthYoy) ? snapshot.sharesOutstandingGrowthYoy : null,
        6,
      ),
      payoutRatio: round(finite(snapshot.payoutRatio) ? snapshot.payoutRatio : null, 6),
      freeCashFlowPerShare: round(freeCashFlowPerShare, 6),
      epsTtm: round(finite(snapshot.epsTtm) ? snapshot.epsTtm : null, 6),
    },
    trends,
    strengths,
    concerns,
    unknowns,
  };
}
