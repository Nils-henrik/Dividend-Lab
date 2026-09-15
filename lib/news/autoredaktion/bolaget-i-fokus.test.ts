import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BOLAGET_I_FOKUS_SBB_15_SEPTEMBER_2026_ARTICLE } from "@/data/news-articles/bolaget-i-fokus-sbb-15-september-2026";

import { plannedExportName, plannedFilePath } from "./publication";
import { validateEditorialSeries } from "./series-validator";

describe("Bolaget i fokus managed series", () => {
  it("accepts the approved live SBB article as a company-focused edition", () => {
    const result = validateEditorialSeries(
      BOLAGET_I_FOKUS_SBB_15_SEPTEMBER_2026_ARTICLE,
      "bolaget-i-fokus",
    );
    assert.equal(result.ok, true, result.issues.map((issue) => issue.message).join("; "));
  });

  it("rejects a Bolaget i fokus article without company category", () => {
    const result = validateEditorialSeries(
      { ...BOLAGET_I_FOKUS_SBB_15_SEPTEMBER_2026_ARTICLE, category: "market" },
      "bolaget-i-fokus",
    );
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "company-focus"));
  });

  it("uses canonical managed module and export names", () => {
    const date = new Date("2026-09-16T11:00:00+02:00");
    assert.equal(
      plannedFilePath("bolaget-i-fokus", date),
      "data/news-articles/bolaget-i-fokus-16-september-2026.ts",
    );
    assert.equal(
      plannedExportName("bolaget-i-fokus", date),
      "BOLAGET_I_FOKUS_16_SEPTEMBER_2026_ARTICLE",
    );
  });
});
