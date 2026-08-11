import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import type { ModelPortfolioEvidence } from "./decision";

function compactEvidence(evidence: readonly ModelPortfolioEvidence[]): string {
  // Mirrors lib/model-portfolios/engine/ai.ts compactEvidence bounds.
  return evidence
    .slice(0, 12)
    .map(
      (item) =>
        `[${item.id}] ${item.kind} | ${item.publisher} | ${item.publishedAt} | ${item.title}\n${item.summary}`,
    )
    .join("\n\n");
}

describe("research pipeline report evidence contract", () => {
  it("keeps report parsing off the AI generation path", () => {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const pipeline = readFileSync(path.join(dir, "research-pipeline.ts"), "utf8");
    const enrichment = readFileSync(path.join(dir, "primary-source-enrichment.ts"), "utf8");
    const official = readFileSync(path.join(dir, "official-document.ts"), "utf8");

    assert.match(pipeline, /persistPrimarySourceResearchHit/);
    assert.match(pipeline, /enrichNordicPrimarySourceHits/);
    assert.doesNotMatch(pipeline, /from "\.\/ai"/);
    assert.doesNotMatch(enrichment, /generateText|generateObject|streamText/);
    assert.doesNotMatch(official, /generateText|generateObject|streamText/);
    assert.match(official, /from "pdf-parse"/);

    // Primary hits must not be persisted through the Google discovery helper.
    const primaryPersistIndex = pipeline.indexOf("persistPrimarySourceResearchHit({");
    const googlePersistIndex = pipeline.indexOf("await persistGoogleResearchHit({");
    assert.ok(primaryPersistIndex > 0);
    assert.ok(googlePersistIndex > primaryPersistIndex);
    const primaryBlock = pipeline.slice(primaryPersistIndex, googlePersistIndex);
    assert.match(primaryBlock, /official_source:\s*"nasdaq_nordic_cns"/);
    assert.doesNotMatch(primaryBlock, /Google Custom Search/);
  });

  it("includes bounded report evidence in the existing evidence compaction set", () => {
    const evidence: ModelPortfolioEvidence[] = [
      {
        id: "research:INVE-B:ST:1",
        kind: "market_data",
        publisher: "Yahoo Finance + DivLab deterministic TA",
        publishedAt: "2026-08-11T07:00:00.000Z",
        verifiedAt: "2026-08-11T07:20:00.000Z",
        title: "Investor – marknadsdata",
        summary: "Marknadsdata",
      },
      {
        id: "primary:INVE-B:2026-08-11:0",
        kind: "company_report",
        publisher: "view.news.eu.nasdaq.com",
        publishedAt: "2026-07-16T06:15:37.000Z",
        verifiedAt: "2026-08-11T07:20:00.000Z",
        title: "Interim report January-June 2026",
        summary: "Officiell bolagsrapport (H1 2026). Utdrag: Adjusted NAV...",
      },
    ];
    const compacted = compactEvidence(evidence);
    assert.match(compacted, /company_report/);
    assert.match(compacted, /Adjusted NAV/);
    assert.match(compacted, /view\.news\.eu\.nasdaq\.com/);
  });
});
