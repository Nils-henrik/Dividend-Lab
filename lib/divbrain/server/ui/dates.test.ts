/**
 * DivBrain shell date formatting tests (Ticket 1A-9a).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatDivBrainConversationTimestamp,
  formatDivBrainMessageTimestamp,
} from "../../dates";

describe("DivBrain shell date formatting", () => {
  it("formats a valid ISO timestamp deterministically in Swedish", () => {
    const iso = "2026-08-04T12:30:00.000Z";
    const list = formatDivBrainConversationTimestamp(iso);
    const message = formatDivBrainMessageTimestamp(iso);

    assert.equal(typeof list, "string");
    assert.equal(list.length > 0, true);
    assert.equal(list, formatDivBrainConversationTimestamp(iso));
    assert.equal(message, formatDivBrainMessageTimestamp(iso));
    assert.equal(list.includes("Okänd"), false);
    assert.equal(message.includes("Okänd"), false);
  });

  it("maps malformed timestamps to a safe fallback", () => {
    assert.equal(formatDivBrainConversationTimestamp("not-a-date"), "Okänd tid");
    assert.equal(formatDivBrainMessageTimestamp(""), "Okänd tid");
    assert.equal(formatDivBrainConversationTimestamp(null), "Okänd tid");
    assert.equal(formatDivBrainMessageTimestamp(undefined), "Okänd tid");
  });
});
