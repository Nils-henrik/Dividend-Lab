import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildInvestorFacingDecisionRationale,
  buildInvestorFacingResearchSummary,
  buildOperationalResearchDiagnostics,
} from "./decision-narrative";

describe("model portfolio decision narrative", () => {
  it("shows a short shortlist in plain Swedish without shared holding ownership", () => {
    const summary = buildInvestorFacingResearchSummary({
      pass: "nordic_morning",
      investigated: [
        {
          symbol: "INVE-B",
          exchange: "ST",
          name: "Investor AB ser. B",
          held: true,
          changePct: 1.2,
          qualityScore: 0.8,
          valuationScore: 0.6,
          technicalRegime: "uptrend",
          technicalComposite: 0.72,
        },
        {
          symbol: "EQNR",
          exchange: "OL",
          name: "Equinor ASA",
          held: false,
          changePct: -2.4,
          catalystScore: 0.55,
          dividendQualityScore: 0.7,
        },
      ],
      topCandidates: [
        {
          symbol: "INVE-B",
          exchange: "ST",
          name: "Investor AB ser. B",
          held: true,
          qualityScore: 0.8,
          valuationScore: 0.6,
          technicalRegime: "uptrend",
          reasons: ["kvalitet", "balansräkning"],
        },
      ],
    });

    assert.match(summary, /Dagens aktiesökning/);
    assert.match(summary, /Sökt 2 bolag/);
    assert.match(summary, /1 av dessa bedöms vara intressanta för djupare analys/);
    assert.match(summary, /Investor AB ser\. B/);
    assert.doesNotMatch(summary, /Equinor ASA/);
    assert.doesNotMatch(summary, /befintligt innehav|befintliga innehav/);
    assert.doesNotMatch(summary, /uptrend|0\.72|signaler:/i);
    assert.doesNotMatch(summary, /EODHD|cache|Google|Yahoo|budget/i);
  });

  it("frames BUY/SELL/HOLD reasons for Senaste beslut in Swedish sections", () => {
    const hold = buildInvestorFacingDecisionRationale({
      researchSummary: "Dagens aktiesökning\nSökt 8 bolag. 4 av dessa bedöms vara intressanta för djupare analys.",
      decision: {
        action: "hold",
        symbol: null,
        exchange: null,
        instrumentName: null,
        proposedPortfolioPct: 0,
        convictionScore: 0.4,
        materialThesisBreak: false,
        thesis: "Inget case passerade tröskeln med tillräckligt stödjande och motsägande underlag.",
        bearCase: "Att forcera ett köp skulle öka omsättning utan tydlig edge.",
        catalyst: "Väntar på starkare kombination av kvalitet, värdering och riskbild.",
        valuationView: "Ingen kandidat erbjöd tillräckligt attraktiv risk/reward.",
        keyRisks: ["Otillräckligt underlag"],
        evidenceIds: ["research:INVE-B"],
        disconfirmingEvidenceIds: [],
        rationale: "Befintliga innehav och kassa-/riskregler gav starkare utfall än nya kandidater.",
      },
    });

    assert.match(hold, /Beslut\nAVVAKTA \(HOLD\)/);
    assert.match(hold, /Dagens aktiesökning/);
    assert.match(hold, /portföljens krav på underlag, risk och positionering/);
    assert.doesNotMatch(hold, /EODHD|cacheHits|Google-träff/i);

    const buy = buildInvestorFacingDecisionRationale({
      researchSummary: "Dagens aktiesökning\nSökt 10 bolag. 4 av dessa bedöms vara intressanta för djupare analys.",
      decision: {
        action: "buy",
        symbol: "MSFT",
        exchange: "US",
        instrumentName: "Microsoft",
        proposedPortfolioPct: 12,
        convictionScore: 0.8,
        materialThesisBreak: false,
        thesis: "Microsoft erbjuder kvalitetstillväxt med uthållig kassaflödesprofil.",
        bearCase: "Höga förväntningar kan pressa multipeln vid tillväxtbesvikelse.",
        catalyst: "Stabil molntillväxt och kapitalallokering.",
        valuationView: "Acceptabel värdering givet kvalitet.",
        keyRisks: ["Multipelkontraktion"],
        evidenceIds: ["research:MSFT"],
        disconfirmingEvidenceIds: ["research:AAPL"],
        rationale: "Mandatpassning, kvalitet och trend talade för en startposition.",
      },
    });
    assert.match(buy, /Beslut\nKÖP/);
    assert.match(buy, /Microsoft \(MSFT\.US\)/);
  });

  it("keeps operational API/cache diagnostics out of the investor-facing channel", () => {
    const ops = buildOperationalResearchDiagnostics({
      pass: "nordic_morning",
      seeds: 90,
      deepTargets: 14,
      cacheHits: 4,
      technicalCount: 12,
      fundamentalCount: 8,
      yahooFundamentalCount: 8,
      eodhdFundamentalCount: 0,
      googleHits: 0,
      eodhdUsed: 0,
      eodhdLimit: 0,
    });
    assert.match(ops, /eodhdBudget=0\/0/);
    assert.match(ops, /cacheHits=4/);
    assert.match(ops, /primaryHits=0/);
  });

  it("never double-appends Nordic Yahoo suffixes in investor-facing text", () => {
    const summary = buildInvestorFacingResearchSummary({
      pass: "nordic_morning",
      investigated: [
        { symbol: "DNB.OL", exchange: "OL", name: "DNB Bank ASA", changePct: 0.4 },
        { symbol: "DNB", exchange: "OL", name: "DNB Bank ASA", changePct: -0.5 },
        { symbol: "ATCO-A", exchange: "ST", name: "Atlas Copco AB ser. A", changePct: 0.2 },
      ],
      topCandidates: [
        { symbol: "DNB.OL", exchange: "OL", name: "DNB Bank ASA", changePct: 0.4 },
      ],
    });
    assert.match(summary, /DNB Bank ASA/);
    assert.doesNotMatch(summary, /\.OL\.OL|\.ST\.ST|\.HE\.HE|\.CO\.CO/);

    const rationale = buildInvestorFacingDecisionRationale({
      researchSummary: summary,
      decision: {
        action: "hold",
        symbol: "DNB.OL",
        exchange: "OL",
        instrumentName: "DNB Bank ASA",
        proposedPortfolioPct: 0,
        convictionScore: 0.4,
        materialThesisBreak: false,
        thesis: "Otillräckligt verifierat fundamentalunderlag för en ny position i detta pass.",
        bearCase: "Om kreditkvalitet eller kapitalkrav försämras kan nedsidan bli större.",
        catalyst: "Väntar på tydligare primärkälla och värderingsstöd.",
        valuationView: "Ingen köpbeslutad värderingsmarginal i detta pass.",
        keyRisks: ["Saknade fundamentals"],
        evidenceIds: ["research:DNB"],
        disconfirmingEvidenceIds: [],
        rationale: "HOLD tills verifierade fundamentals och riskregler ger tydligt stöd.",
      },
    });
    assert.match(rationale, /DNB\.OL/);
    assert.doesNotMatch(rationale, /DNB\.OL\.OL/);
  });
});
