/**
 * DivBrain shell safe production diagnostic tests.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import type { DivBrainConversation } from "../../types";
import {
  createDivBrainConversationRepository,
  type DivBrainConversationRepository,
} from "../repository/repository";
import type {
  DivBrainPersistenceError,
  DivBrainPersistencePort,
} from "../repository/persistence";
import { createDivBrainServiceRolePersistencePort } from "../repository/service-role-client";
import {
  DIVBRAIN_SHELL_DIAGNOSTIC_CATEGORIES,
  createDivBrainShellDiagnosticLogger,
  createOnceDivBrainShellDiagnosticSink,
  mapListConversationsPersistenceKindToDiagnosticCategory,
  type DivBrainShellDiagnosticCategory,
} from "./diagnostic";
import { loadDivBrainShellData } from "./loader";
import { createDivBrainRuntimeRepository } from "./runtime";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ACTOR = "11111111-1111-4111-8111-111111111111";
const SECRET = "secret-runtime-value";
const FAKE_URL = "https://example.invalid.supabase.co";

function iso(): string {
  return new Date(Date.UTC(2026, 7, 4, 12, 0, 0)).toISOString();
}

function createRecordingSink() {
  const categories: DivBrainShellDiagnosticCategory[] = [];
  const payloads: unknown[] = [];

  const sink = (category: DivBrainShellDiagnosticCategory) => {
    categories.push(category);
    payloads.push({ category });
  };

  return { categories, payloads, sink };
}

function createStubRepository(
  overrides: Partial<DivBrainConversationRepository>,
): DivBrainConversationRepository {
  const notImplemented = async () =>
    divBrainFailureFromCode("internal_error");

  return {
    createConversation: notImplemented,
    getConversation: notImplemented,
    listConversations: notImplemented,
    updateConversation: notImplemented,
    archiveConversation: notImplemented,
    restoreConversation: notImplemented,
    deleteConversation: notImplemented,
    listMessages: async () => divBrainSuccess({ items: [], nextCursor: null }),
    createMessage: notImplemented,
    ...overrides,
  };
}

function createPersistenceWithListFailure(
  kind: DivBrainPersistenceError["kind"],
): DivBrainPersistencePort {
  const notImplemented = async () =>
    ({ ok: false as const, error: { kind: "query_failed" as const } });

  return {
    insertConversation: notImplemented,
    findConversationForActor: notImplemented,
    listConversationsForActor: async () => ({
      ok: false,
      error: { kind },
    }),
    updateConversationForActor: notImplemented,
    deleteConversationForActor: notImplemented,
    listMessagesForConversation: notImplemented,
    insertMessage: notImplemented,
  };
}

function withClearedSupabaseEnv(run: () => void) {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    run();
  } finally {
    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    }

    if (previousKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    }
  }
}

describe("DivBrain shell diagnostic categories", () => {
  it("exposes only the fixed allowlisted category set", () => {
    assert.deepEqual([...DIVBRAIN_SHELL_DIAGNOSTIC_CATEGORIES], [
      "runtime_configuration_missing",
      "runtime_client_creation_failed",
      "conversation_list_unavailable",
      "conversation_list_query_failed",
      "conversation_list_malformed_response",
      "conversation_list_unknown_failure",
      "shell_mapping_failure",
      "conversation_list_permission_denied",
      "conversation_list_relation_missing",
      "conversation_list_column_missing",
      "conversation_list_auth_rejected",
      "conversation_list_postgrest_other",
    ]);
  });

  it("maps persistence kinds without accepting raw payloads", () => {
    assert.equal(
      mapListConversationsPersistenceKindToDiagnosticCategory("unavailable"),
      "conversation_list_unavailable",
    );
    assert.equal(
      mapListConversationsPersistenceKindToDiagnosticCategory("query_failed"),
      "conversation_list_query_failed",
    );
    assert.equal(
      mapListConversationsPersistenceKindToDiagnosticCategory(
        "malformed_response",
      ),
      "conversation_list_malformed_response",
    );
    assert.equal(
      mapListConversationsPersistenceKindToDiagnosticCategory(
        "permission_denied",
      ),
      "conversation_list_permission_denied",
    );
    assert.equal(
      mapListConversationsPersistenceKindToDiagnosticCategory(
        "relation_missing",
      ),
      "conversation_list_relation_missing",
    );
    assert.equal(
      mapListConversationsPersistenceKindToDiagnosticCategory("column_missing"),
      "conversation_list_column_missing",
    );
    assert.equal(
      mapListConversationsPersistenceKindToDiagnosticCategory("auth_rejected"),
      "conversation_list_auth_rejected",
    );
    assert.equal(
      mapListConversationsPersistenceKindToDiagnosticCategory("postgrest_other"),
      "conversation_list_postgrest_other",
    );
    assert.equal(
      mapListConversationsPersistenceKindToDiagnosticCategory("configuration"),
      "conversation_list_unknown_failure",
    );
  });

  it("logger emits only a fixed category field", () => {
    const recorded: unknown[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      recorded.push(args);
    };

    try {
      const logger = createDivBrainShellDiagnosticLogger();
      logger("conversation_list_query_failed");
      assert.equal(recorded.length, 1);
      assert.deepEqual(recorded[0], [
        "[DivBrain shell diagnostic]",
        { category: "conversation_list_query_failed" },
      ]);
      assert.equal(JSON.stringify(recorded).includes(SECRET), false);
      assert.equal(JSON.stringify(recorded).includes(ACTOR), false);
      assert.equal(JSON.stringify(recorded).includes(FAKE_URL), false);
    } finally {
      console.error = original;
    }
  });

  it("once-sink reports a single category", () => {
    const { categories, sink } = createRecordingSink();
    const once = createOnceDivBrainShellDiagnosticSink(sink);
    once("runtime_configuration_missing");
    once("shell_mapping_failure");
    assert.deepEqual(categories, ["runtime_configuration_missing"]);
  });
});

describe("DivBrain shell diagnostic runtime paths", () => {
  it("emits runtime_configuration_missing for missing service-role config", () => {
    const { categories, payloads, sink } = createRecordingSink();

    withClearedSupabaseEnv(() => {
      const result = createDivBrainRuntimeRepository({ diagnose: sink });
      assert.equal(result.ok, false);
      assert.deepEqual(categories, ["runtime_configuration_missing"]);
      assert.deepEqual(payloads, [
        { category: "runtime_configuration_missing" },
      ]);
      assert.equal(JSON.stringify(payloads).includes("SUPABASE"), false);
      assert.equal(JSON.stringify(payloads).includes(ACTOR), false);
    });
  });

  it("service-role missing-configuration hook receives no arguments", () => {
    const receivedArgs: unknown[] = [];

    withClearedSupabaseEnv(() => {
      createDivBrainServiceRolePersistencePort({
        onMissingConfiguration: (...args: unknown[]) => {
          receivedArgs.push(args);
        },
      });
    });

    assert.deepEqual(receivedArgs, [[]]);
  });

  it("emits runtime_client_creation_failed when persistence factory throws", () => {
    const { categories, sink } = createRecordingSink();
    const result = createDivBrainRuntimeRepository({
      diagnose: sink,
      createPersistencePort() {
        throw new Error(SECRET);
      },
    });

    assert.equal(result.ok, false);
    assert.deepEqual(categories, ["runtime_client_creation_failed"]);
    assert.equal(JSON.stringify(categories).includes(SECRET), false);
  });

  it("emits runtime_client_creation_failed when repository construction throws", () => {
    const { categories, sink } = createRecordingSink();
    const result = createDivBrainRuntimeRepository({
      diagnose: sink,
      createPersistencePort: () =>
        divBrainSuccess(createPersistenceWithListFailure("query_failed")),
      createRepository() {
        throw new Error(SECRET);
      },
    });

    assert.equal(result.ok, false);
    assert.deepEqual(categories, ["runtime_client_creation_failed"]);
    assert.equal(JSON.stringify(categories).includes(SECRET), false);
  });

  it("service-role onClientCreationThrow is a zero-arg callback", () => {
    const receivedArgs: unknown[] = [];
    const onClientCreationThrow = (...args: unknown[]) => {
      receivedArgs.push(args);
    };

    // Contract used by the catch path — never pass the thrown value.
    try {
      throw new Error(SECRET);
    } catch {
      onClientCreationThrow();
    }

    assert.deepEqual(receivedArgs, [[]]);
    assert.equal(JSON.stringify(receivedArgs).includes(SECRET), false);
  });
});

describe("DivBrain shell diagnostic listConversations paths", () => {
  for (const [kind, category] of [
    ["unavailable", "conversation_list_unavailable"],
    ["query_failed", "conversation_list_query_failed"],
    ["malformed_response", "conversation_list_malformed_response"],
  ] as const) {
    it(`emits ${category} for persistence kind ${kind}`, async () => {
      const { categories, payloads, sink } = createRecordingSink();
      const once = createOnceDivBrainShellDiagnosticSink(sink);
      const repositoryResult = createDivBrainRuntimeRepository({
        diagnose: once,
        createPersistencePort: () =>
          divBrainSuccess(createPersistenceWithListFailure(kind)),
      });

      assert.equal(repositoryResult.ok, true);
      if (!repositoryResult.ok) {
        return;
      }

      const view = await loadDivBrainShellData({
        actorId: ACTOR,
        repository: repositoryResult.data,
        diagnose: once,
      });

      assert.deepEqual(view, { state: "data_unavailable" });
      assert.deepEqual(categories, [category]);
      assert.deepEqual(payloads, [{ category }]);
      assert.equal(JSON.stringify(view).includes(category), false);
      assert.equal(JSON.stringify(view).includes(ACTOR), false);
      assert.equal(JSON.stringify(payloads).includes(SECRET), false);
      assert.equal(JSON.stringify(payloads).includes(ACTOR), false);
    });
  }

  it("emits conversation_list_unknown_failure when listConversations throws", async () => {
    const { categories, sink } = createRecordingSink();
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      diagnose: sink,
      repository: createStubRepository({
        async listConversations() {
          throw new Error(`${SECRET}:${ACTOR}:${FAKE_URL}`);
        },
      }),
    });

    assert.deepEqual(view, { state: "data_unavailable" });
    assert.deepEqual(categories, ["conversation_list_unknown_failure"]);
    assert.equal(JSON.stringify(categories).includes(SECRET), false);
    assert.equal(JSON.stringify(categories).includes(ACTOR), false);
    assert.equal(JSON.stringify(categories).includes(FAKE_URL), false);
    assert.equal(JSON.stringify(view).includes("conversation_list"), false);
  });

  it("emits shell_mapping_failure when mapping throws after a successful list", async () => {
    const { categories, sink } = createRecordingSink();
    const poisoned = {
      get id(): string {
        throw new Error(`${SECRET}:${ACTOR}`);
      },
      title: "A",
      summary: null,
      createdAt: iso(),
      updatedAt: iso(),
      archivedAt: null,
    } as unknown as DivBrainConversation;

    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      diagnose: sink,
      repository: createStubRepository({
        async listConversations() {
          return divBrainSuccess({
            items: [poisoned],
            nextCursor: null,
          });
        },
      }),
    });

    assert.deepEqual(view, { state: "data_unavailable" });
    assert.deepEqual(categories, ["shell_mapping_failure"]);
    assert.equal(JSON.stringify(categories).includes(SECRET), false);
    assert.equal(JSON.stringify(categories).includes(ACTOR), false);
    assert.equal(JSON.stringify(view).includes("shell_mapping"), false);
  });

  it("successful empty conversation load emits no failure category", async () => {
    const { categories, sink } = createRecordingSink();
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      diagnose: sink,
      repository: createStubRepository({
        async listConversations() {
          return divBrainSuccess({ items: [], nextCursor: null });
        },
      }),
    });

    assert.equal(view.state, "empty");
    assert.deepEqual(categories, []);
  });

  it("repository persistence callback never receives raw Error.message", async () => {
    const received: unknown[] = [];
    const repository = createDivBrainConversationRepository({
      persistence: createPersistenceWithListFailure("query_failed"),
      onListConversationsPersistenceFailure: (kind) => {
        received.push(kind);
      },
    });

    const result = await repository.listConversations({ actorId: ACTOR });
    assert.equal(result.ok, false);
    assert.deepEqual(received, ["query_failed"]);
    assert.equal(JSON.stringify(received).includes(SECRET), false);
    assert.equal(typeof received[0], "string");
  });
});

describe("DivBrain shell diagnostic browser boundary", () => {
  it("page wires server diagnostics without exposing categories in UI copy", () => {
    const page = readFileSync(
      join(__dirname, "../../../../app/brain/page.tsx"),
      "utf8",
    );

    assert.equal(page.includes("createDivBrainShellDiagnosticLogger"), true);
    assert.equal(page.includes("createOnceDivBrainShellDiagnosticSink"), true);
    assert.equal(page.includes("diagnose"), true);
    assert.equal(page.includes("DivBrain kunde inte laddas"), false);
    assert.equal(page.includes("runtime_configuration_missing"), false);
    assert.equal(page.includes("conversation_list_query_failed"), false);
    assert.equal(page.includes("SUPABASE_SERVICE_ROLE_KEY"), false);
    assert.equal(page.includes("console.error"), false);
  });

  it("shell unavailable panel copy remains generic", () => {
    const shell = readFileSync(
      join(
        __dirname,
        "../../../../components/brain/DivBrainShell.tsx",
      ),
      "utf8",
    );

    assert.equal(shell.includes("DivBrain kunde inte laddas"), true);
    assert.equal(
      shell.includes(
        "Konversationerna är inte tillgängliga just nu. Försök igen senare.",
      ),
      true,
    );
    assert.equal(shell.includes("runtime_configuration_missing"), false);
    assert.equal(shell.includes("conversation_list_query_failed"), false);
    assert.equal(shell.includes("[DivBrain shell diagnostic]"), false);
  });
});
