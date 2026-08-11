import "server-only";

import { createModelPortfolioAdminClient } from "@/lib/model-portfolios/admin";
import type { DivBrainSource } from "../../sources";

/** Classic finance intents (valuation, portfolio, ticker language). */
const FINANCE_TRIGGER =
  /(?:aktie|bolag|börs|kurs|värdering|fundamental|teknisk|portfölj|köp|sälj|utdelning|ticker|stock|share|valuation|technical)/iu;

/**
 * Report / document intents — Swedish + common English shorthand.
 * Kept deliberately document-shaped so generic education does not open the store.
 */
const REPORT_DOCUMENT_TRIGGER =
  /(?:kvartalsrapport(?:en|er|erna)?|delårsrapport(?:en|er|erna)?|halvårsrapport(?:en|er|erna)?|årsrapport(?:en|er|erna)?|årsredovisning(?:en|ar)?|bokslutskommunik[eé]|bokslut(?:et)?|resultatrapport(?:en|er|erna)?|rapport(?:en|er|erna)?|earnings|quarterly\s+reports?|annual\s+reports?|\bq[1-4]\b|\bh[12]\b)/iu;

/** Guidance/prognos only counts when a company-like signal is also present. */
const GUIDANCE_TRIGGER = /(?:\bguidance\b|\bprognos(?:en|er)?\b)/iu;

const TICKER_LIKE = /[A-Z]{2,6}(?:[-.][A-Z0-9]{1,4})?/;

/** Definitional education prompts should not hit the shared portfolio-research store. */
const GENERIC_EDUCATION_QUERY =
  /^\s*vad\s+är\s+(?:en|ett)\b/iu;

const REPORT_KIND = new Set([
  "company_report",
  "company_release",
  "regulatory_filing",
]);

const REPORT_TEXT =
  /(?:rapport|kvartalsrapport|delårsrapport|halvårsrapport|årsrapport|årsredovisning|bokslut|resultatrapport|earnings|quarterly|10-[qk]|20-f)/iu;

const STOP_TERMS = new Set([
  "en",
  "ett",
  "och",
  "att",
  "det",
  "som",
  "för",
  "med",
  "till",
  "från",
  "kan",
  "du",
  "på",
  "vad",
  "är",
  "hur",
  "såg",
  "ut",
  "den",
  "de",
  "av",
  "om",
  "har",
  "var",
  "vid",
  "eller",
  "the",
  "a",
  "an",
  "of",
  "in",
  "on",
  "for",
  "to",
  "is",
  "was",
  "titta",
  "senaste",
  "stod",
]);

const MAX_ROWS = 100;
const MAX_SOURCES = 3;

export type ModelPortfolioResearchRow = {
  id: string;
  instrument_symbol: string;
  exchange: string;
  instrument_name: string;
  kind: string;
  publisher: string;
  source_url: string;
  published_at: string;
  verified_at: string;
  title: string;
  summary: string;
  metadata: unknown;
};

export type ReportPeriodHint = {
  quarters: readonly number[];
  halves: readonly number[];
  years: readonly number[];
  wantsReport: boolean;
  wantsGuidance: boolean;
};

