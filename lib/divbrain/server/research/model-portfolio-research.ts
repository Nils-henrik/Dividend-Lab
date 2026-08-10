import "server-only";

import { createModelPortfolioAdminClient } from "@/lib/model-portfolios/admin";
import type { DivBrainSource } from "../../sources";

const FINANCE_TRIGGER = /(?:aktie|bolag|börs|kurs|värdering|fundamental|teknisk|portfölj|köp|sälj|utdelning|ticker|stock|share|valuation|technical)/iu;
const MAX_ROWS = 100;
const MAX_SOURCES = 3;

type ResearchRow = {
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

function queryTerms(query: string): string[] {
  return query
    .normalize("NFC")
    .toLowerCase()
    .split(/[^\p{L}\p{N}-]+/u)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)
    .slice(0, 16);
}

function scoreRow(row: ResearchRow, terms: readonly string[]): number {
  const symbol = row.instrument_symbol.toLowerCase();
  const name = row.instrument_name.toLowerCase();
  const title = row.title.toLowerCase();
  const summary = row.summary.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (symbol === term) score += 20;
    if (symbol.includes(term)) score += 8;
    if (name.includes(term)) score += 5;
    if (title.includes(term)) score += 3;
    if (summary.includes(term)) score += 1;
  }
  return score;
}

function metadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function freshnessState(row: ResearchRow): DivBrainSource["freshnessState"] {
  const meta = metadata(row.metadata);
  const expiry = typeof meta.expires_at === "string" ? Date.parse(meta.expires_at) : NaN;
  if (Number.isFinite(expiry)) return expiry > Date.now() ? "current" : "stale";
  const published = Date.parse(row.published_at);
  if (!Number.isFinite(published)) return "unknown";
  return Date.now() - published <= 24 * 60 * 60 * 1000 ? "current" : "dated";
}

function verificationState(row: ResearchRow): DivBrainSource["verificationState"] {
  const meta = metadata(row.metadata);
  if (meta.verification_state === "verified") return "verified";
  if (meta.verification_state === "internally_curated") return "internally_curated";
  return "unverified";
}

function category(row: ResearchRow): DivBrainSource["category"] {
  const meta = metadata(row.metadata);
  if (meta.primary_source === "eodhd" || meta.primary_source === "mixed") return "market_data_provider";
  if (meta.research_kind === "candidate_bundle") return "internal_structured_data";
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

export async function loadModelPortfolioResearchSources(query: string): Promise<readonly DivBrainSource[]> {
  const normalized = query.normalize("NFC").trim();
  if (!normalized || (!FINANCE_TRIGGER.test(normalized) && !/[A-Z]{2,6}(?:[-.][A-Z0-9]{1,4})?/.test(normalized))) {
    return [];
  }

  const supabase = createModelPortfolioAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("model_portfolio_research_snapshots")
    .select("id,instrument_symbol,exchange,instrument_name,kind,publisher,source_url,published_at,verified_at,title,summary,metadata")
    .order("verified_at", { ascending: false })
    .limit(MAX_ROWS);
  if (error) return [];

  const terms = queryTerms(normalized);
  return ((data ?? []) as ResearchRow[])
    .map((row) => ({ row, score: scoreRow(row, terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Date.parse(b.row.verified_at) - Date.parse(a.row.verified_at))
    .slice(0, MAX_SOURCES)
    .map(({ row }): DivBrainSource => ({
      id: `portfolio-research:${row.id}`,
      title: row.title.slice(0, 200),
      category: category(row),
      verificationState: verificationState(row),
      freshnessState: freshnessState(row),
      publisher: row.publisher.slice(0, 120),
      canonicalUrl: safeUrl(row.source_url),
      publishedAt: row.published_at,
      retrievedAt: new Date().toISOString(),
      dataAsOf: row.published_at,
      attribution: `${row.instrument_name} (${row.instrument_symbol}.${row.exchange})`,
      excerpt: row.summary.slice(0, 1500),
      recordRef: row.id,
      schemaVersion: 1,
    }));
}
