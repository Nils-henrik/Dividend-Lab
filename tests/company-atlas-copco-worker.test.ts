import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import type { CompanyIngestionJob } from "@/lib/companies/ingestion/queue";
import type { CompanyIngestionStore } from "@/lib/companies/ingestion/store";
import { loadAtlasCopcoPressReleaseDocuments, runAtlasCopcoIngestionJob } from "@/lib/companies/ingestion/workers/atlas-copco";

const JOB: CompanyIngestionJob = {
  id: "6bb70661-3c0b-4d3f-a0ce-cd03dd45f610",
  companyId: "fd31b206-b20a-4183-9e98-a5af9545c458",
  jobType: "initial_sync",
  attempts: 1,
};
const SOURCE_ID = "99970661-3c0b-4d3f-a0ce-cd03dd45f610";
const PRESS_URL =
  "https://www.atlascopcogroup.com/en/media-new/press-releases/20260827-verified";
const LISTING = `<a class="cmp-teaser__link" href="${PRESS_URL}"><p class="cmp-teaser__date">August 27 2026</p><h2 class="cmp-teaser__title">Verified Atlas Copco release</h2></a>`;

function testStore() {
  const calls: Array<{ operation: string; value?: unknown }> = [];
  const store: CompanyIngestionStore = {
    async loadOfficialSource(input) {
      calls.push({ operation: "source", value: input });
      return { status: "ok", source: { id: SOURCE_ID } };
    },
    async savePressReleases(input) {
      calls.push({ operation: "save", value: input });
      return true;
    },
    async markSourceChecked(sourceId, checkedAt) {
      calls.push({ operation: "checked", value: { sourceId, checkedAt } });
      return true;
    },
    async completeJob(job, completedAt) {
      calls.push({ operation: "complete", value: { job, completedAt } });
      return true;
    },
    async retryOrFailJob(job, reason, failedAt) {
      calls.push({ operation: "retry", value: { job, reason, failedAt } });
      return true;
    },
  };

  return { store, calls };
}

