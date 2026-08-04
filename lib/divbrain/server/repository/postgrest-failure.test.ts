/**
 * PostgREST failure classification tests for DivBrain persistence diagnostics.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createDivBrainConversationRepository } from "./repository";
import { classifyPostgrestFailure } from "./postgrest-failure";
import type {
  DivBrainPersistenceError,
  DivBrainPersistencePort,
} from "./persistence";
import { createSupabaseDivBrainPersistencePort } from "./supabase-persistence";
import {
  createOnceDivBrainShellDiagnosticSink,
  mapListConversationsPersistenceKindToDiagnosticCategory,
  type DivBrainShellDiagnosticCategory,
} from "../ui/diagnostic";
import { loadDivBrainShellData } from "../ui/loader";
import { createDivBrainRuntimeRepository } from "../ui/runtime";
import { divBrainSuccess } from "../../results";

const ACTOR = "11111111-1111-4111-8111-111111111111";
const SECRET = "secret-postgrest-payload";
const FAKE_TABLE = "divbrain_conversations_fake";
const FAKE_COLUMN = "owner_email_fake";

function createRecordingSink() {
  const categories: DivBrainShellDiagnosticCategory[] = [];
  const payloads: unknown[] = [];
  const sink = (category: DivBrainShellDiagnosticCategory) => {
    categories.push(category);
    payloads.push({ category });
  };
  return { categories, payloads, sink };
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

function createRecordingClient(error: { message: string; code?: string }) {
  const api = {
    select() {
      return api;
    },
    eq() {
      return api;
    },
    is() {
      return api;
    },
    not() {
      return api;
    },
    or() {
      return api;
    },
    order() {
      return api;
    },
    limit() {
      return api;
    },
    then(
      resolve: (value: {
        data: unknown;
        error: { message: string; code?: string } | null;
      }) => void,
    ) {
      resolve({ data: null, error });
    },
  };

  return {
    from() {
      return api;
    },
  };
}

describe("DivBrain PostgREST failure classification", () => {
  it("maps 42501 to permission_denied", () => {
    assert.equal(
      classifyPostgrestFailure({
        code: "42501",
        message: `${SECRET} permission denied for table ${FAKE_TABLE}`,
      }),
      "permission_denied",
    );
  });

  it("maps 42P01 and PGRST205 to relation_missing", () => {
    assert.equal(
      classifyPostgrestFailure({
        code: "42P01",
        message: `${SECRET} relation ${FAKE_TABLE} does not exist`,
      }),
      "relation_missing",
    );
    assert.equal(
      classifyPostgrestFailure({
        code: "PGRST205",
        message: `${SECRET} could not find the table ${FAKE_TABLE}`,
      }),
      "relation_missing",
    );
  });

  it("maps 42703 and PGRST204 to column_missing", () => {
    assert.equal(
      classifyPostgrestFailure({
        code: "42703",
        message: `${SECRET} column ${FAKE_COLUMN} does not exist`,
      }),
      "column_missing",
    );
    assert.equal(
      classifyPostgrestFailure({
        code: "PGRST204",
        message: `${SECRET} could not find the ${FAKE_COLUMN} column`,
      }),
      "column_missing",
    );
  });

  it("maps PGRST301 to auth_rejected", () => {
    assert.equal(
      classifyPostgrestFailure({
        code: "PGRST301",
        message: `${SECRET} JWT expired for actor ${ACTOR}`,
      }),
      "auth_rejected",
    );
  });

  it("maps network-like failures without stable codes to unavailable", () => {
    assert.equal(
      classifyPostgrestFailure({
        message: `fetch failed while contacting ${SECRET}`,
      }),
      "unavailable",
    );
    assert.equal(
      classifyPostgrestFailure({
        message: `network timeout ${SECRET}`,
      }),
      "unavailable",
    );
    assert.equal(
      classifyPostgrestFailure({
        code: "",
        message: `timeout ${SECRET}`,
      }),
      "unavailable",
    );
    assert.equal(
      classifyPostgrestFailure({
        code: "   ",
        message: `fetch failed ${SECRET}`,
      }),
      "unavailable",
    );
  });

  it("maps unknown PostgREST codes to postgrest_other", () => {
    assert.equal(
      classifyPostgrestFailure({
        code: "PGRST999",
        message: `${SECRET} unexpected`,
      }),
      "postgrest_other",
    );
    assert.equal(classifyPostgrestFailure(null), "postgrest_other");
  });

  it("does not let network-like messages override a present unknown code", () => {
    assert.equal(
      classifyPostgrestFailure({
        code: "PGRST999",
        message: "network timeout",
      }),
      "postgrest_other",
    );
    assert.equal(
      classifyPostgrestFailure({
        code: "XX000",
        message: `fetch failed ${SECRET}`,
      }),
      "postgrest_other",
    );
  });

  it("keeps known codes even when the message looks network-like", () => {
    assert.equal(
      classifyPostgrestFailure({
        code: "42501",
        message: `network timeout ${SECRET}`,
      }),
      "permission_denied",
    );
    assert.equal(
      classifyPostgrestFailure({
        code: "42P01",
        message: `timeout while loading ${FAKE_TABLE}`,
      }),
      "relation_missing",
    );
  });

  it("classification output never includes raw code or message text", () => {
    const kind = classifyPostgrestFailure({
      code: "42501",
      message: `${SECRET} ${ACTOR} ${FAKE_TABLE}`,
    });
    assert.equal(kind, "permission_denied");
    assert.equal(JSON.stringify(kind).includes("42501"), false);
    assert.equal(JSON.stringify(kind).includes(SECRET), false);
    assert.equal(JSON.stringify(kind).includes(ACTOR), false);
  });
});

describe("DivBrain refined listConversations diagnostics", () => {
  const cases = [
    ["permission_denied", "conversation_list_permission_denied"],
    ["relation_missing", "conversation_list_relation_missing"],
    ["column_missing", "conversation_list_column_missing"],
    ["auth_rejected", "conversation_list_auth_rejected"],
    ["postgrest_other", "conversation_list_postgrest_other"],
    ["unavailable", "conversation_list_unavailable"],
  ] as const;

  for (const [kind, category] of cases) {
    it(`maps persistence kind ${kind} to ${category} once`, async () => {
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
      assert.equal(JSON.stringify(payloads).includes(SECRET), false);
      assert.equal(JSON.stringify(payloads).includes(ACTOR), false);
      assert.equal(JSON.stringify(payloads).includes("42501"), false);
    });
  }

  it("adapter code 42501 reaches conversation_list_permission_denied without raw fields", async () => {
    const { categories, payloads, sink } = createRecordingSink();
    const once = createOnceDivBrainShellDiagnosticSink(sink);
    const client = createRecordingClient({
      code: "42501",
      message: `${SECRET} permission denied on ${FAKE_TABLE} for ${ACTOR}`,
    });

    const port = createSupabaseDivBrainPersistencePort(client as never);
    const repository = createDivBrainConversationRepository({
      persistence: port,
      onListConversationsPersistenceFailure: (kind) => {
        once(mapListConversationsPersistenceKindToDiagnosticCategory(kind));
      },
    });

    const result = await repository.listConversations({ actorId: ACTOR });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "persistence_failed");
      assert.equal(JSON.stringify(result.error).includes("42501"), false);
      assert.equal(JSON.stringify(result.error).includes(SECRET), false);
    }

    assert.deepEqual(categories, ["conversation_list_permission_denied"]);
    assert.deepEqual(payloads, [
      { category: "conversation_list_permission_denied" },
    ]);
    assert.equal(JSON.stringify(payloads).includes(SECRET), false);
    assert.equal(JSON.stringify(payloads).includes(FAKE_TABLE), false);
    assert.equal(JSON.stringify(payloads).includes(ACTOR), false);
    assert.equal(JSON.stringify(payloads).includes("42501"), false);
  });

  it("successful empty list still emits no category", async () => {
    const { categories, sink } = createRecordingSink();
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      diagnose: sink,
      repository: createDivBrainConversationRepository({
        persistence: {
          ...createPersistenceWithListFailure("query_failed"),
          listConversationsForActor: async () => ({
            ok: true,
            data: [],
          }),
        },
      }),
    });

    assert.equal(view.state, "empty");
    assert.deepEqual(categories, []);
  });
});
