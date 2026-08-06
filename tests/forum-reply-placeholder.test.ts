import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("forum reply placeholder", () => {
  it("uses the simplified Swedish placeholder", () => {
    const source = readFileSync(
      join(root, "components/forum/ForumReplyForm.tsx"),
      "utf8",
    );

    assert.match(source, /placeholder="Skriv ett svar\.\.\."/);
    assert.doesNotMatch(
      source,
      /Skriv ett lugnt, användbart svar/,
    );
  });
});
