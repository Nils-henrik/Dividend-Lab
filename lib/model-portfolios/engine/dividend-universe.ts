import type { NordicSeedInstrument } from "./nordic-universe";

export type DividendInstrumentKind =
  | "preferred_share"
  | "d_share"
  | "dividend_etf"
  | "ordinary_dividend";

export type DividendInstrumentProfile = {
  kind: DividendInstrumentKind;
  priorityScore: number;
  label: string;
};

type DividendPriorityInstrument = {
  symbol: string;
  exchange: "ST";
  name: string;
  kind: Exclude<DividendInstrumentKind, "ordinary_dividend">;
  priorityScore: number;
};

/**
 * Explicit Nordic income instruments that ordinary mover/large-cap discovery
 * easily misses. Symbols use DivLab's canonical base-symbol form; Yahoo gets the
 * .ST suffix through the existing Nordic symbol adapter.
 *
 * Preference and D shares intentionally get the highest discovery/ranking
 * priority, but priority is never an automatic BUY signal. Distribution status,
 * issuer solvency, liquidity, valuation and concentration still have to pass.
 */
export const DIVIDEND_PRIORITY_INSTRUMENTS: readonly DividendPriorityInstrument[] = [
  { symbol: "SAGA-D", exchange: "ST", name: "Sagax D", kind: "d_share", priorityScore: 1 },
  { symbol: "CORE-D", exchange: "ST", name: "Corem Property Group D", kind: "d_share", priorityScore: 1 },
  { symbol: "FPAR-D", exchange: "ST", name: "Fastpartner D", kind: "d_share", priorityScore: 1 },
  { symbol: "SBB-D", exchange: "ST", name: "Samhällsbyggnadsbolaget i Norden D", kind: "d_share", priorityScore: 1 },
  { symbol: "NP3-PREF", exchange: "ST", name: "NP3 Fastigheter Pref", kind: "preferred_share", priorityScore: 1 },
  { symbol: "VOLO-PREF", exchange: "ST", name: "Volati Pref", kind: "preferred_share", priorityScore: 1 },
  { symbol: "EMIL-PREF", exchange: "ST", name: "Emilshus Pref", kind: "preferred_share", priorityScore: 1 },
  { symbol: "HEIM-PREF", exchange: "ST", name: "Heimstaden Pref", kind: "preferred_share", priorityScore: 1 },
  { symbol: "XACTHDIV", exchange: "ST", name: "XACT Norden Högutdelande (UCITS ETF)", kind: "dividend_etf", priorityScore: 0.84 },
  { symbol: "MONTDIV", exchange: "ST", name: "Montrose Global Monthly Dividend MSCI World UCITS ETF", kind: "dividend_etf", priorityScore: 0.84 },
] as const;

export const NORDIC_DIVIDEND_PRIORITY_SEEDS: readonly NordicSeedInstrument[] =
  DIVIDEND_PRIORITY_INSTRUMENTS.map((item) => ({
    symbol: item.symbol,
    exchange: item.exchange,
    country: "SE" as const,
    name: item.name,
    // Discovery only needs a supported segment label. Runtime market cap and
    // liquidity remain the real eligibility checks.
    segment: "mid_cap" as const,
  }));

function instrumentKey(symbol: string, exchange: string): string {
  const cleanSymbol = symbol.trim().toUpperCase().replace(/\.ST$/, "");
  const cleanExchange = exchange.trim().toUpperCase();
  return `${cleanSymbol}.${cleanExchange}`;
}

const PRIORITY_BY_KEY = new Map(
  DIVIDEND_PRIORITY_INSTRUMENTS.map((item) => [
    instrumentKey(item.symbol, item.exchange),
    item,
  ] as const),
);

export function classifyDividendInstrument(input: {
  symbol: string;
  exchange: string;
}): DividendInstrumentProfile | null {
  const explicit = PRIORITY_BY_KEY.get(instrumentKey(input.symbol, input.exchange));
  if (explicit) {
    return {
      kind: explicit.kind,
      priorityScore: explicit.priorityScore,
      label:
        explicit.kind === "d_share"
          ? "D-aktie"
          : explicit.kind === "preferred_share"
            ? "preferensaktie"
            : "utdelande ETF",
    };
  }

  const symbol = input.symbol.trim().toUpperCase().replace(/\.(ST|CO|HE|OL)$/, "");
  if (/(?:^|-)PREF$/.test(symbol)) {
    return { kind: "preferred_share", priorityScore: 1, label: "preferensaktie" };
  }
  if (/-D$/.test(symbol)) {
    return { kind: "d_share", priorityScore: 1, label: "D-aktie" };
  }
  return null;
}

/**
 * Dividend mandate hard gate. Ordinary shares need verified dividend
 * fundamentals. Preference/D shares and explicitly approved distributing ETFs
 * may enter research even when generic equity fundamentals are incomplete, so
 * the AI can verify the current distribution before any BUY decision.
 */
export function isDividendResearchCandidate(input: {
  symbol: string;
  exchange: string;
  dividendQualityScore?: number;
}): boolean {
  if (classifyDividendInstrument(input)) return true;
  return Number.isFinite(input.dividendQualityScore);
}

export function dividendInstrumentPriorityScore(input: {
  symbol: string;
  exchange: string;
  dividendQualityScore?: number;
}): number {
  const special = classifyDividendInstrument(input);
  if (special) return special.priorityScore;
  return Number.isFinite(input.dividendQualityScore) ? 0.55 : 0;
}
