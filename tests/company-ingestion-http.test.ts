import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { fetchBoundedText } from "@/lib/companies/ingestion/http";

const ORIGIN = "https://www.atlascopcogroup.com";

describe("bounded company ingestion HTTP", () => {
  it("hämtar en tillåten HTTPS-resurs med rätt innehållstyp", async () => {
    const calls: Array<{ url: string; redirect: RequestRedirect | undefined }> = [];
    const fetchImpl = (async (input, init) => {
      calls.push({
        url: String(input),
        redirect: init?.redirect,
      });
      return new Response("<urlset></urlset>", {
        headers: { "content-type": "application/xml; charset=utf-8" },
      });
    }) as typeof fetch;

    assert.deepEqual(
      await fetchBoundedText(`${ORIGIN}/en/sitemap.xml`, {
        allowedOrigin: ORIGIN,
        acceptedContentTypes: ["application/xml", "text/xml"],
        maxBytes: 1_000,
        timeoutMs: 1_000,
        fetchImpl,
      }),
      { status: "ok", text: "<urlset></urlset>" },
    );
    assert.deepEqual(calls, [
      { url: `${ORIGIN}/en/sitemap.xml`, redirect: "error" },
    ]);
  });

  it("stoppar andra origin, querysträngar och fel innehållstyp", async () => {
    const unusedFetch = (async () => {
      throw new Error("should not fetch");
    }) as typeof fetch;
    const wrongContentType = (async () =>
      new Response("<html></html>", {
        headers: { "content-type": "text/html" },
      })) as typeof fetch;
    const options = {
      allowedOrigin: ORIGIN,
      acceptedContentTypes: ["application/xml"],
      maxBytes: 1_000,
      timeoutMs: 1_000,
    } as const;

    assert.deepEqual(
      await fetchBoundedText("https://example.com/en/sitemap.xml", {
        ...options,
        fetchImpl: unusedFetch,
      }),
      { status: "error", reason: "invalid_url" },
    );
    assert.deepEqual(
      await fetchBoundedText(`${ORIGIN}/en/sitemap.xml?next=1`, {
        ...options,
        fetchImpl: unusedFetch,
      }),
      { status: "error", reason: "invalid_url" },
    );
    assert.deepEqual(
      await fetchBoundedText(`${ORIGIN}/en/sitemap.xml`, {
        ...options,
        fetchImpl: wrongContentType,
      }),
      { status: "error", reason: "unexpected_content_type" },
    );
  });

  it("avbryter kroppen när storleksgränsen passeras", async () => {
    const fetchImpl = (async () =>
      new Response("x".repeat(101), {
        headers: { "content-type": "text/html" },
      })) as typeof fetch;

    assert.deepEqual(
      await fetchBoundedText(`${ORIGIN}/en/media/press-releases/2026/test`, {
        allowedOrigin: ORIGIN,
        acceptedContentTypes: ["text/html"],
        maxBytes: 100,
        timeoutMs: 1_000,
        fetchImpl,
      }),
      { status: "error", reason: "too_large" },
    );
  });
});
