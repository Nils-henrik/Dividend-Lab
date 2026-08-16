import "server-only";

import {
  DIVLAB_ANALYST_QUALITY_GATE_VERSION,
  evaluateAnalystContentQuality,
  type DivLabAnalystQualityGate,
} from "./analyst-quality-gate";
import {
  DIVLAB_ANALYST_SCHEMA_VERSION,
  divLabAnalystDraftSchema,
  type DivLabAnalystDraft,
} from "./analyst-schema";
import type { DivLabResearchPacket } from "./deep-research";
import { createDivLabAnalysisReadClient } from "./read-client";
import { buildVersionedResearchPacketFromRow } from "./research-version-read";

export type PublishedDivLabAnalysis = {
  analysisId: string;
  versionId: string;
  versionNumber: number;
  slug: string;
  publishedAt: string;
  generatedAt: string;
  packet: DivLabResearchPacket;
  draft: DivLabAnalystDraft;
  analystQualityGate: DivLabAnalystQualityGate;
};

type AnalysisRow = {
  id: string;
  slug: string;
  status: string;
};

type VersionRow = {
  id: string;
  analysis_id: string;
  version_number: number;
  engine_version: string;
  data_as_of: string;
  currency: string;
  current_price: number | string;
  research_packet: unknown;
  quality_gate: unknown;
  publishable: boolean;
  published_at: string | null;
};

type ContentRow = {
  id: string;
  analysis_version_id: string;
  schema_version: string;
  analyst_draft: unknown;
  generated_at: string;
  analyst_quality_gate_version: string;
  analyst_quality_gate: unknown;
};

function safeSlug(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) return null;
  return normalized.slice(0, 120);
}

function iso(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

async function loadPublishedAnalysisBySlug(
  slug: string,
): Promise<PublishedDivLabAnalysis | null> {
  const normalizedSlug = safeSlug(slug);
  if (!normalizedSlug) return null;

  const supabase = await createDivLabAnalysisReadClient();
  if (!supabase) return null;

  const { data: analysisData, error: analysisError } = await supabase
    .from("divlab_analyses")
    .select("id,slug,status")
    .eq("slug", normalizedSlug)
    .eq("status", "published")
    .maybeSingle();

  if (analysisError || !analysisData) return null;
  const analysis = analysisData as AnalysisRow;

  const { data: versionData, error: versionError } = await supabase
    .from("divlab_analysis_versions")
    .select(
      "id,analysis_id,version_number,engine_version,data_as_of,currency,current_price,research_packet,quality_gate,publishable,published_at",
    )
    .eq("analysis_id", analysis.id)
    .eq("publishable", true)
    .not("published_at", "is", null)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionError || !versionData) return null;
  const version = versionData as VersionRow;
  const publishedAt = iso(version.published_at);
  if (!publishedAt) return null;

  let packet: DivLabResearchPacket;
  try {
    packet = buildVersionedResearchPacketFromRow({ row: version }).packet;
  } catch {
    return null;
  }

  // Public charting requires the immutable chart payload introduced for the
  // productized DivLab Analys experience. Never reload later bars for an older
  // packet because that would leak look-ahead information into history.
  if (
    !packet.chart ||
    packet.chart.version !== "analysis-chart-v1" ||
    packet.chart.sessions < 30 ||
    packet.chart.bars.length !== packet.chart.sessions
  ) {
    return null;
  }

  const { data: contentData, error: contentError } = await supabase
    .from("divlab_analysis_contents")
    .select(
      "id,analysis_version_id,schema_version,analyst_draft,generated_at,analyst_quality_gate_version,analyst_quality_gate",
    )
    .eq("analysis_version_id", version.id)
    .eq("schema_version", DIVLAB_ANALYST_SCHEMA_VERSION)
    .eq("analyst_quality_gate_version", DIVLAB_ANALYST_QUALITY_GATE_VERSION)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (contentError || !contentData) return null;
  const content = contentData as ContentRow;
  const generatedAt = iso(content.generated_at);
  if (!generatedAt) return null;

  let draft: DivLabAnalystDraft;
  try {
    draft = divLabAnalystDraftSchema.parse(content.analyst_draft);
  } catch {
    return null;
  }

  // Recompute the content gate from the immutable research + draft instead of
  // trusting only a stored boolean. Any methodology drift fails closed.
  const analystQualityGate = evaluateAnalystContentQuality({ packet, draft });
  if (!analystQualityGate.publishable) return null;

  return {
    analysisId: analysis.id,
    versionId: version.id,
    versionNumber: version.version_number,
    slug: analysis.slug,
    publishedAt,
    generatedAt,
    packet,
    draft,
    analystQualityGate,
  };
}

export async function getPublishedDivLabAnalysis(
  slug: string,
): Promise<PublishedDivLabAnalysis | null> {
  try {
    return await loadPublishedAnalysisBySlug(slug);
  } catch {
    return null;
  }
}

export async function listPublishedDivLabAnalyses(
  limit = 24,
): Promise<PublishedDivLabAnalysis[]> {
  const supabase = await createDivLabAnalysisReadClient();
  if (!supabase) return [];

  const safeLimit = Math.max(1, Math.min(60, Math.trunc(limit)));
  const { data, error } = await supabase
    .from("divlab_analyses")
    .select("slug")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(safeLimit);

  if (error || !data) return [];

  const results = await Promise.all(
    (data as { slug: string }[]).map((row) => loadPublishedAnalysisBySlug(row.slug)),
  );

  return results
    .filter((analysis): analysis is PublishedDivLabAnalysis => analysis !== null)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}
