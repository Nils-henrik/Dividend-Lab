import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelPortfolioEvidence } from "./decision";
import type { ResearchCandidate } from "./research";
import type { DelayedQuote } from "./eodhd";

export type ResearchFundamentalsSource = "none" | "unavailable" | "market_only" | "yahoo" | "eodhd";

export type ResearchSnapshotMetadata = {
  research_kind: "candidate_bundle" | "google_discovery";
  expires_at: string;
  primary_source: "yahoo_finance" | "eodhd" | "google" | "mixed";
  verification_state: "verified" | "internally_curated" | "unverified";
  candidate?: ResearchCandidate;
  quote?: DelayedQuote | null;
  fundamentals_source?: ResearchFundamentalsSource;
  yahoo_symbol?: string;
  currency?: string | null;
  source_urls?: string[];
};

export type StoredCandidateBundle = {
  id: string;
  symbol: string;
  exchange: string;
  name: string;
  publisher: string;
  sourceUrl: string;
  publishedAt: string;
  verifiedAt: string;
  summary: string;
  candidate: ResearchCandidate;
  quote: DelayedQuote | null;
  fundamentalsSource: ResearchFundamentalsSource;
  metadata: ResearchSnapshotMetadata;
};

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
  content_hash: string;
  metadata: unknown;
};

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function metadataFromUnknown(value: unknown): ResearchSnapshotMetadata | null {
  const raw = objectValue(value);
  if (!raw || raw.research_kind !== "candidate_bundle") return null;
  if (typeof raw.expires_at !== "string" || typeof raw.primary_source !== "string") return null;
  const candidate = objectValue(raw.candidate) as ResearchCandidate | null;
  if (!candidate || typeof candidate.symbol !== "string" || typeof candidate.exchange !== "string") return null;
  const quote = raw.quote === null || objectValue(raw.quote) ? (raw.quote as DelayedQuote | null) : null;
  const fundamentalsSource = typeof raw.fundamentals_source === "string"
    ? (raw.fundamentals_source as ResearchFundamentalsSource)
    : "unavailable";
  return {
    research_kind: "candidate_bundle",
    expires_at: raw.expires_at,
    primary_source: raw.primary_source as ResearchSnapshotMetadata["primary_source"],
    verification_state:
      raw.verification_state === "verified" || raw.verification_state === "internally_curated"
        ? raw.verification_state
        : "unverified",
    candidate,
    quote,
    fundamentals_source: fundamentalsSource,
    yahoo_symbol: typeof raw.yahoo_symbol === "string" ? raw.yahoo_symbol : undefined,
    currency: typeof raw.currency === "string" || raw.currency === null ? raw.currency : undefined,
    source_urls: Array.isArray(raw.source_urls)
      ? raw.source_urls.filter((item): item is string => typeof item === "string")
      : undefined,
  };
}

function isFresh(expiresAt: string, now: Date): boolean {
  const expiry = Date.parse(expiresAt);
  return Number.isFinite(expiry) && expiry > now.getTime();
}

function safeHttps(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "https://divlab.se/portfolios";
  } catch {
    return "https://divlab.se/portfolios";
  }
}

export function buildResearchContentHash(input: {
  symbol: string;
  exchange: string;
  publishedAt: string;
  summary: string;
  sourceUrl: string;
}): string {
  return createHash("sha256")
    .update([input.symbol, input.exchange, input.publishedAt, input.summary, input.sourceUrl].join("\n"))
    .digest("hex");
}

