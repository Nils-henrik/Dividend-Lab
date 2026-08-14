import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCompanyProfilePreflightFromYahooPayload } from "../lib/analysis/company-profile-preflight";

function payload(input: { sector?: string; industry?: string; quoteType?: string }) {
  return {
    quoteSummary: {
      result: [
        {
          assetProfile: {
            sector: input.sector,
            industry: input.industry,
          },
          price: {
            quoteType: input.quoteType,
          },
        },
      ],
    },
  };
}

const FETCHED_AT = new Date("2026-08-15T00:30:00.000Z");

describe("DivLab company-profile methodology preflight", () => {
  it("marks an ordinary operating company as supported with source-backed classification", () => {
    const result = buildCompanyProfilePreflightFromYahooPayload({
      payload: payload({
        sector: "Industrials",
        industry: "Specialty Industrial Machinery",
        quoteType: "EQUITY",
      }),
      yahooSymbol: "ATCO-A.ST",
      fetchedAt: FETCHED_AT,
    });

    assert.equal(result.version, "company-profile-preflight-v1");
    assert.equal(result.classification.type, "operating_company");
    assert.equal(result.methodology.status, "supported");
    assert.deepEqual(result.classification.sourceIds, [result.source.id]);
    assert.equal(result.source.kind, "fundamental_data");
    assert.equal(result.source.primary, false);
  });

  it("blocks a bank from generic heavy research until the specialized methodology exists", () => {
    const result = buildCompanyProfilePreflightFromYahooPayload({
      payload: payload({
        sector: "Financial Services",
        industry: "Banks - Regional",
        quoteType: "EQUITY",
      }),
      yahooSymbol: "BANK.ST",
      fetchedAt: FETCHED_AT,
    });

    assert.equal(result.classification.type, "bank");
    assert.equal(result.methodology.status, "specialized_required");
    assert.equal(result.methodology.valuationSupport.priceToFcf, false);
    assert.equal(result.methodology.valuationSupport.enterpriseMultiples, false);
  });

  it("fails closed when provider metadata only says EQUITY", () => {
    const result = buildCompanyProfilePreflightFromYahooPayload({
      payload: payload({ quoteType: "EQUITY" }),
      yahooSymbol: "UNKNOWN.ST",
      fetchedAt: FETCHED_AT,
    });

    assert.equal(result.classification.type, "unknown");
    assert.equal(result.methodology.status, "classification_required");
  });
});
