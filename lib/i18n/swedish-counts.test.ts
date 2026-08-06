import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatArticleCountLabel,
  formatCommentCountLabel,
  formatReplyCountLabel,
} from "@/lib/i18n/swedish-counts";

describe("swedish count labels", () => {
  it("formats article counts correctly", () => {
    assert.equal(formatArticleCountLabel(0), "0 artiklar");
    assert.equal(formatArticleCountLabel(1), "1 artikel");
    assert.equal(formatArticleCountLabel(2), "2 artiklar");
    assert.equal(formatArticleCountLabel(24), "24 artiklar");
  });

  it("formats comment and reply counts correctly", () => {
    assert.equal(formatCommentCountLabel(1), "1 kommentar");
    assert.equal(formatCommentCountLabel(3), "3 kommentarer");
    assert.equal(formatReplyCountLabel(1), "1 svar");
    assert.equal(formatReplyCountLabel(5), "5 svar");
  });
});
