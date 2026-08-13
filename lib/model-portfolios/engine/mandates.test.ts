import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MODEL_PORTFOLIO_MANDATES,
  buildModelPortfolioSystemMandate,
} from "./mandates";

describe("model portfolio investment horizons", () => {
  it("encodes the approved horizon for every strategy", () => {
    assert.equal(MODEL_PORTFOLIO_MANDATES.conservative.horizonLabel, "12–60+ månader");
    assert.equal(MODEL_PORTFOLIO_MANDATES.balanced.horizonLabel, "2–24 månader");
    assert.equal(MODEL_PORTFOLIO_MANDATES.high_risk.horizonLabel, "1 vecka–12 månader");
    assert.equal(MODEL_PORTFOLIO_MANDATES.dividend.horizonLabel, "5–10+ år");
  });

  it("passes horizon guidance into the AI system mandate", () => {
    for (const strategyKey of ["conservative", "balanced", "high_risk", "dividend"] as const) {
      const mandate = MODEL_PORTFOLIO_MANDATES[strategyKey];
      const system = buildModelPortfolioSystemMandate(strategyKey);
      assert.match(system, new RegExp(mandate.horizonLabel.replace(/[+]/g, "\\+")));
      assert.match(system, /strategiskt analysfilter/);
      assert.match(system, /inte samma sak som förväntad innehavstid/);
    }
  });

  it("does not turn the horizon into an automatic sell timer", () => {
    for (const strategyKey of ["conservative", "balanced", "high_risk", "dividend"] as const) {
      const mandate = MODEL_PORTFOLIO_MANDATES[strategyKey];
      assert.ok(
        mandate.explicitDoNot.some((item) => /utgångsdatum|innehavstid/.test(item)),
        `${strategyKey} must state that horizon is not an automatic sell timer`,
      );
    }
  });

  it("encodes the high-risk fallen-quality recovery playbook", () => {
    const mandate = buildModelPortfolioSystemMandate("high_risk");
    assert.match(mandate, /kvalitetsbolag som fallit materiellt/);
    assert.match(mandate, /Försök inte pricka absoluta botten/);
    assert.match(mandate, /entry-bekräftelse/);
    assert.match(mandate, /fallande kniv/);
  });

  it("prefers Nordic and US small-mid caps without banning exceptional large caps", () => {
    const mandate = buildModelPortfolioSystemMandate("high_risk");
    assert.match(mandate, /small- och mid-cap-bolag i Norden/);
    assert.match(mandate, /Russell-universumet/);
    assert.match(mandate, /stora amerikanska kvalitetsbolag är fortsatt tillåtna/);
    assert.match(mandate, /Påstå inte Russell-medlemskap/);
  });

  it("encodes distinct search mission, setups, tactics and rejection signals", () => {
    const conservative = buildModelPortfolioSystemMandate("conservative");
    const balanced = buildModelPortfolioSystemMandate("balanced");
    const highRisk = buildModelPortfolioSystemMandate("high_risk");
    const dividend = buildModelPortfolioSystemMandate("dividend");

    assert.match(conservative, /SÖKUPPDRAG:/);
    assert.match(conservative, /FÖREDRAGNA SETUPS:/);
    assert.match(conservative, /ENTRY-TAKTIK:/);
    assert.match(conservative, /AVVISNINGSSIGNALER:/);
    assert.match(conservative, /KORTLISTAN i detta pass är redan skräddarsydd/);
    assert.match(conservative, /Imitera inte en annan modellportfölj/);
    assert.match(conservative, /HOLD och kassa är giltiga utfall/);
    assert.match(conservative, /etablerad, lönsam kvalitet/);
    assert.match(conservative, /maxvikten 12 %/);

    assert.match(balanced, /quality at a reasonable price|kvalitet till rimlig värdering/);
    assert.match(balanced, /maxvikten 15 %/);
    assert.match(highRisk, /annan möjlighetssamling/);
    assert.match(highRisk, /Generisk mega-cap-kvalitet/);
    assert.match(highRisk, /Forcera inte 20 %/);
    assert.match(dividend, /Ingen icke-utdelande aktie får läcka in/);
    assert.match(dividend, /Hög yield efter kurskollaps/);

    assert.notEqual(MODEL_PORTFOLIO_MANDATES.conservative.searchMission, MODEL_PORTFOLIO_MANDATES.high_risk.searchMission);
    assert.notEqual(MODEL_PORTFOLIO_MANDATES.balanced.preferredSetups[0], MODEL_PORTFOLIO_MANDATES.dividend.preferredSetups[0]);
  });

  it("restricts the dividend mandate to income securities and prioritizes preference/D shares", () => {
    const mandate = buildModelPortfolioSystemMandate("dividend");
    assert.match(mandate, /Sök endast bland utdelande stamaktier, preferensaktier, D-aktier och utdelande ETF:er/);
    assert.match(mandate, /preferensaktier och D-aktier förtur/i);
    assert.match(mandate, /vanlig aktie utan verifierad positiv utdelning är inte en ny köpkandidat/i);
    assert.match(mandate, /XACT Norden Högutdelande/);
    assert.match(mandate, /Montrose Global Monthly Dividend/);
    assert.match(mandate, /covered-call\/optionskomponent/);
  });
});
