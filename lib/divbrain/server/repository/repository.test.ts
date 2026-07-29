/**
 * DivBrain Ticket 1A-7a — conversation repository unit tests.
 * Run via: npm run test:divbrain
 *
 * Uses an in-memory persistence fake — no remote Supabase access.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createDivBrainConversationRepository,
  DIVBRAIN_DEFAULT_CONVERSATION_TITLE,
  encodeConversationCursor,
  encodeMessageCursor,
  mapConversationRowToDomain,
  mapMessageRowToDomain,
} from "./index";
import type {
  DivBrainConversationInsert,
  DivBrainConversationUpdatePatch,
  DivBrainListConversationsQuery,
  DivBrainListMessagesQuery,
  DivBrainMessageInsert,
  DivBrainPersistencePort,
  DivBrainPersistenceResult,
} from "./persistence";
import type {
  DivBrainConversationRow,
  DivBrainMessageRow,
} from "./rows";
import { createDivBrainServiceRolePersistencePort } from "./service-role-client";

const ACTOR_A = "11111111-1111-4111-8111-111111111111";
const ACTOR_B = "22222222-2222-4222-8222-222222222222";
const CONV_1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CONV_2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const MSG_1 = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const MSG_2 = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const MSG_3 = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function iso(msOffset = 0): string {
  return new Date(Date.UTC(2026, 6, 19, 12, 0, 0) + msOffset).toISOString();
}

function conversationRow(
  partial: Partial<DivBrainConversationRow> &
    Pick<DivBrainConversationRow, "id" | "user_id" | "title">,
): DivBrainConversationRow {
  return {
    summary: null,
    schema_version: 1,
    created_at: iso(),
    updated_at: iso(),
    archived_at: null,
    ...partial,
  };
}

function messageRow(
  partial: Partial<DivBrainMessageRow> &
    Pick<
      DivBrainMessageRow,
      "id" | "conversation_id" | "role" | "content" | "completion_status"
    >,
): DivBrainMessageRow {
  return {
    safety_classification: null,
    sources: [],
    error_code: null,
    created_at: iso(),
    ...partial,
  };
}

type FakeState = {
  conversations: DivBrainConversationRow[];
  messages: DivBrainMessageRow[];
  failNext?: "unavailable" | "query_failed" | "malformed_response";
  lastInsertConversation?: DivBrainConversationInsert;
  lastUpdatePatch?: DivBrainConversationUpdatePatch;
  lastMessageInsert?: DivBrainMessageInsert;
  deletedMessageIds: string[];
};

function createFakePersistence(state: FakeState): DivBrainPersistencePort {
  const fail = <T,>(): DivBrainPersistenceResult<T> | null => {
    if (!state.failNext) {
      return null;
    }
    const kind = state.failNext;
    state.failNext = undefined;
    return { ok: false, error: { kind } };
  };

  return {
    async insertConversation(input) {
      const early = fail<DivBrainConversationRow>();
      if (early) return early;

      state.lastInsertConversation = { ...input };
      const row = conversationRow({
        id: crypto.randomUUID(),
        user_id: input.user_id,
        title: input.title,
        summary: input.summary ?? null,
        archived_at: input.archived_at ?? null,
        created_at: iso(state.conversations.length * 1000),
        updated_at: iso(state.conversations.length * 1000),
      });
      state.conversations.push(row);
      return { ok: true, data: { ...row } };
    },

    async findConversationForActor({ conversationId, userId }) {
      const early = fail<DivBrainConversationRow | null>();
      if (early) return early;

      const found =
        state.conversations.find(
          (row) => row.id === conversationId && row.user_id === userId,
        ) ?? null;
      return { ok: true, data: found ? { ...found } : null };
    },

    async listConversationsForActor(query: DivBrainListConversationsQuery) {
      const early = fail<DivBrainConversationRow[]>();
      if (early) return early;

      let rows = state.conversations.filter(
        (row) => row.user_id === query.userId,
      );

      if (query.archiveFilter === "active") {
        rows = rows.filter((row) => row.archived_at === null);
      } else if (query.archiveFilter === "archived") {
        rows = rows.filter((row) => row.archived_at !== null);
      }

      rows = [...rows].sort((a, b) => {
        if (a.updated_at === b.updated_at) {
          return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
        }
        return a.updated_at < b.updated_at ? 1 : -1;
      });

      if (query.cursor) {
        rows = rows.filter((row) => {
          if (row.updated_at < query.cursor!.updatedAt) return true;
          if (row.updated_at > query.cursor!.updatedAt) return false;
          return row.id < query.cursor!.id;
        });
      }

      return {
        ok: true,
        data: rows.slice(0, query.limit).map((row) => ({ ...row })),
      };
    },

    async updateConversationForActor({ conversationId, userId, patch }) {
      const early = fail<DivBrainConversationRow | null>();
      if (early) return early;

      state.lastUpdatePatch = { ...patch };
      const index = state.conversations.findIndex(
        (row) => row.id === conversationId && row.user_id === userId,
      );
      if (index < 0) {
        return { ok: true, data: null };
      }

      const current = state.conversations[index];
      const next: DivBrainConversationRow = {
        ...current,
        title: patch.title ?? current.title,
        summary: patch.summary !== undefined ? patch.summary : current.summary,
        archived_at:
          patch.archived_at !== undefined
            ? patch.archived_at
            : current.archived_at,
        updated_at: iso(50_000 + index),
      };
      state.conversations[index] = next;
      return { ok: true, data: { ...next } };
    },

    async deleteConversationForActor({ conversationId, userId }) {
      const early = fail<DivBrainConversationRow | null>();
      if (early) return early;

      const index = state.conversations.findIndex(
        (row) => row.id === conversationId && row.user_id === userId,
      );
      if (index < 0) {
        return { ok: true, data: null };
      }

      const [removed] = state.conversations.splice(index, 1);
      const cascaded = state.messages.filter(
        (message) => message.conversation_id === conversationId,
      );
      state.deletedMessageIds.push(...cascaded.map((message) => message.id));
      state.messages = state.messages.filter(
        (message) => message.conversation_id !== conversationId,
      );
      return { ok: true, data: { ...removed } };
    },

    async listMessagesForConversation(query: DivBrainListMessagesQuery) {
      const early = fail<DivBrainMessageRow[]>();
      if (early) return early;

      let rows = state.messages.filter(
        (row) => row.conversation_id === query.conversationId,
      );

      rows = [...rows].sort((a, b) => {
        if (a.created_at === b.created_at) {
          return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        }
        return a.created_at < b.created_at ? -1 : 1;
      });

      if (query.cursor) {
        rows = rows.filter((row) => {
          if (row.created_at > query.cursor!.createdAt) return true;
          if (row.created_at < query.cursor!.createdAt) return false;
          return row.id > query.cursor!.id;
        });
      }

      return {
        ok: true,
        data: rows.slice(0, query.limit).map((row) => ({ ...row })),
      };
    },

    async insertMessage(input) {
      const early = fail<DivBrainMessageRow>();
      if (early) return early;

      const recorded: DivBrainMessageInsert = {
        conversation_id: input.conversation_id,
        role: input.role,
        content: input.content,
        completion_status: input.completion_status,
      };
      if (input.safety_classification !== undefined) {
        recorded.safety_classification = input.safety_classification;
      }
      if (input.sources !== undefined) {
        recorded.sources = [...input.sources];
      }
      if (input.error_code !== undefined) {
        recorded.error_code = input.error_code;
      }
      state.lastMessageInsert = recorded;
      const row = messageRow({
        id: crypto.randomUUID(),
        conversation_id: input.conversation_id,
        role: input.role,
        content: input.content,
        completion_status: input.completion_status,
        safety_classification: input.safety_classification ?? null,
        sources: input.sources ?? [],
        error_code: input.error_code ?? null,
        created_at: iso(state.messages.length * 1000),
      });
      state.messages.push(row);
      return { ok: true, data: { ...row } };
    },
  };
}

describe("DivBrain conversation repository — create", () => {
  it("creates a conversation for the authenticated actor", async () => {
    const state: FakeState = {
      conversations: [],
      messages: [],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const result = await repo.createConversation({
      actorId: ACTOR_A,
      title: "  Utdelningar  ",
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.title, "Utdelningar");
    assert.equal(state.lastInsertConversation?.user_id, ACTOR_A);
    assert.equal(state.lastInsertConversation?.title, "Utdelningar");
    assert.equal(
      Object.keys(state.lastInsertConversation ?? {}).sort().join(","),
      "title,user_id",
    );
  });

  it("uses default title and ignores missing optional fields", async () => {
    const state: FakeState = {
      conversations: [],
      messages: [],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const result = await repo.createConversation({ actorId: ACTOR_A });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.title, DIVBRAIN_DEFAULT_CONVERSATION_TITLE);
  });

  it("rejects caller-supplied ownership fields", async () => {
    const state: FakeState = {
      conversations: [],
      messages: [],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const result = await repo.createConversation({
      actorId: ACTOR_A,
      title: "Test",
      user_id: ACTOR_B,
    } as never);

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, "invalid_request");
    assert.equal(state.conversations.length, 0);
  });

  it("rejects invalid title and actor id", async () => {
    const state: FakeState = {
      conversations: [],
      messages: [],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const badActor = await repo.createConversation({
      actorId: "not-a-uuid",
      title: "Ok",
    });
    assert.equal(badActor.ok, false);
    if (!badActor.ok) {
      assert.equal(badActor.error.code, "invalid_request");
    }

    const blank = await repo.createConversation({
      actorId: ACTOR_A,
      title: "   ",
    });
    assert.equal(blank.ok, false);
    if (!blank.ok) {
      assert.equal(blank.error.code, "invalid_request");
    }
  });

  it("maps persistence failure to a safe typed error", async () => {
    const state: FakeState = {
      conversations: [],
      messages: [],
      deletedMessageIds: [],
      failNext: "query_failed",
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const result = await repo.createConversation({
      actorId: ACTOR_A,
      title: "Test",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "persistence_failed");
      assert.equal(result.error.message, "Kunde inte spara. Försök igen.");
      assert.equal(
        JSON.stringify(result.error).includes("query_failed"),
        false,
      );
    }
  });
});

describe("DivBrain conversation repository — retrieval", () => {
  it("retrieves an owned conversation and hides ownership", async () => {
    const state: FakeState = {
      conversations: [
        conversationRow({
          id: CONV_1,
          user_id: ACTOR_A,
          title: "Min",
        }),
      ],
      messages: [],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const result = await repo.getConversation({
      actorId: ACTOR_A,
      conversationId: CONV_1,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.id, CONV_1);
    assert.equal(result.data.title, "Min");
    assert.equal("user_id" in result.data, false);
    assert.equal("userId" in result.data, false);
  });

  it("returns the same not_found for missing and unowned conversations", async () => {
    const state: FakeState = {
      conversations: [
        conversationRow({
          id: CONV_1,
          user_id: ACTOR_A,
          title: "Privat",
        }),
      ],
      messages: [],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const missing = await repo.getConversation({
      actorId: ACTOR_A,
      conversationId: CONV_2,
    });
    const unowned = await repo.getConversation({
      actorId: ACTOR_B,
      conversationId: CONV_1,
    });

    assert.equal(missing.ok, false);
    assert.equal(unowned.ok, false);
    if (!missing.ok && !unowned.ok) {
      assert.equal(missing.error.code, "not_found");
      assert.equal(unowned.error.code, "not_found");
      assert.equal(missing.error.message, unowned.error.message);
      assert.equal(JSON.stringify(unowned.error).includes(ACTOR_A), false);
    }
  });
});

describe("DivBrain conversation repository — listing", () => {
  it("returns only the actor conversations with active/archived filters", async () => {
    const state: FakeState = {
      conversations: [
        conversationRow({
          id: CONV_1,
          user_id: ACTOR_A,
          title: "Active",
          updated_at: iso(2000),
        }),
        conversationRow({
          id: CONV_2,
          user_id: ACTOR_A,
          title: "Archived",
          updated_at: iso(3000),
          archived_at: iso(2500),
        }),
        conversationRow({
          id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
          user_id: ACTOR_B,
          title: "Other",
          updated_at: iso(4000),
        }),
      ],
      messages: [],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const active = await repo.listConversations({
      actorId: ACTOR_A,
      archiveFilter: "active",
    });
    assert.equal(active.ok, true);
    if (!active.ok) return;
    assert.deepEqual(
      active.data.items.map((item) => item.id),
      [CONV_1],
    );

    const archived = await repo.listConversations({
      actorId: ACTOR_A,
      archiveFilter: "archived",
    });
    assert.equal(archived.ok, true);
    if (!archived.ok) return;
    assert.deepEqual(
      archived.data.items.map((item) => item.id),
      [CONV_2],
    );
  });

  it("orders deterministically with id tie-breaker and paginates", async () => {
    const sharedTs = iso(1000);
    const idLow = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01";
    const idHigh = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02";
    const state: FakeState = {
      conversations: [
        conversationRow({
          id: idLow,
          user_id: ACTOR_A,
          title: "Low",
          updated_at: sharedTs,
        }),
        conversationRow({
          id: idHigh,
          user_id: ACTOR_A,
          title: "High",
          updated_at: sharedTs,
        }),
        conversationRow({
          id: CONV_2,
          user_id: ACTOR_A,
          title: "Newer",
          updated_at: iso(2000),
        }),
      ],
      messages: [],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const page1 = await repo.listConversations({
      actorId: ACTOR_A,
      archiveFilter: "all",
      pageSize: 2,
    });
    assert.equal(page1.ok, true);
    if (!page1.ok) return;
    assert.deepEqual(
      page1.data.items.map((item) => item.id),
      [CONV_2, idHigh],
    );
    assert.ok(page1.data.nextCursor);

    const page2 = await repo.listConversations({
      actorId: ACTOR_A,
      archiveFilter: "all",
      pageSize: 2,
      cursor: page1.data.nextCursor!,
    });
    assert.equal(page2.ok, true);
    if (!page2.ok) return;
    assert.deepEqual(
      page2.data.items.map((item) => item.id),
      [idLow],
    );
    assert.equal(page2.data.nextCursor, null);
  });

  it("rejects invalid cursor and page size; empty list is ok", async () => {
    const state: FakeState = {
      conversations: [],
      messages: [],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const empty = await repo.listConversations({ actorId: ACTOR_A });
    assert.equal(empty.ok, true);
    if (empty.ok) {
      assert.deepEqual(empty.data.items, []);
      assert.equal(empty.data.nextCursor, null);
    }

    const badCursor = await repo.listConversations({
      actorId: ACTOR_A,
      cursor: "not-valid",
    });
    assert.equal(badCursor.ok, false);
    if (!badCursor.ok) {
      assert.equal(badCursor.error.code, "invalid_request");
    }

    const wrongKind = encodeMessageCursor({
      createdAt: iso(),
      id: MSG_1,
    });
    const wrongCursor = await repo.listConversations({
      actorId: ACTOR_A,
      cursor: wrongKind,
    });
    assert.equal(wrongCursor.ok, false);
    if (!wrongCursor.ok) {
      assert.equal(wrongCursor.error.code, "invalid_request");
    }

    for (const pageSize of [0, -1, 51]) {
      const badSize = await repo.listConversations({
        actorId: ACTOR_A,
        pageSize,
      });
      assert.equal(badSize.ok, false);
      if (!badSize.ok) {
        assert.equal(badSize.error.code, "invalid_request");
      }
    }
  });

  it("handles one result, exact page size, and Unicode titles", async () => {
    const state: FakeState = {
      conversations: [
        conversationRow({
          id: CONV_1,
          user_id: ACTOR_A,
          title: "Utdelning — Göteborgs åäö",
          updated_at: iso(1000),
        }),
        conversationRow({
          id: CONV_2,
          user_id: ACTOR_A,
          title: "Andra",
          updated_at: iso(2000),
        }),
      ],
      messages: [],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const one = await repo.listConversations({
      actorId: ACTOR_A,
      archiveFilter: "all",
      pageSize: 1,
    });
    assert.equal(one.ok, true);
    if (!one.ok) return;
    assert.equal(one.data.items.length, 1);
    assert.equal(one.data.items[0]?.title, "Andra");
    assert.ok(one.data.nextCursor);

    const exact = await repo.listConversations({
      actorId: ACTOR_A,
      archiveFilter: "all",
      pageSize: 2,
    });
    assert.equal(exact.ok, true);
    if (!exact.ok) return;
    assert.equal(exact.data.items.length, 2);
    assert.equal(exact.data.nextCursor, null);
    assert.equal(
      exact.data.items.some((item) => item.title.includes("åäö")),
      true,
    );
  });
});

describe("DivBrain conversation repository — update archive restore delete", () => {
  it("updates allowlisted fields and rejects ownership or empty patches", async () => {
    const state: FakeState = {
      conversations: [
        conversationRow({
          id: CONV_1,
          user_id: ACTOR_A,
          title: "Old",
          summary: "Keep me",
          archived_at: null,
        }),
      ],
      messages: [],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const updated = await repo.updateConversation({
      actorId: ACTOR_A,
      conversationId: CONV_1,
      title: "  New title  ",
    });
    assert.equal(updated.ok, true);
    if (!updated.ok) return;
    assert.equal(updated.data.title, "New title");
    assert.equal(updated.data.summary, "Keep me");
    assert.equal(updated.data.archivedAt, null);
    assert.equal(state.lastUpdatePatch?.title, "New title");
    assert.equal("user_id" in (state.lastUpdatePatch ?? {}), false);

    const empty = await repo.updateConversation({
      actorId: ACTOR_A,
      conversationId: CONV_1,
    });
    assert.equal(empty.ok, false);
    if (!empty.ok) {
      assert.equal(empty.error.code, "invalid_request");
    }

    const ownership = await repo.updateConversation({
      actorId: ACTOR_A,
      conversationId: CONV_1,
      title: "X",
      user_id: ACTOR_B,
    } as never);
    assert.equal(ownership.ok, false);
    if (!ownership.ok) {
      assert.equal(ownership.error.code, "invalid_request");
    }

    const unowned = await repo.updateConversation({
      actorId: ACTOR_B,
      conversationId: CONV_1,
      title: "Hack",
    });
    assert.equal(unowned.ok, false);
    if (!unowned.ok) {
      assert.equal(unowned.error.code, "not_found");
    }
  });

  it("archives and restores idempotently without deleting messages", async () => {
    const state: FakeState = {
      conversations: [
        conversationRow({
          id: CONV_1,
          user_id: ACTOR_A,
          title: "Live",
        }),
      ],
      messages: [
        messageRow({
          id: MSG_1,
          conversation_id: CONV_1,
          role: "user",
          content: "Hej",
          completion_status: "completed",
        }),
      ],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const archived = await repo.archiveConversation({
      actorId: ACTOR_A,
      conversationId: CONV_1,
    });
    assert.equal(archived.ok, true);
    if (!archived.ok) return;
    assert.ok(archived.data.archivedAt);

    const archivedAgain = await repo.archiveConversation({
      actorId: ACTOR_A,
      conversationId: CONV_1,
    });
    assert.equal(archivedAgain.ok, true);
    if (!archivedAgain.ok) return;
    assert.equal(archivedAgain.data.archivedAt, archived.data.archivedAt);

    assert.equal(state.messages.length, 1);

    const restored = await repo.restoreConversation({
      actorId: ACTOR_A,
      conversationId: CONV_1,
    });
    assert.equal(restored.ok, true);
    if (!restored.ok) return;
    assert.equal(restored.data.archivedAt, null);

    const other = await repo.archiveConversation({
      actorId: ACTOR_B,
      conversationId: CONV_1,
    });
    assert.equal(other.ok, false);
    if (!other.ok) {
      assert.equal(other.error.code, "not_found");
    }
  });

  it("deletes an owned conversation and cascades messages in the fake", async () => {
    const state: FakeState = {
      conversations: [
        conversationRow({
          id: CONV_1,
          user_id: ACTOR_A,
          title: "Delete me",
        }),
      ],
      messages: [
        messageRow({
          id: MSG_1,
          conversation_id: CONV_1,
          role: "user",
          content: "Bye",
          completion_status: "completed",
        }),
      ],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const deleted = await repo.deleteConversation({
      actorId: ACTOR_A,
      conversationId: CONV_1,
    });
    assert.equal(deleted.ok, true);
    assert.equal(state.conversations.length, 0);
    assert.equal(state.messages.length, 0);
    assert.deepEqual(state.deletedMessageIds, [MSG_1]);
  });
});

describe("DivBrain conversation repository — messages", () => {
  it("lists chronological messages for owned conversations only", async () => {
    const sharedTs = iso(1000);
    const state: FakeState = {
      conversations: [
        conversationRow({ id: CONV_1, user_id: ACTOR_A, title: "A" }),
        conversationRow({ id: CONV_2, user_id: ACTOR_B, title: "B" }),
      ],
      messages: [
        messageRow({
          id: MSG_2,
          conversation_id: CONV_1,
          role: "assistant",
          content: "Andra",
          completion_status: "completed",
          created_at: sharedTs,
        }),
        messageRow({
          id: MSG_1,
          conversation_id: CONV_1,
          role: "user",
          content: "Första",
          completion_status: "completed",
          created_at: sharedTs,
        }),
        messageRow({
          id: MSG_3,
          conversation_id: CONV_2,
          role: "user",
          content: "Other",
          completion_status: "completed",
          created_at: iso(500),
        }),
      ],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const result = await repo.listMessages({
      actorId: ACTOR_A,
      conversationId: CONV_1,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(
      result.data.items.map((item) => item.content),
      ["Första", "Andra"],
    );

    const foreign = await repo.listMessages({
      actorId: ACTOR_A,
      conversationId: CONV_2,
    });
    assert.equal(foreign.ok, false);
    if (!foreign.ok) {
      assert.equal(foreign.error.code, "not_found");
    }
  });

  it("paginates messages and supports empty transcripts", async () => {
    const state: FakeState = {
      conversations: [
        conversationRow({ id: CONV_1, user_id: ACTOR_A, title: "A" }),
      ],
      messages: [
        messageRow({
          id: MSG_1,
          conversation_id: CONV_1,
          role: "user",
          content: "1",
          completion_status: "completed",
          created_at: iso(1000),
        }),
        messageRow({
          id: MSG_2,
          conversation_id: CONV_1,
          role: "assistant",
          content: "2",
          completion_status: "completed",
          created_at: iso(2000),
        }),
        messageRow({
          id: MSG_3,
          conversation_id: CONV_1,
          role: "user",
          content: "3",
          completion_status: "completed",
          created_at: iso(3000),
        }),
      ],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const page1 = await repo.listMessages({
      actorId: ACTOR_A,
      conversationId: CONV_1,
      pageSize: 2,
    });
    assert.equal(page1.ok, true);
    if (!page1.ok) return;
    assert.deepEqual(
      page1.data.items.map((item) => item.content),
      ["1", "2"],
    );
    assert.ok(page1.data.nextCursor);

    const page2 = await repo.listMessages({
      actorId: ACTOR_A,
      conversationId: CONV_1,
      pageSize: 2,
      cursor: page1.data.nextCursor!,
    });
    assert.equal(page2.ok, true);
    if (!page2.ok) return;
    assert.deepEqual(
      page2.data.items.map((item) => item.content),
      ["3"],
    );

    state.messages = [];
    const empty = await repo.listMessages({
      actorId: ACTOR_A,
      conversationId: CONV_1,
    });
    assert.equal(empty.ok, true);
    if (empty.ok) {
      assert.deepEqual(empty.data.items, []);
    }
  });

  it("creates messages only after ownership checks with allowlisted fields", async () => {
    const state: FakeState = {
      conversations: [
        conversationRow({ id: CONV_1, user_id: ACTOR_A, title: "A" }),
        conversationRow({
          id: CONV_2,
          user_id: ACTOR_A,
          title: "Archived",
          archived_at: iso(1),
        }),
      ],
      messages: [],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const created = await repo.createMessage({
      actorId: ACTOR_A,
      conversationId: CONV_1,
      role: "user",
      content: "  Vad är en ETF?  ",
      completionStatus: "completed",
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.equal(created.data.content, "Vad är en ETF?");
    assert.equal(created.data.role, "user");
    assert.equal(state.lastMessageInsert?.conversation_id, CONV_1);
    assert.equal(
      Object.keys(state.lastMessageInsert ?? {})
        .sort()
        .join(","),
      "completion_status,content,conversation_id,role",
    );

    const badRole = await repo.createMessage({
      actorId: ACTOR_A,
      conversationId: CONV_1,
      role: "tool" as never,
      content: "x",
      completionStatus: "completed",
    });
    assert.equal(badRole.ok, false);
    if (!badRole.ok) {
      assert.equal(badRole.error.code, "invalid_request");
    }

    const empty = await repo.createMessage({
      actorId: ACTOR_A,
      conversationId: CONV_1,
      role: "user",
      content: "   ",
      completionStatus: "completed",
    });
    assert.equal(empty.ok, false);

    const foreign = await repo.createMessage({
      actorId: ACTOR_B,
      conversationId: CONV_1,
      role: "user",
      content: "Hack",
      completionStatus: "completed",
    });
    assert.equal(foreign.ok, false);
    if (!foreign.ok) {
      assert.equal(foreign.error.code, "not_found");
    }

    const archived = await repo.createMessage({
      actorId: ACTOR_A,
      conversationId: CONV_2,
      role: "user",
      content: "Nope",
      completionStatus: "completed",
    });
    assert.equal(archived.ok, false);
    if (!archived.ok) {
      assert.equal(archived.error.code, "invalid_request");
    }

    state.failNext = "unavailable";
    const failed = await repo.createMessage({
      actorId: ACTOR_A,
      conversationId: CONV_1,
      role: "assistant",
      content: "Svar",
      completionStatus: "completed",
    });
    assert.equal(failed.ok, false);
    if (!failed.ok) {
      assert.equal(failed.error.code, "persistence_failed");
    }
  });
});

describe("DivBrain conversation repository — mapping and security", () => {
  it("maps rows to domain models without mutating sources", () => {
    const row = conversationRow({
      id: CONV_1,
      user_id: ACTOR_A,
      title: "Map",
      summary: "S",
    });
    const snapshot = structuredClone(row);
    const mapped = mapConversationRowToDomain(row);
    assert.equal(mapped.ok, true);
    if (!mapped.ok) return;
    assert.deepEqual(row, snapshot);
    assert.equal(mapped.data.id, CONV_1);
    assert.equal("user_id" in mapped.data, false);

    const message = messageRow({
      id: MSG_1,
      conversation_id: CONV_1,
      role: "user",
      content: "Hej",
      completion_status: "completed",
      safety_classification: "allow",
      sources: [{ id: "s1" }],
      error_code: "internal_error",
    });
    const messageSnapshot = structuredClone(message);
    const mappedMessage = mapMessageRowToDomain(message);
    assert.equal(mappedMessage.ok, true);
    if (!mappedMessage.ok) return;
    assert.deepEqual(message, messageSnapshot);
    assert.equal("sources" in mappedMessage.data, false);
    assert.equal("safetyClassification" in mappedMessage.data, false);
    assert.equal("errorCode" in mappedMessage.data, false);
  });

  it("fails safely on malformed rows", () => {
    const bad = mapConversationRowToDomain({
      id: "bad",
      user_id: ACTOR_A,
      title: "X",
      summary: null,
      schema_version: 1,
      created_at: "nope",
      updated_at: iso(),
      archived_at: null,
    });
    assert.equal(bad.ok, false);
    if (!bad.ok) {
      assert.equal(bad.error.code, "persistence_failed");
    }
  });

  it("does not expose service-role configuration through errors", () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const result = createDivBrainServiceRolePersistencePort();
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "internal_error");
      const serialized = JSON.stringify(result.error);
      assert.equal(serialized.includes("SERVICE_ROLE"), false);
      assert.equal(serialized.includes("service_role"), false);
      assert.equal(serialized.includes("service-role"), false);
      assert.equal("data" in result, false);
    }

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
  });

  it("rejects unvalidated arbitrary sources on message create", async () => {
    const state: FakeState = {
      conversations: [
        conversationRow({ id: CONV_1, user_id: ACTOR_A, title: "A" }),
      ],
      messages: [],
      deletedMessageIds: [],
    };
    const repo = createDivBrainConversationRepository({
      persistence: createFakePersistence(state),
    });

    const result = await repo.createMessage({
      actorId: ACTOR_A,
      conversationId: CONV_1,
      role: "assistant",
      content: "Svar",
      completionStatus: "completed",
      sources: [{ evil: true, providerBlob: "secret" }],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "invalid_request");
    }
    assert.equal(state.messages.length, 0);
  });

  it("public repository index does not export a raw service-role client factory", async () => {
    const exported = await import("./index");
    assert.equal("createDivBrainServiceRoleClient" in exported, false);
    assert.equal("createDivBrainServiceRolePersistencePort" in exported, true);
    assert.equal("createSupabaseDivBrainPersistencePort" in exported, true);
  });

  it("cursor helpers round-trip without secrets", () => {
    const conversationCursor = encodeConversationCursor({
      updatedAt: iso(),
      id: CONV_1,
    });
    const messageCursor = encodeMessageCursor({
      createdAt: iso(),
      id: MSG_1,
    });
    assert.equal(conversationCursor.includes(ACTOR_A), false);
    assert.equal(messageCursor.includes("service"), false);
  });
});
