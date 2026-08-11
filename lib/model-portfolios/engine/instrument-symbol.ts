/**
 * Canonical listed-instrument symbol helpers.
 *
 * Internal base symbol stays exchange-free (e.g. DNB + OL, JPM + US).
 * Yahoo transport and investor-facing labels use exactly one market suffix
 * where DivLab exposes one and must never double-append (.OL.OL / .US.US).
 */

const NORDIC_SUFFIX_RE = /\.(ST|CO|HE|OL)$/i;
const NORDIC_SUFFIX_CAPTURE_RE = /^(.*)\.(ST|CO|HE|OL)$/i;
const US_SUFFIX_CAPTURE_RE = /^(.*)\.US$/i;

export type NordicYahooSuffix = "ST" | "CO" | "HE" | "OL";

export type CanonicalInstrumentSymbol = {
  /** Exchange-free base ticker used in storage/keys when possible. */
  baseSymbol: string;
  /** Normalized exchange code: ST|CO|HE|OL|US or passthrough uppercased. */
  exchange: string;
  /** Yahoo Finance transport symbol (DNB.OL, MSFT). */
  yahooSymbol: string;
  /** Investor-facing label (DNB.OL, MSFT.US). Never double-suffixed. */
  investorLabel: string;
};

function normalizeNordicExchangeCode(exchange: string): NordicYahooSuffix | null {
  const value = exchange.trim().toUpperCase();
  if (["ST", "STO", "XSTO", "STOCKHOLM", "NASDAQ STOCKHOLM"].includes(value)) return "ST";
  if (["CO", "CPH", "XCSE", "COPENHAGEN", "NASDAQ COPENHAGEN"].includes(value)) return "CO";
  if (["HE", "HEL", "XHEL", "HELSINKI", "NASDAQ HELSINKI"].includes(value)) return "HE";
  if (["OL", "OSL", "XOSL", "OSLO", "OSLO BØRS", "OSLO BORS", "EURONEXT OSLO", "OSLO STOCK EXCHANGE"].includes(value)) return "OL";
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
    "NEW YORK STOCK EXCHANGE",
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
 * exactly one .US suffix for US instruments. Never emits DNB.OL.OL/JPM.US.US.
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

  const nordic = normalizeNordicExchangeCode(exchange);
  if (nordic) {
    const yahooSymbol = `${baseSymbol}.${nordic}`;
    return {
      baseSymbol,
      exchange: nordic,
      yahooSymbol,
      investorLabel: yahooSymbol,
    };
  }

  if (normalizeUsExchange(exchange)) {
    // The model may return investor-facing JPM.US even though Yahoo transport
    // expects JPM. Collapse repeated .US suffixes before storage/quote lookup.
    while (true) {
      const match = baseSymbol.match(US_SUFFIX_CAPTURE_RE);
      if (!match) break;
      baseSymbol = match[1]!;
    }
    return {
      baseSymbol,
      exchange: "US",
      yahooSymbol: baseSymbol,
      investorLabel: `${baseSymbol}.US`,
    };
  }

  const normalizedExchange = exchange.trim().toUpperCase() || "US";
  return {
    baseSymbol,
    exchange: normalizedExchange,
    yahooSymbol: baseSymbol,
    investorLabel: `${baseSymbol}.${normalizedExchange}`,
  };
}
