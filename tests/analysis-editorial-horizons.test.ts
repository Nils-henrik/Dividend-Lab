import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../${relativePath}`, import.meta.url)),
    "utf8",
  );
}

describe("DivLab analysis editorial horizons and chart", () => {
  it("keeps separate swing and quarter analysis perspectives", () => {
    const horizons = source("components/analysis/AnalysisHorizons.tsx");

    assert.match(horizons, /Swingtrade · 1–4 veckor/);
    assert.match(horizons, /Kvartalscase · cirka 3 månader/);
    assert.match(horizons, /Kortsiktig teknisk analys/);
    assert.match(horizons, /Längre analys/);
    assert.match(horizons, /Etablering över/);
  });

  it("uses the TradingView Lightweight Charts standalone canvas renderer", () => {
    const chart = source("components/analysis/DivLabAnalysisChart.tsx");

    assert.match(chart, /lightweight-charts@5\.2\.0/);
    assert.match(chart, /CandlestickSeries/);
    assert.match(chart, /HistogramSeries/);
    assert.match(chart, /LineSeries/);
    assert.match(chart, /attributionLogo:\s*true/);
    assert.match(chart, /TradingView Lightweight Charts™/);
  });

  it("keeps DivLab AI zones and manual drawing tools on the chart", () => {
    const chart = source("components/analysis/DivLabAnalysisChart.tsx");

    assert.match(chart, /model\.zones\.supports/);
    assert.match(chart, /model\.zones\.resistances/);
    assert.match(chart, />Nivå</);
    assert.match(chart, />Trend</);
    assert.match(chart, />Zon</);
    assert.match(chart, /coordinateToTime/);
    assert.match(chart, /coordinateToPrice/);
  });

  it("passes only the publication-safe analysis subset into the client horizon context", () => {
    const page = source("app/analyses/[slug]/page.tsx");

    assert.match(page, /buildClientPayload/);
    assert.match(page, /AnalysisClientProvider analysis=\{clientPayload\}/);
    assert.match(page, /investmentCase:/);
    assert.match(page, /fundamentalInterpretation:/);
    assert.match(page, /valuationInterpretation:/);
  });

  it("allows only the pinned TradingView loader origin in the CSP addition", () => {
    const config = source("next.config.ts");

    assert.match(config, /https:\/\/unpkg\.com/);
    assert.match(config, /TradingView charts\/widgets/);
  });
});
