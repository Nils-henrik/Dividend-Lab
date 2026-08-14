import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DIVLAB_INVESTMENT_ANALYSIS_CORE_SV,
  DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV,
  DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_VERSION,
} from "../lib/investment-analysis/doctrine";
import { buildModelPortfolioSystemMandate } from "../lib/model-portfolios/engine/mandates";

describe("shared DivLab investment-analysis doctrine", () => {
  it("is version 3 and keeps the original safety core", () => {
    assert.equal(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_VERSION, 3);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /Okänd data är okänd/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /inte ett neutralt 0,5-betyg/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /Klassificera caset innan värderingen/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /Ett bra bolag är inte automatiskt en bra aktie/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /skriv inte om ett gammalt beslut/);
  });

  it("covers the core analytical layers, uncertainty and diversification discipline", () => {
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /affärskvalitet och kassaflöde/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /balansräkning/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /Värdering är priset på framtida förväntningar/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /trend och momentum/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /koncentration och korrelation/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /Riskspridning är normalläget/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /absolut säkerhetstak, inte en målviktsrekommendation/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /verkliga riskkällor, inte bara antal tickers/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /startfasfriktion/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /Sök aktivt efter motbevis/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /ingen metod kan garantera vinst/);
  });

  it("adds deeper portfolio-manager checks", () => {
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Resultatkvalitet/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Kapitalallokering/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /refinansieringsbehov/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Förväntningar/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Efteranalys/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /ANALYSDISCIPLIN V3/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Casetyp före värdering/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Scenario och falsifierbarhet/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Per-aktie-ekonomi och utspädning/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Kapitalintensitet och återinvestering/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Evidenskalibrering/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Portföljpassning mot fristående kvalitet/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Riskspridning före tickerantal/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Maxvikt mot målposition/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Portföljmognad/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Inkomstvärdepapper/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Processkvalitet före utfallsbias/);
  });

  it("is injected into every model-portfolio manager mandate", () => {
    for (const strategyKey of ["conservative", "balanced", "high_risk", "dividend"] as const) {
      const system = buildModelPortfolioSystemMandate(strategyKey);
      assert.match(system, /GEMENSAM ANALYSDISCIPLIN/);
      assert.match(system, /nedsidan före uppsidan/);
      assert.match(system, /Okänd data är okänd/);
      assert.match(system, /Riskspridning är normalläget/);
      assert.match(system, /Maxvikt mot målposition/);
    }
  });
});
