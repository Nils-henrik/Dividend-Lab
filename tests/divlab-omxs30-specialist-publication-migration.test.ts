import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/20260816210000_allow_omxs30_specialist_publication.sql", import.meta.url),
  "utf8",
);

describe("OMXS30 specialist publication migration", () => {
  it("keeps generic and bank content while admitting the financial-specialist schema", () => {
    assert.match(migration, /analyst-v2/);
    assert.match(migration, /analyst-v3-bank/);
    assert.match(migration, /analyst-v1-financial-specialist/);
    assert.match(migration, /financial-specialist-analyst-quality-v1/);
    assert.match(migration, /score'\)::numeric, -1\) < 100/);
    assert.match(migration, /divlab_analysis_chart_not_publishable/);
    assert.match(migration, /divlab_analysis_sources_not_publishable/);
  });
});
