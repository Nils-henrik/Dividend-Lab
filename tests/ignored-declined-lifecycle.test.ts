import assert from "node:assert/strict";
import { describe, it } from "node:test";

type ConversationStatus =
  | "message_request"
  | "active"
  | "ignored"
  | "declined";

function resolvePendingSenderUi(status: ConversationStatus, initiatedBy: string, viewerId: string) {
  const isPendingSender =
    (status === "message_request" || status === "ignored" || status === "declined") &&
    initiatedBy === viewerId;

  return {
    showNeutralPendingCopy: isPendingSender,
    composerEnabled: status === "active",
    revealIgnoredOrDeclined: false,
  };
}

function canOpenReuseWithoutNewMessage(params: {
  isParticipant: boolean;
  canSend: boolean;
}) {
  if (params.canSend) return "send";
  if (params.isParticipant) return "reuse";
  return "reject";
}

describe("ignored and declined sender UX", () => {
  it("shows neutral pending copy for ignored and declined without revealing status", () => {
    for (const status of ["ignored", "declined", "message_request"] as const) {
      const ui = resolvePendingSenderUi(status, "sender", "sender");
      assert.equal(ui.showNeutralPendingCopy, true);
      assert.equal(ui.composerEnabled, false);
      assert.equal(ui.revealIgnoredOrDeclined, false);
    }
  });

  it("enables composer only after activation", () => {
    const ui = resolvePendingSenderUi("active", "sender", "sender");
    assert.equal(ui.composerEnabled, true);
    assert.equal(ui.showNeutralPendingCopy, false);
  });
});

describe("canonical conversation reopen behavior", () => {
  it("reuses the existing conversation when a participant cannot send", () => {
    assert.equal(
      canOpenReuseWithoutNewMessage({ isParticipant: true, canSend: false }),
      "reuse",
    );
  });

  it("sends when permitted and rejects non-participants", () => {
    assert.equal(
      canOpenReuseWithoutNewMessage({ isParticipant: true, canSend: true }),
      "send",
    );
    assert.equal(
      canOpenReuseWithoutNewMessage({ isParticipant: false, canSend: false }),
      "reject",
    );
  });
});
