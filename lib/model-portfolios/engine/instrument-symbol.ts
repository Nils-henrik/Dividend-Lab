/**
 * Canonical listed-instrument symbol helpers.
 *
 * Internal base symbol stays exchange-free (e.g. DNB + OL).
 * Yahoo transport and investor-facing labels use a single Nordic suffix
 * (DNB.OL) and must never double-append (.OL.OL / .ST.ST).
 */

const NORDIC_SUFFIX_RE = /\.(ST|CO|HE|OL)$/i;
const NORDIC_SUFFIX_CAPTURE_RE = /^(.*)\.(ST|CO|HE|OL)$/i;

export type NordicYahooSuffix = "ST" | "CO" | "HE" | "OL";

export type CanonicalInstrumentSymbol = {
  /** Exchange-free base ticker used in storage/keys when possible. */
  baseSymbol: string;
  /** Normalized exchange code: ST|CO|HE|OL|US or passthrough uppercased. */
  exchange: string;
  /** Yahoo Finance transport symbol (DNB.OL, MSFT). */
  yahooSymbol: string;
  /** Investor-facing label (DNB.OL, MSFT). Never double-suffixed. */
  investorLabel: string;
};

function normalizeNordicExchangeCode(exchange: string): NordicYahooSuffix | null {
  const value = exchange.trim().toUpperCase();
  if (["ST", "STO", "XSTO", "STOCKHOLM"].includes(value)) return "ST";
  if (["CO", "CPH", "XCSE", "COPENHAGEN"].includes(value)) return "CO";
  if (["HE", "HEL", "XHEL", "HELSINKI"].includes(value)) return "HE";
  if (["OL", "OSL", "XOSL", "OSLO"].includes(value)) return "OL";
  return null;
}

function normalizeUsExchange(exchange: string): boolean {
  const value = exchange.trim().toUpperCase();
  return [
    "US",
    "NASDAQ",
    "NASDAQGS",
    "NASDAQGM",
    "NASDAQCM",
    "NYSE",
    "NYQ",
    "NMS",
    "NGM",
    "NCM",
  ].includes(value);
}

/**
 * Strip a trailing Nordic Yahoo suffix if present. Leaves US tickers untouched.
 */
export function stripNordicYahooSuffix(symbol: string): string {
  return symbol.trim().replace(NORDIC_SUFFIX_RE, "");
}

/**
 * True when the symbol already ends with .ST/.CO/.HE/.OL.
 */
export function hasNordicYahooSuffix(symbol: string): boolean {
  return NORDIC_SUFFIX_RE.test(symbol.trim());
}

/**
 * Build Yahoo transport symbol without double-appending exchange suffixes.
 */
export function toYahooTransportSymbol(symbol: string, exchange: string): string {
  return canonicalizeInstrumentSymbol(symbol, exchange).yahooSymbol;
}

/**
 * Investor-facing label: exactly one Nordic suffix when listed in Norden,
 * bare ticker for US. Never emits DNB.OL.OL.
 */
export function toInvestorFacingSymbol(symbol: string, exchange: string): string {
  return canonicalizeInstrumentSymbol(symbol, exchange).investorLabel;
}

/**
 * Canonicalize any mix of base symbol / already-suffixed symbol + exchange.
 */
export function canonicalizeInstrumentSymbol(
  symbol: string,
  exchange: string,
): CanonicalInstrumentSymbol {
  const rawSymbol = symbol.trim();
  if (!rawSymbol) throw new Error("invalid_instrument_symbol");

  let baseSymbol = rawSymbol.toUpperCase();
  let suffixFromSymbol: NordicYahooSuffix | null = null;
  // Peel repeated Nordic suffixes so DNB.OL.OL collapses to DNB + OL.
  while (true) {
    const match = baseSymbol.match(NORDIC_SUFFIX_CAPTURE_RE);
    if (!match) break;
    baseSymbol = match[1]!;
    suffixFromSymbol = match[2] as NordicYahooSuffix;
  }

  if (suffixFromSymbol) {
    const fromExchange = normalizeNordicExchangeCode(exchange);
    const resolvedExchange = fromExchange ?? suffixFromSymbol;
    const yahooSymbol = `${baseSymbol}.${resolvedExchange}`;
    return {
      baseSymbol,
      exchange: resolvedExchange,
      yahooSymbol,
      investorLabel: yahooSymbol,
    };
  }

  const upper = baseSymbol;
  const nordic = normalizeNordicExchangeCode(exchange);
  if (nordic) {
    const yahooSymbol = `${upper}.${nordic}`;
    return {
      baseSymbol: upper,
      exchange: nordic,
      yahooSymbol,
      investorLabel: yahooSymbol,
    };
  }

  if (normalizeUsExchange(exchange)) {
    return {
      baseSymbol: upper,
      exchange: "US",
      yahooSymbol: upper,
      investorLabel: `${upper}.US`,
    };
  }

  const normalizedExchange = exchange.trim().toUpperCase() || "US";
  return {
    baseSymbol: upper,
    exchange: normalizedExchange,
    yahooSymbol: upper,
    investorLabel: `${upper}.${normalizedExchange}`,
  };
}
