import type { ModelPortfolioDecision } from "./decision";
import type { ModelPortfolioResearchPass } from "./eodhd-budget";
import type { ResearchCandidate } from "./research";

export type NarrativeCandidate = {
  symbol: string;
  exchange: string;
  name: string;
  held?: boolean;
  changePct?: number | null;
  qualityScore?: number;
  valuationScore?: number;
  dividendQualityScore?: number;
  catalystScore?: number;
  balanceSheetScore?: number;
  earningsRevisionScore?: number;
  technicalRegime?: string;
  technicalComposite?: number;
  priceMomentum20d?: number;
  reasons?: readonly string[];
};

function passLabel(pass: ModelPortfolioResearchPass): string {
  if (pass === "nordic_morning") return "Nordiska morgonpasset (09.20)";
  if (pass === "us_1550") return "USA-passet (15.50)";
  if (pass === "us_1830") return "USA-passet (18.30)";
  return "USA-passet (21.30)";
}

function actionLabel(action: ModelPortfolioDecision["action"]): string {
  if (action === "buy") return "KÖP";
  if (action === "sell") return "SÄLJ";
  if (action === "trim") return "MINSKA";
  if (action === "rebalance") return "OMVIKTA";
  return "AVVAKTA (HOLD)";
}

function formatPct(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function scorePhrase(label: string, value: number | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (value >= 0.7) return `stark ${label}`;
  if (value >= 0.55) return `stabil ${label}`;
  if (value >= 0.4) return `blandad ${label}`;
  return `svag ${label}`;
}

function candidateFindings(candidate: NarrativeCandidate): string {
  const parts: string[] = [];
  const move = formatPct(candidate.changePct);
  if (move) parts.push(`dagsrörelse ${move}`);
  if (candidate.technicalRegime) {
    parts.push(
      candidate.technicalComposite != null && Number.isFinite(candidate.technicalComposite)
        ? `trend ${candidate.technicalRegime} (${candidate.technicalComposite.toFixed(2)})`
        : `trend ${candidate.technicalRegime}`,
    );
  }
  for (const [label, value] of [
    ["värdering", candidate.valuationScore],
    ["kvalitet", candidate.qualityScore],
    ["utdelning", candidate.dividendQualityScore],
    ["balansräkning", candidate.balanceSheetScore],
    ["katalysator", candidate.catalystScore],
    ["revideringar", candidate.earningsRevisionScore],
  ] as const) {
    const phrase = scorePhrase(label, value);
    if (phrase) parts.push(phrase);
  }
  if (candidate.reasons?.length) {
    parts.push(`signaler: ${candidate.reasons.slice(0, 3).join(", ")}`);
  }
  if (!parts.length) return "begränsat underlag i detta pass";
  return parts.join("; ");
}

function listNames(candidates: readonly NarrativeCandidate[], limit = 6): string {
  if (!candidates.length) return "inga namn";
  return candidates
    .slice(0, limit)
    .map((item) => `${item.name} (${item.symbol}.${item.exchange})`)
    .join(", ");
}

export function toNarrativeCandidate(
  candidate: ResearchCandidate,
  names: ReadonlyMap<string, string>,
  extras?: { held?: boolean; changePct?: number | null },
): NarrativeCandidate {
  const key = `${candidate.symbol}.${candidate.exchange}`.toUpperCase();
  return {
    symbol: candidate.symbol,
    exchange: candidate.exchange,
    name: names.get(key) ?? candidate.symbol,
    held: extras?.held,
    changePct: extras?.changePct,
    qualityScore: candidate.qualityScore,
    valuationScore: candidate.valuationScore,
    dividendQualityScore: candidate.dividendQualityScore,
    catalystScore: candidate.catalystScore,
    balanceSheetScore: candidate.balanceSheetScore,
    earningsRevisionScore: candidate.earningsRevisionScore,
    technicalRegime: candidate.technicalAnalysis?.trend.regime,
    technicalComposite: candidate.technicalAnalysis?.scores.composite,
    priceMomentum20d: candidate.priceMomentum20d,
    reasons: undefined,
  };
}

/**
 * User-facing Swedish summary for Senaste beslut.
 * Describes investigated names, findings and decision framing — not API/cache plumbing.
 */
export function buildInvestorFacingResearchSummary(input: {
  pass: ModelPortfolioResearchPass;
  investigated: readonly NarrativeCandidate[];
  topCandidates: readonly NarrativeCandidate[];
}): string {
  const investigated = input.investigated;
  const top = input.topCandidates.slice(0, 4);
  const held = investigated.filter((item) => item.held);

  const findingLines = top.map((item) => {
    const heldNote = item.held ? " (befintligt innehav)" : "";
    return `${item.name}${heldNote}: ${candidateFindings(item)}.`;
  });

  const parts = [
    `${passLabel(input.pass)} granskade ${investigated.length} aktier mer i detalj` +
      (held.length ? `, varav ${held.length} befintliga innehav` : "") +
      ".",
    investigated.length
      ? `Djupare analys omfattade bland annat ${listNames(investigated, 8)}.`
      : "Inga kandidater hade tillräckligt underlag för djupare analys i detta pass.",
    top.length
      ? `Mest relevanta kandidater: ${listNames(top, 4)}.`
      : "Ingen kandidat stack ut tillräckligt tydligt i ranking.",
    ...findingLines,
    "Teknisk analys väger in som stöd men får aldrig ensam avgöra köp eller sälj. Saknade fundamentala värden lämnas saknade.",
  ];

  return parts.filter(Boolean).join(" ");
}

export function buildInvestorFacingDecisionRationale(input: {
  researchSummary: string;
  decision: ModelPortfolioDecision;
}): string {
  const research = input.researchSummary.trim();
  const decisionText = input.decision.rationale.trim();
  const action = actionLabel(input.decision.action);
  const instrument =
    input.decision.symbol && input.decision.exchange
      ? ` i ${input.decision.instrumentName ?? input.decision.symbol} (${input.decision.symbol}.${input.decision.exchange})`
      : "";

  const holdHint =
    input.decision.action === "hold"
      ? " HOLD betyder att ingen affär klarade strategins och riskreglernas tröskel i detta pass — till exempel för svagt underlag, starkare befintliga innehav, kassa-/riskgränser eller kyltid."
      : "";

  const prefix = research ? `${research} ` : "";
  return `${prefix}Beslut: ${action}${instrument}. ${decisionText}${holdHint}`.slice(0, 4000);
}

export function buildOperationalResearchDiagnostics(input: {
  pass: ModelPortfolioResearchPass;
  seeds: number;
  deepTargets: number;
  cacheHits: number;
  technicalCount: number;
  fundamentalCount: number;
  yahooFundamentalCount: number;
  eodhdFundamentalCount: number;
  googleHits: number;
  eodhdUsed: number;
  eodhdLimit: number;
}): string {
  return [
    `ops[${input.pass}] seeds=${input.seeds} deep=${input.deepTargets}`,
    `cacheHits=${input.cacheHits} technical=${input.technicalCount}`,
    `fundamentals=${input.fundamentalCount} yahoo=${input.yahooFundamentalCount} eodhd=${input.eodhdFundamentalCount}`,
    `googleHits=${input.googleHits} eodhdBudget=${input.eodhdUsed}/${input.eodhdLimit}`,
  ].join(" ");
}
