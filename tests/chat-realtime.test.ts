import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyMessageToSummaries,
  mapRealtimeMessageRow,
  mergeRealtimeMessage,
  mergeRealtimeMessages,
} from "../lib/messages/realtime-messages";
import type { ConversationMessage, ConversationSummary } from "../lib/messages/types";

const first: ConversationMessage = {
  id: "m1",
  conversationId: "c1",
  senderId: "other",
  body: "Första",
  createdAt: "2026-08-15T12:00:00.000Z",
};

const second: ConversationMessage = {
  id: "m2",
  conversationId: "c1",
  senderId: "other",
  body: "Andra",
  createdAt: "2026-08-15T12:01:00.000Z",
};

describe("realtime message merge", () => {
  it("appends a new message without a full reload", () => {
    const merged = mergeRealtimeMessage([first], second);
    assert.deepEqual(
      merged.map((message) => message.id),
      ["m1", "m2"],
    );
  });

  it("does not duplicate a replayed or resent event", () => {
    const merged = mergeRealtimeMessages([first, second], [second, first]);
    assert.deepEqual(
      merged.map((message) => message.id),
      ["m1", "m2"],
    );
  });

  it("does not duplicate after reconnect/resubscribe", () => {
    const replayed = mergeRealtimeMessages([first, second], [first, second]);
    assert.equal(replayed.length, 2);
  });

  it("updates inbox preview and unread from a new event", () => {
    const summaries: ConversationSummary[] = [
      {
        id: "c1",
        subject: null,
        status: "active",
        initiatedBy: "me",
        updatedAt: first.createdAt,
        otherParticipant: {
          id: "other",
          name: "Kontakt",
          username: "kontakt",
          initials: "KO",
          avatarUrl: null,
        },
        lastMessagePreview: first.body,
        lastMessageAt: first.createdAt,
        hasUnread: false,
      },
    ];

    const next = applyMessageToSummaries(summaries, second, {
      currentUserId: "me",
      isOpenAndVisible: false,
    });

    assert.equal(next[0]?.lastMessagePreview, "Andra");
    assert.equal(next[0]?.hasUnread, true);
  });

  it("ignores malformed realtime rows", () => {
    assert.equal(mapRealtimeMessageRow({ id: 1 }), null);
    assert.deepEqual(
      mapRealtimeMessageRow({
        id: "m3",
        conversation_id: "c1",
        sender_id: "other",
        body: "OK",
        created_at: "2026-08-15T12:02:00.000Z",
      }),
      {
        id: "m3",
        conversationId: "c1",
        senderId: "other",
        body: "OK",
        createdAt: "2026-08-15T12:02:00.000Z",
      },
    );
  });
});