function uniqueNumbers(values: readonly number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

export function extractReportPeriodHint(query: string): ReportPeriodHint {
  const text = query.normalize("NFC");
  const quarters: number[] = [];
  const halves: number[] = [];
  const years: number[] = [];

  for (const match of text.matchAll(/\bq\s*([1-4])\b/gi)) {
    quarters.push(Number(match[1]));
  }
  for (const match of text.matchAll(/\bh\s*([12])\b/gi)) {
    halves.push(Number(match[1]));
  }
  for (const match of text.matchAll(/\b(20\d{2})\b/g)) {
    years.push(Number(match[1]));
  }

  return {
    quarters: uniqueNumbers(quarters),
    halves: uniqueNumbers(halves),
    years: uniqueNumbers(years),
    wantsReport: REPORT_DOCUMENT_TRIGGER.test(text),
    wantsGuidance: GUIDANCE_TRIGGER.test(text),
  };
}

function hasLikelyCompanySignal(query: string): boolean {
  if (TICKER_LIKE.test(query)) return true;
  // Capitalized multi-letter token (company names in Swedish questions).
  return /(?:^|[^\p{L}])[\p{Lu}][\p{L}]{2,}(?:'s|s)?\b/u.test(query);
}

export function shouldQueryModelPortfolioResearch(query: string): boolean {
  const normalized = query.normalize("NFC").trim();
  if (!normalized) return false;
  if (GENERIC_EDUCATION_QUERY.test(normalized)) return false;
  if (REPORT_DOCUMENT_TRIGGER.test(normalized)) return true;
  if (TICKER_LIKE.test(normalized)) return true;
  if (FINANCE_TRIGGER.test(normalized)) return true;
  if (GUIDANCE_TRIGGER.test(normalized) && hasLikelyCompanySignal(normalized)) {
    return true;
  }
  return false;
}

function termVariants(term: string): string[] {
  const variants = [term];
  // Swedish/English genitive: "Investors" → "Investor"
  if (term.length >= 4 && term.endsWith("s") && !term.endsWith("ss")) {
    variants.push(term.slice(0, -1));
  }
  return variants;
}

export function queryTerms(query: string): string[] {
  return query
    .normalize("NFC")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2 && !STOP_TERMS.has(term))
    .slice(0, 16);
}

function rowSearchText(row: ModelPortfolioResearchRow): string {
  return `${row.kind} ${row.title} ${row.summary}`.toLowerCase();
}

function rowHasQuarter(text: string, quarter: number): boolean {
  return new RegExp(`\\bq\\s*${quarter}\\b`, "i").test(text);
}

function rowHasHalf(text: string, half: number): boolean {
  return new RegExp(`\\bh\\s*${half}\\b`, "i").test(text);
}

function rowHasYear(text: string, year: number): boolean {
  return new RegExp(`\\b${year}\\b`).test(text);
}

function companyMatchScore(
  row: ModelPortfolioResearchRow,
  terms: readonly string[],
): number {
  const symbol = row.instrument_symbol.toLowerCase();
  const name = row.instrument_name.toLowerCase();
  let score = 0;

  for (const term of terms) {
    for (const variant of termVariants(term)) {
      if (symbol === variant) score += 20;
      else if (symbol.includes(variant)) score += 8;
      if (name.includes(variant)) score += 5;
    }
  }
  return score;
}

function lexicalFieldScore(
  row: ModelPortfolioResearchRow,
  terms: readonly string[],
): number {
  const title = row.title.toLowerCase();
  const summary = row.summary.toLowerCase();
  let score = 0;
  for (const term of terms) {
    for (const variant of termVariants(term)) {
      if (title.includes(variant)) score += 3;
      if (summary.includes(variant)) score += 1;
    }
  }
  return score;
}

function periodScore(
  rowText: string,
  hint: ReportPeriodHint,
): number {
  let score = 0;

  for (const quarter of hint.quarters) {
    if (rowHasQuarter(rowText, quarter)) score += 40;
  }
  for (const half of hint.halves) {
    if (rowHasHalf(rowText, half)) score += 30;
  }
  for (const year of hint.years) {
    if (rowHasYear(rowText, year)) score += 20;
  }

  // Soft preference against a conflicting quarter when a requested quarter is present.
  if (hint.quarters.length > 0) {
    const matchedRequested = hint.quarters.some((quarter) =>
      rowHasQuarter(rowText, quarter),
    );
    if (!matchedRequested) {
      const otherQuarter = [1, 2, 3, 4].some(
        (quarter) =>
          !hint.quarters.includes(quarter) && rowHasQuarter(rowText, quarter),
      );
      if (otherQuarter) score -= 15;
    }
  }

  return score;
}

function reportKindScore(
  row: ModelPortfolioResearchRow,
  rowText: string,
  hint: ReportPeriodHint,
): number {
  if (!hint.wantsReport && !hint.wantsGuidance) return 0;
  let score = 0;
  if (REPORT_KIND.has(row.kind)) score += 25;
  if (REPORT_TEXT.test(rowText)) score += 18;
  if (hint.wantsGuidance && /(?:guidance|prognos)/iu.test(rowText)) score += 12;
  // Generic same-company news without report signals stays lower.
  if (row.kind === "news" && !REPORT_TEXT.test(rowText)) score -= 8;
  return score;
}

function freshnessBoost(row: ModelPortfolioResearchRow): number {
  const published = Date.parse(row.published_at);
  const verified = Date.parse(row.verified_at);
  const stamp = Number.isFinite(verified)
    ? verified
    : Number.isFinite(published)
      ? published
      : NaN;
  if (!Number.isFinite(stamp)) return 0;
  const ageMs = Date.now() - stamp;
  if (ageMs <= 7 * 24 * 60 * 60 * 1000) return 6;
  if (ageMs <= 90 * 24 * 60 * 60 * 1000) return 3;
  return 0;
}

/**
 * Deterministic relevance score using only existing snapshot fields.
 * Period metadata is never fabricated — only matched when present in text/kind.
 */
export function scoreModelPortfolioResearchRow(
  row: ModelPortfolioResearchRow,
  query: string,
): number {
  const terms = queryTerms(query);
  const hint = extractReportPeriodHint(query);
  const companyScore = companyMatchScore(row, terms);
  // Without a company/symbol signal, do not ground on loose report keywords alone.
  if (companyScore <= 0) return 0;

  const rowText = rowSearchText(row);
  return (
    companyScore +
    lexicalFieldScore(row, terms) +
    periodScore(rowText, hint) +
    reportKindScore(row, rowText, hint) +
    freshnessBoost(row)
  );
}

export function selectModelPortfolioResearchRows(
  query: string,
  rows: readonly ModelPortfolioResearchRow[],
  limit = MAX_SOURCES,
): ModelPortfolioResearchRow[] {
  return rows
    .map((row) => ({ row, score: scoreModelPortfolioResearchRow(row, query) }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Date.parse(b.row.verified_at) - Date.parse(a.row.verified_at),
    )
    .slice(0, Math.max(0, limit))
    .map((item) => item.row);
}

function metadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function freshnessState(
  row: ModelPortfolioResearchRow,
): DivBrainSource["freshnessState"] {
  const meta = metadata(row.metadata);
  const expiry =
    typeof meta.expires_at === "string" ? Date.parse(meta.expires_at) : NaN;
  if (Number.isFinite(expiry)) return expiry > Date.now() ? "current" : "stale";
  const published = Date.parse(row.published_at);
  if (!Number.isFinite(published)) return "unknown";
  return Date.now() - published <= 24 * 60 * 60 * 1000 ? "current" : "dated";
}

function verificationState(
  row: ModelPortfolioResearchRow,
): DivBrainSource["verificationState"] {
  const meta = metadata(row.metadata);
  if (meta.verification_state === "verified") return "verified";
  if (meta.verification_state === "internally_curated") return "internally_curated";
  return "unverified";
}

/**
 * Narrow category mapping. Only promote to official_company_report when the
 * snapshot kind is already company_report and trusted metadata/publisher exists.
 */
export function mapModelPortfolioResearchCategory(
  row: ModelPortfolioResearchRow,
): DivBrainSource["category"] {
  const meta = metadata(row.metadata);
  if (meta.primary_source === "eodhd" || meta.primary_source === "mixed") {
    return "market_data_provider";
  }
  if (meta.research_kind === "candidate_bundle") {
    return "internal_structured_data";
  }

  if (row.kind === "company_report") {
    const trustedVerification =
      meta.verification_state === "verified" ||
      meta.verification_state === "internally_curated";
    const trustedPublisher =
      typeof row.publisher === "string" &&
      /(?:investor\s*relations|\bir\b|bolaget|official|officiell)/iu.test(
        row.publisher,
      );
    const trustedSourceFlag =
      meta.primary_source === "company" ||
      meta.source_type === "official_company_report";
    if (trustedVerification || trustedPublisher || trustedSourceFlag) {
      return "official_company_report";
    }
  }

  return "external_unverified";
}

function safeUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function researchRowToDivBrainSource(
  row: ModelPortfolioResearchRow,
  retrievedAt = new Date().toISOString(),
): DivBrainSource {
  return {
    id: `portfolio-research:${row.id}`,
    title: row.title.slice(0, 200),
    category: mapModelPortfolioResearchCategory(row),
    verificationState: verificationState(row),
    freshnessState: freshnessState(row),
    publisher: row.publisher.slice(0, 120),
    canonicalUrl: safeUrl(row.source_url),
    publishedAt: row.published_at,
    retrievedAt,
    dataAsOf: row.published_at,
    attribution: `${row.instrument_name} (${row.instrument_symbol}.${row.exchange})`,
    excerpt: row.summary.slice(0, 1500),
    recordRef: row.id,
    schemaVersion: 1,
  };
}

export async function loadModelPortfolioResearchSources(
  query: string,
): Promise<readonly DivBrainSource[]> {
  const normalized = query.normalize("NFC").trim();
  if (!shouldQueryModelPortfolioResearch(normalized)) {
    return [];
  }

  const supabase = createModelPortfolioAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("model_portfolio_research_snapshots")
    .select(
      "id,instrument_symbol,exchange,instrument_name,kind,publisher,source_url,published_at,verified_at,title,summary,metadata",
    )
    .order("verified_at", { ascending: false })
    .limit(MAX_ROWS);
  if (error) return [];

  const selected = selectModelPortfolioResearchRows(
    normalized,
    (data ?? []) as ModelPortfolioResearchRow[],
    MAX_SOURCES,
  );
  return selected.map((row) => researchRowToDivBrainSource(row));
}
