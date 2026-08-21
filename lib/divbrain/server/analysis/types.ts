import type { DivLabAnalystDraft } from "@/lib/analysis/analyst-schema";
import type { DivLabAnalystQualityGate } from "@/lib/analysis/analyst-quality-gate";
import type { AnalysisSource } from "@/lib/analysis/quality-gate";
import type { DivBrainSource } from "../../sources";

export const DIVBRAIN_DIVLAB_ANALYSIS_CONTEXT_VERSION =
  "divbrain-divlab-analysis-v1" as const;

export type DivBrainApprovedAnalysisRecord = {
  analysisId: string;
  analysisVersionId: string;
  versionNumber: number;
  symbol: string;
  exchange: string;
  name: string;
  slug: string;
  analysisStatus: "draft" | "published";
  engineVersion: string;
  dataAsOf: string;
  currentPrice: number;
  currency: string;
  publishedAt: string | null;
  analystDraft: DivLabAnalystDraft;
  analystQualityGate: DivLabAnalystQualityGate;
  sources: AnalysisSource[];
  /** Narrow deterministic facts needed for a compact DivBrain summary. */
  researchSummary: {
    baseScenarioValue: number | null;
    baseScenarioUpsideDownsidePct: number | null;
    nearestSupport: { lower: number; upper: number } | null;
    nearestResistance: { lower: number; upper: number } | null;
    resistanceState: string | null;
  };
};

export type DivBrainDivLabAnalysisRetrievalResult = {
  version: typeof DIVBRAIN_DIVLAB_ANALYSIS_CONTEXT_VERSION;
  record: DivBrainApprovedAnalysisRecord | null;
  sources: DivBrainSource[];
};
