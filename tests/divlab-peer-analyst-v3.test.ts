import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DivLabResearchPacket } from "../lib/analysis/deep-research";
import {
  validatePeerAnalystDraft,
} from "../lib/analysis/peer-analyst-contract";
import type { DivLabPeerAnalystContext } from "../lib/analysis/peer-analyst-context";
import {
  evaluatePeerAnalystContentQuality,
} from "../lib/analysis/peer-analyst-quality-gate";
import {
  divLabPeerAnalystDraftSchema,
  type DivLabPeerAnalystDraft,
} from "../lib/analysis/peer-analyst-schema";

const REPORT_SOURCE = "report:q2";
const MARKET_SOURCE = "market:test";
const TARGET_VERSION_ID = "20000000-0000-4000-8000-000000000001";
const AUDIT_ID = "20000000-0000-4000-8000-000000000002";
const PEER_SET_ID = "20000000-0000-4000-8000-000000000003";

function packet(): DivLabResearchPacket {
  return {
    version: "deep-research-v2",
    instrument: {
      symbol: "TEST",
      exchange: "ST",
      name: "Testbolaget AB",
      currency: "SEK",
      currentPrice: 100,
    },
    dataAsOf: "2026-08-15T09:00:00.000Z",
    sources: [
      {
        id: REPORT_SOURCE,
        kind: "quarterly_report",
        publisher: "Testbolaget AB",
        url: "https://example.com/report",
        publishedAt: "2026-08-10T06:00:00.000Z",
        verifiedAt: "2026-08-15T08:30:00.000Z",
        primary: true,
      },
      {
        id: MARKET_SOURCE,
        kind: "market_data",
        publisher: "Market provider",
        url: "https://example.com/market",
        publishedAt: "2026-08-15T08:30:00.000Z",
        verifiedAt: "2026-08-15T08:30:00.000Z",
        primary: false,
      },
    ],
    valuationProvenance: {
      version: "valuation-provenance-v1",
      measures: {
        pe: {
          available: true,
          traceable: true,
          sourceIds: [REPORT_SOURCE, MARKET_SOURCE],
          primaryConfirmedMetrics: [],
        },
        priceToFcf: { available: false, traceable: false, sourceIds: [], primaryConfirmedMetrics: [] },
        fcfYield: { available: false, traceable: false, sourceIds: [], primaryConfirmedMetrics: [] },
        enterpriseValue: { available: false, traceable: false, sourceIds: [], primaryConfirmedMetrics: [] },
        evToEbit: { available: false, traceable: false, sourceIds: [], primaryConfirmedMetrics: [] },
        evToEbitda: { available: false, traceable: false, sourceIds: [], primaryConfirmedMetrics: [] },
      },
    },
    valuationInputs: {
      epsTtm: {
        value: 8,
        originalValue: 8,
        originalCurrency: "SEK",
        targetCurrency: "SEK",
        converted: false,
        fxSourceIds: [],
      },
      freeCashFlowPerShareTtm: {
        value: 7,
        originalValue: 7,
        originalCurrency: "SEK",
        targetCurrency: "SEK",
        converted: false,
        fxSourceIds: [],
      },
    },
    valuation: {
      scenarios: [
        { name: "bear", valuePerShare: 75, upsideDownsidePct: -0.25 },
        { name: "base", valuePerShare: 120, upsideDownsidePct: 0.2 },
        { name: "bull", valuePerShare: 170, upsideDownsidePct: 0.7 },
      ],
    },
  } as unknown as DivLabResearchPacket;
}

function factor(assessment: "strong" | "neutral" | "weak" | "unknown" = "neutral") {
  return {
    assessment,
    rationale: "Bedömningen bygger på verifierat target-underlag.",
    sourceIds: assessment === "unknown" ? [] : [REPORT_SOURCE],
  };
}

