/**
 * Phase 1B provider foundation tests (Ticket 1B-1).
 *
 * All gateway behavior is mocked — no external model calls.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  APICallError,
  LoadAPIKeyError,
} from "ai";
import {
  GatewayAuthenticationError,
  GatewayInternalServerError,
  GatewayRateLimitError,
} from "@ai-sdk/gateway";
import { createDivBrainError } from "../../errors";
import {
  runDivBrainProviderBenchmark,
  serializeDivBrainBenchmarkReport,
} from "../benchmark";
import { DIVBRAIN_BENCHMARK_CASES } from "../benchmark/cases";
import { evaluateDivBrainBenchmarkRubric } from "../benchmark/rubric";
import {
  AiGatewayProvider,
  createAiGatewayProvider,
  type AiGatewayGenerateText,
} from "./ai-gateway-provider";
import {
  DIVBRAIN_BENCHMARK_CANDIDATES,
  listDivBrainBenchmarkCandidateIds,
} from "./candidates";
import {
  hasDivBrainGatewayAuthMaterial,
  parseDivBrainProviderConfig,
} from "./config";
import { estimateDivBrainCandidateCostUsd } from "./cost";
import { createDivBrainProvider } from "./factory";
import { mapGatewayErrorToDivBrainProviderResult } from "./gateway-errors";
import { mapDivBrainRequestToGatewayPrompt } from "./request-mapping";
import type { DivBrainProviderRequest } from "./types";
import { DIVBRAIN_PROVIDER_UNCONFIGURED_ID } from "./types";
import { createUnconfiguredProvider } from "./unconfigured-provider";

function baseRequest(
  overrides: Partial<DivBrainProviderRequest> = {},
): DivBrainProviderRequest {
  return {
    contextBlocks: [
      { kind: "identity", content: "Du är DivBrain." },
      { kind: "policy", content: "Inga personliga köpråd." },
    ],
    messages: [{ role: "user", content: "Vad är en utdelning?" }],
    sources: [],
    timeoutMs: 5_000,
    ...overrides,
  };
}

describe("DivBrain Phase 1B candidates", () => {
  it("exposes three verified gateway candidate families", () => {
    const ids = listDivBrainBenchmarkCandidateIds();
    assert.equal(ids.length, 3);
    assert.ok(ids.includes("openai/gpt-5.6-luna"));
    assert.ok(ids.includes("anthropic/claude-sonnet-5"));
    assert.ok(ids.includes("google/gemini-3.6-flash"));
    assert.equal(
      DIVBRAIN_BENCHMARK_CANDIDATES.filter((c) => c.preferredPrimary).length,
      1,
    );
  });
});

describe("DivBrain provider config / factory", () => {
  it("defaults to unconfigured when env is empty", () => {
    const config = parseDivBrainProviderConfig({});
    assert.equal(config.kind, "unconfigured");
    const { provider } = createDivBrainProvider({ config });
    assert.equal(provider.id, DIVBRAIN_PROVIDER_UNCONFIGURED_ID);
  });

  it("fails closed on invalid kind or model", () => {
    assert.equal(
      parseDivBrainProviderConfig({ DIVBRAIN_PROVIDER: "openai-direct" }).kind,
      "unconfigured",
    );
    assert.equal(
      parseDivBrainProviderConfig({
        DIVBRAIN_PROVIDER: "ai-gateway",
      }).kind,
      "unconfigured",
    );
    assert.equal(
      parseDivBrainProviderConfig({
        DIVBRAIN_PROVIDER: "ai-gateway",
        DIVBRAIN_PROVIDER_MODEL: "not a model",
      }).kind,
      "unconfigured",
    );
    assert.equal(
      parseDivBrainProviderConfig({
        DIVBRAIN_PROVIDER: "ai-gateway",
        DIVBRAIN_PROVIDER_MODEL: "openai/gpt-5.6-luna",
        DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS: "999999",
      }).kind,
      "unconfigured",
    );
  });

  it("selects ai-gateway only with valid server model config", () => {
    const config = parseDivBrainProviderConfig({
      DIVBRAIN_PROVIDER: "ai-gateway",
      DIVBRAIN_PROVIDER_MODEL: "openai/gpt-5.6-luna",
      DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS: "256",
    });
    assert.equal(config.kind, "ai-gateway");
    if (config.kind !== "ai-gateway") {
      return;
    }
    assert.equal(config.modelId, "openai/gpt-5.6-luna");
    assert.equal(config.maxOutputTokens, 256);
    assert.equal(config.isBenchmarkCandidate, true);

    const generateText: AiGatewayGenerateText = async () => ({
      text: "En utdelning är en utbetalning från bolaget till aktieägare.",
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    });

    const { provider } = createDivBrainProvider({
      config,
      generateText,
    });
    assert.equal(provider.id, "ai-gateway");
  });

  it("detects gateway auth material by presence only", () => {
    assert.equal(hasDivBrainGatewayAuthMaterial({}), false);
    assert.equal(
      hasDivBrainGatewayAuthMaterial({ AI_GATEWAY_API_KEY: "sk-test" }),
      true,
    );
    assert.equal(
      hasDivBrainGatewayAuthMaterial({ VERCEL_OIDC_TOKEN: "oidc" }),
      true,
    );
  });
});

describe("DivBrain AI Gateway adapter", () => {
  it("maps completed text and usage through the DivBrain contract", async () => {
    const calls: unknown[] = [];
    const generateText: AiGatewayGenerateText = async (params) => {
      calls.push(params);
      return {
        text: "  En utdelning är bolagets utbetalning till ägare.  ",
        usage: { inputTokens: 12, outputTokens: 18, totalTokens: 30 },
      };
    };

    const provider = createAiGatewayProvider({
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 128,
      generateText,
    });

    const result = await provider.generate(baseRequest());
    assert.equal(result.status, "completed");
    if (result.status !== "completed") {
      return;
    }
    assert.equal(
      result.text,
      "En utdelning är bolagets utbetalning till ägare.",
    );
    assert.deepEqual(result.usage, {
      inputTokens: 12,
      outputTokens: 18,
      totalTokens: 30,
    });

    const call = calls[0] as {
      system?: string;
      messages: Array<{ role: string; content: string }>;
      maxOutputTokens: number;
      maxRetries: number;
      timeout: number;
    };
    assert.match(call.system ?? "", /Identity/);
    assert.match(call.system ?? "", /Policy/);
    assert.equal(call.messages.length, 1);
    assert.equal(call.messages[0]?.role, "user");
    assert.equal(call.maxOutputTokens, 128);
    assert.equal(call.maxRetries, 0);
    assert.equal(call.timeout, 5_000);
    assert.equal(JSON.stringify(call).includes("sk-"), false);
  });

  it("returns cancelled when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const provider = createAiGatewayProvider({
      modelId: "openai/gpt-5.6-luna",
      generateText: async () => {
        throw new Error("should not be called");
      },
    });
    const result = await provider.generate(
      baseRequest({ signal: controller.signal }),
    );
    assert.equal(result.status, "cancelled");
  });

  it("maps empty or malformed completed text to failed internal_error", async () => {
    const provider = createAiGatewayProvider({
      modelId: "anthropic/claude-sonnet-5",
      generateText: async () => ({ text: "   ", usage: {} }),
    });
    const result = await provider.generate(baseRequest());
    assert.equal(result.status, "failed");
    if (result.status === "failed") {
      assert.equal(result.error.code, "internal_error");
    }
  });

  it("never returns raw gateway payload fields on failure", async () => {
    const provider = new AiGatewayProvider({
      modelId: "google/gemini-3.6-flash",
      generateText: async () => {
        throw new GatewayAuthenticationError({
          message: "secret api key sk-live-should-not-leak",
          statusCode: 401,
        });
      },
    });
    const result = await provider.generate(baseRequest());
    assert.equal(result.status, "provider_unavailable");
    const serialized = JSON.stringify(result);
    assert.equal(serialized.includes("sk-live"), false);
    assert.equal(serialized.includes("secret"), false);
  });
});

describe("DivBrain gateway error mapping", () => {
  it("maps timeout/abort to cancelled", () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    assert.equal(
      mapGatewayErrorToDivBrainProviderResult(abort).status,
      "cancelled",
    );
  });

  it("maps rate limit to failed rate_limited", () => {
    const result = mapGatewayErrorToDivBrainProviderResult(
      new GatewayRateLimitError({ message: "slow down", statusCode: 429 }),
    );
    assert.equal(result.status, "failed");
    if (result.status === "failed") {
      assert.equal(result.error.code, "rate_limited");
      assert.equal(
        result.error.message,
        createDivBrainError("rate_limited").message,
      );
    }
  });

  it("maps auth and missing key to provider_unavailable", () => {
    assert.equal(
      mapGatewayErrorToDivBrainProviderResult(
        new GatewayAuthenticationError({ statusCode: 401 }),
      ).status,
      "provider_unavailable",
    );
    assert.equal(
      mapGatewayErrorToDivBrainProviderResult(
        new LoadAPIKeyError({ message: "missing key" }),
      ).status,
      "provider_unavailable",
    );
  });

  it("maps 5xx / gateway outage to provider_unavailable", () => {
    assert.equal(
      mapGatewayErrorToDivBrainProviderResult(
        new GatewayInternalServerError({ statusCode: 502 }),
      ).status,
      "provider_unavailable",
    );
    assert.equal(
      mapGatewayErrorToDivBrainProviderResult(
        new APICallError({
          message: "upstream",
          url: "https://example.invalid",
          requestBodyValues: { prompt: "secret" },
          statusCode: 503,
          isRetryable: true,
          responseBody: "raw provider dump",
        }),
      ).status,
      "provider_unavailable",
    );
  });

  it("maps API 429 via APICallError", () => {
    const result = mapGatewayErrorToDivBrainProviderResult(
      new APICallError({
        message: "rate",
        url: "https://example.invalid",
        requestBodyValues: {},
        statusCode: 429,
        isRetryable: true,
      }),
    );
    assert.equal(result.status, "failed");
    if (result.status === "failed") {
      assert.equal(result.error.code, "rate_limited");
    }
  });
});

describe("DivBrain request mapping", () => {
  it("keeps context blocks in system and conversation in messages", () => {
    const mapped = mapDivBrainRequestToGatewayPrompt(
      baseRequest({
        messages: [
          { role: "assistant", content: "Tidigare svar." },
          { role: "user", content: "Förklara ISK." },
        ],
      }),
    );
    assert.ok(mapped);
    assert.match(mapped?.system ?? "", /Du är DivBrain/);
    assert.equal(mapped?.messages.length, 2);
    assert.equal(mapped?.messages[0]?.role, "assistant");
    assert.equal(mapped?.messages[1]?.content, "Förklara ISK.");
  });
});

describe("DivBrain cost helpers", () => {
  it("estimates USD cost for known candidates", () => {
    const estimate = estimateDivBrainCandidateCostUsd({
      modelId: "openai/gpt-5.6-luna",
      usage: { inputTokens: 1_000_000, outputTokens: 500_000 },
    });
    assert.ok(estimate);
    assert.equal(estimate?.currency, "USD");
    assert.ok((estimate?.totalUsd ?? 0) > 0);
  });

  it("returns null for unknown model ids", () => {
    assert.equal(
      estimateDivBrainCandidateCostUsd({
        modelId: "unknown/model",
        usage: { inputTokens: 10, outputTokens: 10 },
      }),
      null,
    );
  });
});

describe("DivBrain benchmark harness", () => {
  it("runs mocked multi-candidate reports without prompts in artifacts", async () => {
    const report = await runDivBrainProviderBenchmark({
      mode: "mock",
      generatedAt: "2026-08-07T00:00:00.000Z",
      now: (() => {
        let t = 1_000;
        return () => {
          t += 25;
          return t;
        };
      })(),
      cases: DIVBRAIN_BENCHMARK_CASES.slice(0, 2),
      candidates: DIVBRAIN_BENCHMARK_CANDIDATES,
      providerFactory: ({ modelId }) =>
        createAiGatewayProvider({
          modelId,
          maxOutputTokens: 64,
          generateText: async () => ({
            text: "En kort utbildande förklaring om begreppet.",
            usage: { inputTokens: 40, outputTokens: 20, totalTokens: 60 },
          }),
        }),
    });

    assert.equal(report.schemaVersion, 1);
    assert.equal(report.mode, "mock");
    assert.equal(report.candidateCount, 3);
    assert.equal(report.caseCount, 2);
    assert.equal(report.results.length, 6);
    assert.equal(report.allPassed, true);

    const serialized = serializeDivBrainBenchmarkReport(report);
    assert.equal(serialized.includes("Vad är en utdelning"), false);
    assert.equal(serialized.includes("lösenord"), false);
    assert.equal(serialized.includes("Du är DivBrain"), false);
    assert.match(serialized, /openai\/gpt-5\.6-luna/);
  });

  it("enforces live hard caps on case count", async () => {
    const report = await runDivBrainProviderBenchmark({
      mode: "live",
      maxCases: 99,
      cases: DIVBRAIN_BENCHMARK_CASES,
      candidates: DIVBRAIN_BENCHMARK_CANDIDATES.slice(0, 1),
      providerFactory: ({ modelId }) =>
        createAiGatewayProvider({
          modelId,
          generateText: async () => ({
            text: "Svar.",
            usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
          }),
        }),
    });
    assert.equal(report.caseCount, 3);
    assert.equal(report.mode, "live");
  });

  it("marks provider_unavailable as a failed rubric category", () => {
    const rubric = evaluateDivBrainBenchmarkRubric({
      benchmarkCase: DIVBRAIN_BENCHMARK_CASES[0],
      providerResult: {
        status: "provider_unavailable",
        error: createDivBrainError("provider_unavailable"),
      },
    });
    assert.equal(rubric.passed, false);
    assert.ok(rubric.failureCategories.includes("provider_unavailable"));
  });
});

describe("UnconfiguredProvider remains default", () => {
  it("still returns provider_unavailable for valid requests", async () => {
    const provider = createUnconfiguredProvider();
    const result = await provider.generate(baseRequest());
    assert.equal(result.status, "provider_unavailable");
  });
});
