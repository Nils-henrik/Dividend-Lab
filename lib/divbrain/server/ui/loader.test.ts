/**
 * DivBrain shell page-loader tests (Ticket 1A-9a).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createDivBrainError } from "../../errors";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import type { DivBrainConversation, DivBrainMessage } from "../../types";
import type {
  DivBrainConversationRepository,
} from "../repository/repository";
import { loadDivBrainShellData } from "./loader";
import { DIVBRAIN_SHELL_CONVERSATION_PAGE_SIZE } from "./types";

const ACTOR = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const CONV_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CONV_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CONV_C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const EMAIL = "user@example.com";

function iso(offsetMs = 0): string {
  return new Date(Date.UTC(2026, 7, 4, 12, 0, 0) + offsetMs).toISOString();
}

function conversation(
  id: string,
  title: string,
  updatedOffset = 0,
  archivedAt: string | null = null,
): DivBrainConversation {
  return {
    id,
    title,
    summary: null,
    createdAt: iso(0),
    updatedAt: iso(updatedOffset),
    archivedAt,
  };
}

type FakeRepoOptions = {
  conversations?: DivBrainConversation[];
  nextCursor?: string | null;
  messagesByConversation?: Record<string, DivBrainMessage[]>;
  getConversationResult?: Awaited<
    ReturnType<DivBrainConversationRepository["getConversation"]>
  >;
  listConversationsFails?: boolean;
  listMessagesFails?: boolean;
  mutationLog?: string[];
  lastListPageSize?: { value?: number };
};

function createFakeRepository(
  options: FakeRepoOptions = {},
): DivBrainConversationRepository {
  const mutationLog = options.mutationLog ?? [];

  const rejectMutation = async (name: string) => {
    mutationLog.push(name);
    return divBrainFailureFromCode("internal_error");
  };

  return {
    async createConversation() {
      return rejectMutation("createConversation");
    },
    async updateConversation() {
      return rejectMutation("updateConversation");
    },
    async archiveConversation() {
      return rejectMutation("archiveConversation");
    },
    async restoreConversation() {
      return rejectMutation("restoreConversation");
    },
    async deleteConversation() {
      return rejectMutation("deleteConversation");
    },
    async createMessage() {
      return rejectMutation("createMessage");
    },
    async listConversations(params) {
      if (options.lastListPageSize) {
        options.lastListPageSize.value = params.pageSize;
      }
      assert.equal(params.actorId, ACTOR);
      assert.equal(params.archiveFilter ?? "active", "active");
      if (options.listConversationsFails) {
        return {
          ok: false as const,
          error: createDivBrainError("persistence_failed"),
        };
      }
      return divBrainSuccess({
        items: options.conversations ?? [],
        nextCursor: options.nextCursor ?? null,
      });
    },
    async getConversation(params) {
      assert.equal(params.actorId, ACTOR);
      if (options.getConversationResult) {
        return options.getConversationResult;
      }
      const found = (options.conversations ?? []).find(
        (item) => item.id === params.conversationId.toLowerCase(),
      );
      if (!found) {
        return divBrainFailureFromCode("not_found");
      }
      return divBrainSuccess(found);
    },
    async listMessages(params) {
      assert.equal(params.actorId, ACTOR);
      if (options.listMessagesFails) {
        return {
          ok: false as const,
          error: createDivBrainError("persistence_failed"),
        };
      }
      const items =
        options.messagesByConversation?.[params.conversationId] ?? [];
      return divBrainSuccess({ items, nextCursor: null });
    },
  };
}

function assertNoSensitiveFields(view: unknown) {
  const serialized = JSON.stringify(view);
  assert.equal(serialized.includes(ACTOR), false);
  assert.equal(serialized.includes(OTHER), false);
  assert.equal(serialized.includes(EMAIL), false);
  assert.equal(serialized.includes("SUPABASE"), false);
  assert.equal(serialized.includes("service_role"), false);
  assert.equal(serialized.includes("DIVBRAIN_ALPHA"), false);
  assert.equal(serialized.includes("persistence_failed"), false);
  assert.equal(serialized.includes("actorId"), false);
  assert.equal(serialized.includes("userId"), false);
  assert.equal(serialized.includes("ownerId"), false);
  assert.equal(serialized.includes("email"), false);
}

describe("DivBrain shell page loader data states", () => {
  it("returns empty when the active conversation list is empty", async () => {
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      repository: createFakeRepository({ conversations: [] }),
    });
    assert.equal(view.state, "empty");
    if (view.state === "empty") {
      assert.equal(view.conversations.length, 0);
      assert.equal(view.selectedConversationId, null);
      assert.equal(view.hasMoreConversations, false);
    }
    assertNoSensitiveFields(view);
  });

  it("selects the first active conversation by default", async () => {
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      repository: createFakeRepository({
        conversations: [
          conversation(CONV_A, "Senaste", 2),
          conversation(CONV_B, "Äldre", 1),
        ],
        messagesByConversation: {
          [CONV_A]: [
            {
              id: "11111111-1111-4111-8111-111111111101",
              conversationId: CONV_A,
              role: "user",
              content: "Hej",
              completionStatus: "completed",
              createdAt: iso(),
            },
          ],
        },
      }),
    });
    assert.equal(view.state, "ready");
    if (view.state === "ready") {
      assert.equal(view.selectedConversation.id, CONV_A);
      assert.equal(view.selectedConversation.title, "Senaste");
    }
    assertNoSensitiveFields(view);
  });

  it("selects an explicitly requested owned conversation", async () => {
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      selectedConversationId: CONV_B,
      repository: createFakeRepository({
        conversations: [
          conversation(CONV_A, "A", 2),
          conversation(CONV_B, "B", 1),
        ],
      }),
    });
    assert.equal(view.state, "ready");
    if (view.state === "ready") {
      assert.equal(view.selectedConversation.id, CONV_B);
    }
  });

  it("maps malformed selected id to conversation_not_found", async () => {
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      selectedConversationId: "not-a-uuid",
      repository: createFakeRepository({
        conversations: [conversation(CONV_A, "A")],
      }),
    });
    assert.equal(view.state, "conversation_not_found");
    assert.equal(JSON.stringify(view).includes("not-a-uuid"), false);
  });

  it("maps missing selected conversation to conversation_not_found", async () => {
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      selectedConversationId: CONV_C,
      repository: createFakeRepository({
        conversations: [conversation(CONV_A, "A")],
        getConversationResult: divBrainFailureFromCode("not_found"),
      }),
    });
    assert.equal(view.state, "conversation_not_found");
  });

  it("maps simulated cross-owner selection to the same not-found state", async () => {
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      selectedConversationId: CONV_C,
      repository: createFakeRepository({
        conversations: [conversation(CONV_A, "A")],
        getConversationResult: divBrainFailureFromCode("not_found"),
      }),
    });
    assert.equal(view.state, "conversation_not_found");
    assert.equal(JSON.stringify(view).includes(OTHER), false);
  });

  it("maps listConversations failure to data_unavailable without raw errors", async () => {
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      repository: createFakeRepository({ listConversationsFails: true }),
    });
    assert.deepEqual(view, { state: "data_unavailable" });
    assertNoSensitiveFields(view);
  });

  it("maps transcript load failure to data_unavailable", async () => {
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      repository: createFakeRepository({
        conversations: [conversation(CONV_A, "A")],
        listMessagesFails: true,
      }),
    });
    assert.deepEqual(view, { state: "data_unavailable" });
  });

  it("renders an explicitly selected archived conversation read-only", async () => {
    const archived = conversation(CONV_C, "Arkiverad", 0, iso(9));
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      selectedConversationId: CONV_C,
      repository: createFakeRepository({
        conversations: [conversation(CONV_A, "Aktiv")],
        getConversationResult: divBrainSuccess(archived),
      }),
    });
    assert.equal(view.state, "ready");
    if (view.state === "ready") {
      assert.equal(view.selectedConversation.archived, true);
      assert.equal(
        view.conversations.some((item) => item.id === CONV_C),
        true,
      );
    }
  });
});

describe("DivBrain shell conversation list", () => {
  it("requests active conversations with the shell page size", async () => {
    const lastListPageSize: { value?: number } = {};
    await loadDivBrainShellData({
      actorId: ACTOR,
      repository: createFakeRepository({
        conversations: [],
        lastListPageSize,
      }),
    });
    assert.equal(lastListPageSize.value, DIVBRAIN_SHELL_CONVERSATION_PAGE_SIZE);
  });

  it("sets hasMoreConversations from nextCursor without leaking the cursor", async () => {
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      repository: createFakeRepository({
        conversations: [conversation(CONV_A, "A")],
        nextCursor: "secret-cursor-value",
      }),
    });
    assert.equal(view.state, "ready");
    if (view.state === "ready") {
      assert.equal(view.hasMoreConversations, true);
    }
    assert.equal(JSON.stringify(view).includes("secret-cursor-value"), false);
    assert.equal(JSON.stringify(view).includes("nextCursor"), false);
  });

  it("preserves repository list order and plain-text titles", async () => {
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      repository: createFakeRepository({
        conversations: [
          conversation(CONV_A, "<script>x</script>"),
          conversation(CONV_B, "Andra"),
        ],
      }),
    });
    assert.equal(view.state, "ready");
    if (view.state === "ready") {
      assert.deepEqual(
        view.conversations.map((item) => item.title),
        ["<script>x</script>", "Andra"],
      );
    }
  });

  it("viewing does not call create/update/archive/restore/delete", async () => {
    const mutationLog: string[] = [];
    await loadDivBrainShellData({
      actorId: ACTOR,
      selectedConversationId: CONV_A,
      repository: createFakeRepository({
        conversations: [conversation(CONV_A, "A")],
        mutationLog,
      }),
    });
    assert.deepEqual(mutationLog, []);
  });
});
