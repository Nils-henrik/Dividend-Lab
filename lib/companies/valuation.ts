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

const YAHOO = "Yahoo Finance";

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
      definition: "Bolagets börsvärde i kursens valuta enligt Yahoo Finance. DivLab räknar inte om till en annan valuta.",
      value: formatCompactMoney(input.marketCap, input.currency),
      source: YAHOO,
    },
    {
      id: "trailing_pe",
      label: "P/E",
      definition: "Pris delat med rapporterad vinst per aktie (trailing P/E) enligt Yahoo Finance.",
      value: formatRatio(valuation.trailingPe, 1),
      source: YAHOO,
    },
    {
      id: "forward_pe",
      label: "Forward P/E",
      definition: "Pris delat med förväntad vinst per aktie enligt Yahoo Finance. DivLab gör ingen egen prognos.",
      value: formatRatio(valuation.forwardPe, 1),
      source: YAHOO,
    },
    {
      id: "ps",
      label: "P/S",
      definition: "Pris delat med omsättning de senaste tolv månaderna enligt Yahoo Finance.",
      value: formatRatio(valuation.priceToSales, 2),
      source: YAHOO,
    },
    {
      id: "pb",
      label: "P/B",
      definition: "Pris delat med bokfört eget kapital enligt Yahoo Finance.",
      value: formatRatio(valuation.priceToBook, 2),
      source: YAHOO,
    },
    {
      id: "ev_ebitda",
      label: "EV/EBITDA",
      definition: "Enterprise value delat med EBITDA enligt Yahoo Finance.",
      value: formatRatio(valuation.enterpriseToEbitda, 1),
      source: YAHOO,
    },
    {
      id: "enterprise_value",
      label: "Enterprise value",
      definition: "Enterprise value i kursens valuta enligt Yahoo Finance.",
      value: formatCompactMoney(valuation.enterpriseValue, input.currency),
      source: YAHOO,
    },
    {
      id: "yahoo_yield",
      label: "Direktavkastning",
      definition: "Direktavkastning enligt Yahoo Finance, som andel av kursen. Inte omräknad mellan valutor.",
      value: formatPercentFromFraction(valuation.dividendYield),
      source: YAHOO,
    },
    {
      id: "official_yield",
      label: "Direktavkastning (officiell)",
      definition: officialDefinition,
      value: formatPercentPoints(input.officialYieldPercent),
      source: "Officiell utdelning och Yahoo Finance",
    },
    {
      id: "eps",
      label: "EPS",
      definition: "Rapporterad vinst per aktie (trailing) enligt Yahoo Finance, i kursens valuta.",
      value: formatMoney(valuation.trailingEps, input.currency),
      source: YAHOO,
    },
    {
      id: "beta",
      label: "Beta",
      definition: "Beta enligt Yahoo Finance.",
      value: formatRatio(valuation.beta, 2),
      source: YAHOO,
    },
    {
      id: "week52",
      label: "52 veckor",
      definition: "Lägsta och högsta dagsnotering de senaste tolv månaderna, beräknat från Yahoo-historik i kursens valuta.",
      value: range,
      source: YAHOO,
    },
    {
      id: "volume",
      label: "Volym",
      definition: "Senast rapporterad omsatt volym enligt Yahoo Finance.",
      value: formatCount(input.volume),
      source: YAHOO,
    },
    {
      id: "shares",
      label: "Utestående aktier",
      definition: "Antal utestående aktier enligt Yahoo Finance.",
      value: formatCount(valuation.sharesOutstanding),
      source: YAHOO,
    },
  ];
}
