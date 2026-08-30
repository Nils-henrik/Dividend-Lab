import "server-only";

import { DIVLAB_ANALYST_QUALITY_GATE_VERSION, evaluateAnalystContentQuality, type DivLabAnalystQualityGate } from "./analyst-quality-gate";
import { DIVLAB_ANALYST_SCHEMA_VERSION, divLabAnalystDraftSchema, type DivLabAnalystDraft } from "./analyst-schema";
import { DIVLAB_BANK_ANALYST_QUALITY_GATE_VERSION, evaluateBankAnalystContentQuality, type DivLabBankAnalystQualityGate } from "./bank-analyst-quality-gate";
import { DIVLAB_BANK_ANALYST_SCHEMA_VERSION, divLabBankAnalystDraftSchema, type DivLabBankAnalystDraft } from "./bank-analyst-schema";
import type { DivLabBankResearchPacket } from "./bank-deep-research";
import type { DivLabResearchPacket } from "./deep-research";
import { DIVLAB_FINANCIAL_SPECIALIST_ANALYST_QUALITY_GATE_VERSION, evaluateFinancialSpecialistAnalystQuality, type DivLabFinancialSpecialistAnalystQualityGate } from "./financial-specialist-analyst-quality-gate";
import { DIVLAB_FINANCIAL_SPECIALIST_ANALYST_SCHEMA_VERSION, divLabFinancialSpecialistAnalystDraftSchema, type DivLabFinancialSpecialistAnalystDraft } from "./financial-specialist-schema";
import type { DivLabFinancialSpecialistResearchPacket } from "./financial-specialist-deep-research";
import { createDivLabAnalysisReadClient } from "./read-client";
import { buildVersionedResearchPacketFromRow } from "./research-version-read";

export type PublishedAnalysisBase = { analysisId: string; versionId: string; versionNumber: number; slug: string; publishedAt: string; generatedAt: string };
export type PublishedOperatingAnalysis = PublishedAnalysisBase & { kind: "operating_company"; packet: DivLabResearchPacket; draft: DivLabAnalystDraft; analystQualityGate: DivLabAnalystQualityGate };
export type PublishedBankAnalysis = PublishedAnalysisBase & { kind: "bank"; packet: DivLabBankResearchPacket; draft: DivLabBankAnalystDraft; analystQualityGate: DivLabBankAnalystQualityGate };
export type PublishedFinancialSpecialistAnalysis = PublishedAnalysisBase & { kind: "financial_specialist"; packet: DivLabFinancialSpecialistResearchPacket; draft: DivLabFinancialSpecialistAnalystDraft; analystQualityGate: DivLabFinancialSpecialistAnalystQualityGate };
/** Backward-compatible name used by the existing operating-company article. */
export type PublishedDivLabAnalysis = PublishedOperatingAnalysis;
export type PublishedAnyDivLabAnalysis = PublishedOperatingAnalysis | PublishedBankAnalysis | PublishedFinancialSpecialistAnalysis;

type AnalysisRow = { id: string; slug: string; status: string };
type VersionRow = { id: string; analysis_id: string; version_number: number; engine_version: string; data_as_of: string; currency: string; current_price: number | string; research_packet: unknown; quality_gate: unknown; publishable: boolean; published_at: string | null };
type ContentRow = { id: string; analysis_version_id: string; schema_version: string; analyst_draft: unknown; generated_at: string; analyst_quality_gate_version: string; analyst_quality_gate: unknown };

