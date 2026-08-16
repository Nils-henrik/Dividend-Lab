import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyIncomingUnread,
  countUnread,
  filterAcceptedContacts,
  filterChatSearch,
  formatUnreadChatBadgeLabel,
  getMaxOpenDesktopWindows,
  listMobileInboxResults,
  markConversationUnreadCleared,
  openDesktopWindow,
  parsePersistedChatUiState,
  persistedStateContainsTranscript,
  reconcileDesktopWindows,
  reduceMobileChatLayer,
  serializePersistedChatUiState,
  shouldCoverMainContent,
  sortChatContacts,
} from "../lib/messages/chat-state";
import { validateMessageBody } from "../lib/messages/validation";
import type { ChatContact, ConversationSummary, PresenceView } from "../lib/messages/types";

function contact(
  overrides: Partial<ChatContact> & Pick<ChatContact, "userId" | "name">,
): ChatContact {
  return {
    username: null,
    initials: "DL",
    avatarUrl: null,
    conversationId: null,
    hasUnread: false,
    lastActivityAt: null,
    ...overrides,
  };
}

function summary(
  overrides: Partial<ConversationSummary> & Pick<ConversationSummary, "id">,
): ConversationSummary {
  return {
    subject: null,
    status: "active",
    initiatedBy: "user-a",
    updatedAt: "2026-08-15T12:00:00.000Z",
    otherParticipant: {
      id: "user-b",
      name: "Kontakt",
      username: "kontakt",
      initials: "KO",
      avatarUrl: null,
    },
    lastMessagePreview: "Hej",
    lastMessageAt: "2026-08-15T12:00:00.000Z",
    hasUnread: false,
    ...overrides,
  };
}

describe("contact rail membership", () => {
  it("keeps only accepted contacts in the rail", () => {
    const rows = filterAcceptedContacts([
      { accepted: true, name: "Anna" },
      { accepted: false, name: "Pending" },
      { name: "Implicit accepted" },
    ]);
    assert.deepEqual(
      rows.map((row) => row.name),
      ["Anna", "Implicit accepted"],
    );
  });

  it("sorts online contacts first, then recent activity", () => {
    const sorted = sortChatContacts(
      [
        contact({
          userId: "offline",
          name: "Zara",
          lastActivityAt: "2026-08-15T11:00:00.000Z",
        }),
        contact({
          userId: "online",
          name: "Bert",
          lastActivityAt: "2026-08-15T10:00:00.000Z",
        }),
        contact({
          userId: "recent",
          name: "Ada",
          lastActivityAt: "2026-08-15T12:00:00.000Z",
        }),
      ],
      {
        online: { kind: "online", lastSeenAt: null, compactLabel: "Aktiv nu", srLabel: "Aktiv nu" },
        recent: { kind: "recent", lastSeenAt: null, compactLabel: "5 min", srLabel: "Senast aktiv för 5 minuter sedan" },
        offline: { kind: "offline", lastSeenAt: null, compactLabel: null, srLabel: null },
      } satisfies Record<string, PresenceView>,
    );

    assert.deepEqual(
      sorted.map((item) => item.userId),
      ["online", "recent", "offline"],
    );
  });
});

describe("desktop windows", () => {
  it("opens a contact chat without requiring a route change", () => {
    const windows = openDesktopWindow([], "11111111-1111-4111-8111-111111111111", 2);
    assert.equal(windows[0]?.conversationId, "11111111-1111-4111-8111-111111111111");
    assert.equal(windows[0]?.minimized, false);
  });

  it("minimizes overflow windows deterministically", () => {
    const first = "11111111-1111-4111-8111-111111111111";
    const second = "22222222-2222-4222-8222-222222222222";
    const third = "33333333-3333-4333-8333-333333333333";
    const windows = openDesktopWindow(
      openDesktopWindow(openDesktopWindow([], first, 2), second, 2),
      third,
      2,
    );

    assert.equal(windows.find((item) => item.conversationId === first)?.minimized, true);
    assert.equal(windows.find((item) => item.conversationId === second)?.minimized, false);
    assert.equal(windows.find((item) => item.conversationId === third)?.minimized, false);
  });

  it("does not let the rail cover critical content on narrower desktop", () => {
    assert.equal(
      shouldCoverMainContent({ viewportWidth: 1100, railVisible: true }),
      true,
    );
    assert.equal(
      shouldCoverMainContent({ viewportWidth: 1440, railVisible: true }),
      false,
    );
    assert.ok(getMaxOpenDesktopWindows({
      viewportWidth: 1100,
      sidebarWidth: 80,
      railVisible: false,
    }) >= 1);
    assert.deepEqual(
      reconcileDesktopWindows(
        [{ conversationId: "11111111-1111-4111-8111-111111111111", minimized: false }],
        1,
      ),
      [{ conversationId: "11111111-1111-4111-8111-111111111111", minimized: false }],
    );
  });
});

