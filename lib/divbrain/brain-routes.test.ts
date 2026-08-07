/**
 * Safe /brain route helper tests (Ticket 1A-9b).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDivBrainHref,
  parseDivBrainArchiveScope,
} from "./brain-routes";

describe("DivBrain archive scope parsing", () => {
  it("defaults missing and malformed values to active", () => {
    assert.equal(parseDivBrainArchiveScope(undefined), "active");
    assert.equal(parseDivBrainArchiveScope(null), "active");
    assert.equal(parseDivBrainArchiveScope(""), "active");
    assert.equal(parseDivBrainArchiveScope("all"), "active");
    assert.equal(parseDivBrainArchiveScope(["archived", "active"]), "active");
  });

  it("accepts archived explicitly", () => {
    assert.equal(parseDivBrainArchiveScope("archived"), "archived");
    assert.equal(parseDivBrainArchiveScope(" Archived "), "archived");
  });
});

describe("DivBrain href builder", () => {
  it("builds active root without redundant archive query", () => {
    assert.equal(buildDivBrainHref(), "/brain");
    assert.equal(
      buildDivBrainHref({ archiveScope: "active", conversationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }),
      "/brain?conversation=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
  });

  it("preserves archived scope in links", () => {
    assert.equal(
      buildDivBrainHref({ archiveScope: "archived" }),
      "/brain?archive=archived",
    );
    assert.equal(
      buildDivBrainHref({
        archiveScope: "archived",
        conversationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      }),
      "/brain?archive=archived&conversation=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    );
  });

  it("never builds open redirects", () => {
    assert.equal(
      buildDivBrainHref({
        conversationId: "https://evil.example",
      }).startsWith("/brain"),
      true,
    );
    assert.equal(buildDivBrainHref().includes("http"), false);
  });
});
