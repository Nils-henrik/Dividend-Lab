import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createDivBrainProvider } from "./factory";
import type { AiGatewayGenerateText } from "./ai-gateway-provider";
import type { DivBrainProviderRequest } from "./types";

function request(): DivBrainProviderRequest {
  return {
    contextBlocks: [
      { kind: "identity", content: "Du är DivBrain." },
      { kind: "policy", content: "Ge inte personliga köp- eller säljråd." },
    ],
    messages: [{ role: "user", content: "Vad är en indexfond?" }],
    sources: [],
    timeoutMs: 5_000,
  };
}

describe("DivBrain Gateway budget-key wiring", () => {
  it("uses AI_GATEWAY_API_KEY from server env when present", async () => {
    let observedModel: unknown;
    const generateText: AiGatewayGenerateText = async (params) => {
      observedModel = params.model;
      return {
        text: "En indexfond följer ett index och sprider risken över många innehav.",
        usage: { inputTokens: 20, outputTokens: 18, totalTokens: 38 },
      };
    };

    const { provider, config } = createDivBrainProvider({
      env: {
        DIVBRAIN_PROVIDER: "ai-gateway",
        DIVBRAIN_PROVIDER_MODEL: "openai/gpt-5.6-luna",
        DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS: "64",
        AI_GATEWAY_API_KEY: "gateway-budget-key-test",
      },
      generateText,
    });

    assert.equal(config.kind, "ai-gateway");
    const result = await provider.generate(request());
    assert.equal(result.status, "completed");

    // createGateway({ apiKey })(modelId) yields a model object. A plain string
    // means the factory fell back to OIDC and the API-key quota would be bypassed.
    assert.notEqual(typeof observedModel, "string");
  });

  it("keeps OIDC fallback when no dedicated Gateway API key is configured", async () => {
    let observedModel: unknown;
    const generateText: AiGatewayGenerateText = async (params) => {
      observedModel = params.model;
      return {
        text: "En indexfond följer ett index och sprider risken över många innehav.",
        usage: { inputTokens: 20, outputTokens: 18, totalTokens: 38 },
      };
    };

    const { provider, config } = createDivBrainProvider({
      env: {
        DIVBRAIN_PROVIDER: "ai-gateway",
        DIVBRAIN_PROVIDER_MODEL: "openai/gpt-5.6-luna",
        DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS: "64",
        VERCEL_OIDC_TOKEN: "oidc-presence-only",
      },
      generateText,
    });

    assert.equal(config.kind, "ai-gateway");
    const result = await provider.generate(request());
    assert.equal(result.status, "completed");
    assert.equal(typeof observedModel, "string");
    assert.equal(observedModel, "openai/gpt-5.6-luna");
  });
});