describe("route persistence", () => {
  it("restores window IDs without storing transcript contents", () => {
    const persisted = serializePersistedChatUiState({
      windows: [
        {
          conversationId: "11111111-1111-4111-8111-111111111111",
          minimized: true,
        },
      ],
      mobileLayer: "inbox",
      mobileConversationId: null,
    });

    assert.equal(persistedStateContainsTranscript(persisted), false);
    assert.equal(persisted.includes("hemligt meddelande"), false);

    const parsed = parsePersistedChatUiState(persisted);
    assert.equal(parsed.windows[0]?.conversationId, "11111111-1111-4111-8111-111111111111");
    assert.equal(parsed.windows[0]?.minimized, true);
    assert.equal(parsed.mobileLayer, "inbox");
  });

  it("rejects persisted payloads that contain message bodies", () => {
    assert.equal(
      persistedStateContainsTranscript(
        JSON.stringify({
          windows: [],
          messages: [{ body: "hemligt" }],
        }),
      ),
      true,
    );
    assert.deepEqual(
      parsePersistedChatUiState(
        JSON.stringify({
          windows: [{ conversationId: "not-a-uuid", body: "hemligt" }],
        }),
      ).windows,
      [],
    );
  });
});

describe("mobile overlay navigation", () => {
  it("walks page -> inbox -> conversation -> inbox -> page", () => {
    const inbox = reduceMobileChatLayer("closed", "open");
    const conversation = reduceMobileChatLayer(inbox, "openConversation");
    const backToInbox = reduceMobileChatLayer(conversation, "back");
    const backToPage = reduceMobileChatLayer(backToInbox, "back");

    assert.equal(inbox, "inbox");
    assert.equal(conversation, "conversation");
    assert.equal(backToInbox, "inbox");
    assert.equal(backToPage, "closed");
  });
});

describe("unread semantics", () => {
  it("does not mark a conversation read from a background event", () => {
    const unread = applyIncomingUnread({
      unreadConversationIds: [],
      conversationId: "c1",
      senderId: "other",
      currentUserId: "me",
      isOpenAndVisible: false,
    });
    assert.deepEqual(unread, ["c1"]);
  });

  it("marks read only when the conversation is open and visible", () => {
    const unread = applyIncomingUnread({
      unreadConversationIds: ["c1"],
      conversationId: "c1",
      senderId: "other",
      currentUserId: "me",
      isOpenAndVisible: true,
    });
    assert.deepEqual(unread, ["c1"]);
    assert.deepEqual(markConversationUnreadCleared(unread, "c1"), []);
  });

  it("counts inbox unread from real conversation state", () => {
    assert.equal(
      countUnread(
        [summary({ id: "c1", hasUnread: true })],
        [summary({ id: "r1", hasUnread: true, status: "message_request" })],
        [],
      ),
      2,
    );
    assert.equal(formatUnreadChatBadgeLabel(1), "Meddelanden, 1 oläst konversation");
  });
});

describe("search and request separation", () => {
  it("can open accepted contacts without an existing conversation from search", () => {
    const result = filterChatSearch({
      query: "ada",
      chats: [],
      contacts: [contact({ userId: "ada", name: "Ada", conversationId: null })],
    });
    assert.equal(result.contacts[0]?.userId, "ada");
    assert.equal(result.contacts[0]?.conversationId, null);
  });

  it("exposes accepted contacts from the mobile compose control even with an empty query", () => {
    const existing = summary({
      id: "c1",
      otherParticipant: {
        id: "bert",
        name: "Bert",
        username: "bert",
        initials: "BE",
        avatarUrl: null,
      },
    });
    const ada = contact({ userId: "ada", name: "Ada", conversationId: null });
    const bert = contact({
      userId: "bert",
      name: "Bert",
      conversationId: "c1",
    });

    const idle = listMobileInboxResults({
      query: "",
      chats: [existing],
      contacts: [ada, bert],
      composeMode: false,
    });
    assert.equal(idle.contacts.length, 0);
    assert.equal(idle.chats.length, 1);

    const composing = listMobileInboxResults({
      query: "",
      chats: [existing],
      contacts: [ada, bert],
      composeMode: true,
    });
    assert.deepEqual(
      composing.contacts.map((item) => item.userId),
      ["ada"],
    );
    assert.equal(composing.chats[0]?.id, "c1");
  });
});

describe("existing permission boundary", () => {
  it("keeps send_private_message body validation authoritative in the shared mutation layer", () => {
    assert.equal(validateMessageBody("", { required: true }).error, "Skriv ett meddelande innan du skickar.");
    assert.match(
      validateMessageBody("x".repeat(2001), { required: true }).error ?? "",
      /högst 2000/,
    );
    assert.equal(validateMessageBody("Hej", { required: true }).body, "Hej");
  });
});
