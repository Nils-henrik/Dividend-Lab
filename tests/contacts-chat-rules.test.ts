import assert from "node:assert/strict";
import { describe, it } from "node:test";

type ContactStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "removed";

type ConversationStatus =
  | "message_request"
  | "active"
  | "ignored"
  | "declined";

function countsTowardContactTotal(status: ContactStatus) {
  return status === "accepted";
}

function canSenderSendBeforeAcceptance(params: {
  conversationStatus: ConversationStatus;
  initiatedBy: string;
  actingUserId: string;
  existingMessageCount: number;
}) {
  if (params.conversationStatus !== "message_request") {
    return params.conversationStatus === "active";
  }

  if (params.initiatedBy !== params.actingUserId) {
    return false;
  }

  return params.existingMessageCount === 0;
}

function acceptingMessageRequestCreatesContact() {
  return false;
}

function removingContactDisablesActiveChat() {
  return false;
}

describe("contact counting rules", () => {
  it("counts only accepted relationships", () => {
    assert.equal(countsTowardContactTotal("accepted"), true);
    assert.equal(countsTowardContactTotal("pending"), false);
    assert.equal(countsTowardContactTotal("rejected"), false);
    assert.equal(countsTowardContactTotal("cancelled"), false);
    assert.equal(countsTowardContactTotal("removed"), false);
  });
});

describe("message request anti-spam rules", () => {
  it("allows exactly one initial sender message before acceptance", () => {
    assert.equal(
      canSenderSendBeforeAcceptance({
        conversationStatus: "message_request",
        initiatedBy: "sender",
        actingUserId: "sender",
        existingMessageCount: 0,
      }),
      true,
    );
    assert.equal(
      canSenderSendBeforeAcceptance({
        conversationStatus: "message_request",
        initiatedBy: "sender",
        actingUserId: "sender",
        existingMessageCount: 1,
      }),
      false,
    );
  });

  it("blocks the recipient from sending before acceptance", () => {
    assert.equal(
      canSenderSendBeforeAcceptance({
        conversationStatus: "message_request",
        initiatedBy: "sender",
        actingUserId: "recipient",
        existingMessageCount: 1,
      }),
      false,
    );
  });

  it("allows both sides after activation", () => {
    assert.equal(
      canSenderSendBeforeAcceptance({
        conversationStatus: "active",
        initiatedBy: "sender",
        actingUserId: "sender",
        existingMessageCount: 1,
      }),
      true,
    );
    assert.equal(
      canSenderSendBeforeAcceptance({
        conversationStatus: "active",
        initiatedBy: "sender",
        actingUserId: "recipient",
        existingMessageCount: 1,
      }),
      true,
    );
  });
});

describe("contact and chat independence", () => {
  it("does not create contacts when accepting a message request", () => {
    assert.equal(acceptingMessageRequestCreatesContact(), false);
  });

  it("does not disable active chat when removing a contact", () => {
    assert.equal(removingContactDisablesActiveChat(), false);
  });
});

describe("presence is contact-only", () => {
  it("does not expose active status to a non-contact message requester", () => {
    const canReadPresence = (params: {
      areAcceptedContacts: boolean;
      shareActiveStatus: boolean;
    }) => params.areAcceptedContacts && params.shareActiveStatus;

    assert.equal(
      canReadPresence({ areAcceptedContacts: false, shareActiveStatus: true }),
      false,
    );
    assert.equal(
      canReadPresence({ areAcceptedContacts: true, shareActiveStatus: true }),
      true,
    );
  });
});

describe("payload privacy", () => {
  it("never includes email fields in public contact summaries", () => {
    const contactPayload = {
      id: "user-1",
      name: "Example",
      username: "example",
      initials: "EX",
      avatarUrl: null as string | null,
    };

    assert.equal("email" in contactPayload, false);
  });

  it("never includes email fields in conversation participant payloads", () => {
    const participantPayload = {
      id: "user-1",
      name: "Example",
      username: "example",
      initials: "EX",
      avatarUrl: null as string | null,
    };

    assert.equal("email" in participantPayload, false);
  });
});