function safeSlug(value: string): string | null { const normalized = value.trim().toLowerCase(); return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized) ? normalized.slice(0, 120) : null; }
function iso(value: string | null | undefined): string | null { if (!value) return null; const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toISOString() : null; }
function object(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function validImmutablePacket(value: unknown, expectedVersion: string): value is Record<string, unknown> {
  const packet = object(value); const chart = object(packet?.chart); const quality = object(packet?.qualityGate); const instrument = object(packet?.instrument);
  return Boolean(packet && packet.version === expectedVersion && instrument && typeof instrument.symbol === "string" && typeof instrument.name === "string" && chart?.version === "analysis-chart-v1" && Number(chart.sessions) >= 30 && Array.isArray(chart.bars) && chart.bars.length === Number(chart.sessions) && quality?.publishable === true && Number(quality.score) === 100 && Array.isArray(quality.blockers) && quality.blockers.length === 0 && Array.isArray(packet.sources));
}

async function loadPublishedAnalysisBySlug(slug: string): Promise<PublishedAnyDivLabAnalysis | null> {
  const normalizedSlug = safeSlug(slug); if (!normalizedSlug) return null;
  const supabase = await createDivLabAnalysisReadClient(); if (!supabase) return null;
  const { data: analysisData, error: analysisError } = await supabase.from("divlab_analyses").select("id,slug,status").eq("slug", normalizedSlug).eq("status", "published").maybeSingle();
  if (analysisError || !analysisData) return null; const analysis = analysisData as AnalysisRow;
  const { data: versionData, error: versionError } = await supabase.from("divlab_analysis_versions").select("id,analysis_id,version_number,engine_version,data_as_of,currency,current_price,research_packet,quality_gate,publishable,published_at").eq("analysis_id", analysis.id).eq("publishable", true).not("published_at", "is", null).order("version_number", { ascending: false }).limit(1).maybeSingle();
  if (versionError || !versionData) return null; const version = versionData as VersionRow; const publishedAt = iso(version.published_at); if (!publishedAt) return null;
  const { data: contentData, error: contentError } = await supabase.from("divlab_analysis_contents").select("id,analysis_version_id,schema_version,analyst_draft,generated_at,analyst_quality_gate_version,analyst_quality_gate").eq("analysis_version_id", version.id).order("generated_at", { ascending: false }).limit(1).maybeSingle();
  if (contentError || !contentData) return null; const content = contentData as ContentRow; const generatedAt = iso(content.generated_at); if (!generatedAt) return null;
  const base: PublishedAnalysisBase = { analysisId: analysis.id, versionId: version.id, versionNumber: version.version_number, slug: analysis.slug, publishedAt, generatedAt };

  if (content.schema_version === DIVLAB_ANALYST_SCHEMA_VERSION && content.analyst_quality_gate_version === DIVLAB_ANALYST_QUALITY_GATE_VERSION) {
    let packet: DivLabResearchPacket; try { packet = buildVersionedResearchPacketFromRow({ row: version }).packet; } catch { return null; }
    if (packet.chart.version !== "analysis-chart-v1") return null;
    let draft: DivLabAnalystDraft; try { draft = divLabAnalystDraftSchema.parse(content.analyst_draft); } catch { return null; }
    const analystQualityGate = evaluateAnalystContentQuality({ packet, draft });
    if (!analystQualityGate.publishable) return null;
    if (analystQualityGate.score !== 100) return null;
    return { ...base, kind: "operating_company", packet, draft, analystQualityGate };
  }
  if (content.schema_version === DIVLAB_BANK_ANALYST_SCHEMA_VERSION && content.analyst_quality_gate_version === DIVLAB_BANK_ANALYST_QUALITY_GATE_VERSION && validImmutablePacket(version.research_packet, "deep-research-v3-bank")) {
    const packet = version.research_packet as unknown as DivLabBankResearchPacket; const parsed = divLabBankAnalystDraftSchema.safeParse(content.analyst_draft);
    if (!parsed.success || !packet.bankResearch || !packet.bankScenarios) return null;
    const analystQualityGate = evaluateBankAnalystContentQuality({ bankResearch: packet.bankResearch, draft: parsed.data, scenarios: packet.bankScenarios }); if (!analystQualityGate.publishable || analystQualityGate.score !== 100) return null;
    return { ...base, kind: "bank", packet, draft: parsed.data, analystQualityGate };
  }
  if (content.schema_version === DIVLAB_FINANCIAL_SPECIALIST_ANALYST_SCHEMA_VERSION && content.analyst_quality_gate_version === DIVLAB_FINANCIAL_SPECIALIST_ANALYST_QUALITY_GATE_VERSION && validImmutablePacket(version.research_packet, "deep-research-v3-financial-specialist")) {
    const packet = version.research_packet as unknown as DivLabFinancialSpecialistResearchPacket; const parsed = divLabFinancialSpecialistAnalystDraftSchema.safeParse(content.analyst_draft);
    if (!parsed.success || !packet.specialistResearch || !packet.specialistScenarios) return null;
    const analystQualityGate = evaluateFinancialSpecialistAnalystQuality({ research: packet.specialistResearch, draft: parsed.data, scenarios: packet.specialistScenarios }); if (!analystQualityGate.publishable || analystQualityGate.score !== 100) return null;
    return { ...base, kind: "financial_specialist", packet, draft: parsed.data, analystQualityGate };
  }
  return null;
}

export function analysisExecutiveSummary(analysis: PublishedAnyDivLabAnalysis): string { return analysis.draft.executiveSummary; }
export function analysisView(analysis: PublishedAnyDivLabAnalysis) { return analysis.draft.view; }
export function analysisRisk(analysis: PublishedAnyDivLabAnalysis) { return analysis.draft.riskLevel; }
export function analysisConfidence(analysis: PublishedAnyDivLabAnalysis) { return analysis.draft.confidence; }
export function analysisBaseValue(analysis: PublishedAnyDivLabAnalysis): number | null {
  if (analysis.kind === "operating_company") return analysis.packet.valuation.scenarios.find((scenario) => scenario.name === "base")?.valuePerShare ?? null;
  if (analysis.kind === "bank") return analysis.packet.bankScenarios.baseCaseValue;
  return analysis.packet.specialistScenarios.baseCaseValue;
}
export async function getPublishedDivLabAnalysis(slug: string): Promise<PublishedAnyDivLabAnalysis | null> { try { return await loadPublishedAnalysisBySlug(slug); } catch { return null; } }
export async function listPublishedDivLabAnalyses(limit = 24): Promise<PublishedAnyDivLabAnalysis[]> {
  const supabase = await createDivLabAnalysisReadClient(); if (!supabase) return [];
  const safeLimit = Math.max(1, Math.min(60, Math.trunc(limit)));
  const { data, error } = await supabase.from("divlab_analyses").select("slug").eq("status", "published").order("updated_at", { ascending: false }).limit(safeLimit); if (error || !data) return [];
  const results = await Promise.all((data as { slug: string }[]).map((row) => loadPublishedAnalysisBySlug(row.slug)));
  return results.filter((item): item is PublishedAnyDivLabAnalysis => item !== null).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
