import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const PUBLIC_STATIC_PAGES = [
  "app/about/page.tsx",
  "app/contact/page.tsx",
  "app/cookies/page.tsx",
  "app/disclaimer/page.tsx",
  "app/editorial/page.tsx",
  "app/features/page.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
] as const;

for (const relativePath of PUBLIC_STATIC_PAGES) {
  test(`${relativePath} relies on the root title template for the DivLab suffix`, () => {
    const source = readFileSync(resolve(process.cwd(), relativePath), "utf8");
    const metadataBlock = source.match(
      /export const metadata: Metadata = \{([\s\S]*?)\n\};/,
    )?.[1];

    assert.ok(metadataBlock, `Could not find static metadata in ${relativePath}`);

    const titleLine = metadataBlock
      .split("\n")
      .find((line) => /^  title:/.test(line));

    assert.ok(titleLine, `Could not find top-level metadata title in ${relativePath}`);
    assert.equal(
      titleLine.includes("| DivLab") || titleLine.includes("DIVLAB_BRAND_NAME"),
      false,
      `${relativePath} must not include the DivLab suffix before the root title template is applied`,
    );
  });
}
