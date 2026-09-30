import { MARKET_DATA_LABEL } from "@/lib/companies/source-labels";

export type ValuationSnapshot = {
  trailingPe: number | null;
  forwardPe: number | null;
  priceToSales: number | null;
  priceToBook: number | null;
  enterpriseToEbitda: number | null;
  enterpriseValue: number | null;
  trailingEps: number | null;
  beta: number | null;
  sharesOutstanding: number | null;
  payoutRatio: number | null;
  dividendYield: number | null;
};

export type DisplayMetric = {
  id: string;
  label: string;
  definition: string;
  value: string;
  source: string;
};

export const MISSING_METRIC = "—";

export const CURRENCY_MISMATCH_YIELD_REASON =
  "Direktavkastning visas inte eftersom utdelningens valuta och kursens valuta skiljer sig.";

const MARKET_DATA_SOURCE = MARKET_DATA_LABEL;

export function formatSvNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("sv-SE", options).format(value);
}

export function formatRatio(value: number | null, digits = 1) {
  if (value === null || !Number.isFinite(value)) return MISSING_METRIC;
  return formatSvNumber(value, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatMoney(value: number | null, currency: string | null, digits = 2) {
  if (value === null || !Number.isFinite(value) || !currency) return MISSING_METRIC;
  return `${formatSvNumber(value, { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${currency}`;
}

export function formatCompactMoney(value: number | null, currency: string | null) {
  if (value === null || !Number.isFinite(value) || !currency) return MISSING_METRIC;
  const absolute = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (absolute >= 1_000_000_000) {
    return `${sign}${formatSvNumber(absolute / 1_000_000_000, { maximumFractionDigits: 1 })} md ${currency}`;
  }
  if (absolute >= 1_000_000) {
    return `${sign}${formatSvNumber(absolute / 1_000_000, { maximumFractionDigits: 1 })} mn ${currency}`;
  }
  return formatMoney(value, currency, 0);
}

/** Compact annual statement amount. Currency is appended only when it is already verified. */
export function formatStatementAmount(value: number | null, currency: string | null) {
  if (value === null || !Number.isFinite(value)) return MISSING_METRIC;
  if (value === 0) return currency ? `0 ${currency}` : "0";
  const absolute = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  let scaled = absolute;
  let unit = "";
  if (absolute >= 1_000_000_000) {
    scaled = absolute / 1_000_000_000;
    unit = "md";
  } else if (absolute >= 1_000_000) {
    scaled = absolute / 1_000_000;
    unit = "mn";
  }
  const digits = unit === "" ? 0 : scaled >= 100 ? 1 : 2;
  const body = `${sign}${formatSvNumber(scaled, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  const suffix = [unit, currency].filter(Boolean).join(" ");
  return suffix ? `${body} ${suffix}` : body;
}

export function formatCount(value: number | null) {
  if (value === null || !Number.isFinite(value)) return MISSING_METRIC;
  return formatSvNumber(value, { maximumFractionDigits: 0 });
}

export function formatPercentFromFraction(value: number | null) {
  if (value === null || !Number.isFinite(value)) return MISSING_METRIC;
  return `${formatSvNumber(value * 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

export function formatPercentPoints(value: number | null) {
  if (value === null || !Number.isFinite(value)) return MISSING_METRIC;
  return `${formatSvNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

/** Yahoo payoutRatio is shown only when it is already a fraction. Percent-shaped values are withheld. */
export function formatPayoutRatio(value: number | null) {
  if (value === null || !Number.isFinite(value) || value < 0 || value > 1.5) return MISSING_METRIC;
  return formatPercentFromFraction(value);
}

export function buildValuationMetrics(input: {
  currency: string | null;
  marketCap: number | null;
  volume: number | null;
  week52Low: number | null;
  week52High: number | null;
  valuation: ValuationSnapshot;
  officialYieldPercent: number | null;
  officialYieldBlocked: boolean;
}): DisplayMetric[] {
  const { valuation } = input;
  const range = input.week52Low === null || input.week52High === null
    ? MISSING_METRIC
    : `${formatSvNumber(input.week52Low, { maximumFractionDigits: 2 })} – ${formatSvNumber(input.week52High, { maximumFractionDigits: 2 })}${input.currency ? ` ${input.currency}` : ""}`;
  const officialDefinition = input.officialYieldBlocked
    ? CURRENCY_MISMATCH_YIELD_REASON
    : "Officiell utdelning per aktie delat med fördröjd kurs. Beräknas bara när båda värdena finns och valutorna är samma.";

  return [
    {
      id: "market_cap",
      label: "Börsvärde",
      definition: "Bolagets börsvärde i kursens valuta enligt fördröjd marknadsdata. DivLab räknar inte om till en annan valuta.",
      value: formatCompactMoney(input.marketCap, input.currency),
      source: MARKET_DATA_SOURCE,
    },
    {
      id: "trailing_pe",
      label: "P/E",
      definition: "Pris delat med rapporterad vinst per aktie (trailing P/E) enligt fördröjd marknadsdata.",
      value: formatRatio(valuation.trailingPe, 1),
      source: MARKET_DATA_SOURCE,
    },
    {
      id: "forward_pe",
      label: "Forward P/E",
      definition: "Pris delat med förväntad vinst per aktie enligt fördröjd marknadsdata. DivLab gör ingen egen prognos.",
      value: formatRatio(valuation.forwardPe, 1),
      source: MARKET_DATA_SOURCE,
    },
    {
      id: "ps",
      label: "P/S",
      definition: "Pris delat med omsättning de senaste tolv månaderna enligt fördröjd marknadsdata.",
      value: formatRatio(valuation.priceToSales, 2),
      source: MARKET_DATA_SOURCE,
    },
    {
      id: "pb",
      label: "P/B",
      definition: "Pris delat med bokfört eget kapital enligt fördröjd marknadsdata.",
      value: formatRatio(valuation.priceToBook, 2),
      source: MARKET_DATA_SOURCE,
    },
    {
      id: "ev_ebitda",
      label: "EV/EBITDA",
      definition: "Enterprise value delat med EBITDA enligt fördröjd marknadsdata.",
      value: formatRatio(valuation.enterpriseToEbitda, 1),
      source: MARKET_DATA_SOURCE,
    },
    {
      id: "enterprise_value",
      label: "Enterprise value",
      definition: "Enterprise value i kursens valuta enligt fördröjd marknadsdata.",
      value: formatCompactMoney(valuation.enterpriseValue, input.currency),
      source: MARKET_DATA_SOURCE,
    },
    {
      id: "yahoo_yield",
      label: "Direktavkastning",
      definition: "Direktavkastning enligt fördröjd marknadsdata, som andel av kursen. Inte omräknad mellan valutor.",
      value: formatPercentFromFraction(valuation.dividendYield),
      source: MARKET_DATA_SOURCE,
    },
    {
      id: "official_yield",
      label: "Direktavkastning (officiell)",
      definition: officialDefinition,
      value: formatPercentPoints(input.officialYieldPercent),
      source: "Officiell utdelning och marknadsdata",
    },
    {
      id: "eps",
      label: "EPS",
      definition: "Rapporterad vinst per aktie (trailing) enligt fördröjd marknadsdata, i kursens valuta.",
      value: formatMoney(valuation.trailingEps, input.currency),
      source: MARKET_DATA_SOURCE,
    },
    {
      id: "beta",
      label: "Beta",
      definition: "Beta enligt fördröjd marknadsdata.",
      value: formatRatio(valuation.beta, 2),
      source: MARKET_DATA_SOURCE,
    },
    {
      id: "week52",
      label: "52 veckor",
      definition: "Lägsta och högsta dagsnotering de senaste tolv månaderna, beräknat från fördröjd kurshistorik i kursens valuta.",
      value: range,
      source: MARKET_DATA_SOURCE,
    },
    {
      id: "volume",
      label: "Volym",
      definition: "Senast rapporterad omsatt volym enligt fördröjd marknadsdata.",
      value: formatCount(input.volume),
      source: MARKET_DATA_SOURCE,
    },
    {
      id: "shares",
      label: "Utestående aktier",
      definition: "Antal utestående aktier enligt fördröjd marknadsdata.",
      value: formatCount(valuation.sharesOutstanding),
      source: MARKET_DATA_SOURCE,
    },
  ];
}
