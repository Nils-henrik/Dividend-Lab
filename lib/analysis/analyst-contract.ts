import type { DivLabAnalystDraft } from "./analyst-schema";
import type {
  DivLabResearchPacket,
  DivLabValuationInputs,
} from "./deep-research";
import type { NormalizedValuationInput } from "./fx";
import type { ValuationScenarioInput } from "./valuation";

function allDraftSourceIds(draft: DivLabAnalystDraft): string[] {
  const ids: string[] = [];
  const addClaims = (items: readonly { sourceIds: readonly string[] }[]) => {
    for (const item of items) ids.push(...item.sourceIds);
  };
  addClaims(draft.investmentCase);
  addClaims(draft.latestReport);
  addClaims(draft.fundamentalInterpretation);
  addClaims(draft.catalysts);
  addClaims(draft.risks);
  addClaims(draft.contradictions);
  addClaims(draft.thesisBreakers);
  addClaims(draft.technicalInterpretation);
  for (const factor of Object.values(draft.qualityFactors)) ids.push(...factor.sourceIds);
  for (const scenario of draft.valuationScenarios) ids.push(...scenario.sourceIds);
  return ids;
}

function requireFxProvenance(input: {
  scenarioName: string;
  scenarioSourceIds: readonly string[];
  valuationInput: NormalizedValuationInput;
  method: "eps" | "fcf";
}): void {
  if (!input.valuationInput.converted) return;
  for (const fxSourceId of input.valuationInput.fxSourceIds) {
    if (!input.scenarioSourceIds.includes(fxSourceId)) {
      throw new Error(
        `divlab_analyst_fx_source_missing:${input.scenarioName}:${input.method}:${fxSourceId}`,
      );
    }
  }
}

function validateScenarioValuationBasis(input: {
  scenario: DivLabAnalystDraft["valuationScenarios"][number];
  valuationInputs: DivLabValuationInputs;
}): void {
  const usesEps = input.scenario.eps !== null || input.scenario.peMultiple !== null;
  const usesFcf =
    input.scenario.freeCashFlowPerShare !== null ||
    input.scenario.pFcfMultiple !== null;

  if (usesEps && input.valuationInputs.epsTtm.value === null) {
    throw new Error(
      `divlab_analyst_eps_basis_unavailable:${input.scenario.name}`,
    );
  }
  if (usesFcf && input.valuationInputs.freeCashFlowPerShareTtm.value === null) {
    throw new Error(
      `divlab_analyst_fcf_basis_unavailable:${input.scenario.name}`,
    );
  }

  if (usesEps) {
    requireFxProvenance({
      scenarioName: input.scenario.name,
      scenarioSourceIds: input.scenario.sourceIds,
      valuationInput: input.valuationInputs.epsTtm,
      method: "eps",
    });
  }
  if (usesFcf) {
    requireFxProvenance({
      scenarioName: input.scenario.name,
      scenarioSourceIds: input.scenario.sourceIds,
      valuationInput: input.valuationInputs.freeCashFlowPerShareTtm,
      method: "fcf",
    });
  }
}

export function validateAnalystDraftAgainstPacket(input: {
  packet: DivLabResearchPacket;
  draft: DivLabAnalystDraft;
}): void {
  const sourceIds = new Set(input.packet.sources.map((source) => source.id));
  for (const sourceId of allDraftSourceIds(input.draft)) {
    if (!sourceIds.has(sourceId)) {
      throw new Error(`divlab_analyst_unknown_source_id:${sourceId}`);
    }
  }

  const marketCurrency = input.packet.instrument.currency.toUpperCase();
  for (const scenario of input.draft.valuationScenarios) {
    if (scenario.currency !== marketCurrency) {
      throw new Error(`divlab_analyst_scenario_currency_mismatch:${scenario.name}`);
    }
    validateScenarioValuationBasis({
      scenario,
      valuationInputs: input.packet.valuationInputs,
    });
  }

  const primarySourceIds = new Set(
    input.packet.sources.filter((source) => source.primary).map((source) => source.id),
  );
  if (
    !input.draft.latestReport.some((claim) =>
      claim.sourceIds.some((sourceId) => primarySourceIds.has(sourceId)),
    )
  ) {
    throw new Error("divlab_analyst_latest_report_must_reference_primary_source");
  }
}

export function analystDraftToValuationScenarios(
  draft: DivLabAnalystDraft,
): ValuationScenarioInput[] {
  return draft.valuationScenarios.map((scenario) => ({
    name: scenario.name,
    label: scenario.label,
    currency: scenario.currency,
    eps: scenario.eps,
    peMultiple: scenario.peMultiple,
    freeCashFlowPerShare: scenario.freeCashFlowPerShare,
    pFcfMultiple: scenario.pFcfMultiple,
    explicitValuePerShare: scenario.explicitValuePerShare,
    assumptions: [...scenario.assumptions],
  }));
}
