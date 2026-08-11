/**
 * Maintained Nordic large/mid-cap seed universe for the 09:20 discovery funnel.
 * Cheap Yahoo quote screening ranks these names; deep research runs only on a
 * bounded shortlist plus all current holdings.
 */

export type NordicCountry = "SE" | "NO" | "FI" | "DK";
export type NordicExchange = "ST" | "CO" | "HE" | "OL";
export type NordicCapSegment = "large_cap" | "mid_cap";

export type NordicSeedInstrument = {
  symbol: string;
  exchange: NordicExchange;
  country: NordicCountry;
  name: string;
  segment: NordicCapSegment;
};

/**
 * Explicit network/cost bounds for the Nordic morning pass.
 * Broad discovery may screen many names cheaply; deep history/TA/fundamentals
 * and optional event enrichment stay tightly capped.
 */
export const NORDIC_RESEARCH_BOUNDS = {
  broadDiscoveryCandidateCount: 96,
  perCountryMinShortlist: 2,
  perCountryMaxShortlist: 5,
  deepHistoryTechnicalCount: 14,
  fundamentalsTargetCount: 8,
  eventPrimarySourceTargetCount: 2,
  quoteBatchSize: 40,
  cacheTtlMs: 2 * 60 * 60 * 1_000,
  /** Approx. SEK-equivalent floor for liquid mid-cap research eligibility. */
  minimumMarketCapSek: 8_000_000_000,
  minimumAverageDailyVolume: 50_000,
} as const;

const COUNTRY_BY_EXCHANGE: Record<NordicExchange, NordicCountry> = {
  ST: "SE",
  CO: "DK",
  HE: "FI",
  OL: "NO",
};

export function normalizeNordicExchange(exchange: string): NordicExchange | null {
  const value = exchange.trim().toUpperCase();
  if (["ST", "STO", "XSTO", "STOCKHOLM"].includes(value)) return "ST";
  if (["CO", "CPH", "XCSE", "COPENHAGEN"].includes(value)) return "CO";
  if (["HE", "HEL", "XHEL", "HELSINKI"].includes(value)) return "HE";
  if (["OL", "OSL", "XOSL", "OSLO"].includes(value)) return "OL";
  return null;
}

export function nordicCountryFromExchange(exchange: string): NordicCountry | null {
  const normalized = normalizeNordicExchange(exchange);
  return normalized ? COUNTRY_BY_EXCHANGE[normalized] : null;
}

export function isNordicExchange(exchange: string): boolean {
  return normalizeNordicExchange(exchange) !== null;
}

export function nordicYahooSuffix(exchange: NordicExchange): ".ST" | ".CO" | ".HE" | ".OL" {
  if (exchange === "ST") return ".ST";
  if (exchange === "CO") return ".CO";
  if (exchange === "HE") return ".HE";
  return ".OL";
}

export function toNordicYahooSymbol(symbol: string, exchange: string): string {
  const clean = symbol.trim().toUpperCase();
  if (!clean) throw new Error("invalid_nordic_symbol");

  let base = clean;
  let suffixFromSymbol: NordicExchange | null = null;
  while (true) {
    const match = base.match(/^(.*)\.(ST|CO|HE|OL)$/);
    if (!match) break;
    base = match[1]!;
    suffixFromSymbol = match[2] as NordicExchange;
  }

  const normalized = normalizeNordicExchange(exchange) ?? suffixFromSymbol;
  if (!normalized) throw new Error("invalid_nordic_exchange");
  return `${base}${nordicYahooSuffix(normalized)}`;
}

export function parseNordicYahooSymbol(yahooSymbol: string): {
  symbol: string;
  exchange: NordicExchange;
  country: NordicCountry;
} | null {
  const match = yahooSymbol.trim().toUpperCase().match(/^(.+)\.(ST|CO|HE|OL)$/);
  if (!match) return null;
  const exchange = match[2] as NordicExchange;
  return {
    symbol: match[1]!,
    exchange,
    country: COUNTRY_BY_EXCHANGE[exchange],
  };
}

