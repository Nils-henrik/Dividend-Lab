import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDivLabPeerAnalystContext,
  serializeDivLabPeerAnalystContext,
} from "../lib/analysis/peer-analyst-context";
import { buildStoredPeerComparisonAudit } from "../lib/analysis/peer-comparison-audit-read";

const IDS = {
  audit: "10000000-0000-4000-8000-000000000001",
  target: "10000000-0000-4000-8000-000000000002",
  set: "10000000-0000-4000-8000-000000000003",
  a: "10000000-0000-4000-8000-000000000004",
  b: "10000000-0000-4000-8000-000000000005",
  c: "10000000-0000-4000-8000-000000000006",
} as const;

function metric(metric: "pe" | "priceToFcf" | "evToEbit" | "evToEbitda", value: number) {
  return {
    metric,
    status: "ready" as const,
    targetValue: value,
    peerSampleSize: 3,
    peerMedian: value - 1,
    peerMin: value - 2,
    peerMax: value + 2,
    targetVsMedianPct: value / (value - 1) - 1,
    peers: [],
  };
}

function auditPayload() {
  return {
    version: "peer-comparison-audit-v1",
    registry: {
      peerSetId: IDS.set,
      versionNumber: 2,
      dataAsOf: "2026-08-15T08:30:00.000Z",
      registeredPeerCount: 3,
    },
    targetResearch: {
      analysisVersionId: IDS.target,
      symbol: "EVO",
      exchange: "ST",
      name: "Evolution",
      engineVersion: "deep-research-v2",
      dataAsOf: "2026-08-15T09:00:00.000Z",
      valuationProvenanceVersion: "valuation-provenance-v1",
    },
    peerResearch: [
      {
        analysisVersionId: IDS.a,
        symbol: "AAA",
        exchange: "ST",
        name: "Peer A",
        engineVersion: "deep-research-v2",
        dataAsOf: "2026-08-15T08:55:00.000Z",
        valuationProvenanceVersion: "valuation-provenance-v1",
      },
      {
        analysisVersionId: IDS.b,
        symbol: "BBB",
        exchange: "ST",
        name: "Peer B",
        engineVersion: "deep-research-v2",
        dataAsOf: "2026-08-15T08:56:00.000Z",
        valuationProvenanceVersion: "valuation-provenance-v1",
      },
      {
        analysisVersionId: IDS.c,
        symbol: "CCC",
        exchange: "ST",
        name: "Peer C",
        engineVersion: "deep-research-v2",
        dataAsOf: "2026-08-15T08:57:00.000Z",
        valuationProvenanceVersion: "valuation-provenance-v1",
      },
    ],
    comparison: {
      version: "peer-comparison-v1",
      status: "ready",
      target: { symbol: "EVO", exchange: "ST", name: "Evolution" },
      dataAsOf: "2026-08-15T08:55:00.000Z",
      peerCount: 3,
      relationshipSourceIds: ["basis:verified"],
      metrics: {
        pe: metric("pe", 20),
        priceToFcf: metric("priceToFcf", 18),
        evToEbit: metric("evToEbit", 17),
        evToEbitda: metric("evToEbitda", 15),
      },
      notes: ["Neutral peer context."],
    },
  };
}

function auditRow() {
  return {
    id: IDS.audit,
    target_analysis_version_id: IDS.target,
    peer_set_id: IDS.set,
    audit_version: "peer-comparison-audit-v1",
    methodology_version: "peer-comparison-v1",
    peer_set_version_number: 2,
    audit: auditPayload(),
  };
}

function memberRows() {
  return [IDS.a, IDS.b, IDS.c].map((peerAnalysisVersionId) => ({
    audit_id: IDS.audit,
    peer_set_id: IDS.set,
    peer_analysis_version_id: peerAnalysisVersionId,
  }));
}

describe("DivLab persisted peer analyst context", () => {
  it("requires normalized FK bindings before producing a bounded neutral context", () => {
    const stored = buildStoredPeerComparisonAudit({
      auditRow: auditRow(),
      memberRows: memberRows(),
    });
    const context = buildDivLabPeerAnalystContext(stored);
    const serialized = serializeDivLabPeerAnalystContext(context);

    assert.equal(context.version, "peer-analyst-context-v1");
    assert.equal(context.auditId, IDS.audit);
    assert.equal(context.targetAnalysisVersionId, IDS.target);
    assert.equal(context.peerCount, 3);
    assert.equal(context.readyMetricCount, 4);
    assert.equal(context.metrics.find((item) => item.metric === "pe")?.peerMedian, 19);
    assert.doesNotMatch(serialized, /sourceIds/);
    assert.doesNotMatch(serialized, /peerResearch/);
    assert.match(serialized, /peer-analyst-context-v1/);
  });

  it("rejects audit JSON whose peer version set differs from normalized member rows", () => {
    assert.throws(
      () =>
        buildStoredPeerComparisonAudit({
          auditRow: auditRow(),
          memberRows: memberRows().slice(0, 2),
        }),
      /divlab_peer_comparison_audit_read_member_set_mismatch/,
    );
  });

  it("rejects a target analysis-version mismatch in stored audit JSON", () => {
    const row = auditRow();
    (row.audit.targetResearch as Record<string, unknown>).analysisVersionId = IDS.a;

    assert.throws(
      () => buildStoredPeerComparisonAudit({ auditRow: row, memberRows: memberRows() }),
      /divlab_peer_comparison_audit_read_payload_mismatch/,
    );
  });
});
