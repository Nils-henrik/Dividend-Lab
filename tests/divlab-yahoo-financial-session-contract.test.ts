import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const SOURCE = new URL("../lib/analysis/yahoo-financials.ts", import.meta.url);

describe("DivLab Analys Yahoo financial session contract", () => {
  it("uses the Vercel-proven fc.yahoo.com cookie bootstrap without replacing the shared session contract", async () => {
    const source = await readFile(SOURCE, "utf8");

    assert.match(
      source,
      /const YAHOO_COOKIE_BOOTSTRAP = "https:\/\/fc\.yahoo\.com\/";/,
    );
    assert.match(
      source,
      /typeof input === "string" && input === YAHOO_LEGACY_SESSION_HOME\s*\? YAHOO_COOKIE_BOOTSTRAP/,
    );
    assert.match(
      source,
      /getYahooCrumbSession\(financialSessionFetch\(fetchImpl\), now\)/,
    );
    assert.match(
      source,
      /const response = await fetchImpl\(url,/,
    );
    assert.doesNotMatch(source, /getYahooCrumbSession\([^)]*YAHOO_COOKIE_BOOTSTRAP/);
  });
});