function peerContext(): DivLabPeerAnalystContext {
  return {
    version: "peer-analyst-context-v1",
    auditId: AUDIT_ID,
    targetAnalysisVersionId: TARGET_VERSION_ID,
    peerSetId: PEER_SET_ID,
    peerSetVersionNumber: 2,
    dataAsOf: "2026-08-15T08:55:00.000Z",
    target: { symbol: "TEST", exchange: "ST", name: "Testbolaget AB" },
    peerCount: 3,
    readyMetricCount: 2,
    metrics: [
      {
        metric: "pe",
        status: "ready",
        targetValue: 20,
        peerSampleSize: 3,
        peerMedian: 18,
        peerMin: 15,
        peerMax: 23,
        targetVsMedianPct: 0.111111,
      },
      {
        metric: "priceToFcf",
        status: "ready",
        targetValue: 17,
        peerSampleSize: 3,
        peerMedian: 16,
        peerMin: 14,
        peerMax: 20,
        targetVsMedianPct: 0.0625,
      },
      {
        metric: "evToEbit",
        status: "insufficient",
        targetValue: null,
        peerSampleSize: 2,
        peerMedian: 14,
        peerMin: 13,
        peerMax: 15,
        targetVsMedianPct: null,
      },
      {
        metric: "evToEbitda",
        status: "insufficient",
        targetValue: null,
        peerSampleSize: 1,
        peerMedian: 12,
        peerMin: 12,
        peerMax: 12,
        targetVsMedianPct: null,
      },
    ],
    notes: ["Två peer-mått har minst tre fullt spårbara observationer."],
  };
}

function rawDraft() {
  const claim = (text: string, sourceIds = [REPORT_SOURCE]) => ({ text, sourceIds });
  return {
    view: "positive" as const,
    riskLevel: "medium" as const,
    confidence: "medium" as const,
    horizonMonths: { min: 12, max: 36 },
    executiveSummary:
      "Bolaget har ett positivt basscenario men peer-värderingen ska behandlas som neutral kontext och inte som ett fristående köpargument.",
    investmentCase: [claim("Lönsamheten är stabil."), claim("Kassaflödet stödjer investeringscaset.")],
    latestReport: [claim("Senaste rapporten visar fortsatt stabil utveckling.")],
    fundamentalInterpretation: [
      claim("Omsättningen utvecklas stabilt."),
      claim("Per-aktie-utvecklingen är positiv."),
    ],
    valuationInterpretation: [
      {
        measure: "pe" as const,
        text: "Target-bolagets trailing P/E används som en verifierad del av värderingsbilden.",
        sourceIds: [REPORT_SOURCE, MARKET_SOURCE],
      },
    ],
    qualityFactors: {
      competitiveAdvantage: factor("strong"),
      pricingPower: factor(),
      marketPosition: factor(),
      managementAndCapitalAllocation: factor(),
      reinvestmentRunway: factor(),
      cyclicality: factor(),
      customerConcentration: factor("unknown"),
      regulatoryRisk: factor(),
      currencyRisk: factor(),
      acquisitionRisk: factor(),
      disruptionRisk: factor(),
    },
    catalysts: [claim("Fortsatt marginalstabilitet kan vara en katalysator.")],
    risks: [
      claim("Svagare efterfrågan är en risk."),
      claim("Multipelkontraktion är en risk.", [MARKET_SOURCE]),
    ],
    contradictions: [
      claim("Stark historik motsägs delvis av värderingsrisken.", [REPORT_SOURCE, MARKET_SOURCE]),
    ],
    thesisBreakers: [claim("Ett bestående kassaflödesbrott skulle bryta tesen.")],
    technicalInterpretation: [
      claim("Den tekniska bilden är sekundär till verifierade fundamenta.", [MARKET_SOURCE]),
    ],
    valuationScenarios: [
      {
        name: "bear" as const,
        label: "Bear",
        currency: "SEK",
        eps: 6.25,
        peMultiple: 12,
        freeCashFlowPerShare: null,
        pFcfMultiple: null,
        explicitValuePerShare: null,
        assumptions: ["Svagare efterfrågan"],
        sourceIds: [REPORT_SOURCE, MARKET_SOURCE],
      },
      {
        name: "base" as const,
        label: "Base",
        currency: "SEK",
        eps: 7.5,
        peMultiple: 16,
        freeCashFlowPerShare: null,
        pFcfMultiple: null,
        explicitValuePerShare: null,
        assumptions: ["Normaliserad efterfrågan"],
        sourceIds: [REPORT_SOURCE, MARKET_SOURCE],
      },
      {
        name: "bull" as const,
        label: "Bull",
        currency: "SEK",
        eps: 8.5,
        peMultiple: 20,
        freeCashFlowPerShare: null,
        pFcfMultiple: null,
        explicitValuePerShare: null,
        assumptions: ["Starkare marginal och tillväxt"],
        sourceIds: [REPORT_SOURCE, MARKET_SOURCE],
      },
    ],
    peerContextVersion: "peer-analyst-context-v1" as const,
    peerAuditId: AUDIT_ID,
    peerInterpretation: [
      {
        metric: "pe" as const,
        text: "Target handlas till en högre P/E än medianen i det verifierade peer-setet; det är neutral relativ värderingskontext, inte ett säljsignal i sig.",
        peerAuditId: AUDIT_ID,
        targetValue: 20,
        peerSampleSize: 3,
        peerMedian: 18,
        peerMin: 15,
        peerMax: 23,
        targetVsMedianPct: 0.111111,
      },
      {
        metric: "priceToFcf" as const,
        text: "P/FCF ligger också över peer-medianen och ska vägas mot target-bolagets kvalitet och tillväxt, inte användas som ensam rekommendation.",
        peerAuditId: AUDIT_ID,
        targetValue: 17,
        peerSampleSize: 3,
        peerMedian: 16,
        peerMin: 14,
        peerMax: 20,
        targetVsMedianPct: 0.0625,
      },
    ],
  };
}