describe("Atlas Copco ingestion worker", () => {
  it("respekterar crawl-delay och sparar ett verifierat dokument idempotent", async () => {
    const { store, calls } = testStore();
    const urls: string[] = [];
    const delays: number[] = [];
    const fetchImpl = (async (input) => {
      const url = String(input);
      urls.push(url);
      return new Response(LISTING, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }) as typeof fetch;

    assert.deepEqual(
      await runAtlasCopcoIngestionJob(JOB, {
        store,
        fetchImpl,
        sleep: async (delay) => {
          delays.push(delay);
        },
        now: () => new Date("2026-09-22T12:00:00.000Z"),
      }),
      { status: "completed", savedDocuments: 1 },
    );
    assert.equal(urls.length, 2);
    assert.deepEqual(delays, []);
    assert.equal(urls[0]?.endsWith("/en/sitemap.xml"), true);
    assert.equal(urls[1]?.includes("/en/media-new/press-releases"), true);
    assert.deepEqual(
      calls.map((call) => call.operation),
      ["source", "save", "checked", "complete"],
    );
    const save = calls.find((call) => call.operation === "save")?.value as {
      documents: Array<{ title: string; sourceUrl: string }>;
    };
    assert.equal(save.documents[0].title, "Verified Atlas Copco release");
    assert.equal(save.documents[0].sourceUrl, PRESS_URL);
  });

  it("schemalägger om ett tillfälligt hämtningsfel utan databaslagring", async () => {
    const { store, calls } = testStore();
    const fetchImpl = (async () =>
      new Response("unavailable", {
        status: 503,
        headers: { "content-type": "text/plain" },
      })) as typeof fetch;

    assert.deepEqual(
      await runAtlasCopcoIngestionJob(JOB, {
        store,
        fetchImpl,
        now: () => new Date("2026-09-22T12:00:00.000Z"),
      }),
      { status: "retry_scheduled", reason: "listing_http_status" },
    );
    assert.deepEqual(
      calls.map((call) => call.operation),
      ["source", "retry"],
    );
  });

  it("markerar tredje misslyckade försöket som permanent fel", async () => {
    const { store } = testStore();
    const fetchImpl = (async () =>
      new Response("unavailable", {
        status: 503,
        headers: { "content-type": "text/plain" },
      })) as typeof fetch;

    assert.deepEqual(
      await runAtlasCopcoIngestionJob(
        { ...JOB, attempts: 3 },
        { store, fetchImpl },
      ),
      { status: "failed", reason: "listing_http_status" },
    );
  });

  it("fångar oväntade fel och lämnar jobbet för kontrollerad retry", async () => {
    const { store, calls } = testStore();
    store.loadOfficialSource = async () => {
      throw new Error("secret database detail");
    };

    assert.deepEqual(
      await runAtlasCopcoIngestionJob(JOB, { store }),
      { status: "retry_scheduled", reason: "worker_unexpected_error" },
    );
    assert.equal(calls.at(-1)?.operation, "retry");
    assert.doesNotMatch(JSON.stringify(calls), /secret database detail/);
  });

  it("hämtar högst fyra nya sitemap-träffar och hoppar över den äldre listningen", async () => {
    const urls: string[] = [];
    const delays: number[] = [];
    const sitemap = Array.from({ length: 6 }, (_, index) => {
      const day = String(20 - index).padStart(2, "0");
      return `<url><loc>https://www.atlascopcogroup.com/en/media/press-releases/2026/202609${day}-item</loc><lastmod>2026-09-${day}T00:00:00.000Z</lastmod></url>`;
    }).join("");
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.endsWith("/sitemap.xml")) {
        return new Response(`<urlset>${sitemap}</urlset>`, {
          headers: { "content-type": "text/xml" },
        });
      }
      return new Response(
        `<h1 class="cmp-title__text">${url.split("/").at(-1)}</h1><p class="cmp-pagedate">September 21, 2026</p>`,
        { headers: { "content-type": "text/html" } },
      );
    }) as typeof fetch;

    const loaded = await loadAtlasCopcoPressReleaseDocuments({
      fetchImpl,
      sleep: async (delay) => {
        delays.push(delay);
      },
    });

    assert.equal(loaded.status, "ok");
    assert.equal(loaded.status === "ok" ? loaded.documents.length : 0, 4);
    assert.equal(
      loaded.status === "ok" ? loaded.documents[0]?.sourceUrl.endsWith("/20260920-item") : false,
      true,
    );
    assert.equal(urls.filter((url) => url.includes("/2026/")).length, 4);
    assert.deepEqual(delays, [1000, 1000, 1000]);
    assert.equal(urls.some((url) => url.includes("/media-new/")), false);
  });

  it("behåller redan lästa detaljer när nästa fördröjning inte ryms", async () => {
    let details = 0;
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/sitemap.xml")) {
        return new Response(
          `<urlset><url><loc>https://www.atlascopcogroup.com/en/media/press-releases/2026/20260920-item</loc><lastmod>2026-09-20T00:00:00.000Z</lastmod></url><url><loc>https://www.atlascopcogroup.com/en/media/press-releases/2026/20260919-item</loc><lastmod>2026-09-19T00:00:00.000Z</lastmod></url></urlset>`,
          { headers: { "content-type": "text/xml" } },
        );
      }
      details += 1;
      return new Response(
        `<h1 class="cmp-title__text">Kept release</h1><p class="cmp-pagedate">September 20, 2026</p>`,
        { headers: { "content-type": "text/html" } },
      );
    }) as typeof fetch;

    const loaded = await loadAtlasCopcoPressReleaseDocuments({
      fetchImpl,
      sleep: async () => undefined,
      deadline: {
        remainingMs: () => 1_000,
        allowDelay: () => false,
        requestTimeoutMs: () => 1_000,
      },
    });

    assert.equal(loaded.status, "ok");
    assert.equal(loaded.status === "ok" ? loaded.documents.length : 0, 1);
    assert.equal(details, 1);
  });

  it("lagrar med unik bolags- och originallänk som idempotensnyckel", () => {
    const source = readFileSync(
      new URL("../lib/companies/ingestion/store.ts", import.meta.url),
      "utf8",
    );

    assert.match(source, /onConflict: "company_id,source_url"/);
    assert.match(source, /\.eq\("status", "processing"\)/);
    assert.doesNotMatch(source, /console\.(?:log|error)/);
  });
});
