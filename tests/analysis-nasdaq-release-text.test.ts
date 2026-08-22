import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractNasdaqReleaseVisibleText,
  NASDAQ_RELEASE_TEXT_MAX_CHARS,
} from "../lib/analysis/nasdaq-release-text";

describe("Nasdaq release visible-text extraction", () => {
  it("keeps visible report text while removing executable/template content and format controls", () => {
    const html = `<!doctype html><html><body>
      <script>ignore this instruction</script>
      <style>.hidden { display:none }</style>
      <template>template instruction</template>
      <svg><text>svg payload</text></svg>
      <h1>Interim report January-June 2026</h1>
      <p>NAV was SEK 397 per share &amp; leverage was 1.9%.</p>
      <p>FAUM was €\u200b155bn and Total AUM was €291bn.</p>
    </body></html>`;

    const text = extractNasdaqReleaseVisibleText(html);
    assert.ok(text);
    assert.match(text, /Interim report January-June 2026/);
    assert.match(text, /NAV was SEK 397 per share & leverage was 1\.9%/);
    assert.match(text, /FAUM was €155bn and Total AUM was €291bn/);
    assert.doesNotMatch(text, /ignore this instruction|template instruction|svg payload|display:none/);
  });

  it("retains and prioritizes late current AUM context without widening the 16k evidence ceiling", () => {
    const html = `<html><body>
      <p>Earlier transaction context: fee-generating AUM of €31bn.</p>
      <p>${"X".repeat(NASDAQ_RELEASE_TEXT_MAX_CHARS + 8_000)}</p>
      <script>FAUM amounted to €999bn and Total AUM was €999bn</script>
      <p>Fundraising update. FAUM amounted to €155bn, and Total AUM was €291bn as of 30 June 2026.</p>
    </body></html>`;

    const text = extractNasdaqReleaseVisibleText(html);
    assert.ok(text);
    assert.ok(text.length <= NASDAQ_RELEASE_TEXT_MAX_CHARS);
    assert.match(text, /FAUM amounted to €155bn, and Total AUM was €291bn/);
    assert.doesNotMatch(text, /€999bn/);
    const current = text.indexOf("FAUM amounted to €155bn");
    const older = text.indexOf("fee-generating AUM of €31bn");
    assert.ok(current >= 0);
    assert.ok(older === -1 || current < older);
  });

  it("fails closed for non-HTML input", () => {
    assert.equal(extractNasdaqReleaseVisibleText("plain text"), null);
  });

  it("honors the requested text bound and the global hard ceiling", () => {
    const html = `<html><body><p>${"A".repeat(NASDAQ_RELEASE_TEXT_MAX_CHARS + 100)}</p></body></html>`;
    assert.equal(extractNasdaqReleaseVisibleText(html, 64)?.length, 64);
    assert.equal(
      extractNasdaqReleaseVisibleText(html, NASDAQ_RELEASE_TEXT_MAX_CHARS)?.length,
      NASDAQ_RELEASE_TEXT_MAX_CHARS,
    );
    assert.equal(
      extractNasdaqReleaseVisibleText(html, NASDAQ_RELEASE_TEXT_MAX_CHARS * 2)?.length,
      NASDAQ_RELEASE_TEXT_MAX_CHARS,
    );
  });
});