function validDraft(): DivLabPeerAnalystDraft {
  return divLabPeerAnalystDraftSchema.parse(rawDraft());
}

describe("DivLab analyst v3-peer contract", () => {
  it("keeps target sourceIds and peer-audit provenance separate while certifying all ready peer metrics", () => {
    const research = packet();
    const context = peerContext();
    const draft = validDraft();

    validatePeerAnalystDraft({
      packet: research,
      targetAnalysisVersionId: TARGET_VERSION_ID,
      peerContext: context,
      draft,
    });
    const gate = evaluatePeerAnalystContentQuality({
      packet: research,
      targetAnalysisVersionId: TARGET_VERSION_ID,
      peerContext: context,
      draft,
    });

    assert.equal(gate.publishable, true);
    assert.equal(gate.score, 100);
    assert.equal(gate.checks.peerMetricCoverage, true);
    assert.equal(gate.checks.peerNumericGrounding, true);
  });

  it("rejects a structured peer number that differs from the immutable context", () => {
    const research = packet();
    const context = peerContext();
    const draft = validDraft();
    draft.peerInterpretation[0]!.peerMedian = 17.5;

    assert.throws(
      () =>
        validatePeerAnalystDraft({
          packet: research,
          targetAnalysisVersionId: TARGET_VERSION_ID,
          peerContext: context,
          draft,
        }),
      /divlab_peer_analyst_numeric_mismatch:pe:peerMedian/,
    );
    const gate = evaluatePeerAnalystContentQuality({
      packet: research,
      targetAnalysisVersionId: TARGET_VERSION_ID,
      peerContext: context,
      draft,
    });
    assert.equal(gate.publishable, false);
    assert.equal(gate.checks.peerNumericGrounding, false);
  });

  it("fails quality certification if the model cherry-picks one of two ready peer metrics", () => {
    const research = packet();
    const context = peerContext();
    const draft = validDraft();
    draft.peerInterpretation = draft.peerInterpretation.slice(0, 1);

    validatePeerAnalystDraft({
      packet: research,
      targetAnalysisVersionId: TARGET_VERSION_ID,
      peerContext: context,
      draft,
    });
    const gate = evaluatePeerAnalystContentQuality({
      packet: research,
      targetAnalysisVersionId: TARGET_VERSION_ID,
      peerContext: context,
      draft,
    });
    assert.equal(gate.publishable, false);
    assert.equal(gate.checks.peerMetricCoverage, false);
  });

  it("rejects interpretation of an insufficient peer metric", () => {
    const draft = validDraft();
    draft.peerInterpretation[0] = {
      metric: "evToEbit",
      text: "Det här måttet saknar tillräckligt peer-underlag och får därför inte tolkas.",
      peerAuditId: AUDIT_ID,
      targetValue: 10,
      peerSampleSize: 3,
      peerMedian: 9,
      peerMin: 8,
      peerMax: 11,
      targetVsMedianPct: 0.111111,
    };

    assert.throws(
      () =>
        validatePeerAnalystDraft({
          packet: packet(),
          targetAnalysisVersionId: TARGET_VERSION_ID,
          peerContext: peerContext(),
          draft,
        }),
      /divlab_peer_analyst_metric_not_ready:evToEbit/,
    );
  });

  it("rejects duplicate peer metrics and mismatched audit ids at schema level", () => {
    const duplicate = rawDraft();
    duplicate.peerInterpretation[1] = {
      ...duplicate.peerInterpretation[0],
    };
    assert.equal(divLabPeerAnalystDraftSchema.safeParse(duplicate).success, false);

    const wrongAudit = rawDraft();
    wrongAudit.peerInterpretation[0] = {
      ...wrongAudit.peerInterpretation[0],
      peerAuditId: "20000000-0000-4000-8000-000000000099",
    };
    assert.equal(divLabPeerAnalystDraftSchema.safeParse(wrongAudit).success, false);
  });
});
