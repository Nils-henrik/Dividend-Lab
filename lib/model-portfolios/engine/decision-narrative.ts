import type { ModelPortfolioDecision } from "./decision";
import type { ModelPortfolioResearchPass } from "./eodhd-budget";
import { toInvestorFacingSymbol } from "./instrument-symbol";
import type { ResearchCandidate } from "./research";

export type NarrativeCandidate = {
  symbol: string;
  exchange: string;
  name: string;
  held?: boolean;
  attentionEligibility?: "new_entry" | "held_for_monitoring";
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

function actionLabel(action: ModelPortfolioDecision["action"]): string {
  if (action === "buy") return "KÖP";
  if (action === "sell") return "SÄLJ";
  if (action === "trim") return "MINSKA";
  if (action === "rebalance") return "OMVIKTA";
  return "AVVAKTA (HOLD)";
}

function joinSwedish(parts: readonly string[]): string {
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} och ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} och ${parts.at(-1)}`;
}

function trendSentence(regime: string | undefined): string | null {
  if (regime === "strong_uptrend") return "Aktien visar en tydligt positiv trend.";
  if (regime === "uptrend") return "Aktien visar en positiv trend.";
  if (regime === "neutral") return "Kursutvecklingen är mer neutral just nu.";
  if (regime === "downtrend") return "Aktien har en svagare trend just nu.";
  if (regime === "strong_downtrend") return "Aktien befinner sig i en tydligt svag trend.";
  return null;
}

function positiveFindingPhrases(candidate: NarrativeCandidate): string[] {
  const phrases: string[] = [];
  if ((candidate.qualityScore ?? -1) >= 0.55) phrases.push("bolagskvaliteten ser bra ut");
  if ((candidate.valuationScore ?? -1) >= 0.55) phrases.push("värderingen ger stöd");
  if ((candidate.balanceSheetScore ?? -1) >= 0.55) phrases.push("balansräkningen ser stabil ut");
  if ((candidate.earningsRevisionScore ?? -1) >= 0.55) phrases.push("vinstförväntningarna utvecklas positivt");
  if ((candidate.catalystScore ?? -1) >= 0.55) phrases.push("det finns tydliga positiva katalysatorer");
  if ((candidate.dividendQualityScore ?? -1) >= 0.55) phrases.push("utdelningsprofilen är stark");
  return phrases;
}

function cautionFindingPhrases(candidate: NarrativeCandidate): string[] {
  const phrases: string[] = [];
  if (candidate.valuationScore != null && candidate.valuationScore < 0.4) {
    phrases.push("värderingen är däremot mer ansträngd");
  }
  if (candidate.qualityScore != null && candidate.qualityScore < 0.4) {
    phrases.push("bolagskvaliteten är ett frågetecken");
  }
  if (candidate.balanceSheetScore != null && candidate.balanceSheetScore < 0.4) {
    phrases.push("balansräkningen behöver granskas närmare");
  }
  if (candidate.earningsRevisionScore != null && candidate.earningsRevisionScore < 0.4) {
    phrases.push("vinstförväntningarna ger ännu inget tydligt stöd");
  }
  if (candidate.catalystScore != null && candidate.catalystScore < 0.4) {
    phrases.push("det saknas en tydlig positiv katalysator");
  }
  return phrases;
}

function capitalize(value: string): string {
  if (!value) return value;
  return `${value[0]!.toUpperCase()}${value.slice(1)}`;
}

function candidateAnalysis(candidate: NarrativeCandidate): string {
  if (candidate.attentionEligibility === "held_for_monitoring") {
    const monitored = candidateAnalysisBody(candidate);
    return `Befintligt innehav under bevakning, inte en ny köpkandidat. ${monitored}`;
  }
  return candidateAnalysisBody(candidate);
}

function candidateAnalysisBody(candidate: NarrativeCandidate): string {
  const sentences: string[] = [];
  const trend = trendSentence(candidate.technicalRegime);
  if (trend) sentences.push(trend);

  const positives = positiveFindingPhrases(candidate).slice(0, 2);
  if (positives.length) {
    sentences.push(`${capitalize(joinSwedish(positives))}.`);
  }

  const caution = cautionFindingPhrases(candidate)[0];
  if (caution) sentences.push(`${capitalize(caution)}.`);

  if (!sentences.length) {
    return "Underlaget är mer blandat, men bolaget har tillräckligt många positiva signaler för att vara intressant att analysera vidare.";
  }
  return sentences.slice(0, 3).join(" ");
}

export function toNarrativeCandidate(
  candidate: ResearchCandidate,
  names: ReadonlyMap<string, string>,
  extras?: {
    held?: boolean;
    changePct?: number | null;
    attentionEligibility?: "new_entry" | "held_for_monitoring";
  },
): NarrativeCandidate {
  const key = `${candidate.symbol}.${candidate.exchange}`.toUpperCase();
  return {
    symbol: candidate.symbol,
    exchange: candidate.exchange,
    name: names.get(key) ?? candidate.symbol,
    held: extras?.held,
    attentionEligibility: extras?.attentionEligibility,
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
 * Keeps the detailed ranking machinery internal and presents only the shortlist
 * in short, plain-language sections for readers.
 *
 * The shared fetch pool can still be common, but each portfolio summary must
 * describe only the mandate-specific attention set that portfolio investigated.
 * Holding ownership is still not inferred here; holdings are supplied separately
 * to each decision engine.
 */
export function buildInvestorFacingResearchSummary(input: {
  pass: ModelPortfolioResearchPass;
  investigated: readonly NarrativeCandidate[];
  topCandidates: readonly NarrativeCandidate[];
  strategyName?: string;
}): string {
  const investigated = input.investigated;
  const top = input.topCandidates.slice(0, 4);
  const mandatePrefix = input.strategyName ? `${input.strategyName}: ` : "";
  const intro = top.length
    ? `${mandatePrefix}Sökt ${investigated.length} bolag, ${top.length} av dessa är intressanta för djupare analys.`
    : `${mandatePrefix}Sökt ${investigated.length} bolag. Ingen kandidat bedöms vara tillräckligt intressant för djupare analys i detta pass.`;

  const companySections = top.map((item) => `${item.name}\n${candidateAnalysis(item)}`);

  return [
    `Dagens aktiesökning\n${intro}`,
    ...companySections,
  ].join("\n\n");
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
      ? ` i ${input.decision.instrumentName ?? input.decision.symbol} (${toInvestorFacingSymbol(input.decision.symbol, input.decision.exchange)})`
      : "";

  const holdHint =
    input.decision.action === "hold"
      ? " Ingen affär genomförs när inget case klarar portföljens krav på underlag, risk och positionering."
      : "";

  const decisionSection = `Beslut\n${action}${instrument}. ${decisionText}${holdHint}`;
  return `${research}${research ? "\n\n" : ""}${decisionSection}`.slice(0, 4000);
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
  primarySourceHits?: number;
  eodhdUsed: number;
  eodhdLimit: number;
}): string {
  return [
    `ops[${input.pass}] seeds=${input.seeds} deep=${input.deepTargets}`,
    `cacheHits=${input.cacheHits} technical=${input.technicalCount}`,
    `fundamentals=${input.fundamentalCount} yahoo=${input.yahooFundamentalCount} eodhd=${input.eodhdFundamentalCount}`,
    `primaryHits=${input.primarySourceHits ?? 0} googleHits=${input.googleHits} eodhdBudget=${input.eodhdUsed}/${input.eodhdLimit}`,
  ].join(" ");
}
