import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergeNordicDeepResearchTargets,
  nordicSeedCoverage,
  NORDIC_RESEARCH_BOUNDS,
  NORDIC_SEED_UNIVERSE,
  normalizeNordicExchange,
  parseNordicYahooSymbol,
  selectBoundedNordicShortlist,
  toNordicYahooSymbol,
} from "./nordic-universe";

describe("Nordic universe and shortlist bounds", () => {
  it("covers Sweden, Norway, Finland and Denmark with large and mid caps", () => {
    const coverage = nordicSeedCoverage();
    assert.deepEqual(coverage.countries, ["SE", "NO", "FI", "DK"]);
    for (const country of coverage.countries) {
      assert.ok(coverage.byCountry[country].large_cap >= 4, `${country} large_cap`);
      assert.ok(coverage.byCountry[country].mid_cap >= 4, `${country} mid_cap`);
    }
    assert.ok(NORDIC_SEED_UNIVERSE.length >= 60);
    assert.ok(NORDIC_SEED_UNIVERSE.length <= NORDIC_RESEARCH_BOUNDS.broadDiscoveryCandidateCount);
  });

  it("normalizes Stockholm, Copenhagen, Helsinki and Oslo exchange aliases", () => {
    assert.equal(normalizeNordicExchange("XSTO"), "ST");
    assert.equal(normalizeNordicExchange("sto"), "ST");
    assert.equal(normalizeNordicExchange("CPH"), "CO");
    assert.equal(normalizeNordicExchange("XCSE"), "CO");
    assert.equal(normalizeNordicExchange("HEL"), "HE");
    assert.equal(normalizeNordicExchange("XHEL"), "HE");
    assert.equal(normalizeNordicExchange("OSL"), "OL");
    assert.equal(normalizeNordicExchange("XOSL"), "OL");
    assert.equal(normalizeNordicExchange("NYSE"), null);
    assert.equal(toNordicYahooSymbol("INVE-B", "STO"), "INVE-B.ST");
    assert.equal(toNordicYahooSymbol("EQNR", "OSL"), "EQNR.OL");
    assert.equal(toNordicYahooSymbol("NOVO-B", "CPH"), "NOVO-B.CO");
    assert.equal(toNordicYahooSymbol("NOKIA", "HEL"), "NOKIA.HE");
    assert.equal(toNordicYahooSymbol("DNB.OL", "OL"), "DNB.OL");
    assert.equal(toNordicYahooSymbol("ATCO-A.ST", "ST"), "ATCO-A.ST");
    assert.equal(toNordicYahooSymbol("DNB.OL.OL", "OL"), "DNB.OL");
    assert.deepEqual(parseNordicYahooSymbol("VOLV-B.ST"), {
      symbol: "VOLV-B",
      exchange: "ST",
      country: "SE",
    });
  });

  it("keeps the Nordic shortlist bounded and country-balanced", () => {
    const ranked = NORDIC_SEED_UNIVERSE.map((seed, index) => ({
      symbol: seed.symbol,
      exchange: seed.exchange,
      country: seed.country,
      score: 100 - index,
    }));
    const shortlist = selectBoundedNordicShortlist(ranked, {
      shortlistLimit: NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount,
      perCountryMin: NORDIC_RESEARCH_BOUNDS.perCountryMinShortlist,
      perCountryMax: NORDIC_RESEARCH_BOUNDS.perCountryMaxShortlist,
    });

    assert.equal(shortlist.length, NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount);
    assert.ok(shortlist.length < NORDIC_SEED_UNIVERSE.length);

    const byCountry = { SE: 0, NO: 0, FI: 0, DK: 0 };
    for (const item of shortlist) byCountry[item.country] += 1;
    for (const country of ["SE", "NO", "FI", "DK"] as const) {
      assert.ok(byCountry[country] >= NORDIC_RESEARCH_BOUNDS.perCountryMinShortlist);
      assert.ok(byCountry[country] <= NORDIC_RESEARCH_BOUNDS.perCountryMaxShortlist);
    }

    // Deterministic: same input => same order/symbols.
    const again = selectBoundedNordicShortlist(ranked, {
      shortlistLimit: NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount,
    });
    assert.deepEqual(
      again.map((item) => `${item.symbol}.${item.exchange}`),
      shortlist.map((item) => `${item.symbol}.${item.exchange}`),
    );
  });

  it("always includes current holdings even when discovery ranking excludes them", () => {
    const shortlist = [
      { symbol: "INVE-B", exchange: "ST", held: false },
      { symbol: "EQNR", exchange: "OL", held: false },
    ];
    const holdings = [
      { symbol: "SINCH", exchange: "ST", held: true },
      { symbol: "BAVA", exchange: "CO", held: true },
    ];
    const merged = mergeNordicDeepResearchTargets(shortlist, holdings);
    const keys = merged.map((item) => `${item.symbol}.${item.exchange}`).sort();
    assert.deepEqual(keys, ["BAVA.CO", "EQNR.OL", "INVE-B.ST", "SINCH.ST"]);
    assert.equal(merged.find((item) => item.symbol === "SINCH")?.held, true);
    assert.equal(merged.find((item) => item.symbol === "BAVA")?.held, true);
  });

  it("exposes explicit deep-research and event bounds below the broad universe", () => {
    assert.ok(
      NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount <
        NORDIC_RESEARCH_BOUNDS.broadDiscoveryCandidateCount,
    );
    assert.ok(
      NORDIC_RESEARCH_BOUNDS.fundamentalsTargetCount <=
        NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount,
    );
    assert.ok(
      NORDIC_RESEARCH_BOUNDS.eventPrimarySourceTargetCount <=
        NORDIC_RESEARCH_BOUNDS.fundamentalsTargetCount,
    );
    assert.equal(NORDIC_RESEARCH_BOUNDS.cacheTtlMs, 2 * 60 * 60 * 1_000);
  });
});
