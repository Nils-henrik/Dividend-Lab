import "server-only";

import { DIVLAB_ANALYST_QUALITY_GATE_VERSION } from "@/lib/analysis/analyst-quality-gate";
import { DIVLAB_ANALYST_SCHEMA_VERSION } from "@/lib/analysis/analyst-schema";
import { DIVLAB_BANK_ANALYST_QUALITY_GATE_VERSION } from "@/lib/analysis/bank-analyst-quality-gate";
import { DIVLAB_BANK_ANALYST_SCHEMA_VERSION } from "@/lib/analysis/bank-analyst-schema";
import { DIVLAB_FINANCIAL_SPECIALIST_ANALYST_QUALITY_GATE_VERSION } from "@/lib/analysis/financial-specialist-analyst-quality-gate";
import { DIVLAB_FINANCIAL_SPECIALIST_ANALYST_SCHEMA_VERSION } from "@/lib/analysis/financial-specialist-schema";
import { createDivLabAnalysisReadClient } from "@/lib/analysis/read-client";
import { absoluteUrl } from "@/lib/seo/site";
import type { SitemapEntry } from "./sitemap-entries";

type VersionRow = { id: string; analysis_id: string; published_at: string; version_number: number };
const ALLOWED = new Set([
  `${DIVLAB_ANALYST_SCHEMA_VERSION}|${DIVLAB_ANALYST_QUALITY_GATE_VERSION}`,
  `${DIVLAB_BANK_ANALYST_SCHEMA_VERSION}|${DIVLAB_BANK_ANALYST_QUALITY_GATE_VERSION}`,
  `${DIVLAB_FINANCIAL_SPECIALIST_ANALYST_SCHEMA_VERSION}|${DIVLAB_FINANCIAL_SPECIALIST_ANALYST_QUALITY_GATE_VERSION}`,
]);

export async function listPublishedAnalysisSitemapEntries(): Promise<SitemapEntry[]> {
  const supabase = await createDivLabAnalysisReadClient(); if (!supabase) return [];
  try {
    const { data: versionsData, error: versionsError } = await supabase.from("divlab_analysis_versions").select("id,analysis_id,published_at,version_number").eq("publishable", true).not("published_at", "is", null).order("published_at", { ascending: false }).limit(1000);
    if (versionsError || !versionsData?.length) return [];
    const latestByAnalysis = new Map<string, VersionRow>();
    for (const row of versionsData as VersionRow[]) { const current = latestByAnalysis.get(row.analysis_id); if (!current || row.version_number > current.version_number) latestByAnalysis.set(row.analysis_id, row); }
    const versions = [...latestByAnalysis.values()]; const versionIds = versions.map((row) => row.id); const analysisIds = versions.map((row) => row.analysis_id);
    const [{ data: analysesData, error: analysesError }, { data: contentsData, error: contentsError }] = await Promise.all([
      supabase.from("divlab_analyses").select("id,slug,status").in("id", analysisIds).eq("status", "published"),
      supabase.from("divlab_analysis_contents").select("analysis_version_id,schema_version,analyst_quality_gate_version").in("analysis_version_id", versionIds),
    ]);
    if (analysesError || contentsError || !analysesData || !contentsData) return [];
    const contentVersionIds = new Set((contentsData as { analysis_version_id: string; schema_version: string; analyst_quality_gate_version: string }[]).filter((row) => ALLOWED.has(`${row.schema_version}|${row.analyst_quality_gate_version}`)).map((row) => row.analysis_version_id));
    const versionByAnalysis = new Map(versions.map((row) => [row.analysis_id, row] as const));
    return (analysesData as { id: string; slug: string; status: string }[]).flatMap((analysis) => {
      const version = versionByAnalysis.get(analysis.id); if (!version || !contentVersionIds.has(version.id)) return [];
      const modified = new Date(version.published_at);
      return [{ url: absoluteUrl(`/analyses/${analysis.slug}`), ...(Number.isFinite(modified.getTime()) ? { lastModified: modified } : {}) }];
    });
  } catch { return []; }
}
