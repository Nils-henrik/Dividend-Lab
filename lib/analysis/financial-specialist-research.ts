import type { DivLabResearchPacket } from "./deep-research";
import type { AnalysisEvidence } from "./evidence";

export const DIVLAB_FINANCIAL_SPECIALIST_RESEARCH_VERSION =
  "financial-specialist-research-v1" as const;

export type FinancialSpecialistMetric = {
  value: number | null;
  unit: string;
  sourceIds: string[];
  status: "confirmed" | "missing";
};

export type DivLabFinancialSpecialistResearch = {
  version: typeof DIVLAB_FINANCIAL_SPECIALIST_RESEARCH_VERSION;
  specialistType: "investment_company" | "asset_manager";
  status: "research_ready" | "insufficient";
  blockers: string[];
  warnings: string[];
  metrics: {
    navPerShare: FinancialSpecialistMetric;
    discountToNavPct: FinancialSpecialistMetric;
    netDebtRatioPct: FinancialSpecialistMetric;
    totalAumEurBn: FinancialSpecialistMetric;
    feeGeneratingAumEurBn: FinancialSpecialistMetric;
    feeAumSharePct: FinancialSpecialistMetric;
    trailingPe: FinancialSpecialistMetric;
  };
};

function parseNumeric(raw: string): number | null {
  const cleaned = raw
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, "")
    .replace(/,(?=\d{1,3}(?:\D|$))/g, ".")
    .replace(/,(?=\d{3}(?:\D|$))/g, "")
    .replace(/[^0-9.+-]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function normalizeEvidenceText(value: string): string {
  // PDF/text layers can contain invisible Unicode format controls between a
  // currency symbol, digits and unit. They carry no financial meaning but can
  // otherwise break an exact source-bound regex. Remove only category Cf;
  // visible wording, currency, values and scale tokens remain unchanged.
  return value.replace(/\p{Cf}/gu, "");
}

function evidenceText(item: AnalysisEvidence): string {
  return normalizeEvidenceText(`${item.documentExcerpt ?? ""}\n${item.content}`);
}

function metric(
  value: number | null,
  unit: string,
  sourceIds: string[] = [],
): FinancialSpecialistMetric {
  return {
    value,
    unit,
    sourceIds: [...new Set(sourceIds)],
    status: value !== null && Number.isFinite(value) ? "confirmed" : "missing",
  };
}

function findMetric(
  evidence: readonly AnalysisEvidence[],
  patterns: readonly RegExp[],
): { value: number; sourceId: string } | null {
  const ordered = [...evidence].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
  for (const item of ordered) {
    if (!item.primary || !item.documentRetrieved) continue;
    const text = evidenceText(item);
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      const raw = match?.[1];
      if (!raw) continue;
      const value = parseNumeric(raw);
      if (value !== null && value > 0) {
        return { value, sourceId: item.sourceId };
      }
    }
  }
  return null;
}

function findSignedPercent(
  evidence: readonly AnalysisEvidence[],
  patterns: readonly RegExp[],
): { value: number; sourceId: string } | null {
  const ordered = [...evidence].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
  for (const item of ordered) {
    if (!item.primary || !item.documentRetrieved) continue;
    const text = evidenceText(item);
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      const raw = match?.[1];
      if (!raw) continue;
      const value = parseNumeric(raw);
      if (value !== null && Number.isFinite(value)) {
        return { value, sourceId: item.sourceId };
      }
    }
  }
  return null;
}

const NAV_PATTERNS = [
  /(?:SEK|kr)\s*(\d{2,4}(?:[.,]\d+)?)\s*(?:per share|per aktie)[^\n.]{0,80}(?:net asset value|NAV|substansvärde)/i,
  /(?:net asset value|NAV|substansvärde)[^\n.]{0,220}?(?:SEK|kr)\s*(\d{2,4}(?:[.,]\d+)?)\s*(?:per share|per aktie)/i,
  /(?:net asset value|substansvärde)[^\n.]{0,220}?(\d{2,4}(?:[.,]\d+)?)\s*(?:SEK|kr)\s*(?:per share|per aktie)/i,
] as const;

const NET_DEBT_RATIO_PATTERNS = [
  /(?:net debt ratio|nettoskuldsättningsgrad)[^\n.]{0,100}?(-?\d{1,2}(?:[.,]\d+)?)\s*(?:%|percent|procent)/i,
] as const;

const AUM_UNIT = String.raw`(?:billion|bn|mdr|miljarder?)`;
const AUM_VALUE = String.raw`(\d{2,4}(?:[.,]\d+)?)`;

