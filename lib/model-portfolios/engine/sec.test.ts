import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSecFilingUrl, parseRecentSecFilings, parseSecTickerDirectory } from "./sec";

describe("SEC primary-source adapter", () => {
  it("normalizes SEC ticker directory rows", () => {
    assert.deepEqual(
      parseSecTickerDirectory({
        "0": { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." },
        "1": { cik_str: "789019", ticker: "MSFT", title: "MICROSOFT CORP" },
      }),
      [
        { cik: "0000320193", ticker: "AAPL", title: "Apple Inc." },
        { cik: "0000789019", ticker: "MSFT", title: "MICROSOFT CORP" },
      ],
    );
  });

  it("keeps only investment-relevant recent filings and builds canonical archive URLs", () => {
    const filings = parseRecentSecFilings("0000320193", {
      filings: {
        recent: {
          accessionNumber: ["0000320193-26-000001", "0000320193-26-000002"],
          filingDate: ["2026-08-07", "2026-08-08"],
          reportDate: ["2026-06-30", ""],
          acceptanceDateTime: ["2026-08-07T16:00:00.000Z", "2026-08-08T16:00:00.000Z"],
          form: ["10-Q", "4"],
          primaryDocument: ["aapl-20260630.htm", "ownership.xml"],
          primaryDocDescription: ["Quarterly report", "Ownership"],
        },
      },
    });
    assert.equal(filings.length, 1);
    assert.equal(filings[0]?.form, "10-Q");
    assert.equal(
      filings[0]?.sourceUrl,
      "https://www.sec.gov/Archives/edgar/data/320193/000032019326000001/aapl-20260630.htm",
    );
  });

  it("builds archive URLs without leaking query credentials", () => {
    assert.equal(
      buildSecFilingUrl("0000789019", "0000789019-26-000010", "msft-20260630.htm"),
      "https://www.sec.gov/Archives/edgar/data/789019/000078901926000010/msft-20260630.htm",
    );
  });
});
