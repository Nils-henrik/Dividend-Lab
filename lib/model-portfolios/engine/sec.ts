import "server-only";

const SEC_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";
const SEC_SUBMISSIONS_BASE = "https://data.sec.gov/submissions";
const SEC_ARCHIVES_BASE = "https://www.sec.gov/Archives/edgar/data";
const SEC_USER_AGENT = "DivLab research bot (https://divlab.se/contact)";
const REVALIDATE_TICKERS_SECONDS = 86_400;
const REVALIDATE_SUBMISSIONS_SECONDS = 900;

export type SecCompany = {
  cik: string;
  ticker: string;
  title: string;
};

export type SecFiling = {
  accessionNumber: string;
  filingDate: string;
  reportDate: string | null;
  acceptanceDateTime: string | null;
  form: string;
  primaryDocument: string;
  primaryDocDescription: string | null;
  sourceUrl: string;
};

type SecTickerRow = {
  cik_str?: unknown;
  ticker?: unknown;
  title?: unknown;
};

type SecRecent = {
  accessionNumber?: unknown[];
  filingDate?: unknown[];
  reportDate?: unknown[];
  acceptanceDateTime?: unknown[];
  form?: unknown[];
  primaryDocument?: unknown[];
  primaryDocDescription?: unknown[];
};

type SecSubmissions = {
  filings?: { recent?: SecRecent };
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cik10(value: unknown): string | null {
  const numeric = typeof value === "number" ? String(Math.trunc(value)) : text(value);
  if (!numeric || !/^\d+$/.test(numeric)) return null;
  return numeric.padStart(10, "0");
}

async function secJson(url: string, revalidate: number): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": SEC_USER_AGENT,
    },
    next: { revalidate },
  });
  if (!response.ok) throw new Error(`sec_http_${response.status}`);
  return response.json();
}

export function parseSecTickerDirectory(payload: unknown): SecCompany[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
  return Object.values(payload as Record<string, SecTickerRow>)
    .map((row) => {
      const cik = cik10(row.cik_str);
      const ticker = text(row.ticker)?.toUpperCase() ?? null;
      const title = text(row.title);
      return cik && ticker && title ? { cik, ticker, title } : null;
    })
    .filter((row): row is SecCompany => Boolean(row));
}

export function buildSecFilingUrl(cik: string, accessionNumber: string, primaryDocument: string): string {
  const cikPath = String(Number(cik));
  const accessionPath = accessionNumber.replace(/-/g, "");
  return `${SEC_ARCHIVES_BASE}/${cikPath}/${accessionPath}/${encodeURIComponent(primaryDocument)}`;
}

export function parseRecentSecFilings(
  cik: string,
  payload: SecSubmissions,
  allowedForms: readonly string[] = ["10-K", "10-Q", "8-K", "20-F", "40-F", "6-K"],
): SecFiling[] {
  const recent = payload.filings?.recent;
  if (!recent || !Array.isArray(recent.accessionNumber)) return [];
  const allowed = new Set(allowedForms);
  const filings: SecFiling[] = [];

  for (let index = 0; index < recent.accessionNumber.length; index += 1) {
    const accessionNumber = text(recent.accessionNumber[index]);
    const filingDate = text(recent.filingDate?.[index]);
    const form = text(recent.form?.[index]);
    const primaryDocument = text(recent.primaryDocument?.[index]);
    if (!accessionNumber || !filingDate || !form || !primaryDocument || !allowed.has(form)) continue;
    filings.push({
      accessionNumber,
      filingDate,
      reportDate: text(recent.reportDate?.[index]),
      acceptanceDateTime: text(recent.acceptanceDateTime?.[index]),
      form,
      primaryDocument,
      primaryDocDescription: text(recent.primaryDocDescription?.[index]),
      sourceUrl: buildSecFilingUrl(cik, accessionNumber, primaryDocument),
    });
  }
  return filings;
}

export async function resolveSecCompanyByTicker(ticker: string): Promise<SecCompany | null> {
  const payload = await secJson(SEC_TICKERS_URL, REVALIDATE_TICKERS_SECONDS);
  const normalized = ticker.trim().toUpperCase();
  return parseSecTickerDirectory(payload).find((company) => company.ticker === normalized) ?? null;
}

export async function fetchRecentSecFilings(ticker: string): Promise<{ company: SecCompany; filings: SecFiling[] } | null> {
  const company = await resolveSecCompanyByTicker(ticker);
  if (!company) return null;
  const payload = (await secJson(
    `${SEC_SUBMISSIONS_BASE}/CIK${company.cik}.json`,
    REVALIDATE_SUBMISSIONS_SECONDS,
  )) as SecSubmissions;
  return { company, filings: parseRecentSecFilings(company.cik, payload) };
}
