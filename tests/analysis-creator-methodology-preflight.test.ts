import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync("components/analysis/AnalysisCreator.tsx", "utf8");

describe("AnalysisCreator methodology preflight", () => {
  it("does not promise that every Nordic equity can be analyzed before methodology verification", () => {
    assert.match(source, /Nordiska aktier verifieras mot rätt bolagsmetodik/);
    assert.match(source, /Verifieras vid val/);
    assert.doesNotMatch(source, /result\.supported \? "Kan analyseras"/);
  });

  it("requires a successful methodology preflight before enabling publish", () => {
    assert.match(source, /\/api\/internal\/analysis\/preflight/);
    assert.match(source, /preflight\?\.supported/);
    assert.match(source, /disabled=\{!canRun\}/);
    assert.match(source, /Metodik verifierad · Kan analyseras/);
  });

  it("translates methodology failures instead of rendering raw machine codes", () => {
    assert.match(source, /friendlyRunError/);
    assert.match(source, /fundamental_methodology_not_supported/);
    assert.match(source, /Bolagstypen kräver en separat fundamental metodik/);
    assert.doesNotMatch(source, /setMessage\(payload\.reason \?\?/);
  });
});
