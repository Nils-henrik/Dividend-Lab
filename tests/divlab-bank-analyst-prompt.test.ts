import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildBankAnalystFacts,
  buildBankAnalystSystemMandate,
} from "../lib/analysis/bank-analyst-prompt";
import type { DivLabBankResearch } from "../lib/analysis/bank-research";
import type { DivLabResearchPacket } from "../lib/analysis/deep-research";

function packet(): DivLabResearchPacket {
  return {
    instrument: {
      symbol: "BANK",
      exchange: "ST",
      name: "Bank AB",
      currency: "SEK",
      currentPrice: 120,
    },
    dataAsOf: "2026-08-15T05:00:00.000Z",
    companyClassification: { type: "bank" },
    currencyContext: {
      marketCurrency: "SEK",
      reportingCurrency: "SEK",
      epsTtmCurrency: "SEK",
    },
    valuationInputs: {
      epsTtm: {
        value: 10,
        currency: "SEK",
        sourceCurrency: "SEK",
        converted: false,
        fxRate: null,
        fxAsOf: null,
        fxSourceIds: [],
      },
      freeCashFlowPerShareTtm: {
        value: 999,
        currency: "SEK",
        sourceCurrency: "SEK",
        converted: false,
        fxRate: null,
        fxAsOf: null,
        fxSourceIds: [],
      },
    },
    valuation: {
      trailing: {
        pe: 12,
        priceToFcf: 0.12,
        fcfYield: 8.3,
        enterpriseValue: 1_000,
        evToEbit: 7,
        evToEbitda: 6,
      },
    },
    valuationProvenance: {
      measures: {
        pe: { available: true, traceable: true, sourceIds: ["market", "fundamental"] },
      },
    },
    technical: { trend: { medium: "up" } },
    primaryReportReconciliation: { status: "partial" },
    sources: [
      {
        id: "report",
        kind: "quarterly_report",
        publisher: "Bank AB",
        url: "https://example.com/report.pdf",
        publishedAt: "2026-07-15T06:00:00.000Z",
        verifiedAt: "2026-08-15T05:00:00.000Z",
        primary: true,
      },
    ],
    evidence: [
      {
        id: "evidence:report",
        sourceId: "report",
        kind: "official_report_excerpt",
        title: "Q2 report",
        content: "Primärrapportevidens ".repeat(30),
        documentExcerpt: "Ren rapporttext som inte ska dupliceras in i prompten.",
        publishedAt: "2026-07-15T06:00:00.000Z",
        primary: true,
        documentRetrieved: true,
        reportPeriod: "Q2",
        reportYear: 2026,
        documentType: "quarterly_report",
      },
    ],
  } as unknown as DivLabResearchPacket;
}

function bankResearch(): DivLabBankResearch {
  return {
    version: "bank-research-v1",
    status: "research_ready",
    analystReady: false,
    blockers: [],
    analystBlockers: ["bank_analyst_schema_v3_required"],
    warnings: [],
    reportMetrics: {
      status: "evidence_ready",
      sourceId: "report",
      metrics: {
        cet1Ratio: { status: "confirmed", valuePct: 17.2 },
        returnOnEquity: { status: "confirmed", valuePct: 15.7 },
      },
    },
    capital: {
      status: "evidence_ready",
      sourceId: "report",
      actualCet1Pct: 17.2,
      regulatoryCet1Requirement: { status: "not_found" },
      reportedCapitalBuffer: { status: "confirmed", valuePctPoints: 2.5 },
      derivedHeadroomPctPoints: null,
    },
    funding: {
      status: "evidence_ready",
      sourceId: "report",
      metrics: {
        liquidityCoverageRatio: { status: "confirmed", valuePct: 145 },
      },
    },
    valuation: {
      status: "traceable",
      priceToBook: 1.2,
      bookValuePerShare: { value: 100, currency: "SEK" },
      provenance: {
        available: true,
        traceable: true,
        sourceIds: ["market", "fundamental"],
        fxSourceIds: [],
      },
    },
  } as unknown as DivLabBankResearch;
}

describe("DivLab bank analyst v3 prompt", () => {
  it("encodes the bank-specific methodological prohibitions and scenario rules", () => {
    const mandate = buildBankAnalystSystemMandate();
    assert.match(mandate, /nettorskuld\/EBITDA/i);
    assert.match(mandate, /P\/FCF/i);
    assert.match(mandate, /EV\/EBITDA/i);
    assert.match(mandate, /managementm[aå]l/i);
    assert.match(mandate, /regulatoriskt CET1-krav/i);
    assert.match(mandate, /P\/B är bankspecifikt värderingsankare/i);
    assert.match(mandate, /färdigberäknat bankriktvärde/i);
  });

  it("sends only bank-appropriate valuation facts to the model", () => {
    const serialized = buildBankAnalystFacts({
      packet: packet(),
      bankResearch: bankResearch(),
    });
    const facts = JSON.parse(serialized) as Record<string, unknown>;
    assert.ok(facts.bankResearch);
    assert.ok(facts.valuationInputs);
    assert.ok(facts.trailingValuation);
    assert.equal("enterpriseValuationInputs" in facts, false);
    assert.equal("fundamentalSnapshot" in facts, false);
    assert.equal("freeCashFlowPerShareTtm" in (facts.valuationInputs as Record<string, unknown>), false);
    assert.deepEqual(facts.trailingValuation, { pe: 12 });
  });

  it("uses bounded evidence content without duplicating documentExcerpt", () => {
    const serialized = buildBankAnalystFacts({
      packet: packet(),
      bankResearch: bankResearch(),
    });
    assert.equal(serialized.includes("Primärrapportevidens"), true);
    assert.equal(serialized.includes("Ren rapporttext som inte ska dupliceras"), false);
  });
});
