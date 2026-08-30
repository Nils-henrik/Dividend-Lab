import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { companyNamesLikelyMatch } from "../lib/model-portfolios/engine/company-name-matching";

describe("Nasdaq Nordic issuer-name matching", () => {
  it("accepts verified legal/generic issuer-name variants", () => {
    assert.equal(
      companyNamesLikelyMatch("StillFront AB", "Stillfront Group"),
      true,
    );
    assert.equal(
      companyNamesLikelyMatch("Kambi Group Plc", "Kambi Group"),
      true,
    );
    assert.equal(
      companyNamesLikelyMatch("Atlas Copco AB", "Atlas Copco AB ser. A"),
      true,
    );
    assert.equal(companyNamesLikelyMatch("Munters Group AB", "Munters Group"), true);
  });

  it("fails closed when only a generic prefix overlaps", () => {
    assert.equal(
      companyNamesLikelyMatch("Nordic Semiconductor ASA", "Nordic Group AB"),
      false,
    );
    assert.equal(
      companyNamesLikelyMatch("Stillfront Technologies AB", "Stillfront Group"),
      false,
    );
    assert.equal(
      companyNamesLikelyMatch("Attendo AB", "Atlas Copco AB"),
      false,
    );
  });
});
