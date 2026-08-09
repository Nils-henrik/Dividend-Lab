import "server-only";

import { createModelPortfolioAdminClient } from "./admin";
import type { ModelPortfolioEvidence } from "./engine/decision";

export type ResearchSnapshotKind = "company_report" | "regulatory_filing" | "company_release" | "news" | "market_data";

export type ResearchSnapshotInput = {
  instrumentSymbol: string;
  exchange: string;
  instrumentName: string;
  kind: ResearchSnapshotKind;
  publisher: string;
  sourceUrl: string;
  publishedAt: string;
  title: string;
  summary: string;
  contentHash: string;
  metadata?: Record<string, unknown>;
};

export type ResearchSnapshot = ResearchSnapshotInput & {
  id: string;
  verifiedAt: string;
};

function toEvidenceKind(kind: ResearchSnapshotKind): ModelPortfolioEvidence["kind"] {
  if (kind === "regulatory_filing") return "regulatory";
  return kind;
}

export async function upsertResearchSnapshot(input: ResearchSnapshotInput): Promise<ResearchSnapshot> {
  const supabase = createModelPortfolioAdminClient();
  if (!supabase) throw new Error("research_store_unavailable");

  const { data, error } = await supabase
    .from("model_portfolio_research_snapshots")
    .upsert(
      {
        instrument_symbol: input.instrumentSymbol,
        exchange: input.exchange,
        instrument_name: input.instrumentName,
        kind: input.kind,
        publisher: input.publisher,
        source_url: input.sourceUrl,
        published_at: input.publishedAt,
        title: input.title,
        summary: input.summary,
        content_hash: input.contentHash,
        metadata: input.metadata ?? {},
        verified_at: new Date().toISOString(),
      },
      { onConflict: "content_hash" },
    )
    .select("id,instrument_symbol,exchange,instrument_name,kind,publisher,source_url,published_at,title,summary,content_hash,metadata,verified_at")
    .single();

  if (error || !data) throw new Error("research_store_write_failed");
  return {
    id: String(data.id),
    instrumentSymbol: String(data.instrument_symbol),
    exchange: String(data.exchange),
    instrumentName: String(data.instrument_name),
    kind: data.kind as ResearchSnapshotKind,
    publisher: String(data.publisher),
    sourceUrl: String(data.source_url),
    publishedAt: String(data.published_at),
    title: String(data.title),
    summary: String(data.summary),
    contentHash: String(data.content_hash),
    metadata: (data.metadata ?? {}) as Record<string, unknown>,
    verifiedAt: String(data.verified_at),
  };
}

export async function loadResearchEvidence(input: {
  instrumentSymbol: string;
  exchange: string;
  limit?: number;
}): Promise<ModelPortfolioEvidence[]> {
  const supabase = createModelPortfolioAdminClient();
  if (!supabase) throw new Error("research_store_unavailable");
  const limit = Math.max(1, Math.min(input.limit ?? 12, 30));
  const { data, error } = await supabase
    .from("model_portfolio_research_snapshots")
    .select("id,kind,publisher,published_at,verified_at,title,summary")
    .eq("instrument_symbol", input.instrumentSymbol)
    .eq("exchange", input.exchange)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("research_store_read_failed");

  return (data ?? []).map((row) => ({
    id: String(row.id),
    kind: toEvidenceKind(row.kind as ResearchSnapshotKind),
    publisher: String(row.publisher),
    publishedAt: String(row.published_at),
    verifiedAt: String(row.verified_at),
    title: String(row.title),
    summary: String(row.summary),
  }));
}
