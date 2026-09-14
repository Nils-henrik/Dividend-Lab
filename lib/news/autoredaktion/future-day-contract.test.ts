import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTOREDAKTION_PR_LABEL,
  AUTOREDAKTION_PR_MARKER,
  validateManagedPublicationPr,
} from "./pr-policy";

describe("future-day managed release fixture", () => {
  it("accepts a canonical 15 September BörsSverige publication shape before a live run", () => {
    const result = validateManagedPublicationPr({
      number: 1509,
      state: "OPEN",
      isDraft: true,
      headRefName: "autoredaktion/borssverige-2026-09-15",
      baseRefName: "main",
      headRefOid: "futureday123",
      body: `${AUTOREDAKTION_PR_MARKER}\nFuture-day contract fixture`,
      labels: [{ name: AUTOREDAKTION_PR_LABEL }],
      files: [
        { path: "data/news-articles/borssverige-15-september-2026.ts" },
        { path: "lib/news/get-articles.ts" },
        { path: "public/news/generated/borssverige-2026-09-15.png" },
      ],
      commits: [
        { messageHeadline: "news: BörsSverige 15 september 2026" },
        {
          messageHeadline:
            "chore(autoredaktion): [autoredaktion-prepared] normalize article and render cover",
        },
      ],
    });

    assert.equal(result.ok, true, result.issues.join(", "));
    assert.equal(
      result.expectedArticlePath,
      "data/news-articles/borssverige-15-september-2026.ts",
    );
    assert.equal(
      result.expectedImagePath,
      "public/news/generated/borssverige-2026-09-15.png",
    );
  });

  it("accepts a canonical 15 September Norden publication without an image fallback", () => {
    const result = validateManagedPublicationPr({
      number: 1510,
      state: "OPEN",
      isDraft: true,
      headRefName: "autoredaktion/norden-i-centrum-2026-09-15",
      baseRefName: "main",
      headRefOid: "futureday456",
      body: `${AUTOREDAKTION_PR_MARKER}\nFuture-day contract fixture`,
      labels: [{ name: AUTOREDAKTION_PR_LABEL }],
      files: [
        { path: "data/news-articles/norden-i-centrum-15-september-2026.ts" },
        { path: "lib/news/get-articles.ts" },
      ],
      commits: [{ messageHeadline: "news: Norden i centrum 15 september 2026" }],
    });

    assert.equal(result.ok, true, result.issues.join(", "));
  });
});
