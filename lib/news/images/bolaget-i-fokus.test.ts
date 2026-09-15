import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { renderSeriesImage } from "./render-series-image";
import { calculateStaticRegionDiff, staticRegionDiffPasses } from "./static-regression";
import { BOLAGET_I_FOKUS_TEMPLATE_V1 } from "./templates";

const ROOT = process.cwd();

test("Bolaget i fokus renders from the frozen reusable master", async () => {
  const result = await renderSeriesImage({
    series: "bolaget-i-fokus",
    date: "2026-09-16",
    articleSlug: "bolaget-i-fokus-test",
  });

  assert.equal(result.status, "generated");
  assert.equal(result.width, 1280);
  assert.equal(result.height, 720);
  assert.equal(result.format, "png");
  assert.deepEqual(result.companiesUsed, []);
  assert.equal(
    result.templateVersion,
    "bolaget-i-fokus-v1-2026-09-15-static-master",
  );
  assert.ok(result.imagePath);

  const template = BOLAGET_I_FOKUS_TEMPLATE_V1;
  const diff = await calculateStaticRegionDiff(
    result.imagePath!,
    path.join(ROOT, template.referencePath),
    [template.dynamicRegions.date],
    template.staticRegression,
  );
  assert.equal(staticRegionDiffPasses(diff, template.staticRegression), true);
});
