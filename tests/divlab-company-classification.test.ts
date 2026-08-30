import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyCompanyMetadata,
  extractYahooCompanyMetadata,
} from "../lib/analysis/company-classification";

function classify(input: {
  sector?: string | null;
  industry?: string | null;
  quoteType?: string | null;
}) {
  return classifyCompanyMetadata({
    metadata: {
      sector: input.sector ?? null,
      industry: input.industry ?? null,
      quoteType: input.quoteType ?? null,
    },
    sourceIds: ["yahoo:fundamentals"],
  });
}

describe("DivLab company classification", () => {
  it("classifies a normal non-financial sector as an operating company", () => {
    const result = classify({
      sector: "Industrials",
      industry: "Specialty Industrial Machinery",
      quoteType: "EQUITY",
    });
    assert.equal(result.type, "operating_company");
    assert.equal(result.confidence, "medium");
    assert.deepEqual(result.sourceIds, ["yahoo:fundamentals"]);
  });

  it("classifies banks before the generic financial-services fallback", () => {
    const result = classify({
      sector: "Financial Services",
      industry: "Banks - Diversified",
      quoteType: "EQUITY",
    });
    assert.equal(result.type, "bank");
    assert.equal(result.confidence, "high");
  });

  it("classifies insurers and real-estate companies separately", () => {
    assert.equal(
      classify({
        sector: "Financial Services",
        industry: "Insurance - Diversified",
        quoteType: "EQUITY",
      }).type,
      "insurance",
    );
    assert.equal(
      classify({
        sector: "Real Estate",
        industry: "Real Estate Services",
        quoteType: "EQUITY",
      }).type,
      "real_estate",
    );
  });

  it("keeps ambiguous financial companies as financial_other", () => {
    const result = classify({
      sector: "Financial Services",
      industry: "Asset Management",
      quoteType: "EQUITY",
    });
    assert.equal(result.type, "financial_other");
    assert.equal(result.confidence, "medium");
  });

  it("identifies fund/ETF instruments before corporate sector logic", () => {
    const result = classify({
      sector: null,
      industry: null,
      quoteType: "ETF",
    });
    assert.equal(result.type, "fund_or_etf");
    assert.equal(result.confidence, "high");
  });

  it("does not assume that EQUITY alone means operating company", () => {
    const result = classify({
      sector: null,
      industry: null,
      quoteType: "EQUITY",
    });
    assert.equal(result.type, "unknown");
    assert.equal(result.confidence, "low");
  });

  it("extracts sector, industry and quote type from Yahoo quoteSummary metadata", () => {
    const metadata = extractYahooCompanyMetadata({
      quoteSummary: {
        result: [
          {
            assetProfile: {
              sector: "Industrials",
              industry: "Specialty Industrial Machinery",
            },
            price: {
              quoteType: "EQUITY",
            },
          },
        ],
      },
    });

    assert.deepEqual(metadata, {
      sector: "Industrials",
      industry: "Specialty Industrial Machinery",
      quoteType: "EQUITY",
    });
  });
});