export async function loadFreshCandidateBundle(input: {
  supabase: SupabaseClient;
  symbol: string;
  exchange: string;
  now: Date;
}): Promise<StoredCandidateBundle | null> {
  const { data, error } = await input.supabase
    .from("model_portfolio_research_snapshots")
    .select("id,instrument_symbol,exchange,instrument_name,kind,publisher,source_url,published_at,verified_at,title,summary,content_hash,metadata")
    .eq("instrument_symbol", input.symbol)
    .eq("exchange", input.exchange)
    .order("verified_at", { ascending: false })
    .limit(8);
  if (error) return null;

  for (const raw of data ?? []) {
    const row = raw as ResearchRow;
    const metadata = metadataFromUnknown(row.metadata);
    if (!metadata || !isFresh(metadata.expires_at, input.now) || !metadata.candidate) continue;
    return {
      id: row.id,
      symbol: row.instrument_symbol,
      exchange: row.exchange,
      name: row.instrument_name,
      publisher: row.publisher,
      sourceUrl: row.source_url,
      publishedAt: row.published_at,
      verifiedAt: row.verified_at,
      summary: row.summary,
      candidate: metadata.candidate,
      quote: metadata.quote ?? null,
      fundamentalsSource: metadata.fundamentals_source ?? "unavailable",
      metadata,
    };
  }
  return null;
}

export async function persistCandidateBundle(input: {
  supabase: SupabaseClient;
  symbol: string;
  exchange: string;
  name: string;
  publisher: string;
  sourceUrl: string;
  publishedAt: string;
  verifiedAt: string;
  summary: string;
  metadata: ResearchSnapshotMetadata;
}): Promise<void> {
  const sourceUrl = safeHttps(input.sourceUrl);
  const contentHash = buildResearchContentHash({
    symbol: input.symbol,
    exchange: input.exchange,
    publishedAt: input.publishedAt,
    summary: input.summary,
    sourceUrl,
  });
  const { error } = await input.supabase.from("model_portfolio_research_snapshots").insert({
    instrument_symbol: input.symbol,
    exchange: input.exchange,
    instrument_name: input.name,
    kind: "market_data",
    publisher: input.publisher.slice(0, 120),
    source_url: sourceUrl,
    published_at: input.publishedAt,
    verified_at: input.verifiedAt,
    title: `${input.name} (${input.symbol}.${input.exchange}) – DivLab research snapshot`.slice(0, 240),
    summary: input.summary.slice(0, 6000),
    content_hash: contentHash,
    metadata: input.metadata,
  });
  if (error && error.code !== "23505") throw new Error(`research_snapshot_insert_failed:${error.code ?? "unknown"}`);
}

export async function persistGoogleResearchHit(input: {
  supabase: SupabaseClient;
  symbol: string;
  exchange: string;
  name: string;
  title: string;
  snippet: string;
  url: string;
  fetchedAt: string;
}): Promise<void> {
  const publishedAt = input.fetchedAt;
  const contentHash = buildResearchContentHash({
    symbol: input.symbol,
    exchange: input.exchange,
    publishedAt,
    summary: input.snippet,
    sourceUrl: input.url,
  });
  const { error } = await input.supabase.from("model_portfolio_research_snapshots").insert({
    instrument_symbol: input.symbol,
    exchange: input.exchange,
    instrument_name: input.name,
    kind: "news",
    publisher: "Google Custom Search",
    source_url: safeHttps(input.url),
    published_at: publishedAt,
    verified_at: input.fetchedAt,
    title: input.title.slice(0, 240),
    summary: input.snippet.slice(0, 6000),
    content_hash: contentHash,
    metadata: {
      research_kind: "google_discovery",
      expires_at: new Date(Date.parse(input.fetchedAt) + 24 * 60 * 60 * 1000).toISOString(),
      primary_source: "google",
      verification_state: "unverified",
    },
  });
  if (error && error.code !== "23505") throw new Error(`google_research_snapshot_insert_failed:${error.code ?? "unknown"}`);
}

export function storedBundleToEvidence(bundle: StoredCandidateBundle): ModelPortfolioEvidence {
  return {
    id: `research-cache:${bundle.id}`,
    kind: "market_data",
    publisher: bundle.publisher,
    publishedAt: bundle.publishedAt,
    verifiedAt: bundle.verifiedAt,
    title: `${bundle.name} (${bundle.symbol}.${bundle.exchange}) – återanvänd research`,
    summary: bundle.summary,
  };
}
