import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregatePortfolioAiUsage,
  extractGatewayCostUsdMicros,
  extractModelPortfolioAiUsage,
} from "./ai-usage";

describe("model portfolio AI usage observability", () => {
  it("extracts cached tokens and prefers gateway actual cost when present", () => {
    const usage = extractModelPortfolioAiUsage({
      model: "openai/gpt-5.6-luna",
      usage: {
        inputTokens: 1200,
        outputTokens: 300,
        totalTokens: 1600,
        inputTokenDetails: { cacheReadTokens: 400 },
      },
      providerMetadata: { gateway: { cost: "0.00849" } },
      catalogEstimatedCostUsdMicros: 999,
      timestamp: "2026-08-10T12:00:00.000Z",
      runId: "run-1",
    });

    assert.equal(usage.provider, "vercel-ai-gateway");
    assert.equal(usage.inputTokens, 1200);
    assert.equal(usage.cachedInputTokens, 400);
    assert.equal(usage.outputTokens, 300);
    assert.equal(usage.totalTokens, 1600);
    assert.equal(usage.estimatedCostUsdMicros, 8490);
    assert.equal(usage.costSource, "gateway_actual");
    assert.equal(usage.runId, "run-1");
  });

  it("rejects untrusted gateway metadata and falls back to catalog estimate", () => {
    assert.equal(extractGatewayCostUsdMicros({ gateway: { cost: 0 } }), null);
    assert.equal(extractGatewayCostUsdMicros({ gateway: { cost: "nope" } }), null);
    const usage = extractModelPortfolioAiUsage({
      model: "openai/gpt-5.6-luna",
      usage: { inputTokens: 10, outputTokens: 5 },
      providerMetadata: { gateway: { cost: -1 } },
      catalogEstimatedCostUsdMicros: 42,
      runId: null,
    });
    assert.equal(usage.estimatedCostUsdMicros, 42);
    assert.equal(usage.costSource, "catalog_estimate");
    assert.equal(usage.totalTokens, 15);
  });

  it("aggregates four-portfolio batch cost without prompts", () => {
    const batch = aggregatePortfolioAiUsage({
      runId: "run-batch",
      timestamp: "2026-08-10T12:05:00.000Z",
      portfolios: [
        {
          portfolioId: "a",
          slug: "investor-a",
          usage: {
            provider: "vercel-ai-gateway",
            model: "openai/gpt-5.6-luna",
            inputTokens: 100,
            cachedInputTokens: 10,
            outputTokens: 20,
            totalTokens: 130,
            estimatedCostUsdMicros: 1000,
            costSource: "catalog_estimate",
            timestamp: "2026-08-10T12:01:00.000Z",
            runId: "run-batch",
          },
        },
        {
          portfolioId: "b",
          slug: "investor-b",
          usage: {
            provider: "vercel-ai-gateway",
            model: "openai/gpt-5.6-luna",
            inputTokens: 200,
            cachedInputTokens: null,
            outputTokens: 40,
            totalTokens: 240,
            estimatedCostUsdMicros: 2000,
            costSource: "gateway_actual",
            timestamp: "2026-08-10T12:02:00.000Z",
            runId: "run-batch",
          },
        },
      ],
    });

    assert.equal(batch.portfolioCount, 2);
    assert.equal(batch.inputTokens, 300);
    assert.equal(batch.cachedInputTokens, 10);
    assert.equal(batch.outputTokens, 60);
    assert.equal(batch.totalTokens, 370);
    assert.equal(batch.estimatedCostUsdMicros, 3000);
    assert.equal(batch.estimatedCostUsd, 0.003);
    assert.equal(batch.runId, "run-batch");
    assert.equal("prompt" in batch, false);
  });
});
