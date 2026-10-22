import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import JsonLdScript from "../components/seo/JsonLd";
import { discussionForumPostingJsonLd } from "../lib/seo/json-ld";

// tsx uses the classic JSX transform with the application's preserve setting.
(globalThis as unknown as { React: typeof React }).React = React;

describe("JSON-LD HTML boundary", () => {
  it("keeps user-provided closing tags inside the structured-data script", () => {
    const injected = "</script><script>globalThis.auditProbe=1</script>";
    const data = discussionForumPostingJsonLd({
      title: injected,
      description: injected,
      path: "/forum/synthetic-audit",
      datePublished: "2026-10-22T00:00:00Z",
      authorName: injected,
      comments: [{ text: injected, datePublished: "2026-10-22T00:00:00Z" }],
    });
    const html = renderToStaticMarkup(React.createElement(JsonLdScript, { data }));
    assert.equal((html.match(/<script\b/gi) ?? []).length, 1);
    assert.equal((html.match(/<\/script\s*>/gi) ?? []).length, 1);
    const content = html.slice(html.indexOf(">") + 1, html.lastIndexOf("</script>"));
    assert.equal(content.includes("<"), false);
    assert.deepEqual(JSON.parse(content), data);
  });

  it("preserves valid Unicode and both single-object and array structured data", () => {
    for (const data of [{ name: "Årsrapport & <analys>" }, [{ name: "Sverige" }, { name: "世界" }]]) {
      const html = renderToStaticMarkup(React.createElement(JsonLdScript, { data }));
      const content = html.slice(html.indexOf(">") + 1, html.lastIndexOf("</script>"));
      assert.deepEqual(JSON.parse(content), data);
    }
  });
});
