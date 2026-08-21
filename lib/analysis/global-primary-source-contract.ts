export const GLOBAL_SOURCE_DISCOVERY_VERSION = "global-source-discovery-v1" as const;

export type GlobalSourceKind =
  | "regulatory_annual_filing"
  | "regulatory_interim_filing"
  | "issuer_ir_candidate"
  | "issuer_website_candidate";

export type GlobalPrimarySource = {
  id: string;
  kind: GlobalSourceKind;
  publisher: string;
  url: string;
  publishedAt: string | null;
  verifiedAt: string;
  primary: boolean;
  form: string | null;
};

export type GlobalSourceDiscoveryResult = {
  version: typeof GLOBAL_SOURCE_DISCOVERY_VERSION;
  yahooSymbol: string;
  symbol: string;
  exchange: string;
  companyName: string;
  sources: GlobalPrimarySource[];
  primarySourceCount: number;
  annualPrimaryCount: number;
  interimPrimaryCount: number;
  readyForEvidenceExtraction: boolean;
  status: "verified_primary" | "candidate_only" | "unavailable";
  reason: string;
};

type SecTickerRow = {
  cik_str?: unknown;
  ticker?: unknown;
  title?: unknown;
};

type SecRecentFilings = {
  accessionNumber?: unknown;
  filingDate?: unknown;
  form?: unknown;
  primaryDocument?: unknown;
};

type SecSubmissionsLike = {
  filings?: {
    recent?: SecRecentFilings;
  };
};

const ANNUAL_FORMS = new Set(["10-K", "10-K/A", "20-F", "20-F/A", "40-F", "40-F/A"]);
const INTERIM_FORMS = new Set(["10-Q", "10-Q/A"]);

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function integer(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function normalizedSymbol(value: string): string {
  return value.trim().toUpperCase();
}

export function safeHttpsUrl(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    if (!url.hostname || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function sourceKindForForm(form: string): GlobalSourceKind | null {
  const normalized = form.toUpperCase();
  if (ANNUAL_FORMS.has(normalized)) return "regulatory_annual_filing";
  if (INTERIM_FORMS.has(normalized)) return "regulatory_interim_filing";

  // 6-K is intentionally not treated as an interim report here. Foreign
  // private issuers use 6-K for many different current disclosures. It can only
  // become interim financial evidence after document-level classification.
  return null;
}

function recentColumn(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => text(item) ?? "") : [];
}

function filingDateIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed)) return null;
  const date = new Date(parsed);
  return date.toISOString().slice(0, 10) === value ? date.toISOString() : null;
}

function secArchiveUrl(input: {
  cik: number;
  accessionNumber: string;
  primaryDocument: string;
}): string | null {
  const accessionNumber = input.accessionNumber.trim();
  const document = input.primaryDocument.trim();
  if (!/^\d{10}-\d{2}-\d{6}$/.test(accessionNumber)) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(document)) return null;
  if (document.includes("..")) return null;
  const accession = accessionNumber.replace(/-/g, "");
  return `https://www.sec.gov/Archives/edgar/data/${input.cik}/${accession}/${encodeURIComponent(document)}`;
}

export function parseSecTickerDirectory(
  payload: unknown,
  expectedTicker: string,
): { cik: number; ticker: string; title: string } | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const ticker = normalizedSymbol(expectedTicker);
  if (!ticker || ticker.includes(".")) return null;

  for (const row of Object.values(payload as Record<string, unknown>)) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const candidate = row as SecTickerRow;
    const candidateTicker = text(candidate.ticker)?.toUpperCase() ?? "";
    if (candidateTicker !== ticker) continue;
    const cik = integer(candidate.cik_str);
    const title = text(candidate.title);
    if (!cik || !title) return null;
    return { cik, ticker: candidateTicker, title };
  }
  return null;
}

export function parseSecPrimarySources(input: {
  payload: unknown;
  cik: number;
  ticker: string;
  now: Date;
}): GlobalPrimarySource[] {
  if (!Number.isFinite(input.now.getTime())) return [];
  if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) return [];

  const body = input.payload as SecSubmissionsLike;
  const recent = body.filings?.recent;
  if (!recent) return [];

  const accessions = recentColumn(recent.accessionNumber);
  const dates = recentColumn(recent.filingDate);
  const forms = recentColumn(recent.form);
  const documents = recentColumn(recent.primaryDocument);
  const length = Math.min(accessions.length, dates.length, forms.length, documents.length);
  const sources: GlobalPrimarySource[] = [];
  let annualAdded = false;
  let interimAdded = false;

  for (let index = 0; index < length && sources.length < 2; index += 1) {
    const form = forms[index]!;
    const kind = sourceKindForForm(form);
    if (!kind) continue;
    if (kind === "regulatory_annual_filing" && annualAdded) continue;
    if (kind === "regulatory_interim_filing" && interimAdded) continue;

    const publishedAt = filingDateIso(dates[index]!);
    const url = secArchiveUrl({
      cik: input.cik,
      accessionNumber: accessions[index]!,
      primaryDocument: documents[index]!,
    });
    if (!publishedAt || !url) continue;

    sources.push({
      id: `sec:${input.cik}:${accessions[index]}`,
      kind,
      publisher: "U.S. Securities and Exchange Commission",
      url,
      publishedAt,
      verifiedAt: input.now.toISOString(),
      primary: true,
      form,
    });
    if (kind === "regulatory_annual_filing") annualAdded = true;
    if (kind === "regulatory_interim_filing") interimAdded = true;
  }

  return sources;
}

export function summarizeGlobalSourceDiscovery(input: {
  yahooSymbol: string;
  symbol: string;
  exchange: string;
  companyName: string;
  sources: GlobalPrimarySource[];
}): GlobalSourceDiscoveryResult {
  const yahooSymbol = normalizedSymbol(input.yahooSymbol);
  const symbol = normalizedSymbol(input.symbol);
  const exchange = normalizedSymbol(input.exchange);
  const companyName = input.companyName.trim();
  const sources = [...input.sources];
  const primarySources = sources.filter((source) => source.primary);
  const annualPrimaryCount = primarySources.filter(
    (source) => source.kind === "regulatory_annual_filing",
  ).length;
  const interimPrimaryCount = primarySources.filter(
    (source) => source.kind === "regulatory_interim_filing",
  ).length;
  const readyForEvidenceExtraction = annualPrimaryCount >= 1 && interimPrimaryCount >= 1;
  const status = readyForEvidenceExtraction
    ? "verified_primary"
    : sources.length > 0
      ? "candidate_only"
      : "unavailable";
  const reason = readyForEvidenceExtraction
    ? "SEC har verifierat minst en årsfiling och en interimfiling. Källorna kan gå vidare till en separat, bounded evidence-extraction gate."
    : sources.length > 0
      ? "Bolagets källdomän eller en del av primärkällorna hittades, men DivLab saknar ännu komplett verifierad års- och interimtäckning för denna marknad."
      : "Ingen verifierad global primärkälla hittades. Full Deep Research förblir låst.";

  return {
    version: GLOBAL_SOURCE_DISCOVERY_VERSION,
    yahooSymbol,
    symbol,
    exchange,
    companyName,
    sources,
    primarySourceCount: primarySources.length,
    annualPrimaryCount,
    interimPrimaryCount,
    readyForEvidenceExtraction,
    status,
    reason,
  };
}
