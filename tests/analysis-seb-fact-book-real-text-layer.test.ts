import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { projectSebFactBookCurrentPeriod } from "../lib/model-portfolios/engine/seb-fact-book";

function verticalRow(label: string, values: readonly (string | number)[]): string[] {
  return [label, ...values.map(String)];
}

const periods = [
  "Q2", "2024",
  "Q3", "2024",
  "Q4", "2024",
  "Q1", "2025",
  "Q2", "2025",
  "Q3", "2025",
  "Q4", "2025",
  "Q1", "2026",
  "Q2", "2026",
];

const realLikeVerticalText = [
  "Key figures - SEB Group, nine quarters",
  ...periods,
  ...verticalRow("Return on equity, %", [17.6, 17.0, 13.2, 13.4, 15.0, 14.0, 12.9, 13.1, 15.7]),
  ...verticalRow("Return on equity excluding items affecting comparability1), %", [17.6, 17.0, 13.2, 13.4, 15.0, 14.0, 13.6, 13.1, 15.7]),
  ...verticalRow("Return on total assets, %", [0.9, 0.9, 0.7, 0.8, 0.8, 0.7, 0.7, 0.7, 0.8]),
  ...verticalRow("Return on risk exposure amount, %", [4.1, 4.1, 3.2, 3.2, 3.4, 3.1, 3.0, 3.0, 3.5]),
  ...verticalRow("Cost/income ratio", [0.36, 0.37, 0.43, 0.42, 0.41, 0.42, 0.45, 0.41, 0.40]),
  ...verticalRow("Basic earnings per share, SEK", [4.58, 4.63, 3.69, 3.89, 4.13, 3.87, 3.71, 3.83, 4.44]),
  ...verticalRow("Weighted average number of shares 2), millions", [2055, 2044, 2029, 2013, 1999, 1981, 1968, 1958, 1948]),
  ...verticalRow("Diluted earnings per share, SEK", [4.54, 4.57, 3.65, 3.84, 4.08, 3.83, 3.67, 3.79, 4.39]),
  ...verticalRow("Weighted average number of diluted shares 3), millions", [2076, 2068, 2053, 2035, 2021, 2004, 1991, 1980, 1970]),
  ...verticalRow("Net worth per share, SEK", [113.74, 117.94, 122.04, 124.43, 116.14, 120.34, 124.86, 117.55, 121.10]),
  ...verticalRow("Equity per share, SEK", [106.12, 110.26, 114.41, 117.49, 108.86, 112.88, 117.39, 110.29, 113.40]),
  ...verticalRow("Average shareholders' equity, SEK bn", [213.7, 221.8, 227.4, 234.4, 220.5, 219.8, 226.7, 228.6, 230.0]),
  ...verticalRow("Number of outstanding shares 2), millions", [2051, 2037, 2020, 2004, 1989, 1975, 1962, 1954, 1945]),
  ...verticalRow("Net ECL level, %", [0.01, 0.05, 0.05, 0.09, 0.04, 0.03, 0.05, 0.07, 0.05]),
  ...verticalRow("Stage 3 Loans / Total Loans, gross, %", [0.33, 0.41, 0.47, 0.45, 0.36, 0.36, 0.41, 0.43, 0.42]),
  ...verticalRow("Liquidity Coverage Ratio (LCR) 4), %", [130, 133, 160, 132, 130, 136, 150, 135, 125]),
  ...verticalRow("Net Stable Funding Ratio (NSFR) 5), %", [112, 113, 111, 113, 112, 116, 113, 112, 110]),
  "Own funds requirement, Basel III",
  ...verticalRow("Common Equity Tier 1 capital ratio, %", [19.0, 19.4, 17.6, 17.5, 17.7, 18.2, 17.7, 17.5, 17.2]),
].join("\n");

describe("SEB Fact Book real PDF text-layer shape", () => {
  it("reaches the late ECL/LCR/NSFR rows without leaving the named key-figures section", () => {
    const result = projectSebFactBookCurrentPeriod({
      text: realLikeVerticalText,
      reportPeriod: "Q2",
      reportYear: 2026,
    });

    assert.ok(result);
    assert.deepEqual(result.values, {
      netEclLevelPct: 0.05,
      costIncomeRatioPct: 40,
      liquidityCoverageRatioPct: 125,
      netStableFundingRatioPct: 110,
    });
  });

  it("does not borrow a required metric from the following Basel section", () => {
    const withoutLcrInKeyFigures = realLikeVerticalText.replace(
      verticalRow("Liquidity Coverage Ratio (LCR) 4), %", [130, 133, 160, 132, 130, 136, 150, 135, 125]).join("\n"),
      "",
    ) + "\n" + verticalRow("Liquidity Coverage Ratio (LCR) 4), %", [130, 133, 160, 132, 130, 136, 150, 135, 125]).join("\n");

    assert.equal(
      projectSebFactBookCurrentPeriod({
        text: withoutLcrInKeyFigures,
        reportPeriod: "Q2",
        reportYear: 2026,
      }),
      null,
    );
  });
});
