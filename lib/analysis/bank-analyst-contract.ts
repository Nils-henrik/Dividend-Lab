import type { DivLabResearchPacket } from "./deep-research";
import type { DivLabBankResearch } from "./bank-research";
import type { DivLabBankAnalystDraft } from "./bank-analyst-schema";

function collectDraftSourceIds(draft: DivLabBankAnalystDraft): string[] {
  const ids: string[] = [];
  const add = (items: readonly { sourceIds: readonly string[] }[]) => {
    for (const item of items) ids.push(...item.sourceIds);
  };
  add(draft.investmentCase);
  add(draft.latestReport);
  add(draft.bankFundamentalInterpretation);
  add(draft.valuationInterpretation);
  add(draft.catalysts);
  add(draft.risks);
  add(draft.contradictions);
  add(draft.thesisBreakers);
  add(draft.technicalInterpretation);
  for (const factor of Object.values(draft.bankFactors)) ids.push(...factor.sourceIds);
  for (const scenario of draft.valuationScenarios) ids.push(...scenario.sourceIds);
  return ids;
}

function requireSources(input: {
  actual: readonly string[];
  required: readonly string[];
  errorPrefix: string;
}): void {
  for (const sourceId of input.required) {
    if (!input.actual.includes(sourceId)) {
      throw new Error(`${input.errorPrefix}:${sourceId}`);
    }
  }
}

function validateValuationClaims(input: {
  packet: DivLabResearchPacket;
  bankResearch: DivLabBankResearch;
  draft: DivLabBankAnalystDraft;
}): void {
  for (const claim of input.draft.valuationInterpretation) {
    if (claim.measure === "pe") {
      const pe = input.packet.valuationProvenance.measures.pe;
      if (!pe.available) throw new Error("bank_analyst_pe_unavailable");
      if (!pe.traceable) throw new Error("bank_analyst_pe_untraceable");
      requireSources({
        actual: claim.sourceIds,
        required: pe.sourceIds,
        errorPrefix: "bank_analyst_pe_source_missing",
      });
      continue;
    }

    const pb = input.bankResearch.valuation;
    if (pb.status === "unavailable") throw new Error("bank_analyst_pb_unavailable");
    if (!pb.provenance.traceable) throw new Error("bank_analyst_pb_untraceable");
    requireSources({
      actual: claim.sourceIds,
      required: pb.provenance.sourceIds,
      errorPrefix: "bank_analyst_pb_source_missing",
    });
  }
}

function validateScenarioBasis(input: {
  packet: DivLabResearchPacket;
  bankResearch: DivLabBankResearch;
  draft: DivLabBankAnalystDraft;
}): void {
  const peProvenance = input.packet.valuationProvenance.measures.pe;
  const pbProvenance = input.bankResearch.valuation.provenance;
  const marketCurrency = input.packet.instrument.currency.toUpperCase();

  for (const scenario of input.draft.valuationScenarios) {
    if (scenario.currency !== marketCurrency) {
      throw new Error(`bank_analyst_scenario_currency_mismatch:${scenario.name}`);
    }

    if (scenario.peMultiple !== null) {
      if (input.packet.valuationInputs.epsTtm.value === null) {
        throw new Error(`bank_analyst_scenario_eps_basis_unavailable:${scenario.name}`);
      }
      if (!peProvenance.available || !peProvenance.traceable) {
        throw new Error(`bank_analyst_scenario_pe_provenance_unavailable:${scenario.name}`);
      }
      requireSources({
        actual: scenario.sourceIds,
        required: peProvenance.sourceIds,
        errorPrefix: `bank_analyst_scenario_pe_source_missing:${scenario.name}`,
      });
    }

    if (scenario.priceToBookMultiple !== null) {
      if (input.bankResearch.valuation.bookValuePerShare.value === null) {
        throw new Error(`bank_analyst_scenario_book_basis_unavailable:${scenario.name}`);
      }
      if (!pbProvenance.available || !pbProvenance.traceable) {
        throw new Error(`bank_analyst_scenario_pb_provenance_unavailable:${scenario.name}`);
      }
      requireSources({
        actual: scenario.sourceIds,
        required: pbProvenance.sourceIds,
        errorPrefix: `bank_analyst_scenario_pb_source_missing:${scenario.name}`,
      });
    }
  }
}

function requireFactorSource(input: {
  sourceId: string | null;
  factor: DivLabBankAnalystDraft["bankFactors"][keyof DivLabBankAnalystDraft["bankFactors"]];
  errorCode: string;
}): void {
  if (input.factor.assessment === "unknown") return;
  if (!input.sourceId || !input.factor.sourceIds.includes(input.sourceId)) {
    throw new Error(input.errorCode);
  }
}

export function validateBankAnalystDraftAgainstResearch(input: {
  packet: DivLabResearchPacket;
  bankResearch: DivLabBankResearch;
  draft: DivLabBankAnalystDraft;
}): void {
  if (input.packet.companyClassification.type !== "bank") {
    throw new Error("bank_analyst_requires_bank_classification");
  }
  if (input.bankResearch.status !== "research_ready") {
    throw new Error("bank_analyst_research_not_ready");
  }

  const knownSourceIds = new Set(input.packet.sources.map((source) => source.id));
  for (const sourceId of collectDraftSourceIds(input.draft)) {
    if (!knownSourceIds.has(sourceId)) {
      throw new Error(`bank_analyst_unknown_source_id:${sourceId}`);
    }
  }

  validateValuationClaims(input);
  validateScenarioBasis(input);

  const primarySourceIds = new Set(
    input.packet.sources.filter((source) => source.primary).map((source) => source.id),
  );
  if (
    !input.draft.latestReport.some((claim) =>
      claim.sourceIds.some((sourceId) => primarySourceIds.has(sourceId)),
    )
  ) {
    throw new Error("bank_analyst_latest_report_requires_primary_source");
  }

  const reportSourceId = input.bankResearch.reportMetrics.sourceId;
  requireFactorSource({
    sourceId: reportSourceId,
    factor: input.draft.bankFactors.profitability,
    errorCode: "bank_analyst_profitability_requires_bank_report_source",
  });
  requireFactorSource({
    sourceId: reportSourceId,
    factor: input.draft.bankFactors.creditQuality,
    errorCode: "bank_analyst_credit_quality_requires_bank_report_source",
  });
  requireFactorSource({
    sourceId: input.bankResearch.capital.sourceId,
    factor: input.draft.bankFactors.capitalStrength,
    errorCode: "bank_analyst_capital_strength_requires_capital_source",
  });
  requireFactorSource({
    sourceId: input.bankResearch.funding.sourceId,
    factor: input.draft.bankFactors.fundingAndLiquidity,
    errorCode: "bank_analyst_funding_requires_funding_source",
  });
}
