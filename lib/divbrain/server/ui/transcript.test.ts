/**
 * DivBrain shell transcript loader tests (Ticket 1A-9a).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createDivBrainError } from "../../errors";
import { divBrainSuccess } from "../../results";
import type { DivBrainMessage } from "../../types";
import type {
  DivBrainConversationRepository,
  DivBrainMessagePage,
} from "../repository/repository";
import {
  loadDivBrainShellTranscript,
  mapDivBrainMessageToShellTranscriptItem,
  mapMessagesToShellTranscriptItems,
} from "./transcript";
import {
  DIVBRAIN_SHELL_TRANSCRIPT_MAX_PAGE_ROUNDS,
  DIVBRAIN_SHELL_TRANSCRIPT_RENDER_LIMIT,
} from "./types";

const ACTOR = "11111111-1111-4111-8111-111111111111";
const CONV = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_CONV = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function iso(offsetMs = 0): string {
  return new Date(Date.UTC(2026, 7, 4, 12, 0, 0) + offsetMs).toISOString();
}

function msg(
  partial: Partial<DivBrainMessage> & Pick<DivBrainMessage, "id" | "role">,
): DivBrainMessage {
  return {
    conversationId: CONV,
    content: partial.content ?? "text",
    completionStatus: partial.completionStatus ?? "completed",
    createdAt: partial.createdAt ?? iso(),
    ...partial,
  };
}

function notImplemented(): never {
  throw new Error("unexpected repository mutation");
}

function createMessageRepository(
  pages: DivBrainMessagePage[],
): DivBrainConversationRepository {
  let call = 0;
  return {
    createConversation: notImplemented,
    getConversation: notImplemented,
    listConversations: notImplemented,
    updateConversation: notImplemented,
    archiveConversation: notImplemented,
    restoreConversation: notImplemented,
    deleteConversation: notImplemented,
    createMessage: notImplemented,
    async listMessages() {
      const page = pages[call] ?? { items: [], nextCursor: null };
      call += 1;
      return divBrainSuccess(page);
    },
  };
}

describe("DivBrain shell message status mapping", () => {
  it("maps completed user and assistant messages", () => {
    const user = mapDivBrainMessageToShellTranscriptItem(
      msg({ id: "u1", role: "user", content: "Vad är yield?" }),
      CONV,
    );
    const assistant = mapDivBrainMessageToShellTranscriptItem(
      msg({ id: "a1", role: "assistant", content: "Yield är..." }),
      CONV,
    );

    assert.deepEqual(user, {
      kind: "user_message",
      id: "u1",
      content: "Vad är yield?",
      createdAt: iso(),
    });
    assert.deepEqual(assistant, {
      kind: "assistant_message",
      id: "a1",
      content: "Yield är...",
      createdAt: iso(),
    });
  });

  it("maps provider_unavailable to a catalog status card without answer content", () => {
    const item = mapDivBrainMessageToShellTranscriptItem(
      msg({
        id: "p1",
        role: "assistant",
        content: "raw provider dump",
        completionStatus: "provider_unavailable",
      }),
      CONV,
    );
    assert.equal(item?.kind, "provider_unavailable");
    if (item?.kind === "provider_unavailable") {
      assert.equal(item.message, createDivBrainError("provider_unavailable").message);
      assert.equal(JSON.stringify(item).includes("raw provider"), false);
    }
  });

  it("maps failed, cancelled, pending, generating, and blocked safely", () => {
    assert.equal(
      mapDivBrainMessageToShellTranscriptItem(
        msg({ id: "f1", role: "assistant", completionStatus: "failed", content: "stack" }),
        CONV,
      )?.kind,
      "failed",
    );
    assert.equal(
      mapDivBrainMessageToShellTranscriptItem(
        msg({ id: "c1", role: "assistant", completionStatus: "cancelled" }),
        CONV,
      )?.kind,
      "cancelled",
    );
    assert.equal(
      mapDivBrainMessageToShellTranscriptItem(
        msg({ id: "p1", role: "assistant", completionStatus: "pending" }),
        CONV,
      )?.kind,
      "incomplete",
    );
    assert.equal(
      mapDivBrainMessageToShellTranscriptItem(
        msg({ id: "g1", role: "assistant", completionStatus: "generating" }),
        CONV,
      )?.kind,
      "incomplete",
    );

    const blocked = mapDivBrainMessageToShellTranscriptItem(
      msg({
        id: "b1",
        role: "user",
        content: "SECRET_PROMPT_SHOULD_NOT_LEAK",
        completionStatus: "blocked",
      }),
      CONV,
    );
    assert.equal(blocked?.kind, "blocked");
    assert.equal(
      JSON.stringify(blocked).includes("SECRET_PROMPT_SHOULD_NOT_LEAK"),
      false,
    );
  });

  it("excludes system messages and cross-conversation rows", () => {
    assert.equal(
      mapDivBrainMessageToShellTranscriptItem(
        msg({ id: "s1", role: "system", content: "policy" }),
        CONV,
      ),
      null,
    );
    assert.equal(
      mapDivBrainMessageToShellTranscriptItem(
        msg({
          id: "x1",
          role: "user",
          conversationId: OTHER_CONV,
          content: "other",
        }),
        CONV,
      ),
      null,
    );
  });

  it("fails closed for malformed status without exposing payload", () => {
    const item = mapDivBrainMessageToShellTranscriptItem(
      {
        id: "m1",
        conversationId: CONV,
        role: "assistant",
        content: "raw",
        completionStatus: "not_a_status" as DivBrainMessage["completionStatus"],
        createdAt: iso(),
      },
      CONV,
    );
    assert.equal(item?.kind, "unavailable");
    assert.equal(JSON.stringify(item).includes("raw"), false);
  });

  it("does not mutate input arrays when mapping", () => {
    const messages = [
      msg({ id: "u1", role: "user", content: "a" }),
      msg({ id: "s1", role: "system", content: "policy" }),
    ];
    const snapshot = JSON.stringify(messages);
    const items = mapMessagesToShellTranscriptItems(messages, CONV);
    assert.equal(items.length, 1);
    assert.equal(JSON.stringify(messages), snapshot);
  });

  it("never includes hidden reasoning fields", () => {
    const item = mapDivBrainMessageToShellTranscriptItem(
      msg({ id: "a1", role: "assistant", content: "svar" }),
      CONV,
    );
    const keys = Object.keys(item ?? {});
    assert.equal(keys.includes("reasoning"), false);
    assert.equal(keys.includes("hiddenReasoning"), false);
    assert.equal(keys.includes("sources"), false);
  });
});

describe("DivBrain shell transcript pagination", () => {
  it("returns empty transcript for zero messages", async () => {
    const result = await loadDivBrainShellTranscript({
      repository: createMessageRepository([{ items: [], nextCursor: null }]),
      actorId: ACTOR,
      conversationId: CONV,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.data, { status: "empty" });
    }
  });

  it("loads a single page and preserves chronological order", async () => {
    const result = await loadDivBrainShellTranscript({
      repository: createMessageRepository([
        {
          items: [
            msg({ id: "1", role: "user", content: "first", createdAt: iso(0) }),
            msg({
              id: "2",
              role: "assistant",
              content: "second",
              createdAt: iso(1),
            }),
          ],
          nextCursor: null,
        },
      ]),
      actorId: ACTOR,
      conversationId: CONV,
    });
    assert.equal(result.ok, true);
    if (result.ok && result.data.status === "ready") {
      assert.equal(result.data.items.length, 2);
      assert.equal(result.data.items[0]?.kind, "user_message");
      assert.equal(result.data.items[1]?.kind, "assistant_message");
      assert.equal(result.data.historyTruncated, false);
    }
  });

  it("reaches the transcript tail across multiple pages", async () => {
    const result = await loadDivBrainShellTranscript({
      repository: createMessageRepository([
        {
          items: [msg({ id: "1", role: "user", content: "a", createdAt: iso(0) })],
          nextCursor: "cursor-1",
        },
        {
          items: [
            msg({ id: "2", role: "assistant", content: "b", createdAt: iso(1) }),
          ],
          nextCursor: null,
        },
      ]),
      actorId: ACTOR,
      conversationId: CONV,
    });
    assert.equal(result.ok, true);
    if (result.ok && result.data.status === "ready") {
      assert.equal(result.data.items.length, 2);
      assert.equal(
        result.data.items[1] && "content" in result.data.items[1]
          ? result.data.items[1].content
          : null,
        "b",
      );
    }
  });

  it("fails safely on repeated cursor", async () => {
    const result = await loadDivBrainShellTranscript({
      repository: createMessageRepository([
        {
          items: [msg({ id: "1", role: "user", content: "a" })],
          nextCursor: "same",
        },
        {
          items: [msg({ id: "2", role: "user", content: "b" })],
          nextCursor: "same",
        },
      ]),
      actorId: ACTOR,
      conversationId: CONV,
    });
    assert.equal(result.ok, false);
  });

  it("fails safely on no-progress pagination", async () => {
    const result = await loadDivBrainShellTranscript({
      repository: createMessageRepository([
        { items: [], nextCursor: "cursor-1" },
      ]),
      actorId: ACTOR,
      conversationId: CONV,
    });
    assert.equal(result.ok, false);
  });

  it("fails safely when scan bound is exceeded before the tail", async () => {
    const endlessPages: DivBrainMessagePage[] = Array.from(
      { length: DIVBRAIN_SHELL_TRANSCRIPT_MAX_PAGE_ROUNDS + 1 },
      (_, index) => ({
        items: [
          msg({
            id: `msg-${index}`,
            role: "user",
            content: `m${index}`,
            createdAt: iso(index),
          }),
        ],
        nextCursor: `cursor-${index + 1}`,
      }),
    );

    const result = await loadDivBrainShellTranscript({
      repository: createMessageRepository(endlessPages),
      actorId: ACTOR,
      conversationId: CONV,
    });
    assert.equal(result.ok, false);
  });

  it("retains the latest render window and sets historyTruncated", async () => {
    const items = Array.from(
      { length: DIVBRAIN_SHELL_TRANSCRIPT_RENDER_LIMIT + 5 },
      (_, index) =>
        msg({
          id: `id-${index}`,
          role: index % 2 === 0 ? "user" : "assistant",
          content: `m${index}`,
          createdAt: iso(index),
        }),
    );

    const result = await loadDivBrainShellTranscript({
      repository: createMessageRepository([{ items, nextCursor: null }]),
      actorId: ACTOR,
      conversationId: CONV,
    });

    assert.equal(result.ok, true);
    if (result.ok && result.data.status === "ready") {
      assert.equal(result.data.items.length, DIVBRAIN_SHELL_TRANSCRIPT_RENDER_LIMIT);
      assert.equal(result.data.historyTruncated, true);
      const last = result.data.items[result.data.items.length - 1];
      assert.equal(
        last && "content" in last ? last.content : null,
        `m${items.length - 1}`,
      );
    }
  });

  it("excludes system messages from the rendered transcript", async () => {
    const result = await loadDivBrainShellTranscript({
      repository: createMessageRepository([
        {
          items: [
            msg({ id: "s1", role: "system", content: "policy text" }),
            msg({ id: "u1", role: "user", content: "hello" }),
          ],
          nextCursor: null,
        },
      ]),
      actorId: ACTOR,
      conversationId: CONV,
    });
    assert.equal(result.ok, true);
    if (result.ok && result.data.status === "ready") {
      assert.equal(result.data.items.length, 1);
      assert.equal(JSON.stringify(result.data).includes("policy text"), false);
    }
  });
});
