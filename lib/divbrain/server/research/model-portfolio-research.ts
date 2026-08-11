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

/** Period/document vocabulary — useful for scoring, not for company DB targeting. */
const NON_COMPANY_QUERY_TERMS = new Set([
  ...STOP_TERMS,
  "q1",
  "q2",
  "q3",
  "q4",
  "h1",
  "h2",
  "fy",
  "rapport",
  "rapporten",
  "rapporter",
  "rapporterna",
  "kvartalsrapport",
  "kvartalsrapporten",
  "delårsrapport",
  "delårsrapporten",
  "halvårsrapport",
  "halvårsrapporten",
  "årsrapport",
  "årsrapporten",
  "årsredovisning",
  "årsredovisningen",
  "bokslut",
  "bokslutet",
  "bokslutskommunike",
  "bokslutskommuniké",
  "resultatrapport",
  "resultatrapporten",
  "earnings",
  "quarterly",
  "annual",
  "report",
  "reports",
  "guidance",
  "prognos",
  "prognosen",
  "kassaflödet",
  "kassaflode",
  "kassaflöde",
  "resultat",
  "värderingen",
  "varderingen",
  "värdering",
  "portföljen",
  "portfoljen",
  "portfölj",
  "aktie",
  "bolag",
  "technical",
  "analysis",
  "stock",
  "share",
  "valuation",
]);

/**
 * Hard bounds for shared-research retrieval.
 * Company-targeted mode exists so older company rows remain visible after the
 * store grows beyond a tiny global window.
 */
export const RESEARCH_RETRIEVAL_BOUNDS = {
  maxCompanyTerms: 4,
  maxOrClauses: 8,
  maxCompanyCandidateRows: 48,
  maxRecentFallbackRows: 100,
  maxDbCallsPerQuery: 1,
  minSafeTermLength: 2,
  maxSafeTermLength: 32,
  maxSources: 3,
} as const;

/**
 * Strict safe token contract for PostgREST `.or(...)` interpolation.
 * Rejects commas, dots, wildcards, quotes, and other filter metacharacters.
 */
const SAFE_RESEARCH_DB_TERM =
  /^[A-Za-zÅÄÖåäöÆØæøÜü0-9][A-Za-zÅÄÖåäöÆØæøÜü0-9-]{1,31}$/u;

const MAX_SOURCES = RESEARCH_RETRIEVAL_BOUNDS.maxSources;

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

export type ResearchRetrievalMode =
  | "company_targeted"
  | "recent_fallback"
  | "none";

/** Strict DB kind predicate applied before the company candidate limit. */
export type ResearchKindEq = "company_report";

export type ResearchRetrievalPlan = {
  mode: ResearchRetrievalMode;
  companyTerms: readonly string[];
  orFilter: string | null;
  /**
   * When set (report/document intent), the production query must filter
   * `kind = kindEq` at the DB boundary before ordering/limiting candidates.
   * Prevents newer same-company market_data/news from crowding out reports.
   */
  kindEq: ResearchKindEq | null;
  companyLimit: number;
  recentLimit: number;
  maxDbCalls: number;
};

export type ResearchCompanyTargetedQuery = {
  orFilter: string;
  limit: number;
  kindEq: ResearchKindEq | null;
};

