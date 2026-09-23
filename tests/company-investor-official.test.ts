import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseInvestorCeo,
  parseInvestorDividend,
  parseInvestorEvents,
  parseInvestorOwnership,
  parseInvestorPressReleases,
  parseInvestorReports,
} from "../lib/companies/investor-official";

describe("Investor official source parsers", () => {
  it("parses press releases and events without inventing links", () => {
    const press = parseInvestorPressReleases('<div class="views-row"><span class="date-display-single">2026-09-16 14:01</span><a href="/press/1">A verified company press release</a></div>');
    const events = parseInvestorEvents('<div class="views-row"><div class="views-field-field-event-date-1"><span>2026-10-16</span></div><div class="views-field-title"><span class="field-content">Interim Management Statement</span></div></div>');
    assert.equal(press[0]?.date, "2026-09-16");
    assert.equal(press[0]?.title, "A verified company press release");
    assert.equal(events[0]?.date, "2026-10-16");
    assert.equal(events[0]?.title, "Interim Management Statement");
    assert.equal(events[0]?.url, "https://www.investorab.com/investors-media/events-calendar");
  });

  it("parses reports, ownership, CEO and dividend from official HTML", () => {
    const reports = parseInvestorReports('<a href="/media/q2.pdf">PDF Q2 Report</a>');
    const ownership = parseInvestorOwnership('Investor\'s ten largest shareholders as of 6/30 2026<table><tr><td>Owner</td><td>Shares</td><td>A</td><td>B</td><td>% of capital</td><td>% of votes</td></tr><tr><td>Verified Owner</td><td>10</td><td>5</td><td>5</td><td>20,07%</td><td>42,96%</td></tr></table>');
    const ceo = parseInvestorCeo('<h3 class="business-card__name">Christian Cederholm</h3><p>Chief Executive Officer</p>');
    const dividend = parseInvestorDividend('<p>Dividend to shareholders of SEK 5.60 per share.</p>');
    assert.equal(reports[0]?.url, "https://www.investorab.com/media/q2.pdf");
    assert.deepEqual(ownership.items[0], { owner: "Verified Owner", capitalPct: 20.07, votesPct: 42.96 });
    assert.equal(ownership.asOf, "2026-06-30");
    assert.equal(ceo, "Christian Cederholm");
    assert.equal(dividend, 5.6);
  });
});
