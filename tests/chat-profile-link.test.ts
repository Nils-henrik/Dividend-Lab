import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("open desktop chat profile navigation", () => {
  it("links the participant name to the existing username profile route", () => {
    const source = read("components/messages/chat/DesktopChatWindow.tsx");

    assert.match(source, /import Link from "next\/link"/);
    assert.match(
      source,
      /const username = conversation\?\.otherParticipant\?\.username \?\? null/,
    );
    assert.match(source, /href=\{`\/profile\/\$\{username\}`\}/);
    assert.match(source, /\{username \? \(/);
  });

  it("keeps a safe non-link fallback when the participant has no username", () => {
    const source = read("components/messages/chat/DesktopChatWindow.tsx");

    assert.match(
      source,
      /\) : \(\s*<p className="truncate text-sm font-semibold text-divlab-text">\{name\}<\/p>/,
    );
    assert.doesNotMatch(source, /\/profile\/undefined|\/profile\/null/);
  });
});
