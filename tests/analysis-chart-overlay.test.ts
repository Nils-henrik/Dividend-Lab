import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

test("analysis chart renders overlays as a TradingView primitive instead of a stale DOM overlay", async () => {
  const source = await readFile(
    path.join(process.cwd(), "components/analysis/DivLabAnalysisChart.tsx"),
    "utf8",
  );

  assert.match(source, /attachPrimitive\(overlayPrimitive\)/);
  assert.match(source, /useMediaCoordinateSpace/);
  assert.match(source, /context\.clip\(\)/);
  assert.doesNotMatch(source, /screenZones/);
  assert.doesNotMatch(source, /overflow-visible/);
});