const TOTAL_AUM_PATTERNS = [
  new RegExp(String.raw`(?:total|totalt)\s+AUM[^\n.]{0,100}?(?:EUR|€)\s*${AUM_VALUE}\s*${AUM_UNIT}`, "i"),
  new RegExp(String.raw`(?:EUR|€)\s*${AUM_VALUE}\s*${AUM_UNIT}[^\n.]{0,100}?(?:total|totalt)\s+AUM`, "i"),
  /(?:EUR|€)\s*(\d{2,4}(?:[.,]\d+)?)\s*(?:billion|bn|mdr|miljarder?)[^\n.]{0,90}?(?:total )?assets under management/i,
  /(?:total )?assets under management[^\n.]{0,90}?(?:EUR|€)\s*(\d{2,4}(?:[.,]\d+)?)\s*(?:billion|bn|mdr|miljarder?)/i,
] as const;

const FEE_AUM_PATTERNS = [
  new RegExp(String.raw`\bFAUM\b[^\n.]{0,100}?(?:EUR|€)\s*${AUM_VALUE}\s*${AUM_UNIT}`, "i"),
  new RegExp(String.raw`(?:EUR|€)\s*${AUM_VALUE}\s*${AUM_UNIT}[^\n.]{0,100}?\bFAUM\b`, "i"),
  /(?:EUR|€)\s*(\d{2,4}(?:[.,]\d+)?)\s*(?:billion|bn|mdr|miljarder?)\s*(?:in|of)?\s*fee[- ]generating (?:assets under management|AUM)/i,
  /fee[- ]generating (?:assets under management|AUM)[^\n.]{0,90}?(?:EUR|€)\s*(\d{2,4}(?:[.,]\d+)?)\s*(?:billion|bn|mdr|miljarder?)/i,
] as const;

export function buildFinancialSpecialistResearch(input: {
  basePacket: DivLabResearchPacket;
}): DivLabFinancialSpecialistResearch {
  const specialistType = input.basePacket.companyClassification.type;
  if (
    specialistType !== "investment_company" &&
    specialistType !== "asset_manager"
  ) {
    throw new Error("financial_specialist_research_requires_supported_classification");
  }

  const evidence = input.basePacket.evidence;
  const nav = findMetric(evidence, NAV_PATTERNS);
  const debtRatio = findSignedPercent(evidence, NET_DEBT_RATIO_PATTERNS);
  const totalAum = findMetric(evidence, TOTAL_AUM_PATTERNS);
  const feeAum = findMetric(evidence, FEE_AUM_PATTERNS);
  const trailingPeValue = input.basePacket.valuation.trailing.pe;
  const trailingPeSources =
    input.basePacket.valuationProvenance.measures.pe.sourceIds;

  const navPerShare = metric(
    nav?.value ?? null,
    input.basePacket.instrument.currency,
    nav ? [nav.sourceId] : [],
  );
  const discount =
    nav?.value && nav.value > 0
      ? 1 - input.basePacket.instrument.currentPrice / nav.value
      : null;
  const discountToNavPct = metric(
    discount === null ? null : discount * 100,
    "%",
    nav ? [nav.sourceId] : [],
  );
  const netDebtRatioPct = metric(
    debtRatio?.value ?? null,
    "%",
    debtRatio ? [debtRatio.sourceId] : [],
  );
  const totalAumEurBn = metric(
    totalAum?.value ?? null,
    "EUR bn",
    totalAum ? [totalAum.sourceId] : [],
  );
  const feeGeneratingAumEurBn = metric(
    feeAum?.value ?? null,
    "EUR bn",
    feeAum ? [feeAum.sourceId] : [],
  );
  const feeAumSharePct = metric(
    totalAum?.value && feeAum?.value && totalAum.value > 0
      ? (feeAum.value / totalAum.value) * 100
      : null,
    "%",
    totalAum && feeAum ? [totalAum.sourceId, feeAum.sourceId] : [],
  );
  const trailingPe = metric(
    trailingPeValue,
    "x",
    trailingPeValue !== null ? trailingPeSources : [],
  );

  const blockers: string[] = [];
  const warnings: string[] = [];
  if (specialistType === "investment_company") {
    if (navPerShare.status !== "confirmed") {
      blockers.push("investment_company_nav_per_share_missing");
    }
    if (discountToNavPct.status !== "confirmed") {
      blockers.push("investment_company_discount_missing");
    }
    if (netDebtRatioPct.status !== "confirmed") {
      warnings.push("investment_company_net_debt_ratio_missing");
    }
  } else {
    if (totalAumEurBn.status !== "confirmed") {
      blockers.push("asset_manager_total_aum_missing");
    }
    if (feeGeneratingAumEurBn.status !== "confirmed") {
      blockers.push("asset_manager_fee_aum_missing");
    }
    if (trailingPe.status !== "confirmed") {
      blockers.push("asset_manager_trailing_pe_missing");
    }
  }

  return {
    version: DIVLAB_FINANCIAL_SPECIALIST_RESEARCH_VERSION,
    specialistType,
    status: blockers.length === 0 ? "research_ready" : "insufficient",
    blockers,
    warnings,
    metrics: {
      navPerShare,
      discountToNavPct,
      netDebtRatioPct,
      totalAumEurBn,
      feeGeneratingAumEurBn,
      feeAumSharePct,
      trailingPe,
    },
  };
}
