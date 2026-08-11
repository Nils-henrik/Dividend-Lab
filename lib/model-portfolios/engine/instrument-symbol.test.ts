import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canonicalizeInstrumentSymbol,
  hasNordicYahooSuffix,
  stripNordicYahooSuffix,
  toInvestorFacingSymbol,
  toYahooTransportSymbol,
} from "./instrument-symbol";

describe("instrument symbol normalization", () => {
  it("keeps base symbol + exchange separate while building a single Yahoo suffix", () => {
    assert.deepEqual(canonicalizeInstrumentSymbol("DNB", "OL"), {
      baseSymbol: "DNB",
      exchange: "OL",
      yahooSymbol: "DNB.OL",
      investorLabel: "DNB.OL",
    });
    assert.equal(toYahooTransportSymbol("DNB", "OSL"), "DNB.OL");
    assert.equal(toInvestorFacingSymbol("DNB", "OL"), "DNB.OL");
  });

  it("does not double-append when the symbol is already Yahoo-suffixed", () => {
    assert.deepEqual(canonicalizeInstrumentSymbol("DNB.OL", "OL"), {
      baseSymbol: "DNB",
      exchange: "OL",
      yahooSymbol: "DNB.OL",
      investorLabel: "DNB.OL",
    });
    assert.equal(toYahooTransportSymbol("ATCO-A.ST", "ST"), "ATCO-A.ST");
    assert.equal(toYahooTransportSymbol("NOKIA.HE", "HEL"), "NOKIA.HE");
    assert.equal(toYahooTransportSymbol("NOVO-B.CO", "CPH"), "NOVO-B.CO");
    assert.equal(toInvestorFacingSymbol("DNB.OL", "OL"), "DNB.OL");
    assert.equal(toInvestorFacingSymbol("GJF.OL", "OL"), "GJF.OL");
    assert.equal(toInvestorFacingSymbol("DNB.OL.OL", "OL"), "DNB.OL");
    assert.equal(toYahooTransportSymbol("DNB.OL.OL", "OL"), "DNB.OL");
    assert.doesNotMatch(toInvestorFacingSymbol("DNB.OL", "OL"), /\.OL\.OL/);
  });

  it("normalizes Nordic exchange aliases and US labels", () => {
    assert.equal(toYahooTransportSymbol("INVE-B", "XSTO"), "INVE-B.ST");
    assert.equal(toInvestorFacingSymbol("INVE-B", "STO"), "INVE-B.ST");
    assert.equal(toYahooTransportSymbol("MSFT", "NASDAQ"), "MSFT");
    assert.equal(toInvestorFacingSymbol("MSFT", "US"), "MSFT.US");
    assert.equal(stripNordicYahooSuffix("EQNR.OL"), "EQNR");
    assert.equal(hasNordicYahooSuffix("EQNR.OL"), true);
    assert.equal(hasNordicYahooSuffix("EQNR"), false);
  });
});
