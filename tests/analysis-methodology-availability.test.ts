import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { methodologyAvailabilityMessage } from "../lib/analysis/methodology-availability";

describe("analysis methodology availability copy", () => {
  it("keeps supported operating-company methodology explicit", () => {
    const message = methodologyAvailabilityMessage({
      status: "supported",
      companyType: "operating_company",
    });
    assert.match(message, /verifierad/i);
    assert.match(message, /Deep Research/i);
  });

  it("explains investment/financial-company specialization without weakening the gate", () => {
    const message = methodologyAvailabilityMessage({
      status: "specialized_required",
      companyType: "financial_other",
    });
    assert.match(message, /investmentbolag/i);
    assert.match(message, /NAV|substans/i);
    assert.match(message, /innan analysen kan publiceras/i);
  });

  it("explains the existing specialized company types", () => {
    assert.match(
      methodologyAvailabilityMessage({ status: "specialized_required", companyType: "bank" }),
      /bankmetodik/i,
    );
    assert.match(
      methodologyAvailabilityMessage({ status: "specialized_required", companyType: "insurance" }),
      /försäkringsmetodik/i,
    );
    assert.match(
      methodologyAvailabilityMessage({ status: "specialized_required", companyType: "real_estate" }),
      /LTV/i,
    );
  });

  it("fails closed when classification is not verified", () => {
    const message = methodologyAvailabilityMessage({
      status: "classification_required",
      companyType: "unknown",
    });
    assert.match(message, /Ingen analys startas/i);
  });
});
