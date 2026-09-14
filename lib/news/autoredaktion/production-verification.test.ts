import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAutoredaktionXCopy,
  canonicalArticleUrl,
  canonicalImageUrl,
  managedPrNumberFromMergeMessage,
  observeVercelStatus,
  seriesFromManagedArticlePath,
} from "./production-verification";

describe("Autoredaktion production verification policy", () => {
  it("recognizes only the managed merge message", () => {
    assert.equal(
      managedPrNumberFromMergeMessage(
        "Autoredaktion: merge managed publication PR #321\n\nManaged publication",
      ),
      321,
    );
    assert.equal(managedPrNumberFromMergeMessage("feat: ordinary merge (#321)"), null);
  });

  it("uses the latest exact Vercel commit status and never invents readiness", () => {
    assert.deepEqual(observeVercelStatus([]), {
      state: "missing",
      targetUrl: null,
    });
    assert.deepEqual(
      observeVercelStatus([
        {
          context: "Vercel",
          state: "pending",
          target_url: "https://vercel.example/old",
          updated_at: "2026-09-15T06:00:00Z",
        },
        {
          context: "Vercel",
          state: "success",
          target_url: "https://vercel.example/current",
          updated_at: "2026-09-15T06:01:00Z",
        },
      ]),
      {
        state: "success",
        targetUrl: "https://vercel.example/current",
      },
    );
    assert.equal(
      observeVercelStatus([
        {
          context: "Vercel",
          state: "error",
          updated_at: "2026-09-15T06:01:00Z",
        },
      ]).state,
      "failure",
    );
  });

  it("derives canonical article and image URLs without preview domains", () => {
    assert.equal(
      canonicalArticleUrl({ slug: "borssverige-15-september-2026" }),
      "https://divlab.se/news/borssverige-15-september-2026",
    );
    assert.equal(
      canonicalImageUrl({ imageUrl: "/news/generated/borssverige-2026-09-15.png" }),
      "https://divlab.se/news/generated/borssverige-2026-09-15.png",
    );
    assert.equal(canonicalImageUrl({ imageUrl: undefined }), null);
  });

  it("supports the next-day managed article paths", () => {
    assert.equal(
      seriesFromManagedArticlePath(
        "data/news-articles/norden-i-centrum-15-september-2026.ts",
      ),
      "norden-i-centrum",
    );
    assert.equal(
      seriesFromManagedArticlePath(
        "data/news-articles/borssverige-15-september-2026.ts",
      ),
      "borssverige",
    );
    assert.equal(seriesFromManagedArticlePath("data/news-articles/random.ts"), null);
  });

  it("builds compact X copy only after the live phase", () => {
    const text = buildAutoredaktionXCopy(
      {
        slug: "norden-i-centrum-15-september-2026",
        title: "Norden i centrum 15 september: nordiska bolag i fokus",
      },
      "norden-i-centrum",
    );
    assert.match(text, /#NordenICentrum/);
    assert.match(text, /https:\/\/divlab\.se\/news\/norden-i-centrum-15-september-2026/);
    assert.ok(text.length <= 280, `X copy too long: ${text.length}`);
  });
});
