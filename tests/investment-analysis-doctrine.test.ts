import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DIVLAB_INVESTMENT_ANALYSIS_CORE_SV,
  DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV,
} from "../lib/investment-analysis/doctrine";
import { buildModelPortfolioSystemMandate } from "../lib/model-portfolios/engine/mandates";

describe("shared DivLab investment-analysis doctrine", () => {
  it("covers the core analytical layers and uncertainty discipline", () => {
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /affärskvalitet och kassaflöde/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /balansräkning/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /Värdering är priset på framtida förväntningar/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /trend och momentum/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /koncentration och korrelation/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /Sök aktivt efter motbevis/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /ingen metod kan garantera vinst/);
  });

  it("adds deeper portfolio-manager checks", () => {
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Resultatkvalitet/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Kapitalallokering/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /refinansieringsbehov/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Förväntningar/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Efteranalys/);
  });

  it("is injected into every model-portfolio manager mandate", () => {
    for (const strategyKey of ["conservative", "balanced", "high_risk", "dividend"] as const) {
      const system = buildModelPortfolioSystemMandate(strategyKey);
      assert.match(system, /GEMENSAM ANALYSDISCIPLIN/);
      assert.match(system, /nedsidan före uppsidan/);
      assert.match(system, /Okänd data är okänd/);
    }
  });
});
