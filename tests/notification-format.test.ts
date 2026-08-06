import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatContactRequestNotificationBody,
  formatForumReplyNotificationBody,
  formatUnreadMessageNotificationLabel,
} from "../lib/notifications/format";

describe("notification copy", () => {
  it("formats contact request notifications in Swedish", () => {
    assert.equal(
      formatContactRequestNotificationBody("alice"),
      "@alice vill lägga till dig som kontakt.",
    );
  });

  it("formats thread-owner forum reply notifications", () => {
    assert.equal(
      formatForumReplyNotificationBody("bob", {
        threadTitle: "Utdelningar 2026",
        kind: "thread",
      }),
      '@bob svarade i din tråd “Utdelningar 2026”.',
    );
  });

  it("formats direct forum reply notifications", () => {
    assert.equal(
      formatForumReplyNotificationBody("carol", {
        threadTitle: "Portföljfrågor",
        kind: "reply",
      }),
      '@carol svarade på ditt inlägg i “Portföljfrågor”.',
    );
  });

  it("keeps private message summary copy", () => {
    assert.equal(
      formatUnreadMessageNotificationLabel(1),
      "Du har 1 oläst meddelande",
    );
    assert.equal(
      formatUnreadMessageNotificationLabel(3),
      "Du har 3 olästa meddelanden",
    );
  });
});
