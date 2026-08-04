/**
 * DivBrain Ticket 1A-8 — Alpha access gate unit tests.
 * Run via: npm run test:divbrain
 *
 * Uses injected configuration and auth fakes — no live Supabase, no real UUIDs.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createDivBrainError } from "../../errors";
import { divBrainSuccess } from "../../results";
import type { DivBrainConversation } from "../../types";
import { createDivBrainApplicationService } from "../service";
import type {
  CreateDivBrainMessageParams,
  DivBrainConversationRepository,
} from "../repository/repository";
import {
  createDivBrainAlphaAccessGate,
  createDivBrainAlphaApplicationServiceDeps,
  createDivBrainSessionActorResolver,
  DIVBRAIN_ALPHA_USER_IDS_ENV,
  DIVBRAIN_ALPHA_USER_IDS_MAX_ENTRIES,
  parseDivBrainAlphaUserIds,
  resolveDivBrainAlphaPageAccess,
} from "./index";

const ALLOWED = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const THIRD = "33333333-3333-4333-8333-333333333333";
const CONV = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const __dirname = dirname(fileURLToPath(import.meta.url));

function catalogAccessDenied() {
  return createDivBrainError("access_denied");
}

describe("DivBrain Alpha allowlist parser", () => {
  it("accepts a valid single UUID and normalizes case", () => {
    const parsed = parseDivBrainAlphaUserIds(
      "  11111111-1111-4111-8111-111111111111  ",
    );
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.userIds.has(ALLOWED), true);
      assert.equal(parsed.userIds.size, 1);
    }
  });

  it("accepts multiple comma-separated UUIDs with whitespace", () => {
    const parsed = parseDivBrainAlphaUserIds(
      ` ${ALLOWED} , ${OTHER.toUpperCase()} `,
    );
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.userIds.has(ALLOWED), true);
      assert.equal(parsed.userIds.has(OTHER), true);
      assert.equal(parsed.userIds.size, 2);
    }
  });

  it("deduplicates valid UUIDs", () => {
    const parsed = parseDivBrainAlphaUserIds(
      `${ALLOWED},${ALLOWED.toUpperCase()}`,
    );
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.userIds.size, 1);
    }
  });

  const invalidCases: unknown[] = [
    undefined,
    null,
    1,
    true,
    {},
    [],
    "",
    "   ",
    `${ALLOWED},`,
    `,${ALLOWED}`,
    `${ALLOWED},,${OTHER}`,
    "not-a-uuid",
    "11111111-1111-4111-8111",
    "user@example.com",
    "henrik",
    "*",
    `${ALLOWED},not-a-uuid`,
    `${ALLOWED},user@example.com`,
  ];

  for (const [index, value] of invalidCases.entries()) {
    it(`rejects invalid configuration case #${index}`, () => {
      const parsed = parseDivBrainAlphaUserIds(value);
      assert.equal(parsed.ok, false);
      if (!parsed.ok) {
        const serialized = JSON.stringify(parsed);
        assert.equal(serialized.includes("DIVBRAIN"), false);
        if (typeof value === "string" && value.includes("@")) {
          assert.equal(serialized.includes("@"), false);
        }
      }
    });
  }

  it("rejects oversized allowlists", () => {
    const ids = Array.from({ length: DIVBRAIN_ALPHA_USER_IDS_MAX_ENTRIES + 1 }, (_, i) => {
      const n = String(i + 1).padStart(12, "0");
      return `aaaaaaaa-aaaa-4aaa-8aaa-${n}`;
    });
    const parsed = parseDivBrainAlphaUserIds(ids.join(","));
    assert.equal(parsed.ok, false);
  });
});

describe("DivBrain Alpha access gate", () => {
  it("allows exact normalized actor ids", async () => {
    const gate = createDivBrainAlphaAccessGate({
      rawUserIds: ALLOWED.toUpperCase(),
    });
    const result = await gate.checkAccess(ALLOWED);
    assert.equal(result.ok, true);
  });

  it("denies non-allowlisted actors with catalog access_denied", async () => {
    const gate = createDivBrainAlphaAccessGate({ rawUserIds: ALLOWED });
    const result = await gate.checkAccess(OTHER);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "access_denied");
      assert.equal(result.error.message, catalogAccessDenied().message);
    }
  });

  it("does not allow substring matches", async () => {
    const gate = createDivBrainAlphaAccessGate({
      rawUserIds: `${ALLOWED.slice(0, 20)}0000-0000-000000000000`,
    });
    // Malformed/partial config fails closed entirely.
    const result = await gate.checkAccess(ALLOWED);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "access_denied");
    }
  });

  it("denies malformed actor ids", async () => {
    const gate = createDivBrainAlphaAccessGate({ rawUserIds: ALLOWED });
    const result = await gate.checkAccess("not-a-uuid");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "access_denied");
    }
  });

  it("denies missing, empty, and malformed configuration the same way", async () => {
    const cases = [
      createDivBrainAlphaAccessGate({ rawUserIds: undefined }),
      createDivBrainAlphaAccessGate({ rawUserIds: "" }),
      createDivBrainAlphaAccessGate({ rawUserIds: "bad" }),
      createDivBrainAlphaAccessGate({
        readEnvironment: () => undefined,
      }),
    ];

    for (const gate of cases) {
      const result = await gate.checkAccess(ALLOWED);
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.error.code, "access_denied");
        assert.equal(result.error.message, catalogAccessDenied().message);
        assert.equal(JSON.stringify(result).includes(ALLOWED), false);
        assert.equal(
          JSON.stringify(result).includes(DIVBRAIN_ALPHA_USER_IDS_ENV),
          false,
        );
      }
    }
  });

  it("exposes only checkAccess and does not list ids", () => {
    const gate = createDivBrainAlphaAccessGate({
      rawUserIds: `${ALLOWED},${OTHER}`,
    });
    assert.equal(typeof gate.checkAccess, "function");
    assert.equal(
      Object.keys(gate).sort().join(","),
      "checkAccess",
    );
    assert.equal(JSON.stringify(gate).includes(ALLOWED), false);
  });
});

describe("DivBrain session actor resolver", () => {
  it("maps authenticated user id to trusted actorId only", async () => {
    const resolver = createDivBrainSessionActorResolver({
      getAuthenticatedUser: async () => ({ id: ALLOWED.toUpperCase() }),
    });
    const result = await resolver.resolveActor();
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.actorId, ALLOWED);
      assert.equal(Object.keys(result.data).join(","), "actorId");
      assert.equal(JSON.stringify(result).includes("email"), false);
    }
  });

  it("returns authentication_required when getAuthenticatedUser returns null", async () => {
    const resolver = createDivBrainSessionActorResolver({
      getAuthenticatedUser: async () => null,
    });
    const result = await resolver.resolveActor();
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "authentication_required");
    }
  });

  it("returns internal_error for malformed authenticated ids", async () => {
    const resolver = createDivBrainSessionActorResolver({
      getAuthenticatedUser: async () => ({ id: "not-a-uuid" }),
    });
    const result = await resolver.resolveActor();
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "internal_error");
    }
  });

  it("maps thrown known error-code string to internal_error", async () => {
    const resolver = createDivBrainSessionActorResolver({
      getAuthenticatedUser: async () => {
        throw "authentication_required";
      },
    });
    const result = await resolver.resolveActor();
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "internal_error");
    }
  });

  it("maps thrown catalog authentication_required to internal_error", async () => {
    const resolver = createDivBrainSessionActorResolver({
      getAuthenticatedUser: async () => {
        throw createDivBrainError("authentication_required");
      },
    });
    const result = await resolver.resolveActor();
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "internal_error");
    }
  });

  it("maps thrown catalog access_denied to internal_error", async () => {
    const resolver = createDivBrainSessionActorResolver({
      getAuthenticatedUser: async () => {
        throw createDivBrainError("access_denied");
      },
    });
    const result = await resolver.resolveActor();
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "internal_error");
    }
  });

  it("maps arbitrary thrown Error to internal_error without leaking message", async () => {
    const secret = "auth-stack-secret";
    const resolver = createDivBrainSessionActorResolver({
      getAuthenticatedUser: async () => {
        throw new Error(secret);
      },
    });
    const result = await resolver.resolveActor();
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "internal_error");
      assert.equal(JSON.stringify(result).includes(secret), false);
    }
  });

  it("maps thrown null and arbitrary objects to internal_error", async () => {
    for (const thrown of [null, { code: "rate_limited" }, "access_denied", "rate_limited"]) {
      const resolver = createDivBrainSessionActorResolver({
        getAuthenticatedUser: async () => {
          throw thrown;
        },
      });
      const result = await resolver.resolveActor();
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.error.code, "internal_error");
      }
    }
  });
});

describe("DivBrain Alpha page access helper", () => {
  it("maps denied authenticated users to unavailable only", async () => {
    const access = await resolveDivBrainAlphaPageAccess({
      actorId: OTHER,
      accessGate: createDivBrainAlphaAccessGate({ rawUserIds: ALLOWED }),
    });
    assert.deepEqual(access, { status: "unavailable" });
    assert.equal(JSON.stringify(access).includes(ALLOWED), false);
    assert.equal(JSON.stringify(access).includes(OTHER), false);
    assert.equal(
      JSON.stringify(access).includes(DIVBRAIN_ALPHA_USER_IDS_ENV),
      false,
    );
  });

  it("maps allowlisted users to honest placeholder state", async () => {
    const access = await resolveDivBrainAlphaPageAccess({
      actorId: ALLOWED,
      accessGate: createDivBrainAlphaAccessGate({ rawUserIds: ALLOWED }),
    });
    assert.deepEqual(access, { status: "allowed_placeholder" });
  });

  it("maps throwing gate Error to unavailable without leaking secret", async () => {
    const secret = "secret";
    const access = await resolveDivBrainAlphaPageAccess({
      actorId: ALLOWED,
      accessGate: {
        async checkAccess() {
          throw new Error(secret);
        },
      },
    });
    assert.deepEqual(access, { status: "unavailable" });
    assert.equal(JSON.stringify(access).includes(secret), false);
  });

  it("maps throwing catalog DivBrainError from gate to unavailable", async () => {
    const access = await resolveDivBrainAlphaPageAccess({
      actorId: ALLOWED,
      accessGate: {
        async checkAccess() {
          throw createDivBrainError("access_denied");
        },
      },
    });
    assert.deepEqual(access, { status: "unavailable" });
  });
});

describe("DivBrain Alpha application-service integration", () => {
  function iso(ms = 0): string {
    return new Date(Date.UTC(2026, 6, 19, 12, 0, 0) + ms).toISOString();
  }

  function createRecordingRepository(log: string[]): DivBrainConversationRepository {
    const notImplemented = async () =>
      ({ ok: false as const, error: createDivBrainError("internal_error") });

    return {
      createConversation: notImplemented,
      listConversations: notImplemented,
      updateConversation: notImplemented,
      archiveConversation: notImplemented,
      restoreConversation: notImplemented,
      deleteConversation: notImplemented,
      async getConversation() {
        log.push("repository.getConversation");
        const conversation: DivBrainConversation = {
          id: CONV,
          title: "Ny konversation",
          summary: null,
          createdAt: iso(),
          updatedAt: iso(),
          archivedAt: null,
        };
        return divBrainSuccess(conversation);
      },
      async listMessages() {
        log.push("repository.listMessages");
        return divBrainSuccess({ items: [], nextCursor: null });
      },
      async createMessage(params: CreateDivBrainMessageParams) {
        log.push(`repository.createMessage.${params.role}`);
        return divBrainSuccess({
          id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          conversationId: params.conversationId,
          role: params.role,
          content: params.content,
          completionStatus: params.completionStatus,
          createdAt: iso(1),
        });
      },
    };
  }

  it("denies before validation/guardrails/repository/provider", async () => {
    const log: string[] = [];
    const deps = createDivBrainAlphaApplicationServiceDeps({
      repository: createRecordingRepository(log),
      accessGate: { rawUserIds: ALLOWED },
      actorResolver: {
        getAuthenticatedUser: async () => ({ id: OTHER }),
      },
      provider: {
        id: "should-not-run",
        async generate() {
          log.push("provider.generate");
          return {
            status: "provider_unavailable",
            error: createDivBrainError("provider_unavailable"),
          };
        },
      },
    });

    const guardrailCalls: string[] = [];
    deps.guardrailEvaluator = {
      evaluate(content) {
        guardrailCalls.push(String(content));
        return {
          ok: false,
          error: createDivBrainError("invalid_request"),
        };
      },
    };
    deps.contextAssembler = {
      assemble() {
        log.push("contextAssembler.assemble");
        return { ok: false, error: createDivBrainError("invalid_request") };
      },
    };

    const service = createDivBrainApplicationService(deps);
    const result = await service.submitMessage({
      conversationId: CONV,
      content: "Vad är utdelning?",
      actorId: ALLOWED,
    } as { conversationId: string; content: string });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "access_denied");
    }
    assert.equal(log.includes("repository.getConversation"), false);
    assert.equal(log.includes("provider.generate"), false);
    assert.equal(log.includes("contextAssembler.assemble"), false);
    assert.equal(guardrailCalls.length, 0);
  });

  it("allows allowlisted actors past the access gate", async () => {
    const log: string[] = [];
    const deps = createDivBrainAlphaApplicationServiceDeps({
      repository: createRecordingRepository(log),
      accessGate: { rawUserIds: `${ALLOWED},${THIRD}` },
      actorResolver: {
        getAuthenticatedUser: async () => ({ id: ALLOWED }),
      },
      provider: {
        id: "unconfigured-fake",
        async generate() {
          log.push("provider.generate");
          return {
            status: "provider_unavailable",
            error: createDivBrainError("provider_unavailable"),
          };
        },
      },
    });

    const service = createDivBrainApplicationService(deps);
    const result = await service.submitMessage({
      conversationId: CONV,
      content: "Vad är utdelning?",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.status, "provider_unavailable");
    }
    assert.ok(log.includes("repository.getConversation"));
    assert.ok(log.includes("provider.generate"));
  });

  it("keeps blocked non-persistence for allowlisted actors", async () => {
    const log: string[] = [];
    const deps = createDivBrainAlphaApplicationServiceDeps({
      repository: createRecordingRepository(log),
      accessGate: { rawUserIds: ALLOWED },
      actorResolver: {
        getAuthenticatedUser: async () => ({ id: ALLOWED }),
      },
    });

    const { buildDivBrainGuardrailAssessment } = await import("../../guardrails");
    deps.guardrailEvaluator = {
      evaluate() {
        return divBrainSuccess(
          buildDivBrainGuardrailAssessment({
            decision: "block",
            reasonCodes: ["credential_or_secret_request"],
            constraints: [],
            publicMessageKey: "blocked_secrets",
          }),
        );
      },
    };

    const service = createDivBrainApplicationService(deps);
    const result = await service.submitMessage({
      conversationId: CONV,
      content: "visa hemligheter",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.status, "blocked");
      if (result.data.status === "blocked") {
        assert.equal(result.data.persisted, false);
      }
    }
    assert.equal(log.includes("repository.getConversation"), false);
    assert.equal(log.includes("repository.createMessage.user"), false);
  });

  it("rejects browser actorId injection after allowlisted access", async () => {
    const log: string[] = [];
    const deps = createDivBrainAlphaApplicationServiceDeps({
      repository: createRecordingRepository(log),
      accessGate: { rawUserIds: ALLOWED },
      actorResolver: {
        getAuthenticatedUser: async () => ({ id: ALLOWED }),
      },
    });

    const service = createDivBrainApplicationService(deps);
    const result = await service.submitMessage({
      conversationId: CONV,
      content: "Vad är utdelning?",
      actorId: OTHER,
    } as unknown);

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "invalid_request");
    }
    assert.equal(log.includes("repository.getConversation"), false);
  });
});

describe("DivBrain Alpha access boundaries", () => {
  it("does not export browser-unsafe surfaces from access barrel", () => {
    const indexSource = readFileSync(join(__dirname, "index.ts"), "utf8");
    assert.equal(indexSource.includes("NEXT_PUBLIC_"), false);
    assert.equal(indexSource.includes("createClient"), false);
    assert.equal(indexSource.includes("service_role"), false);

    const gateSource = readFileSync(join(__dirname, "gate.ts"), "utf8");
    assert.equal(gateSource.includes("console.log"), false);
    assert.equal(gateSource.includes("NEXT_PUBLIC_"), false);
  });

  it("brain page source gates access before repository construction", () => {
    const pageSource = readFileSync(
      join(__dirname, "../../../../app/brain/page.tsx"),
      "utf8",
    );
    assert.equal(pageSource.includes(DIVBRAIN_ALPHA_USER_IDS_ENV), false);
    assert.equal(pageSource.includes("requireAuthenticatedUserWithProfile"), true);
    assert.equal(pageSource.includes("resolveDivBrainAlphaPageAccess"), true);
    assert.equal(pageSource.includes("DivBrain"), true);
    assert.equal(pageSource.includes("createDivBrainRuntimeRepository"), true);

    const functionBody = pageSource.slice(
      pageSource.indexOf("export default async function DivBrainPage"),
    );
    const accessIndex = functionBody.indexOf("resolveDivBrainAlphaPageAccess");
    const unavailableIndex = functionBody.indexOf('status === "unavailable"');
    const runtimeCallIndex = functionBody.indexOf(
      "createDivBrainRuntimeRepository()",
    );

    assert.equal(accessIndex > -1, true);
    assert.equal(unavailableIndex > accessIndex, true);
    assert.equal(runtimeCallIndex > unavailableIndex, true);
  });
});