/** Classify by SEK-equivalent market cap when available. Missing caps stay null. */
export function classifyNordicCapSegment(marketCapSek: number | null | undefined): NordicCapSegment | null {
  if (marketCapSek == null || !Number.isFinite(marketCapSek) || marketCapSek <= 0) return null;
  if (marketCapSek >= 80_000_000_000) return "large_cap";
  if (marketCapSek >= NORDIC_RESEARCH_BOUNDS.minimumMarketCapSek) return "mid_cap";
  return null;
}

/**
 * Liquid large/mid-cap seed set spanning Sweden, Norway, Finland and Denmark.
 * Not an exhaustive exchange dump — a practical, maintained research universe.
 */
export const NORDIC_SEED_UNIVERSE: readonly NordicSeedInstrument[] = [
  // Sweden — large cap
  { symbol: "INVE-B", exchange: "ST", country: "SE", name: "Investor AB ser. B", segment: "large_cap" },
  { symbol: "VOLV-B", exchange: "ST", country: "SE", name: "Volvo AB ser. B", segment: "large_cap" },
  { symbol: "ATCO-A", exchange: "ST", country: "SE", name: "Atlas Copco AB ser. A", segment: "large_cap" },
  { symbol: "SEB-A", exchange: "ST", country: "SE", name: "SEB AB ser. A", segment: "large_cap" },
  { symbol: "SHB-A", exchange: "ST", country: "SE", name: "Handelsbanken ser. A", segment: "large_cap" },
  { symbol: "SWED-A", exchange: "ST", country: "SE", name: "Swedbank AB ser. A", segment: "large_cap" },
  { symbol: "NDA-SE", exchange: "ST", country: "SE", name: "Nordea Bank Abp", segment: "large_cap" },
  { symbol: "ERIC-B", exchange: "ST", country: "SE", name: "Ericsson AB ser. B", segment: "large_cap" },
  { symbol: "HM-B", exchange: "ST", country: "SE", name: "H&M ser. B", segment: "large_cap" },
  { symbol: "ASSA-B", exchange: "ST", country: "SE", name: "ASSA ABLOY AB ser. B", segment: "large_cap" },
  { symbol: "HEXA-B", exchange: "ST", country: "SE", name: "Hexagon AB ser. B", segment: "large_cap" },
  { symbol: "SAND", exchange: "ST", country: "SE", name: "Sandvik AB", segment: "large_cap" },
  { symbol: "EVO", exchange: "ST", country: "SE", name: "Evolution AB", segment: "large_cap" },
  { symbol: "ALFA", exchange: "ST", country: "SE", name: "Alfa Laval AB", segment: "large_cap" },
  { symbol: "ESSITY-B", exchange: "ST", country: "SE", name: "Essity AB ser. B", segment: "large_cap" },
  { symbol: "TEL2-B", exchange: "ST", country: "SE", name: "Tele2 AB ser. B", segment: "large_cap" },
  { symbol: "TELIA", exchange: "ST", country: "SE", name: "Telia Company AB", segment: "large_cap" },
  { symbol: "SAAB-B", exchange: "ST", country: "SE", name: "Saab AB ser. B", segment: "large_cap" },
  { symbol: "SKF-B", exchange: "ST", country: "SE", name: "SKF AB ser. B", segment: "large_cap" },
  { symbol: "BOL", exchange: "ST", country: "SE", name: "Boliden AB", segment: "large_cap" },
  { symbol: "SCA-B", exchange: "ST", country: "SE", name: "SCA AB ser. B", segment: "large_cap" },
  { symbol: "NIBE-B", exchange: "ST", country: "SE", name: "NIBE Industrier AB ser. B", segment: "large_cap" },
  { symbol: "GETI-B", exchange: "ST", country: "SE", name: "Getinge AB ser. B", segment: "large_cap" },
  { symbol: "SSAB-B", exchange: "ST", country: "SE", name: "SSAB AB ser. B", segment: "large_cap" },
  { symbol: "AZN", exchange: "ST", country: "SE", name: "AstraZeneca PLC (SDR)", segment: "large_cap" },
  // Sweden — mid cap
  { symbol: "CAST", exchange: "ST", country: "SE", name: "Castellum AB", segment: "mid_cap" },
  { symbol: "BALD-B", exchange: "ST", country: "SE", name: "Balder AB ser. B", segment: "mid_cap" },
  { symbol: "FABG", exchange: "ST", country: "SE", name: "Fabege AB", segment: "mid_cap" },
  { symbol: "WALL-B", exchange: "ST", country: "SE", name: "Wallenstam AB ser. B", segment: "mid_cap" },
  { symbol: "INDT", exchange: "ST", country: "SE", name: "Indutrade AB", segment: "mid_cap" },
  { symbol: "LATO-B", exchange: "ST", country: "SE", name: "Latour AB ser. B", segment: "mid_cap" },
  { symbol: "ADDT-B", exchange: "ST", country: "SE", name: "AddTech AB ser. B", segment: "mid_cap" },
  { symbol: "TREL-B", exchange: "ST", country: "SE", name: "Trelleborg AB ser. B", segment: "mid_cap" },
  { symbol: "HOLM-B", exchange: "ST", country: "SE", name: "Holmen AB ser. B", segment: "mid_cap" },
  { symbol: "ELUX-B", exchange: "ST", country: "SE", name: "Electrolux AB ser. B", segment: "mid_cap" },
  { symbol: "SINCH", exchange: "ST", country: "SE", name: "Sinch AB", segment: "mid_cap" },
  { symbol: "DOM", exchange: "ST", country: "SE", name: "Dometic Group AB", segment: "mid_cap" },
  { symbol: "SECU-B", exchange: "ST", country: "SE", name: "Securitas AB ser. B", segment: "mid_cap" },
  { symbol: "KINV-B", exchange: "ST", country: "SE", name: "Kinnevik AB ser. B", segment: "mid_cap" },

  // Norway — large cap
  { symbol: "EQNR", exchange: "OL", country: "NO", name: "Equinor ASA", segment: "large_cap" },
  { symbol: "DNB", exchange: "OL", country: "NO", name: "DNB Bank ASA", segment: "large_cap" },
  { symbol: "TEL", exchange: "OL", country: "NO", name: "Telenor ASA", segment: "large_cap" },
  { symbol: "MOWI", exchange: "OL", country: "NO", name: "Mowi ASA", segment: "large_cap" },
  { symbol: "NHY", exchange: "OL", country: "NO", name: "Norsk Hydro ASA", segment: "large_cap" },
  { symbol: "YAR", exchange: "OL", country: "NO", name: "Yara International ASA", segment: "large_cap" },
  { symbol: "ORK", exchange: "OL", country: "NO", name: "Orkla ASA", segment: "large_cap" },
  { symbol: "GJF", exchange: "OL", country: "NO", name: "Gjensidige Forsikring ASA", segment: "large_cap" },
  { symbol: "STB", exchange: "OL", country: "NO", name: "Storebrand ASA", segment: "large_cap" },
  // Norway — mid cap
  { symbol: "SALM", exchange: "OL", country: "NO", name: "SalMar ASA", segment: "mid_cap" },
  { symbol: "BAKKA", exchange: "OL", country: "NO", name: "Bakkafrost P/F", segment: "mid_cap" },
  { symbol: "AKRBP", exchange: "OL", country: "NO", name: "Aker BP ASA", segment: "mid_cap" },
  { symbol: "AKER", exchange: "OL", country: "NO", name: "Aker ASA", segment: "mid_cap" },
  { symbol: "TOM", exchange: "OL", country: "NO", name: "Tomra Systems ASA", segment: "mid_cap" },
  { symbol: "NOD", exchange: "OL", country: "NO", name: "Nordic Semiconductor ASA", segment: "mid_cap" },
  { symbol: "AUTO", exchange: "OL", country: "NO", name: "AutoStore Holdings Ltd", segment: "mid_cap" },
  { symbol: "KOG", exchange: "OL", country: "NO", name: "Kongsberg Gruppen ASA", segment: "mid_cap" },

  // Finland — large cap
  { symbol: "NOKIA", exchange: "HE", country: "FI", name: "Nokia Oyj", segment: "large_cap" },
  { symbol: "SAMPO", exchange: "HE", country: "FI", name: "Sampo Oyj", segment: "large_cap" },
  { symbol: "KNEBV", exchange: "HE", country: "FI", name: "Kone Oyj", segment: "large_cap" },
  { symbol: "FORTUM", exchange: "HE", country: "FI", name: "Fortum Oyj", segment: "large_cap" },
  { symbol: "UPM", exchange: "HE", country: "FI", name: "UPM-Kymmene Oyj", segment: "large_cap" },
  { symbol: "NESTE", exchange: "HE", country: "FI", name: "Neste Oyj", segment: "large_cap" },
  { symbol: "STERV", exchange: "HE", country: "FI", name: "Stora Enso Oyj R", segment: "large_cap" },
  { symbol: "ORNBV", exchange: "HE", country: "FI", name: "Orion Oyj B", segment: "large_cap" },
  { symbol: "WRT1V", exchange: "HE", country: "FI", name: "Wärtsilä Oyj Abp", segment: "large_cap" },
  { symbol: "ELISA", exchange: "HE", country: "FI", name: "Elisa Oyj", segment: "large_cap" },
  // Finland — mid cap
  { symbol: "TIETO", exchange: "HE", country: "FI", name: "Tietoevry Oyj", segment: "mid_cap" },
  { symbol: "OUT1V", exchange: "HE", country: "FI", name: "Outokumpu Oyj", segment: "mid_cap" },
  { symbol: "METSB", exchange: "HE", country: "FI", name: "Metsä Board Oyj B", segment: "mid_cap" },
  { symbol: "HUH1V", exchange: "HE", country: "FI", name: "Huhtamäki Oyj", segment: "mid_cap" },
  { symbol: "CTY1S", exchange: "HE", country: "FI", name: "Citycon Oyj", segment: "mid_cap" },
  { symbol: "VALMT", exchange: "HE", country: "FI", name: "Valmet Oyj", segment: "mid_cap" },
  { symbol: "KEMIRA", exchange: "HE", country: "FI", name: "Kemira Oyj", segment: "mid_cap" },
  { symbol: "CGCBV", exchange: "HE", country: "FI", name: "Cargotec Oyj", segment: "mid_cap" },

  // Denmark — large cap
  { symbol: "NOVO-B", exchange: "CO", country: "DK", name: "Novo Nordisk A/S B", segment: "large_cap" },
  { symbol: "DSV", exchange: "CO", country: "DK", name: "DSV A/S", segment: "large_cap" },
  { symbol: "MAERSK-B", exchange: "CO", country: "DK", name: "A.P. Møller - Mærsk A/S B", segment: "large_cap" },
  { symbol: "VWS", exchange: "CO", country: "DK", name: "Vestas Wind Systems A/S", segment: "large_cap" },
  { symbol: "ORSTED", exchange: "CO", country: "DK", name: "Ørsted A/S", segment: "large_cap" },
  { symbol: "CARL-B", exchange: "CO", country: "DK", name: "Carlsberg A/S B", segment: "large_cap" },
  { symbol: "COLO-B", exchange: "CO", country: "DK", name: "Coloplast A/S B", segment: "large_cap" },
  { symbol: "GMAB", exchange: "CO", country: "DK", name: "Genmab A/S", segment: "large_cap" },
  { symbol: "TRYG", exchange: "CO", country: "DK", name: "Tryg A/S", segment: "large_cap" },
  { symbol: "DEMANT", exchange: "CO", country: "DK", name: "Demant A/S", segment: "large_cap" },
  // Denmark — mid cap
  { symbol: "JYSK", exchange: "CO", country: "DK", name: "Jyske Bank A/S", segment: "mid_cap" },
  { symbol: "SYDB", exchange: "CO", country: "DK", name: "Sydbank A/S", segment: "mid_cap" },
  { symbol: "RBREW", exchange: "CO", country: "DK", name: "Royal Unibrew A/S", segment: "mid_cap" },
  { symbol: "NETC", exchange: "CO", country: "DK", name: "Netcompany Group A/S", segment: "mid_cap" },
  { symbol: "BAVA", exchange: "CO", country: "DK", name: "Bavarian Nordic A/S", segment: "mid_cap" },
  { symbol: "ZEAL", exchange: "CO", country: "DK", name: "Zealand Pharma A/S", segment: "mid_cap" },
  { symbol: "PNDORA", exchange: "CO", country: "DK", name: "Pandora A/S", segment: "mid_cap" },
  { symbol: "GN", exchange: "CO", country: "DK", name: "GN Store Nord A/S", segment: "mid_cap" },
] as const;

