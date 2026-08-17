import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFollowConfirmationEmail,
  buildTradeEmail,
} from "../lib/model-portfolios/follower-email-template";

test("buildFollowConfirmationEmail links to the followed portfolio", () => {
  const email = buildFollowConfirmationEmail({
    portfolioName: "Medelrisk",
    portfolioSlug: "medelrisk",
    siteUrl: "https://divlab.se/",
  });

  assert.match(email.subject, /Medelrisk/);
  assert.match(email.html, /Portföljbevakning aktiverad/);
  assert.match(email.html, /https:\/\/divlab\.se\/portfolios\/medelrisk/);
  assert.match(email.text, /registrerade e-postadress/);
});

test("buildTradeEmail renders the executed trade and rationale", () => {
  const email = buildTradeEmail({
    portfolioName: "Högrisk",
    portfolioSlug: "hog-risk",
    siteUrl: "https://divlab.se",
    side: "buy",
    symbol: "ERIC-B",
    exchange: "ST",
    quantity: 12,
    executionPriceMinor: 8765,
    currency: "SEK",
    rationale: "Momentum och vinstrevideringar stödjer caset.",
  });

  assert.match(email.subject, /Nytt köp/);
  assert.match(email.html, /ERIC-B\.ST/);
  assert.match(email.html, />12</);
  assert.match(email.html, /Momentum och vinstrevideringar stödjer caset\./);
  assert.match(email.text, /Högrisk har köpt ERIC-B\.ST/);
});

test("buildTradeEmail escapes dynamic HTML content", () => {
  const email = buildTradeEmail({
    portfolioName: "Test <script>alert(1)</script>",
    portfolioSlug: "test",
    siteUrl: "https://divlab.se",
    side: "sell",
    symbol: "TEST",
    exchange: "ST",
    quantity: 1,
    executionPriceMinor: 10000,
    currency: "SEK",
    rationale: "Risk <b>ökade</b>.",
  });

  assert.doesNotMatch(email.html, /<script>/);
  assert.doesNotMatch(email.html, /<b>ökade<\/b>/);
  assert.match(email.html, /&lt;script&gt;/);
  assert.match(email.html, /Risk &lt;b&gt;ökade&lt;\/b&gt;\./);
});
