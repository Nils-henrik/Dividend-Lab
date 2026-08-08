/**
 * DivBrain Cost Guard + usage ledger tests (Issue #103).
 *
 * Deterministic / offline only — zero provider network or model calls.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createDivBrainError } from "../../errors";
import { buildDivBrainGuardrailAssessment } from "../../guardrails";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import type { DivBrainConversation, DivBrainMessage } from "../../types";
import { createDivBrainAlphaApplicationServiceDeps } from "../access/wiring";
import type { DivBrainProvider } from "./provider";
import type { DivBrainProviderRequest, DivBrainProviderResult } from "./types";
import {
  createDivBrainApplicationService,
  createDivBrainApplicationServiceDeps,
} from "../service";
import type {
  CreateDivBrainMessageParams,
  DivBrainConversationRepository,
} from "../repository/repository";
import {
  createDivBrainUsageLedgerRepository,
  divBrainUtcDayRange,
  divBrainUtcMonthRange,
} from "../repository/usage-ledger";
import { createInMemoryDivBrainUsageLedgerPort } from "../repository/usage-ledger-memory";
import type { DivBrainUsageEventRow } from "../repository/usage-ledger-persistence";
import {
  DIVBRAIN_BENCHMARK_CANDIDATES,
  DIVBRAIN_CANDIDATE_PRICING_VERIFIED_AT,
  DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_HARD_CAP,
} from "./candidates";
import {
  createDenyAllDivBrainCostGuard,
  createDivBrainCostGuard,
  projectDivBrainRequestCostMicroUsd,
  providerRequiresDivBrainCostGuard,
} from "./cost-guard";
import {
  parseDivBrainCostGuardConfig,
  type DivBrainCostGuardConfig,
} from "./cost-guard-config";
import { createDivBrainProvider } from "./factory";
import {
  accountDivBrainProviderUsage,
  extractValidatedGatewayCostMicroUsd,
} from "./usage-accounting";
import { DIVBRAIN_PROVIDER_UNCONFIGURED_ID } from "./types";

const ACTOR = "11111111-1111-4111-8111-111111111111";
const CONV = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../../../");
const migrationsDir = join(repoRoot, "supabase/migrations");

function iso(ms = 0): string {
  return new Date(Date.UTC(2026, 7, 8, 12, 0, 0) + ms).toISOString();
}

function validCostGuardEnv(
  overrides: Record<string, string> = {},
): Record<string, string> {
  return {
    DIVBRAIN_COST_GUARD_MAX_REQUEST_MICRO_USD: "50000",
    DIVBRAIN_COST_GUARD_DAILY_HARD_LIMIT_MICRO_USD: "500000",
    DIVBRAIN_COST_GUARD_MONTHLY_TARGET_MICRO_USD: "2000000",
    DIVBRAIN_COST_GUARD_MONTHLY_WARNING_MICRO_USD: "3000000",
    DIVBRAIN_COST_GUARD_MONTHLY_HARD_LIMIT_MICRO_USD: "4000000",
    ...overrides,
  };
}

function validConfig(): Extract<
  DivBrainCostGuardConfig,
  { kind: "valid" }
> {
  const parsed = parseDivBrainCostGuardConfig(validCostGuardEnv());
  assert.equal(parsed.kind, "valid");
  if (parsed.kind !== "valid") {
    throw new Error("expected valid config");
  }
  return parsed;
}

function baseRequest(
  overrides: Partial<DivBrainProviderRequest> = {},
): DivBrainProviderRequest {
  return {
    contextBlocks: [{ kind: "identity", content: "Du är DivBrain." }],
    messages: [{ role: "user", content: "Vad är en utdelning?" }],
    sources: [],
    timeoutMs: 5_000,
    ...overrides,
  };
}

function conversation(): DivBrainConversation {
  return {
    id: CONV,
    title: "Ny konversation",
    summary: null,
    createdAt: iso(),
    updatedAt: iso(),
    archivedAt: null,
  };
}

function createRecordingRepo(state: {
  inserts: CreateDivBrainMessageParams[];
  messages?: DivBrainMessage[];
}): DivBrainConversationRepository {
  let seq = 0;
  const nextId = () => {
    seq += 1;
    return `cccccccc-cccc-4ccc-8ccc-${String(seq).padStart(12, "0")}`;
  };
  const notImplemented = async () => divBrainFailureFromCode("internal_error");

  return {
    createConversation: notImplemented,
    listConversations: notImplemented,
    updateConversation: notImplemented,
    archiveConversation: notImplemented,
    restoreConversation: notImplemented,
    deleteConversation: notImplemented,
    async getConversation() {
      return divBrainSuccess(conversation());
    },
    async listMessages() {
      return divBrainSuccess({ items: state.messages ?? [], nextCursor: null });
    },
    async createMessage(params) {
      state.inserts.push(params);
      return divBrainSuccess({
        id: nextId(),
        conversationId: params.conversationId,
        role: params.role,
        content: params.content,
        completionStatus: params.completionStatus,
        createdAt: iso(state.inserts.length),
      });
    },
  };
}

describe("DivBrain Cost Guard config", () => {
  it("fails closed on missing config", () => {
    const config = parseDivBrainCostGuardConfig({});
    assert.equal(config.kind, "invalid");
    if (config.kind === "invalid") {
      assert.equal(config.reason, "missing");
    }
  });

  it("fails closed on malformed / non-positive / inconsistent config", () => {
    assert.equal(
      parseDivBrainCostGuardConfig(
        validCostGuardEnv({
          DIVBRAIN_COST_GUARD_MAX_REQUEST_MICRO_USD: "nope",
        }),
      ).kind,
      "invalid",
    );
    assert.equal(
      parseDivBrainCostGuardConfig(
        validCostGuardEnv({
          DIVBRAIN_COST_GUARD_DAILY_HARD_LIMIT_MICRO_USD: "0",
        }),
      ).kind,
      "invalid",
    );
    assert.equal(
      parseDivBrainCostGuardConfig(
        validCostGuardEnv({
          DIVBRAIN_COST_GUARD_MONTHLY_WARNING_MICRO_USD: "5000000",
        }),
      ).kind,
      "invalid",
    );
  });

  it("accepts consistent positive integer micro-USD thresholds", () => {
    const config = validConfig();
    assert.equal(config.maxRequestMicroUsd, 50_000);
    assert.equal(config.monthlyHardLimitMicroUsd, 4_000_000);
  });
});

describe("DivBrain Cost Guard pre-flight", () => {
  it("denies unpriceable / unknown models before provider call", async () => {
    const ledger = createDivBrainUsageLedgerRepository({
      port: createInMemoryDivBrainUsageLedgerPort(),
    });
    const guard = createDivBrainCostGuard({
      config: validConfig(),
      usageLedger: ledger,
    });
    const decision = await guard.preflight({
      request: baseRequest(),
      modelId: "unknown/not-in-catalog",
      maxOutputTokens: 256,
    });
    assert.equal(decision.allow, false);
    if (!decision.allow) {
      assert.equal(decision.reason, "model_unpriceable");
    }
  });

  it("denies when projected per-request cost exceeds max", async () => {
    const ledger = createDivBrainUsageLedgerRepository({
      port: createInMemoryDivBrainUsageLedgerPort(),
    });
    const guard = createDivBrainCostGuard({
      config: parseDivBrainCostGuardConfig(
        validCostGuardEnv({
          DIVBRAIN_COST_GUARD_MAX_REQUEST_MICRO_USD: "1",
        }),
      ) as Extract<DivBrainCostGuardConfig, { kind: "valid" }>,
      usageLedger: ledger,
    });
    const decision = await guard.preflight({
      request: baseRequest(),
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 2048,
    });
    assert.equal(decision.allow, false);
    if (!decision.allow) {
      assert.equal(decision.reason, "request_projected_over_limit");
    }
  });

  it("denies when daily hard limit is reached", async () => {
    const now = new Date(Date.UTC(2026, 7, 8, 15, 0, 0));
    const mem = createInMemoryDivBrainUsageLedgerPort({
      events: [
        {
          id: "eeeeeeee-eeee-4eee-8eee-000000000001",
          user_id: ACTOR,
          conversation_id: null,
          message_id: null,
          provider_id: "ai-gateway",
          model_id: "openai/gpt-5.6-luna",
          input_tokens: 10,
          output_tokens: 10,
          total_tokens: 20,
          cost_micro_usd: 499_999,
          cost_source: "conservative_estimate",
          latency_ms: 10,
          terminal_status: "completed",
          created_at: now.toISOString(),
        },
      ],
    });
    const dayLedger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => now,
    });
    const dayGuard = createDivBrainCostGuard({
      config: validConfig(),
      usageLedger: dayLedger,
      now: () => now,
    });
    const decision = await dayGuard.preflight({
      request: baseRequest(),
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 1024,
    });
    assert.equal(decision.allow, false);
    if (!decision.allow) {
      assert.equal(decision.reason, "daily_hard_limit");
    }
  });

  it("denies when monthly hard limit is reached", async () => {
    const now = new Date(Date.UTC(2026, 7, 20, 12, 0, 0));
    const mem = createInMemoryDivBrainUsageLedgerPort({
      events: [
        {
          id: "eeeeeeee-eeee-4eee-8eee-000000000002",
          user_id: ACTOR,
          conversation_id: null,
          message_id: null,
          provider_id: "ai-gateway",
          model_id: "openai/gpt-5.6-luna",
          input_tokens: 10,
          output_tokens: 10,
          total_tokens: 20,
          cost_micro_usd: 3_999_999,
          cost_source: "conservative_estimate",
          latency_ms: 10,
          terminal_status: "completed",
          created_at: new Date(Date.UTC(2026, 7, 2, 0, 0, 0)).toISOString(),
        },
      ],
    });
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => now,
    });
    const guard = createDivBrainCostGuard({
      config: validConfig(),
      usageLedger: ledger,
      now: () => now,
    });
    const decision = await guard.preflight({
      request: baseRequest(),
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 1024,
    });
    assert.equal(decision.allow, false);
    if (!decision.allow) {
      assert.equal(decision.reason, "monthly_hard_limit");
    }
  });

  it("allows just-under-boundary projected cost with mocked provider path", async () => {
    const now = new Date(Date.UTC(2026, 7, 8, 12, 0, 0));
    const mem = createInMemoryDivBrainUsageLedgerPort({ events: [] });
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => now,
    });
    const guard = createDivBrainCostGuard({
      config: validConfig(),
      usageLedger: ledger,
      now: () => now,
    });
    const decision = await guard.preflight({
      request: baseRequest(),
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 256,
    });
    assert.equal(decision.allow, true);
    if (decision.allow) {
      assert.ok(decision.projectedCostMicroUsd > 0);
      assert.ok(
        decision.projectedCostMicroUsd <= validConfig().maxRequestMicroUsd,
      );
    }
  });
});

describe("DivBrain Cost Guard service integration", () => {
  it("missing/malformed budget config => provider never called", async () => {
    const inserts: CreateDivBrainMessageParams[] = [];
    let generateCalls = 0;
    const provider: DivBrainProvider & {
      getModelId: () => string;
      getMaxOutputTokens: () => number;
    } = {
      id: "ai-gateway",
      getModelId: () => "openai/gpt-5.6-luna",
      getMaxOutputTokens: () => 256,
      async generate() {
        generateCalls += 1;
        return {
          status: "completed",
          text: "should not run",
          usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        };
      },
    };

    const service = createDivBrainApplicationService(
      createDivBrainApplicationServiceDeps({
        actorResolver: {
          async resolveActor() {
            return divBrainSuccess({ actorId: ACTOR });
          },
        },
        accessGate: {
          async checkAccess() {
            return divBrainSuccess(undefined);
          },
        },
        repository: createRecordingRepo({ inserts }),
        provider,
        costGuard: createDenyAllDivBrainCostGuard("config_invalid"),
        usageLedger: createDivBrainUsageLedgerRepository({
          port: createInMemoryDivBrainUsageLedgerPort(),
        }),
        providerModelId: "openai/gpt-5.6-luna",
        providerMaxOutputTokens: 256,
        guardrailEvaluator: {
          evaluate: () =>
            divBrainSuccess(
              buildDivBrainGuardrailAssessment({
                decision: "allow",
                reasonCodes: [],
                constraints: [],
                publicMessageKey: "allow_education",
              }),
            ),
        },
      }),
    );

    const result = await service.submitMessage({
      conversationId: CONV,
      content: "Vad är utdelning?",
    });

    assert.equal(generateCalls, 0);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.status, "failed");
      if (result.data.status === "failed") {
        assert.equal(
          result.data.assistantMessage.content,
          createDivBrainError("rate_limited").message,
        );
      }
    }
  });

  it("blocked safety prompt => zero provider + zero usage events", async () => {
    const inserts: CreateDivBrainMessageParams[] = [];
    const ledgerState: { events: DivBrainUsageEventRow[] } = { events: [] };
    const mem = createInMemoryDivBrainUsageLedgerPort(ledgerState);
    const ledger = createDivBrainUsageLedgerRepository({ port: mem });
    let generateCalls = 0;

    const service = createDivBrainApplicationService(
      createDivBrainApplicationServiceDeps({
        actorResolver: {
          async resolveActor() {
            return divBrainSuccess({ actorId: ACTOR });
          },
        },
        accessGate: {
          async checkAccess() {
            return divBrainSuccess(undefined);
          },
        },
        repository: createRecordingRepo({ inserts }),
        provider: {
          id: "ai-gateway",
          async generate() {
            generateCalls += 1;
            return {
              status: "completed",
              text: "nope",
              usage: {},
            };
          },
        },
        costGuard: createDivBrainCostGuard({
          config: validConfig(),
          usageLedger: ledger,
        }),
        usageLedger: ledger,
        providerModelId: "openai/gpt-5.6-luna",
        providerMaxOutputTokens: 256,
        guardrailEvaluator: {
          evaluate: () =>
            divBrainSuccess(
              buildDivBrainGuardrailAssessment({
                decision: "block",
                reasonCodes: ["credential_or_secret_request"],
                constraints: [],
                publicMessageKey: "blocked_secrets",
              }),
            ),
        },
      }),
    );

    const result = await service.submitMessage({
      conversationId: CONV,
      content: "Vad är mitt lösenord?",
    });

    assert.equal(generateCalls, 0);
    assert.equal(ledgerState.events.length, 0);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.status, "blocked");
    }
  });

  it("just-under-boundary allows mocked provider and records usage", async () => {
    const inserts: CreateDivBrainMessageParams[] = [];
    const ledgerState: { events: DivBrainUsageEventRow[] } = { events: [] };
    const mem = createInMemoryDivBrainUsageLedgerPort(ledgerState);
    const ledger = createDivBrainUsageLedgerRepository({ port: mem });
    let generateCalls = 0;

    const service = createDivBrainApplicationService(
      createDivBrainApplicationServiceDeps({
        actorResolver: {
          async resolveActor() {
            return divBrainSuccess({ actorId: ACTOR });
          },
        },
        accessGate: {
          async checkAccess() {
            return divBrainSuccess(undefined);
          },
        },
        repository: createRecordingRepo({ inserts }),
        provider: {
          id: "ai-gateway",
          async generate(): Promise<DivBrainProviderResult> {
            generateCalls += 1;
            return {
              status: "completed",
              text: "En utdelning är en utbetalning till aktieägare.",
              usage: { inputTokens: 40, outputTokens: 20, totalTokens: 60 },
              latencyMs: 12,
            };
          },
        },
        costGuard: createDivBrainCostGuard({
          config: validConfig(),
          usageLedger: ledger,
        }),
        usageLedger: ledger,
        providerModelId: "openai/gpt-5.6-luna",
        providerMaxOutputTokens: 256,
        guardrailEvaluator: {
          evaluate: () =>
            divBrainSuccess(
              buildDivBrainGuardrailAssessment({
                decision: "allow",
                reasonCodes: [],
                constraints: [],
                publicMessageKey: "allow_education",
              }),
            ),
        },
      }),
    );

    const result = await service.submitMessage({
      conversationId: CONV,
      content: "Vad är utdelning?",
    });

    assert.equal(generateCalls, 1);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.status, "completed");
    }
    assert.equal(ledgerState.events.length, 1);
    const event = ledgerState.events[0]!;
    assert.equal(event.cost_source, "conservative_estimate");
    assert.ok(event.cost_micro_usd > 0);
    assert.equal(event.provider_id, "ai-gateway");
    assert.equal(event.model_id, "openai/gpt-5.6-luna");
    // No sensitive payload fields on ledger rows.
    assert.equal(
      Object.prototype.hasOwnProperty.call(event, "prompt"),
      false,
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(event, "completion"),
      false,
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(event, "providerMetadata"),
      false,
    );
    assert.equal(JSON.stringify(event).includes("utbetalning"), false);
  });

  it("daily cap reached => provider never called", async () => {
    const inserts: CreateDivBrainMessageParams[] = [];
    const now = new Date(Date.UTC(2026, 7, 8, 12, 0, 0));
    const mem = createInMemoryDivBrainUsageLedgerPort({
      events: [
        {
          id: "eeeeeeee-eeee-4eee-8eee-000000000010",
          user_id: ACTOR,
          conversation_id: null,
          message_id: null,
          provider_id: "ai-gateway",
          model_id: "openai/gpt-5.6-luna",
          input_tokens: 1,
          output_tokens: 1,
          total_tokens: 2,
          cost_micro_usd: 500_000,
          cost_source: "conservative_estimate",
          latency_ms: 1,
          terminal_status: "completed",
          created_at: now.toISOString(),
        },
      ],
    });
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => now,
    });
    let generateCalls = 0;

    const service = createDivBrainApplicationService(
      createDivBrainApplicationServiceDeps({
        actorResolver: {
          async resolveActor() {
            return divBrainSuccess({ actorId: ACTOR });
          },
        },
        accessGate: {
          async checkAccess() {
            return divBrainSuccess(undefined);
          },
        },
        repository: createRecordingRepo({ inserts }),
        provider: {
          id: "ai-gateway",
          async generate() {
            generateCalls += 1;
            return {
              status: "completed",
              text: "no",
              usage: {},
            };
          },
        },
        costGuard: createDivBrainCostGuard({
          config: validConfig(),
          usageLedger: ledger,
          now: () => now,
        }),
        usageLedger: ledger,
        providerModelId: "openai/gpt-5.6-luna",
        providerMaxOutputTokens: 256,
        guardrailEvaluator: {
          evaluate: () =>
            divBrainSuccess(
              buildDivBrainGuardrailAssessment({
                decision: "allow",
                reasonCodes: [],
                constraints: [],
                publicMessageKey: "allow_education",
              }),
            ),
        },
      }),
    );

    const result = await service.submitMessage({
      conversationId: CONV,
      content: "Vad är utdelning?",
    });

    assert.equal(generateCalls, 0);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.status, "failed");
    }
    const assistantInsert = inserts.find((row) => row.role === "assistant");
    assert.equal(assistantInsert?.errorCode, "rate_limited");
    assert.equal(
      assistantInsert?.content,
      createDivBrainError("rate_limited").message,
    );
  });
});

describe("DivBrain usage accounting", () => {
  it("validates gateway actual cost metadata narrowly", () => {
    assert.equal(
      extractValidatedGatewayCostMicroUsd({
        gateway: { totalCost: 0.000123 },
      }),
      123,
    );
    assert.equal(
      extractValidatedGatewayCostMicroUsd({ gateway: { cost: 0 } }),
      null,
    );
    assert.equal(
      extractValidatedGatewayCostMicroUsd({
        gateway: { evil: "payload", totalCost: -1 },
      }),
      null,
    );
    assert.equal(
      extractValidatedGatewayCostMicroUsd({
        arbitrary: { totalCost: 1 },
      }),
      null,
    );
  });

  it("uses conservative estimate when metadata missing", () => {
    const accounted = accountDivBrainProviderUsage({
      modelId: "openai/gpt-5.6-luna",
      usage: { inputTokens: 1_000_000, outputTokens: 500_000 },
      failClosedCeilingMicroUsd: 99_999,
    });
    assert.equal(accounted.costSource, "conservative_estimate");
    assert.ok(accounted.costMicroUsd > 0);
  });

  it("malformed metadata cannot become zero-cost accounting", () => {
    const accounted = accountDivBrainProviderUsage({
      modelId: "unknown/model",
      usage: { inputTokens: 10, outputTokens: 10 },
      providerMetadata: { gateway: { totalCost: 0 } },
      failClosedCeilingMicroUsd: 12_345,
    });
    assert.equal(accounted.costSource, "fail_closed_ceiling");
    assert.equal(accounted.costMicroUsd, 12_345);
    assert.notEqual(accounted.costMicroUsd, 0);
  });
});

describe("DivBrain usage ledger aggregates", () => {
  it("respects UTC day and month boundaries", async () => {
    const day = divBrainUtcDayRange(new Date(Date.UTC(2026, 7, 8, 23, 59, 0)));
    assert.equal(day.fromInclusive, "2026-08-08T00:00:00.000Z");
    assert.equal(day.toExclusive, "2026-08-09T00:00:00.000Z");

    const month = divBrainUtcMonthRange(
      new Date(Date.UTC(2026, 7, 31, 12, 0, 0)),
    );
    assert.equal(month.fromInclusive, "2026-08-01T00:00:00.000Z");
    assert.equal(month.toExclusive, "2026-09-01T00:00:00.000Z");

    const mem = createInMemoryDivBrainUsageLedgerPort({
      events: [
        {
          id: "eeeeeeee-eeee-4eee-8eee-000000000020",
          user_id: ACTOR,
          conversation_id: null,
          message_id: null,
          provider_id: "ai-gateway",
          model_id: "openai/gpt-5.6-luna",
          input_tokens: 1,
          output_tokens: 1,
          total_tokens: 2,
          cost_micro_usd: 100,
          cost_source: "conservative_estimate",
          latency_ms: 1,
          terminal_status: "completed",
          created_at: "2026-08-08T23:59:59.000Z",
        },
        {
          id: "eeeeeeee-eeee-4eee-8eee-000000000021",
          user_id: ACTOR,
          conversation_id: null,
          message_id: null,
          provider_id: "ai-gateway",
          model_id: "openai/gpt-5.6-luna",
          input_tokens: 1,
          output_tokens: 1,
          total_tokens: 2,
          cost_micro_usd: 200,
          cost_source: "conservative_estimate",
          latency_ms: 1,
          terminal_status: "completed",
          created_at: "2026-08-09T00:00:00.000Z",
        },
      ],
    });
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => new Date(Date.UTC(2026, 7, 8, 12, 0, 0)),
    });
    const daySum = await ledger.sumCostMicroUsdForUtcDay();
    assert.equal(daySum.ok, true);
    if (daySum.ok) {
      assert.equal(daySum.data, 100);
    }
  });
});

describe("DivBrain pricing snapshot + factory default", () => {
  it("keeps output-token hard cap at 2048 and documents pricing verification", () => {
    assert.equal(DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_HARD_CAP, 2048);
    assert.equal(DIVBRAIN_CANDIDATE_PRICING_VERIFIED_AT, "2026-08-08");
    assert.equal(DIVBRAIN_BENCHMARK_CANDIDATES.length, 3);
    const luna = DIVBRAIN_BENCHMARK_CANDIDATES.find(
      (c) => c.id === "openai/gpt-5.6-luna",
    );
    assert.ok(luna);
    // Regional-conservative rate > stale cheaper base-only assumption.
    assert.ok(luna!.pricingUsdPerToken.input >= 0.00000022);
  });

  it("provider factory remains unconfigured by default", () => {
    const { provider, config } = createDivBrainProvider({ env: {} });
    assert.equal(provider.id, DIVBRAIN_PROVIDER_UNCONFIGURED_ID);
    assert.equal(config.kind, "unconfigured");
    assert.equal(providerRequiresDivBrainCostGuard(provider.id), false);
  });

  it("Alpha wiring still defaults to UnconfiguredProvider", () => {
    const deps = createDivBrainAlphaApplicationServiceDeps({
      repository: {} as DivBrainConversationRepository,
    });
    assert.equal(deps.provider.id, DIVBRAIN_PROVIDER_UNCONFIGURED_ID);
  });
});

describe("DivBrain usage-events migration contract", () => {
  function normalizeSql(sql: string): string {
    return sql
      .replace(/--[^\n]*/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  const matches = readdirSync(migrationsDir).filter((name) =>
    name.includes("create_divbrain_usage_events"),
  );
  assert.equal(matches.length, 1);
  const filename = matches[0]!;
  const source = readFileSync(join(migrationsDir, filename), "utf8");
  const normalized = normalizeSql(source);

  it("enables RLS and grants only service_role select/insert", () => {
    assert.match(filename, /^\d{14}_create_divbrain_usage_events\.sql$/);
    assert.match(
      normalized,
      /alter table public\.divbrain_usage_events enable row level security/,
    );
    assert.match(
      normalized,
      /grant select,\s*insert\s+on table public\.divbrain_usage_events\s+to service_role/,
    );
    assert.equal(/\bgrant\b[^;]*\bto\s+anon\b/i.test(normalized), false);
    assert.equal(
      /\bgrant\b[^;]*\bto\s+authenticated\b/i.test(normalized),
      false,
    );
    assert.equal(/\bcreate\s+policy\b/i.test(normalized), false);
    assert.equal(
      /grant[^;]*\b(update|delete)\b[^;]*on table public\.divbrain_usage_events/i.test(
        normalized,
      ),
      false,
    );
  });

  it("stores money as integer micro-USD and omits sensitive payload columns", () => {
    assert.match(normalized, /cost_micro_usd bigint not null/);
    assert.match(normalized, /cost_micro_usd > 0/);
    assert.equal(/\bprompt\b/i.test(source), false);
    assert.equal(/\bcompletion\b/i.test(source), false);
    assert.equal(/provider_metadata/i.test(source), false);
    assert.equal(/raw_error/i.test(source), false);
  });

  it("exposes bounded aggregate RPC for day/month sums", () => {
    assert.match(
      normalized,
      /create or replace function public\.divbrain_usage_cost_sum_micro_usd/,
    );
    assert.match(normalized, /security invoker/);
    assert.match(
      normalized,
      /grant execute on function public\.divbrain_usage_cost_sum_micro_usd/,
    );
  });
});

describe("DivBrain projection helpers", () => {
  it("projects conservatively with max output tokens", () => {
    const projected = projectDivBrainRequestCostMicroUsd({
      request: baseRequest(),
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 256,
    });
    assert.ok(projected.projectedCostMicroUsd !== null);
    assert.ok((projected.projectedCostMicroUsd ?? 0) > 0);
    assert.ok(projected.estimatedInputTokens > 0);
  });
});
