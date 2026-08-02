import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatContactCountLabel,
  normalizeContactPair,
} from "../lib/contacts/labels.ts";

describe("formatContactCountLabel", () => {
  it("uses singular for one contact", () => {
    assert.equal(formatContactCountLabel(1), "1 kontakt");
  });

  it("uses plural for zero contacts", () => {
    assert.equal(formatContactCountLabel(0), "0 kontakter");
  });

  it("uses plural for multiple contacts", () => {
    assert.equal(formatContactCountLabel(24), "24 kontakter");
  });

  it("floors fractional values and clamps negatives", () => {
    assert.equal(formatContactCountLabel(2.9), "2 kontakter");
    assert.equal(formatContactCountLabel(-3), "0 kontakter");
  });
});

describe("normalizeContactPair", () => {
  it("orders participant ids regardless of input order", () => {
    const first = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const second = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

    assert.deepEqual(normalizeContactPair(first, second), {
      userLowId: first,
      userHighId: second,
    });
    assert.deepEqual(normalizeContactPair(second, first), {
      userLowId: first,
      userHighId: second,
    });
  });
});
