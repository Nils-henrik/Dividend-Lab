/**
 * DivBrain Cost Guard + atomic usage ledger tests (Issue #105 / #103).
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
import {
  anonymizeInMemoryDivBrainUsageActor,
  clearInMemoryDivBrainUsageConversationLink,
  clearInMemoryDivBrainUsageMessageLink,
  createInMemoryDivBrainUsageLedgerPort,
} from "../repository/usage-ledger-memory";
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
import { decimalUsdStringToMicroUsdCeil } from "./cost-units";
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

function validConfig(
  overrides: Record<string, string> = {},
): Extract<DivBrainCostGuardConfig, { kind: "valid" }> {
  const parsed = parseDivBrainCostGuardConfig(validCostGuardEnv(overrides));
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
  failAssistantPersist?: boolean;
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
      if (state.failAssistantPersist && params.role === "assistant") {
        return divBrainFailureFromCode("persistence_failed");
      }
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

describe("DivBrain Cost Guard atomic reservation", () => {
  it("denies unpriceable / unknown models before provider call", async () => {
    const ledger = createDivBrainUsageLedgerRepository({
      port: createInMemoryDivBrainUsageLedgerPort(),
      now: () => new Date(iso()),
    });
    const guard = createDivBrainCostGuard({
      config: validConfig(),
      usageLedger: ledger,
    });
    const decision = await guard.reserve({
      actorId: ACTOR,
      conversationId: CONV,
      providerId: "ai-gateway",
      request: baseRequest(),
      modelId: "unknown/model",
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
      now: () => new Date(iso()),
    });
    const guard = createDivBrainCostGuard({
      config: validConfig({
        DIVBRAIN_COST_GUARD_MAX_REQUEST_MICRO_USD: "1",
      }),
      usageLedger: ledger,
    });
    const decision = await guard.reserve({
      actorId: ACTOR,
      conversationId: CONV,
      providerId: "ai-gateway",
      request: baseRequest(),
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 2048,
    });
    assert.equal(decision.allow, false);
    if (!decision.allow) {
      assert.equal(decision.reason, "request_projected_over_limit");
    }
  });

  it("denies when daily hard limit would be exceeded", async () => {
    const mem = createInMemoryDivBrainUsageLedgerPort();
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => new Date(iso()),
    });
    const projected = projectDivBrainRequestCostMicroUsd({
      request: baseRequest(),
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 16,
    });
    assert.ok(projected.projectedCostMicroUsd !== null);
    const unit = projected.projectedCostMicroUsd!;
    const config = validConfig({
      DIVBRAIN_COST_GUARD_MAX_REQUEST_MICRO_USD: String(unit),
      DIVBRAIN_COST_GUARD_DAILY_HARD_LIMIT_MICRO_USD: String(unit),
      DIVBRAIN_COST_GUARD_MONTHLY_TARGET_MICRO_USD: String(unit),
      DIVBRAIN_COST_GUARD_MONTHLY_WARNING_MICRO_USD: String(unit),
      DIVBRAIN_COST_GUARD_MONTHLY_HARD_LIMIT_MICRO_USD: String(unit),
    });
    const guard = createDivBrainCostGuard({ config, usageLedger: ledger });

    const first = await guard.reserve({
      actorId: ACTOR,
      conversationId: CONV,
      providerId: "ai-gateway",
      request: baseRequest(),
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 16,
    });
    assert.equal(first.allow, true);

    const second = await guard.reserve({
      actorId: ACTOR,
      conversationId: CONV,
      providerId: "ai-gateway",
      request: baseRequest(),
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 16,
    });
    assert.equal(second.allow, false);
    if (!second.allow) {
      assert.equal(second.reason, "daily_hard_limit");
    }
  });

  it("denies when monthly hard limit would be exceeded", async () => {
    const projected = projectDivBrainRequestCostMicroUsd({
      request: baseRequest(),
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 16,
    });
    assert.ok(projected.projectedCostMicroUsd !== null);
    const unit = projected.projectedCostMicroUsd!;

    // Prior spend earlier in the same UTC month but previous UTC day so today's
    // day-sum is empty while month-sum is already at the hard cap.
    const mem = createInMemoryDivBrainUsageLedgerPort({
      events: [
        {
          id: "eeeeeeee-eeee-4eee-8eee-000000000010",
          user_id: ACTOR,
          conversation_id: null,
          message_id: null,
          provider_id: "ai-gateway",
          model_id: "openai/gpt-5.6-luna",
          input_tokens: null,
          output_tokens: null,
          total_tokens: null,
          reserved_cost_micro_usd: unit,
          accounted_cost_micro_usd: unit,
          cost_source: "conservative_estimate",
          latency_ms: null,
          terminal_status: "completed",
          status: "finalized",
          created_at: "2026-08-01T12:00:00.000Z",
          finalized_at: "2026-08-01T12:00:01.000Z",
        },
      ],
    });
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => new Date(iso()),
    });
    const config = validConfig({
      DIVBRAIN_COST_GUARD_MAX_REQUEST_MICRO_USD: String(unit),
      DIVBRAIN_COST_GUARD_DAILY_HARD_LIMIT_MICRO_USD: String(unit),
      DIVBRAIN_COST_GUARD_MONTHLY_TARGET_MICRO_USD: String(unit),
      DIVBRAIN_COST_GUARD_MONTHLY_WARNING_MICRO_USD: String(unit),
      DIVBRAIN_COST_GUARD_MONTHLY_HARD_LIMIT_MICRO_USD: String(unit),
    });
    const guard = createDivBrainCostGuard({ config, usageLedger: ledger });

    const decision = await guard.reserve({
      actorId: ACTOR,
      conversationId: CONV,
      providerId: "ai-gateway",
      request: baseRequest(),
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 16,
    });
    assert.equal(decision.allow, false);
    if (!decision.allow) {
      assert.equal(decision.reason, "monthly_hard_limit");
    }
  });

  it("concurrent boundary reservations admit only what fits without overshoot", async () => {
    const mem = createInMemoryDivBrainUsageLedgerPort();
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => new Date(iso()),
    });
    // Projected Luna@16 tokens is small; force a tiny day cap around two reserves.
    const projected = projectDivBrainRequestCostMicroUsd({
      request: baseRequest(),
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 16,
    });
    assert.ok(projected.projectedCostMicroUsd !== null);
    const unit = projected.projectedCostMicroUsd!;
    const config = validConfig({
      DIVBRAIN_COST_GUARD_MAX_REQUEST_MICRO_USD: String(unit),
      DIVBRAIN_COST_GUARD_DAILY_HARD_LIMIT_MICRO_USD: String(unit * 2),
      DIVBRAIN_COST_GUARD_MONTHLY_TARGET_MICRO_USD: String(unit * 2),
      DIVBRAIN_COST_GUARD_MONTHLY_WARNING_MICRO_USD: String(unit * 2),
      DIVBRAIN_COST_GUARD_MONTHLY_HARD_LIMIT_MICRO_USD: String(unit * 2),
    });
    const guard = createDivBrainCostGuard({ config, usageLedger: ledger });

    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        guard.reserve({
          actorId: ACTOR,
          conversationId: CONV,
          providerId: "ai-gateway",
          request: baseRequest(),
          modelId: "openai/gpt-5.6-luna",
          maxOutputTokens: 16,
        }),
      ),
    );

    const admitted = results.filter((r) => r.allow);
    const denied = results.filter((r) => !r.allow);
    assert.equal(admitted.length, 2);
    assert.equal(denied.length, 2);
    for (const d of denied) {
      if (!d.allow) {
        assert.equal(d.reason, "daily_hard_limit");
      }
    }

    const daySum = await ledger.sumReservedCostMicroUsdForUtcDay();
    assert.equal(daySum.ok, true);
    if (daySum.ok) {
      assert.equal(daySum.data, unit * 2);
      assert.ok(daySum.data <= unit * 2);
    }
  });

  it("aggregate/reservation persistence unavailable => deny (zero provider path)", async () => {
    const mem = createInMemoryDivBrainUsageLedgerPort({
      events: [],
      reserveUnavailable: true,
    });
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => new Date(iso()),
    });
    const guard = createDivBrainCostGuard({
      config: validConfig(),
      usageLedger: ledger,
    });
    const decision = await guard.reserve({
      actorId: ACTOR,
      conversationId: CONV,
      providerId: "ai-gateway",
      request: baseRequest(),
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 256,
    });
    assert.equal(decision.allow, false);
    if (!decision.allow) {
      assert.equal(decision.reason, "aggregate_unavailable");
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

  it("reservation persistence unavailable => zero provider calls", async () => {
    const inserts: CreateDivBrainMessageParams[] = [];
    let generateCalls = 0;
    const mem = createInMemoryDivBrainUsageLedgerPort({
      events: [],
      reserveUnavailable: true,
    });
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => new Date(iso()),
    });

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
  });

  it("blocked safety prompt => zero provider call + zero reservation", async () => {
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

  it("reservation succeeds => provider called once only and usage finalized", async () => {
    const inserts: CreateDivBrainMessageParams[] = [];
    const ledgerState: { events: DivBrainUsageEventRow[] } = { events: [] };
    const mem = createInMemoryDivBrainUsageLedgerPort(ledgerState);
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => new Date(iso()),
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
    assert.equal(event.status, "finalized");
    assert.equal(event.cost_source, "conservative_estimate");
    assert.ok((event.accounted_cost_micro_usd ?? 0) > 0);
    assert.ok(event.reserved_cost_micro_usd > 0);
    assert.equal(event.provider_id, "ai-gateway");
    assert.equal(event.model_id, "openai/gpt-5.6-luna");
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

  it("paid provider result + assistant persistence failure still leaves cost represented", async () => {
    const inserts: CreateDivBrainMessageParams[] = [];
    const ledgerState: { events: DivBrainUsageEventRow[] } = { events: [] };
    const mem = createInMemoryDivBrainUsageLedgerPort(ledgerState);
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => new Date(iso()),
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
        repository: createRecordingRepo({
          inserts,
          failAssistantPersist: true,
        }),
        provider: {
          id: "ai-gateway",
          async generate(): Promise<DivBrainProviderResult> {
            generateCalls += 1;
            return {
              status: "completed",
              text: "En utdelning är en utbetalning till aktieägare.",
              usage: { inputTokens: 40, outputTokens: 20, totalTokens: 60 },
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
    assert.equal(result.ok, false);
    assert.equal(ledgerState.events.length, 1);
    const event = ledgerState.events[0]!;
    assert.ok(
      event.status === "reserved" || event.status === "finalized",
      "cost must remain represented after assistant persistence failure",
    );
    assert.ok(event.reserved_cost_micro_usd > 0);
  });

  it("accounting/finalize failure does not erase the reserved charge", async () => {
    const inserts: CreateDivBrainMessageParams[] = [];
    const ledgerState: {
      events: DivBrainUsageEventRow[];
      finalizeUnavailable?: boolean;
    } = { events: [], finalizeUnavailable: true };
    const mem = createInMemoryDivBrainUsageLedgerPort(ledgerState);
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => new Date(iso()),
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
          async generate(): Promise<DivBrainProviderResult> {
            generateCalls += 1;
            return {
              status: "completed",
              text: "En utdelning är en utbetalning till aktieägare.",
              usage: { inputTokens: 40, outputTokens: 20, totalTokens: 60 },
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

    await service.submitMessage({
      conversationId: CONV,
      content: "Vad är utdelning?",
    });

    assert.equal(generateCalls, 1);
    assert.equal(ledgerState.events.length, 1);
    const event = ledgerState.events[0]!;
    assert.equal(event.status, "reserved");
    assert.ok(event.reserved_cost_micro_usd > 0);
    assert.equal(event.accounted_cost_micro_usd, null);

    const daySum = await ledger.sumReservedCostMicroUsdForUtcDay();
    assert.equal(daySum.ok, true);
    if (daySum.ok) {
      assert.equal(daySum.data, event.reserved_cost_micro_usd);
    }
  });

  it("daily cap reached => provider never called", async () => {
    const inserts: CreateDivBrainMessageParams[] = [];
    let generateCalls = 0;
    const mem = createInMemoryDivBrainUsageLedgerPort();
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => new Date(iso()),
    });
    const projected = projectDivBrainRequestCostMicroUsd({
      request: baseRequest({
        messages: [{ role: "user", content: "Vad är utdelning?" }],
      }),
      modelId: "openai/gpt-5.6-luna",
      maxOutputTokens: 256,
    });
    assert.ok(projected.projectedCostMicroUsd !== null);
    const unit = projected.projectedCostMicroUsd!;

    // Saturate daily budget with one prior reservation.
    await ledger.reserveBudget({
      actorId: ACTOR,
      conversationId: CONV,
      providerId: "ai-gateway",
      modelId: "openai/gpt-5.6-luna",
      projectedCostMicroUsd: unit,
      maxRequestMicroUsd: unit,
      dailyHardLimitMicroUsd: unit,
      monthlyTargetMicroUsd: unit,
      monthlyWarningMicroUsd: unit,
      monthlyHardLimitMicroUsd: unit,
    });

    const config = validConfig({
      DIVBRAIN_COST_GUARD_MAX_REQUEST_MICRO_USD: String(unit),
      DIVBRAIN_COST_GUARD_DAILY_HARD_LIMIT_MICRO_USD: String(unit),
      DIVBRAIN_COST_GUARD_MONTHLY_TARGET_MICRO_USD: String(unit),
      DIVBRAIN_COST_GUARD_MONTHLY_WARNING_MICRO_USD: String(unit),
      DIVBRAIN_COST_GUARD_MONTHLY_HARD_LIMIT_MICRO_USD: String(unit),
    });

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
              text: "should not run",
              usage: {},
            };
          },
        },
        costGuard: createDivBrainCostGuard({
          config,
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

describe("DivBrain usage accounting + Gateway decimal strings", () => {
  it("accepts valid Gateway decimal-string cost", () => {
    assert.equal(decimalUsdStringToMicroUsdCeil("0.00849"), 8490);
    assert.equal(
      extractValidatedGatewayCostMicroUsd({
        gateway: { cost: "0.00849" },
      }),
      8490,
    );
    assert.equal(
      extractValidatedGatewayCostMicroUsd({
        gateway: { totalCost: "0.000125" },
      }),
      125,
    );
  });

  it("accepts valid numeric Gateway cost and rejects malformed strings", () => {
    assert.equal(
      extractValidatedGatewayCostMicroUsd({
        gateway: { totalCost: 0.000125 },
      }),
      125,
    );
    assert.equal(
      extractValidatedGatewayCostMicroUsd({ gateway: { cost: 0 } }),
      null,
    );
    assert.equal(
      extractValidatedGatewayCostMicroUsd({ gateway: { cost: "0" } }),
      null,
    );
    assert.equal(
      extractValidatedGatewayCostMicroUsd({ gateway: { cost: "-0.00849" } }),
      null,
    );
    assert.equal(
      extractValidatedGatewayCostMicroUsd({ gateway: { cost: " 0.00849" } }),
      null,
    );
    assert.equal(
      extractValidatedGatewayCostMicroUsd({ gateway: { cost: "0.00849 " } }),
      null,
    );
    assert.equal(
      extractValidatedGatewayCostMicroUsd({ gateway: { cost: "1e-3" } }),
      null,
    );
    assert.equal(
      extractValidatedGatewayCostMicroUsd({ gateway: { cost: "0.00849x" } }),
      null,
    );
    assert.equal(
      extractValidatedGatewayCostMicroUsd({
        gateway: { cost: Number.NaN },
      }),
      null,
    );
    assert.equal(
      extractValidatedGatewayCostMicroUsd({
        gateway: { cost: Number.POSITIVE_INFINITY },
      }),
      null,
    );
    assert.equal(
      extractValidatedGatewayCostMicroUsd({
        gateway: { cost: { nested: "0.00849" } },
      }),
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
      providerMetadata: { gateway: { totalCost: "0" } },
      failClosedCeilingMicroUsd: 12_345,
    });
    assert.equal(accounted.costSource, "fail_closed_ceiling");
    assert.equal(accounted.costMicroUsd, 12_345);
    assert.notEqual(accounted.costMicroUsd, 0);
  });

  it("prefers validated Gateway string cost when available", () => {
    const accounted = accountDivBrainProviderUsage({
      modelId: "openai/gpt-5.6-luna",
      usage: { inputTokens: 10, outputTokens: 10 },
      providerMetadata: { gateway: { cost: "0.00849" } },
      failClosedCeilingMicroUsd: 99_999,
    });
    assert.equal(accounted.costSource, "gateway_actual");
    assert.equal(accounted.costMicroUsd, 8490);
  });
});

describe("DivBrain usage ledger deletion lifecycle", () => {
  it("user deletion does not delete historical cost accounting", async () => {
    const state: { events: DivBrainUsageEventRow[] } = { events: [] };
    const mem = createInMemoryDivBrainUsageLedgerPort(state);
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => new Date(iso()),
    });
    const reserved = await ledger.reserveBudget({
      actorId: ACTOR,
      conversationId: CONV,
      providerId: "ai-gateway",
      modelId: "openai/gpt-5.6-luna",
      projectedCostMicroUsd: 1_000,
      maxRequestMicroUsd: 5_000,
      dailyHardLimitMicroUsd: 50_000,
      monthlyTargetMicroUsd: 100_000,
      monthlyWarningMicroUsd: 200_000,
      monthlyHardLimitMicroUsd: 400_000,
    });
    assert.equal(reserved.ok, true);
    if (!reserved.ok || !reserved.data.admitted) {
      throw new Error("expected reservation");
    }
    await ledger.finalizeBudget({
      reservationId: reserved.data.reservationId,
      accountedCostMicroUsd: 900,
      costSource: "conservative_estimate",
      terminalStatus: "completed",
    });

    anonymizeInMemoryDivBrainUsageActor(state, ACTOR);

    assert.equal(state.events.length, 1);
    assert.equal(state.events[0]!.user_id, null);
    assert.equal(state.events[0]!.reserved_cost_micro_usd, 1_000);
    const daySum = await ledger.sumReservedCostMicroUsdForUtcDay();
    assert.equal(daySum.ok, true);
    if (daySum.ok) {
      assert.equal(daySum.data, 1_000);
    }
  });

  it("conversation/message deletion does not delete historical spend", async () => {
    const state: { events: DivBrainUsageEventRow[] } = {
      events: [
        {
          id: "eeeeeeee-eeee-4eee-8eee-000000000099",
          user_id: ACTOR,
          conversation_id: CONV,
          message_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          provider_id: "ai-gateway",
          model_id: "openai/gpt-5.6-luna",
          input_tokens: 1,
          output_tokens: 1,
          total_tokens: 2,
          reserved_cost_micro_usd: 250,
          accounted_cost_micro_usd: 200,
          cost_source: "conservative_estimate",
          latency_ms: 1,
          terminal_status: "completed",
          status: "finalized",
          created_at: iso(),
          finalized_at: iso(1),
        },
      ],
    };
    const mem = createInMemoryDivBrainUsageLedgerPort(state);
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => new Date(iso()),
    });

    clearInMemoryDivBrainUsageConversationLink(state, CONV);
    clearInMemoryDivBrainUsageMessageLink(
      state,
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    );

    assert.equal(state.events.length, 1);
    assert.equal(state.events[0]!.conversation_id, null);
    assert.equal(state.events[0]!.message_id, null);
    assert.equal(state.events[0]!.reserved_cost_micro_usd, 250);
    const daySum = await ledger.sumReservedCostMicroUsdForUtcDay();
    assert.equal(daySum.ok, true);
    if (daySum.ok) {
      assert.equal(daySum.data, 250);
    }
  });
});

describe("DivBrain usage ledger aggregates", () => {
  it("respects UTC day and month boundaries using reserved_cost", async () => {
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
          reserved_cost_micro_usd: 100,
          accounted_cost_micro_usd: 90,
          cost_source: "conservative_estimate",
          latency_ms: 1,
          terminal_status: "completed",
          status: "finalized",
          created_at: "2026-08-08T23:59:59.000Z",
          finalized_at: "2026-08-08T23:59:59.500Z",
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
          reserved_cost_micro_usd: 200,
          accounted_cost_micro_usd: null,
          cost_source: null,
          latency_ms: null,
          terminal_status: null,
          status: "reserved",
          created_at: "2026-08-09T00:00:00.000Z",
          finalized_at: null,
        },
      ],
    });
    const ledger = createDivBrainUsageLedgerRepository({
      port: mem,
      now: () => new Date(Date.UTC(2026, 7, 8, 12, 0, 0)),
    });
    const daySum = await ledger.sumReservedCostMicroUsdForUtcDay();
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
    assert.ok(luna!.pricingUsdPerToken.output >= 0.00000132);
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

describe("DivBrain usage-ledger migration contract", () => {
  function normalizeSql(sql: string): string {
    return sql
      .replace(/--[^\n]*/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  const matches = readdirSync(migrationsDir).filter((name) =>
    name.includes("create_divbrain_usage_ledger"),
  );
  assert.equal(matches.length, 1);
  const filename = matches[0]!;
  const source = readFileSync(join(migrationsDir, filename), "utf8");
  const normalized = normalizeSql(source);

  it("enables RLS and grants only service_role select + RPC execute", () => {
    assert.match(filename, /^\d{14}_create_divbrain_usage_ledger\.sql$/);
    assert.match(
      normalized,
      /alter table public\.divbrain_usage_events enable row level security/,
    );
    assert.match(
      normalized,
      /grant select\s+on table public\.divbrain_usage_events\s+to service_role/,
    );
    assert.equal(/\bgrant\b[^;]*\bto\s+anon\b/i.test(normalized), false);
    assert.equal(
      /\bgrant\b[^;]*\bto\s+authenticated\b/i.test(normalized),
      false,
    );
    assert.equal(/\bcreate\s+policy\b/i.test(normalized), false);
    assert.equal(
      /grant[^;]*\b(insert|update|delete)\b[^;]*on table public\.divbrain_usage_events/i.test(
        normalized,
      ),
      false,
    );
  });

  it("stores money as integer micro-USD and omits sensitive payload columns", () => {
    assert.match(normalized, /reserved_cost_micro_usd bigint not null/);
    assert.match(normalized, /accounted_cost_micro_usd bigint null/);
    assert.match(normalized, /reserved_cost_micro_usd > 0/);
    assert.equal(/\bprompt\b/i.test(source), false);
    assert.equal(/\bcompletion\b/i.test(source), false);
    assert.equal(/provider_metadata/i.test(source), false);
    assert.equal(/raw_error/i.test(source), false);
  });

  it("uses ON DELETE SET NULL for user_id (never CASCADE spend history away)", () => {
    assert.match(
      normalized,
      /user_id uuid null references auth\.users\s*\(\s*id\s*\)\s*on delete set null/,
    );
    assert.equal(
      /user_id[^,]*on delete cascade/i.test(normalized),
      false,
    );
  });

  it("exposes atomic reserve/finalize SECURITY DEFINER RPCs + reserved sum", () => {
    assert.match(
      normalized,
      /create or replace function public\.divbrain_reserve_usage_budget/,
    );
    assert.match(
      normalized,
      /create or replace function public\.divbrain_finalize_usage_budget/,
    );
    assert.match(
      normalized,
      /create or replace function public\.divbrain_usage_reserved_cost_sum_micro_usd/,
    );
    assert.match(normalized, /pg_advisory_xact_lock/);
    assert.match(normalized, /security definer/);
    assert.match(normalized, /set search_path = public/);
    assert.match(
      normalized,
      /grant execute on function public\.divbrain_reserve_usage_budget/,
    );
    assert.match(
      normalized,
      /grant execute on function public\.divbrain_finalize_usage_budget/,
    );
    assert.equal(
      /grant execute on function public\.divbrain_reserve_usage_budget[^;]*to anon/i.test(
        normalized,
      ),
      false,
    );
    assert.equal(
      /grant execute on function public\.divbrain_reserve_usage_budget[^;]*to authenticated/i.test(
        normalized,
      ),
      false,
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
