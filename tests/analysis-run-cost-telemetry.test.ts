import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const routeSource = readFileSync(
  new URL("../app/api/internal/analysis/run/route.ts", import.meta.url),
  "utf8",
);
const creatorSource = readFileSync(
  new URL("../components/analysis/AnalysisCreator.tsx", import.meta.url),
  "utf8",
);

describe("analysis run cost telemetry", () => {
  it("passes existing engine usage through ordinary Preview execution responses", () => {
    const usagePassThroughs = routeSource.match(/usage: result\.usage/g) ?? [];

    // Operating company: quality failure + final quality failure + success.
    // Bank: post-Research failure + success.
    // Financial specialist: post-Research failure + success.
    assert.equal(usagePassThroughs.length, 7);
  });

  it("keeps cost telemetry downstream of the staff auth boundary", () => {
    const roleGate = routeSource.indexOf("await getStaffRolesForUser(user.id)");
    const firstUsage = routeSource.indexOf("usage: result.usage");

    assert.ok(roleGate >= 0);
    assert.ok(firstUsage > roleGate);
  });

  it("renders normalized token and estimated USD model cost fields in the Preview creator", () => {
    assert.match(creatorSource, /estimatedCostUsdMicros: number/);
    assert.match(creatorSource, /totalTokens: number/);
    assert.match(creatorSource, /usdMicros \/ 1_000_000/);
    assert.match(creatorSource, /Tokens \{formatTokenCount\(runResult\.usage\.totalTokens\)\}/);
    assert.match(creatorSource, /Est\. AI-kostnad/);
    assert.match(creatorSource, /inte DivLabs fulla produktkostnad/);
  });

  it("does not add pricing, billing or an implicit SEK conversion", () => {
    assert.doesNotMatch(creatorSource, /Stripe|subscription|credit|billing/i);
    assert.doesNotMatch(creatorSource, /estimatedCost.*SEK|SEK.*estimatedCost/i);
    assert.doesNotMatch(routeSource, /estimatedCostUsdMicros\s*[*/+-]\s*[^,}\n]+SEK/i);
  });
});