export function nordicSeedCoverage(): {
  countries: NordicCountry[];
  segments: NordicCapSegment[];
  byCountry: Record<NordicCountry, { large_cap: number; mid_cap: number; total: number }>;
} {
  const countries: NordicCountry[] = ["SE", "NO", "FI", "DK"];
  const byCountry = Object.fromEntries(
    countries.map((country) => [country, { large_cap: 0, mid_cap: 0, total: 0 }]),
  ) as Record<NordicCountry, { large_cap: number; mid_cap: number; total: number }>;

  for (const seed of NORDIC_SEED_UNIVERSE) {
    byCountry[seed.country][seed.segment] += 1;
    byCountry[seed.country].total += 1;
  }

  return {
    countries,
    segments: ["large_cap", "mid_cap"],
    byCountry,
  };
}

/**
 * Deterministic shortlist selection with per-country representation.
 * Held instruments are always appended by the caller and must never be dropped here.
 */
export function selectBoundedNordicShortlist<T extends {
  country: NordicCountry;
  score: number;
  symbol: string;
  exchange: NordicExchange;
}>(
  ranked: readonly T[],
  limits: {
    shortlistLimit?: number;
    perCountryMin?: number;
    perCountryMax?: number;
  } = {},
): T[] {
  const shortlistLimit = Math.max(
    1,
    Math.min(limits.shortlistLimit ?? NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount, 30),
  );
  const perCountryMin = Math.max(
    0,
    Math.min(limits.perCountryMin ?? NORDIC_RESEARCH_BOUNDS.perCountryMinShortlist, shortlistLimit),
  );
  const perCountryMax = Math.max(
    perCountryMin,
    Math.min(limits.perCountryMax ?? NORDIC_RESEARCH_BOUNDS.perCountryMaxShortlist, shortlistLimit),
  );

  const sorted = [...ranked].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return `${a.symbol}.${a.exchange}`.localeCompare(`${b.symbol}.${b.exchange}`);
  });

  const selected: T[] = [];
  const selectedKeys = new Set<string>();
  const countByCountry: Record<NordicCountry, number> = { SE: 0, NO: 0, FI: 0, DK: 0 };

  const tryAdd = (item: T): boolean => {
    const key = `${item.symbol}.${item.exchange}`;
    if (selectedKeys.has(key)) return false;
    if (countByCountry[item.country] >= perCountryMax) return false;
    if (selected.length >= shortlistLimit) return false;
    selectedKeys.add(key);
    selected.push(item);
    countByCountry[item.country] += 1;
    return true;
  };

  for (const country of ["SE", "NO", "FI", "DK"] as const) {
    for (const item of sorted) {
      if (item.country !== country) continue;
      if (countByCountry[country] >= perCountryMin) break;
      tryAdd(item);
    }
  }

  for (const item of sorted) {
    if (selected.length >= shortlistLimit) break;
    tryAdd(item);
  }

  return selected;
}

/**
 * Merge discovery shortlist with current holdings. Holdings always win inclusion
 * even when discovery ranking would have excluded them.
 */
export function mergeNordicDeepResearchTargets<T extends {
  symbol: string;
  exchange: string;
  held?: boolean;
}>(shortlist: readonly T[], holdings: readonly T[]): T[] {
  const map = new Map<string, T>();
  for (const item of holdings) {
    const key = `${item.symbol}.${item.exchange}`.toUpperCase();
    map.set(key, { ...item, held: true });
  }
  for (const item of shortlist) {
    const key = `${item.symbol}.${item.exchange}`.toUpperCase();
    const previous = map.get(key);
    if (!previous) {
      map.set(key, { ...item, held: Boolean(item.held) });
      continue;
    }
    map.set(key, {
      ...previous,
      ...item,
      held: true,
    });
  }
  return [...map.values()];
}
