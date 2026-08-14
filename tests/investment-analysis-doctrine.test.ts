import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DIVLAB_INVESTMENT_ANALYSIS_CORE_SV,
  DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV,
  DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_VERSION,
  DIVLAB_PORTFOLIO_DIVERSIFICATION_CORE_SV,
} from "../lib/investment-analysis/doctrine";
import { DIVBRAIN_FINANCIAL_SAFETY_POLICY_TEXT_SV } from "../lib/divbrain/server/policy";
import { buildModelPortfolioSystemMandate } from "../lib/model-portfolios/engine/mandates";

describe("shared DivLab investment-analysis doctrine", () => {
  it("keeps doctrine v2 compatibility and the original safety core", () => {
    assert.equal(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_VERSION, 2);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /Okänd data är okänd/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /inte ett neutralt 0,5-betyg/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /Klassificera caset innan värderingen/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /Ett bra bolag är inte automatiskt en bra aktie/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /skriv inte om ett gammalt beslut/);
  });

  it("keeps the original analytical layers and adds a separate shared diversification core", () => {
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /affärskvalitet och kassaflöde/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /balansräkning/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /Värdering är priset på framtida förväntningar/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /trend och momentum/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /koncentration och korrelation/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /Sök aktivt efter motbevis/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_CORE_SV, /ingen metod kan garantera vinst/);

    assert.match(DIVLAB_PORTFOLIO_DIVERSIFICATION_CORE_SV, /Riskspridning är normalläget/);
    assert.match(DIVLAB_PORTFOLIO_DIVERSIFICATION_CORE_SV, /absolut säkerhetstak/);
    assert.match(DIVLAB_PORTFOLIO_DIVERSIFICATION_CORE_SV, /målviktsrekommendation/);
    assert.match(DIVLAB_PORTFOLIO_DIVERSIFICATION_CORE_SV, /sektor, geografi, valuta, faktor och korrelation/);
    assert.match(DIVLAB_PORTFOLIO_DIVERSIFICATION_CORE_SV, /nedsida, osäkerhet, likviditet och befintlig exponering/);
    assert.match(DIVLAB_PORTFOLIO_DIVERSIFICATION_CORE_SV, /startfasfriktion/);
  });

  it("adds deeper portfolio-manager checks", () => {
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /PORTFÖLJRISK OCH RISKSPRIDNING/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Resultatkvalitet/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Kapitalallokering/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /refinansieringsbehov/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Förväntningar/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /Efteranalys/);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /ANALYSDISCIPLIN V2/);
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

  it("injects both the unchanged analysis core and shared diversification core into DivBrain", () => {
    assert.match(DIVBRAIN_FINANCIAL_SAFETY_POLICY_TEXT_SV, /Gemensam DivLab-analysdisciplin/);
    assert.match(DIVBRAIN_FINANCIAL_SAFETY_POLICY_TEXT_SV, /Okänd data är okänd/);
    assert.match(DIVBRAIN_FINANCIAL_SAFETY_POLICY_TEXT_SV, /Gemensam DivLab-disciplin för portföljrisk och riskspridning/);
    assert.match(DIVBRAIN_FINANCIAL_SAFETY_POLICY_TEXT_SV, /Riskspridning är normalläget/);
    assert.match(DIVBRAIN_FINANCIAL_SAFETY_POLICY_TEXT_SV, /målviktsrekommendation/);
    assert.match(DIVBRAIN_FINANCIAL_SAFETY_POLICY_TEXT_SV, /startfasfriktion/);
  });

  it("is injected into every model-portfolio manager mandate", () => {
    for (const strategyKey of ["conservative", "balanced", "high_risk", "dividend"] as const) {
      const system = buildModelPortfolioSystemMandate(strategyKey);
      assert.match(system, /GEMENSAM ANALYSDISCIPLIN/);
      assert.match(system, /nedsidan före uppsidan/);
      assert.match(system, /Okänd data är okänd/);
      assert.match(system, /PORTFÖLJRISK OCH RISKSPRIDNING/);
      assert.match(system, /Riskspridning är normalläget/);
      assert.match(system, /Maxvikt mot målposition/);
    }
  });
});
