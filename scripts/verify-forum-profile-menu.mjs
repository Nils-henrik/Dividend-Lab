/**
 * Targeted visual verification for the forum author profile menu.
 * Captures desktop + mobile widths requested by the corrective release.
 *
 * Usage:
 *   node scripts/verify-forum-profile-menu.mjs [baseUrl] [threadPath]
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
const threadPath = process.argv[3] ?? "/forum/demo-thread";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "tmp", "forum-profile-menu");

const viewports = [
  { name: "390", width: 390, height: 844 },
  { name: "412", width: 412, height: 915 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 800 },
];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });

    await page.goto(`${baseUrl}${threadPath}#forum-replies`, {
      waitUntil: "networkidle",
    });

    const authorGroups = page.locator(".group\\/forum-author");
    const count = await authorGroups.count();

    if (count === 0) {
      throw new Error(`No author menus found at ${threadPath}`);
    }

    const indexes = Array.from(
      new Set([0, Math.floor((count - 1) / 2), count - 1]),
    );

    for (const index of indexes) {
      const group = authorGroups.nth(index);

      if (viewport.width >= 1024) {
        await group.hover();
      } else {
        const trigger = group.locator('button[aria-haspopup="menu"]');
        await trigger.click();
      }

      const menu = page.locator('[role="menu"][aria-label^="Åtgärder för"]');
      await menu.waitFor({ state: "visible", timeout: 5000 });

      const box = await menu.boundingBox();
      if (!box) {
        throw new Error(`Menu bounding box missing at ${viewport.name}/${index}`);
      }

      const fullyVisible =
        box.x >= 0 &&
        box.y >= 0 &&
        box.x + box.width <= viewport.width + 1 &&
        box.y + box.height <= viewport.height + 1;

      if (!fullyVisible) {
        throw new Error(
          `Menu clipped at ${viewport.name} reply index ${index}: ${JSON.stringify(box)}`,
        );
      }

      const profil = menu.getByRole("menuitem", { name: "Profil" });
      await profil.waitFor({ state: "visible" });

      const file = join(
        outDir,
        `forum-profile-menu-${viewport.name}-reply-${index + 1}.png`,
      );
      await page.screenshot({ path: file, fullPage: false });
      results.push({ viewport: viewport.name, index, file, box });

      await page.keyboard.press("Escape");
      await menu.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
    }

    await page.close();
  }
} finally {
  await browser.close();
}

console.log(
  JSON.stringify(
    {
      ok: true,
      threadPath,
      screenshots: results,
    },
    null,
    2,
  ),
);
