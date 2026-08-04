/**
 * DivBrain shell fail-closed regression tests (Ticket 1A-9a acceptance).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createDivBrainError } from "../../errors";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import type { DivBrainConversation, DivBrainMessage } from "../../types";
import type { DivBrainConversationRepository } from "../repository/repository";
import type { DivBrainPersistencePort } from "../repository/persistence";
import { loadDivBrainShellData } from "./loader";
import { createDivBrainRuntimeRepository } from "./runtime";
import { loadDivBrainShellTranscript } from "./transcript";

const ACTOR = "11111111-1111-4111-8111-111111111111";
const CONV_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SECRET = "secret-runtime-value";

function iso(offsetMs = 0): string {
  return new Date(Date.UTC(2026, 7, 4, 12, 0, 0) + offsetMs).toISOString();
}

function conversation(id: string, title: string): DivBrainConversation {
  return {
    id,
    title,
    summary: null,
    createdAt: iso(),
    updatedAt: iso(),
    archivedAt: null,
  };
}

function createThrowingMutationLog(): {
  mutationLog: string[];
  rejectMutation: (name: string) => Promise<never>;
} {
  const mutationLog: string[] = [];
  return {
    mutationLog,
    async rejectMutation(name: string): Promise<never> {
      mutationLog.push(name);
      throw new Error(`unexpected mutation ${name}`);
    },
  };
}

describe("DivBrain runtime repository fail-closed", () => {
  it("maps persistence factory throws to fresh internal_error without the secret", () => {
    const result = createDivBrainRuntimeRepository({
      createPersistencePort() {
        throw new Error(SECRET);
      },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "internal_error");
      assert.equal(JSON.stringify(result).includes(SECRET), false);
      assert.equal(result.error.message.includes(SECRET), false);
    }
  });

  it("maps repository construction throws to fresh internal_error", () => {
    const fakePort = {} as DivBrainPersistencePort;
    const result = createDivBrainRuntimeRepository({
      createPersistencePort: () => divBrainSuccess(fakePort),
      createRepository() {
        throw new Error(SECRET);
      },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "internal_error");
      assert.equal(JSON.stringify(result).includes(SECRET), false);
    }
  });

  it("does not preserve a thrown catalog error code from persistence factory", () => {
    const result = createDivBrainRuntimeRepository({
      createPersistencePort() {
        throw createDivBrainError("access_denied");
      },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "internal_error");
    }
  });

  it("keeps missing-configuration DivBrainResult failures unchanged", () => {
    const result = createDivBrainRuntimeRepository({
      createPersistencePort: () => divBrainFailureFromCode("internal_error"),
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "internal_error");
    }
  });
});

describe("DivBrain shell loader fail-closed throws", () => {
  it("maps listConversations throws to data_unavailable without raw message", async () => {
    const { mutationLog, rejectMutation } = createThrowingMutationLog();
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      repository: {
        async listConversations() {
          throw new Error(SECRET);
        },
        async getConversation() {
          return divBrainFailureFromCode("not_found");
        },
        async listMessages() {
          return divBrainSuccess({ items: [], nextCursor: null });
        },
        createConversation: () => rejectMutation("createConversation"),
        updateConversation: () => rejectMutation("updateConversation"),
        archiveConversation: () => rejectMutation("archiveConversation"),
        restoreConversation: () => rejectMutation("restoreConversation"),
        deleteConversation: () => rejectMutation("deleteConversation"),
        createMessage: () => rejectMutation("createMessage"),
      },
    });

    assert.deepEqual(view, { state: "data_unavailable" });
    assert.equal(JSON.stringify(view).includes(SECRET), false);
    assert.deepEqual(mutationLog, []);
  });

  it("maps getConversation throws to data_unavailable not conversation_not_found", async () => {
    const { mutationLog, rejectMutation } = createThrowingMutationLog();
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      selectedConversationId: CONV_A,
      repository: {
        async listConversations() {
          return divBrainSuccess({
            items: [conversation(CONV_A, "A")],
            nextCursor: null,
          });
        },
        async getConversation() {
          throw new Error(`${SECRET}:${CONV_A}`);
        },
        async listMessages() {
          return divBrainSuccess({ items: [], nextCursor: null });
        },
        createConversation: () => rejectMutation("createConversation"),
        updateConversation: () => rejectMutation("updateConversation"),
        archiveConversation: () => rejectMutation("archiveConversation"),
        restoreConversation: () => rejectMutation("restoreConversation"),
        deleteConversation: () => rejectMutation("deleteConversation"),
        createMessage: () => rejectMutation("createMessage"),
      },
    });

    assert.deepEqual(view, { state: "data_unavailable" });
    assert.equal(view.state === "conversation_not_found", false);
    assert.equal(JSON.stringify(view).includes(SECRET), false);
    assert.equal(JSON.stringify(view).includes(CONV_A), false);
    assert.deepEqual(mutationLog, []);
  });

  it("maps listMessages throws through transcript to data_unavailable", async () => {
    const { mutationLog, rejectMutation } = createThrowingMutationLog();
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      repository: {
        async listConversations() {
          return divBrainSuccess({
            items: [conversation(CONV_A, "A")],
            nextCursor: null,
          });
        },
        async getConversation() {
          return divBrainSuccess(conversation(CONV_A, "A"));
        },
        async listMessages() {
          throw new Error(SECRET);
        },
        createConversation: () => rejectMutation("createConversation"),
        updateConversation: () => rejectMutation("updateConversation"),
        archiveConversation: () => rejectMutation("archiveConversation"),
        restoreConversation: () => rejectMutation("restoreConversation"),
        deleteConversation: () => rejectMutation("deleteConversation"),
        createMessage: () => rejectMutation("createMessage"),
      },
    });

    assert.deepEqual(view, { state: "data_unavailable" });
    assert.equal(JSON.stringify(view).includes(SECRET), false);
    assert.deepEqual(mutationLog, []);
  });

  it("maps throwing conversation property getters to data_unavailable", async () => {
    const { mutationLog, rejectMutation } = createThrowingMutationLog();
    const poisoned = {
      get id(): string {
        throw new Error(SECRET);
      },
      title: "A",
      summary: null,
      createdAt: iso(),
      updatedAt: iso(),
      archivedAt: null,
    } as unknown as DivBrainConversation;

    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      repository: {
        async listConversations() {
          return divBrainSuccess({
            items: [poisoned],
            nextCursor: null,
          });
        },
        async getConversation() {
          return divBrainSuccess(poisoned);
        },
        async listMessages() {
          return divBrainSuccess({ items: [], nextCursor: null });
        },
        createConversation: () => rejectMutation("createConversation"),
        updateConversation: () => rejectMutation("updateConversation"),
        archiveConversation: () => rejectMutation("archiveConversation"),
        restoreConversation: () => rejectMutation("restoreConversation"),
        deleteConversation: () => rejectMutation("deleteConversation"),
        createMessage: () => rejectMutation("createMessage"),
      },
    });

    assert.deepEqual(view, { state: "data_unavailable" });
    assert.equal(JSON.stringify(view).includes(SECRET), false);
    assert.deepEqual(mutationLog, []);
  });

  it("keeps typed not_found as conversation_not_found", async () => {
    const view = await loadDivBrainShellData({
      actorId: ACTOR,
      selectedConversationId: CONV_A,
      repository: {
        async listConversations() {
          return divBrainSuccess({ items: [], nextCursor: null });
        },
        async getConversation() {
          return divBrainFailureFromCode("not_found");
        },
        async listMessages() {
          return divBrainSuccess({ items: [], nextCursor: null });
        },
        async createConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async updateConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async archiveConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async restoreConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async deleteConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async createMessage() {
          return divBrainFailureFromCode("internal_error");
        },
      },
    });

    assert.equal(view.state, "conversation_not_found");
  });
});

describe("DivBrain shell transcript fail-closed throws", () => {
  it("maps listMessages throws to a safe internal_error failure", async () => {
    const result = await loadDivBrainShellTranscript({
      actorId: ACTOR,
      conversationId: CONV_A,
      repository: {
        async listMessages() {
          throw new Error(SECRET);
        },
        async listConversations() {
          return divBrainSuccess({ items: [], nextCursor: null });
        },
        async getConversation() {
          return divBrainFailureFromCode("not_found");
        },
        async createConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async updateConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async archiveConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async restoreConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async deleteConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async createMessage() {
          return divBrainFailureFromCode("internal_error");
        },
      } satisfies DivBrainConversationRepository,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "internal_error");
      assert.equal(JSON.stringify(result).includes(SECRET), false);
    }
  });

  it("fails safely on a malformed successful page object", async () => {
    const result = await loadDivBrainShellTranscript({
      actorId: ACTOR,
      conversationId: CONV_A,
      repository: {
        async listMessages() {
          return {
            ok: true as const,
            data: { items: "not-an-array", nextCursor: null } as never,
          };
        },
        async listConversations() {
          return divBrainSuccess({ items: [], nextCursor: null });
        },
        async getConversation() {
          return divBrainFailureFromCode("not_found");
        },
        async createConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async updateConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async archiveConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async restoreConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async deleteConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async createMessage() {
          return divBrainFailureFromCode("internal_error");
        },
      },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "internal_error");
    }
  });

  it("fails safely when a page property getter throws", async () => {
    const result = await loadDivBrainShellTranscript({
      actorId: ACTOR,
      conversationId: CONV_A,
      repository: {
        async listMessages() {
          return {
            ok: true as const,
            data: {
              get items(): DivBrainMessage[] {
                throw new Error(SECRET);
              },
              nextCursor: null,
            } as never,
          };
        },
        async listConversations() {
          return divBrainSuccess({ items: [], nextCursor: null });
        },
        async getConversation() {
          return divBrainFailureFromCode("not_found");
        },
        async createConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async updateConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async archiveConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async restoreConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async deleteConversation() {
          return divBrainFailureFromCode("internal_error");
        },
        async createMessage() {
          return divBrainFailureFromCode("internal_error");
        },
      },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "internal_error");
      assert.equal(JSON.stringify(result).includes(SECRET), false);
    }
  });
});