export type ResearchSnapshotQueryPort = {
  fetchRecent(limit: number): Promise<readonly ModelPortfolioResearchRow[]>;
  fetchCompanyTargeted(
    query: ResearchCompanyTargetedQuery,
  ): Promise<readonly ModelPortfolioResearchRow[]>;
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

/**
 * Sanitize one token for safe PostgREST filter interpolation.
 * Returns null when the token fails the strict character/length contract.
 */
export function sanitizeResearchDbTerm(term: string): string | null {
  const normalized = term.normalize("NFC").trim();
  if (
    normalized.length < RESEARCH_RETRIEVAL_BOUNDS.minSafeTermLength ||
    normalized.length > RESEARCH_RETRIEVAL_BOUNDS.maxSafeTermLength
  ) {
    return null;
  }
  if (!SAFE_RESEARCH_DB_TERM.test(normalized)) return null;
  // Defense in depth against ilike / filter metacharacters.
  if (/[%_,.()"'\\]/.test(normalized)) return null;
  return normalized;
}

export function extractCompanyTargetTerms(query: string): string[] {
  const original = query.normalize("NFC");
  const preferred = new Set<string>();

  for (const match of original.matchAll(
    /(?:^|[^\p{L}])([\p{Lu}][\p{L}]{2,})(?:'s|s)?\b/gu,
  )) {
    for (const variant of termVariants(match[1]!.toLowerCase())) {
      preferred.add(variant);
    }
  }

  for (const match of original.matchAll(
    /\b([A-Z]{2,6}(?:[-.][A-Z0-9]{1,4})?)\b/g,
  )) {
    const raw = match[1]!.toLowerCase();
    preferred.add(raw);
    preferred.add(raw.replace(/\./g, "-"));
    preferred.add(raw.replace(/[-.]/g, ""));
  }

  const seen = new Set<string>();
  const terms: string[] = [];
  const candidates =
    preferred.size > 0 ? [...preferred] : queryTerms(original);

  for (const term of candidates) {
    if (NON_COMPANY_QUERY_TERMS.has(term)) continue;
    if (/^\d{4}$/.test(term)) continue;
    for (const variant of termVariants(term)) {
      const safe = sanitizeResearchDbTerm(variant);
      if (!safe || seen.has(safe.toLowerCase())) continue;
      seen.add(safe.toLowerCase());
      terms.push(safe);
      if (terms.length >= RESEARCH_RETRIEVAL_BOUNDS.maxCompanyTerms) {
        return terms;
      }
    }
  }
  return terms;
}

/**
 * Build a PostgREST `.or(...)` filter using only sanitized company terms.
 * Never interpolates unrestricted user text.
 */
export function buildSafeCompanyResearchOrFilter(
  terms: readonly string[],
): string | null {
  const clauses: string[] = [];
  const seen = new Set<string>();

  for (const term of terms) {
    const safe = sanitizeResearchDbTerm(term);
    if (!safe) continue;
    const key = safe.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    clauses.push(`instrument_symbol.ilike.%${safe}%`);
    clauses.push(`instrument_name.ilike.%${safe}%`);
    if (clauses.length >= RESEARCH_RETRIEVAL_BOUNDS.maxOrClauses) break;
  }

  return clauses.length > 0 ? clauses.join(",") : null;
}

export function planModelPortfolioResearchRetrieval(
  query: string,
): ResearchRetrievalPlan {
  const normalized = query.normalize("NFC").trim();
  if (!shouldQueryModelPortfolioResearch(normalized)) {
    return {
      mode: "none",
      companyTerms: [],
      orFilter: null,
      kindEq: null,
      companyLimit: 0,
      recentLimit: 0,
      maxDbCalls: 0,
    };
  }

  const companyTerms = extractCompanyTargetTerms(normalized);
  const orFilter = buildSafeCompanyResearchOrFilter(companyTerms);
  const hasCompanyOrTickerSignal =
    hasLikelyCompanySignal(normalized) || TICKER_LIKE.test(normalized);
  const hint = extractReportPeriodHint(normalized);

  // Company-targeted retrieval only when a real company/ticker signal exists.
  // Broader finance intents without a company signal keep a bounded recent fallback.
  // Report/document intent narrows to actual company_report rows before the limit
  // so same-company market_data snapshots cannot crowd durable reports out.
  if (hasCompanyOrTickerSignal && companyTerms.length > 0 && orFilter) {
    return {
      mode: "company_targeted",
      companyTerms,
      orFilter,
      kindEq: hint.wantsReport ? "company_report" : null,
      companyLimit: RESEARCH_RETRIEVAL_BOUNDS.maxCompanyCandidateRows,
      recentLimit: RESEARCH_RETRIEVAL_BOUNDS.maxRecentFallbackRows,
      maxDbCalls: RESEARCH_RETRIEVAL_BOUNDS.maxDbCallsPerQuery,
    };
  }

  return {
    mode: "recent_fallback",
    companyTerms: [],
    orFilter: null,
    kindEq: null,
    companyLimit: 0,
    recentLimit: RESEARCH_RETRIEVAL_BOUNDS.maxRecentFallbackRows,
    maxDbCalls: RESEARCH_RETRIEVAL_BOUNDS.maxDbCallsPerQuery,
  };
}

/**
 * Execute a retrieval plan against a bounded query port.
 * Used by production loaders and by scalability regression tests.
 */
export async function executeModelPortfolioResearchRetrievalPlan(
  plan: ResearchRetrievalPlan,
  port: ResearchSnapshotQueryPort,
): Promise<readonly ModelPortfolioResearchRow[]> {
  if (plan.mode === "none" || plan.maxDbCalls <= 0) return [];

  if (plan.mode === "company_targeted") {
    if (!plan.orFilter) return [];
    const rows = await port.fetchCompanyTargeted({
      orFilter: plan.orFilter,
      limit: plan.companyLimit,
      kindEq: plan.kindEq,
    });
    // Defense in depth: if a port ignores kindEq, still drop non-report rows
    // before ranking when the plan required an actual document kind.
    const scoped =
      plan.kindEq == null
        ? rows
        : rows.filter((candidate) => candidate.kind === plan.kindEq);
    return scoped.slice(0, plan.companyLimit);
  }

  const rows = await port.fetchRecent(plan.recentLimit);
  return rows.slice(0, plan.recentLimit);
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

function metadataReportPeriod(
  meta: Record<string, unknown>,
): string | null {
  return typeof meta.report_period === "string"
    ? meta.report_period.toUpperCase()
    : null;
}

function metadataReportYear(meta: Record<string, unknown>): number | null {
  if (typeof meta.report_year === "number" && Number.isFinite(meta.report_year)) {
    return meta.report_year;
  }
  if (
    typeof meta.report_year === "string" &&
    /^\d{4}$/.test(meta.report_year)
  ) {
    return Number(meta.report_year);
  }
  return null;
}

/**
 * Structured metadata period scoring (#171 producer fields).
 * Exact Q1–Q4 beats compatible H1↔Q2 / H2↔Q4 signals. Never rewrites stored metadata.
 */
function metadataPeriodScore(
  meta: Record<string, unknown>,
  hint: ReportPeriodHint,
): number {
  let score = 0;
  const reportPeriod = metadataReportPeriod(meta);
  const reportYear = metadataReportYear(meta);

  for (const quarter of hint.quarters) {
    if (reportPeriod === `Q${quarter}`) score += 45;
    else if (quarter === 2 && reportPeriod === "H1") score += 28;
    else if (quarter === 4 && reportPeriod === "H2") score += 28;
  }
  for (const half of hint.halves) {
    if (reportPeriod === `H${half}`) score += 35;
    else if (half === 1 && reportPeriod === "Q2") score += 22;
    else if (half === 2 && reportPeriod === "Q4") score += 22;
  }
  for (const year of hint.years) {
    if (reportYear === year) score += 22;
  }

  if (hint.quarters.length > 0 && reportPeriod && /^Q[1-4]$/.test(reportPeriod)) {
    const matchedRequested = hint.quarters.some(
      (quarter) =>
        reportPeriod === `Q${quarter}` ||
        (quarter === 2 && reportPeriod === "H1") ||
        (quarter === 4 && reportPeriod === "H2"),
    );
    // Soft penalty only for an explicit contradictory quarter in metadata.
    if (!matchedRequested) score -= 15;
  }

  return score;
}

function periodScore(
  rowText: string,
  hint: ReportPeriodHint,
  meta: Record<string, unknown>,
): number {
  // Prefer structured metadata when present; keep title/summary matching for older rows.
  let score = metadataPeriodScore(meta, hint);

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
    const metaPeriod = metadataReportPeriod(meta);
    const matchedViaCompatibleMeta =
      metaPeriod != null &&
      hint.quarters.some(
        (quarter) =>
          (quarter === 2 && metaPeriod === "H1") ||
          (quarter === 4 && metaPeriod === "H2") ||
          metaPeriod === `Q${quarter}`,
      );
    if (!matchedRequested && !matchedViaCompatibleMeta) {
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
  meta: Record<string, unknown>,
): number {
  if (!hint.wantsReport && !hint.wantsGuidance) return 0;
  let score = 0;
  if (REPORT_KIND.has(row.kind)) score += 25;
  if (REPORT_TEXT.test(rowText)) score += 18;
  if (hint.wantsGuidance && /(?:guidance|prognos)/iu.test(rowText)) score += 12;

  if (
    meta.document_retrieved === true &&
    meta.source_type === "official_company_report"
  ) {
    score += 15;
  }
  if (
    typeof meta.document_type === "string" &&
    /report/i.test(meta.document_type)
  ) {
    score += 8;
  }

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
 * Deterministic relevance score using snapshot fields + optional #171 metadata.
 * Period metadata is never fabricated — only matched when present.
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
  const meta = metadata(row.metadata);
  return (
    companyScore +
    lexicalFieldScore(row, terms) +
    periodScore(rowText, hint, meta) +
    reportKindScore(row, rowText, hint, meta) +
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

/**
 * Separate research-cache TTL from durable source/document validity.
 * - candidate_bundle: metadata.expires_at is dynamic cache validity → current/stale
 * - primary_source_disclosure (and other durable rows): derive from published_at
 *   → current when newly published, otherwise dated — never stale solely because
 *   the 7-day research refresh TTL expired.
 */
export function freshnessState(
  row: ModelPortfolioResearchRow,
): DivBrainSource["freshnessState"] {
  const meta = metadata(row.metadata);

  if (meta.research_kind === "candidate_bundle") {
    const expiry =
      typeof meta.expires_at === "string" ? Date.parse(meta.expires_at) : NaN;
    if (Number.isFinite(expiry)) {
      return expiry > Date.now() ? "current" : "stale";
    }
  }

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
 * Narrow category mapping. Promote to official_company_report only when:
 * - kind is already company_report, AND
 * - trusted verification (verified / internally_curated), AND
 * - trusted provenance (primary_source company, official source_type, or
 *   narrowly trusted official publisher signal).
 * Unverified rows stay external_unverified even if publisher text looks official.
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
      /(?:investor\s*relations|\bir\b|bolaget|official|officiell|nasdaq)/iu.test(
        row.publisher,
      );
    const trustedSourceFlag =
      meta.primary_source === "company" ||
      meta.source_type === "official_company_report";
    const trustedProvenance =
      trustedSourceFlag || trustedPublisher;
    if (trustedVerification && trustedProvenance) {
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

/**
 * Prefer the official PDF/document URL only when the verified read-report
 * contract from the #171 producer is fully satisfied.
 */
export function resolveResearchCanonicalUrl(
  row: ModelPortfolioResearchRow,
): string | undefined {
  const meta = metadata(row.metadata);
  const verifiedReadReport =
    row.kind === "company_report" &&
    meta.verification_state === "verified" &&
    meta.document_retrieved === true &&
    meta.source_type === "official_company_report" &&
    typeof meta.document_url === "string";

  if (verifiedReadReport) {
    const documentUrl = safeUrl(meta.document_url as string);
    if (documentUrl) return documentUrl;
  }

  return safeUrl(row.source_url);
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
    canonicalUrl: resolveResearchCanonicalUrl(row),
    publishedAt: row.published_at,
    retrievedAt,
    dataAsOf: row.published_at,
    attribution: `${row.instrument_name} (${row.instrument_symbol}.${row.exchange})`,
    excerpt: row.summary.slice(0, 1500),
    recordRef: row.id,
    schemaVersion: 1,
  };
}

const RESEARCH_SELECT =
  "id,instrument_symbol,exchange,instrument_name,kind,publisher,source_url,published_at,verified_at,title,summary,metadata";

function createSupabaseResearchPort(
  // Loose client to match existing admin client typing.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): ResearchSnapshotQueryPort {
  return {
    async fetchRecent(limit) {
      const { data, error } = await supabase
        .from("model_portfolio_research_snapshots")
        .select(RESEARCH_SELECT)
        .order("verified_at", { ascending: false })
        .limit(limit);
      if (error) return [];
      return (data ?? []) as ModelPortfolioResearchRow[];
    },
    async fetchCompanyTargeted({ orFilter, limit, kindEq }) {
      let query = supabase
        .from("model_portfolio_research_snapshots")
        .select(RESEARCH_SELECT)
        .or(orFilter);
      // Apply kind before order/limit so durable reports stay in the window.
      if (kindEq) {
        query = query.eq("kind", kindEq);
      }
      const { data, error } = await query
        .order("verified_at", { ascending: false })
        .limit(limit);
      if (error) return [];
      return (data ?? []) as ModelPortfolioResearchRow[];
    },
  };
}

export async function loadModelPortfolioResearchSources(
  query: string,
): Promise<readonly DivBrainSource[]> {
  const normalized = query.normalize("NFC").trim();
  const plan = planModelPortfolioResearchRetrieval(normalized);
  if (plan.mode === "none") return [];

  const supabase = createModelPortfolioAdminClient();
  if (!supabase) return [];

  const rows = await executeModelPortfolioResearchRetrievalPlan(
    plan,
    createSupabaseResearchPort(supabase),
  );

  const selected = selectModelPortfolioResearchRows(
    normalized,
    rows,
    MAX_SOURCES,
  );
  return selected.map((row) => researchRowToDivBrainSource(row));
}
