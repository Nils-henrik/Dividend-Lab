import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  easterSunday,
  resolveCombinedMarketStatus,
  swedishExchangeHolidays,
  usExchangeHolidays,
  zonedWallTimeToUtc,
} from "./market-hours";

describe("model portfolio market hours", () => {
  it("reports Sweden open and US closed during Stockholm morning", () => {
    // 2026-08-10 Monday 10:00 Stockholm = 08:00 UTC
    const now = zonedWallTimeToUtc({ year: 2026, month: 8, day: 10 }, 10, 0, "Europe/Stockholm");
    const status = resolveCombinedMarketStatus(now);
    assert.equal(status.sweden.open, true);
    assert.equal(status.us.open, false);
    assert.equal(status.showPulse, true);
    assert.match(status.label, /LIVE · Sverige/);
    assert.match(status.label, /USA stängt/);
  });

  it("reports Sweden closed on a holiday while US opens later", () => {
    // Midsummer Eve 2026-06-19 (Friday) at 10:00 Stockholm — SE closed, US not yet open
    const holidays = swedishExchangeHolidays(2026);
    assert.equal(holidays.get("2026-06-19"), "Midsommarafton");

    const now = zonedWallTimeToUtc({ year: 2026, month: 6, day: 19 }, 10, 0, "Europe/Stockholm");
    const status = resolveCombinedMarketStatus(now);
    assert.equal(status.sweden.open, false);
    assert.equal(status.us.open, false);
    assert.equal(status.showPulse, false);
    assert.match(status.label, /Sverige stängt/);
    assert.match(status.label, /USA öppnar/);
  });

  it("reports Sweden open while US is on holiday", () => {
    // Thanksgiving 2026-11-26 — US closed; Sweden open at 15:00 Stockholm
    const usHolidays = usExchangeHolidays(2026);
    assert.equal(usHolidays.get("2026-11-26"), "Thanksgiving");

    const now = zonedWallTimeToUtc({ year: 2026, month: 11, day: 26 }, 15, 0, "Europe/Stockholm");
    const status = resolveCombinedMarketStatus(now);
    assert.equal(status.sweden.open, true);
    assert.equal(status.us.open, false);
    assert.equal(status.showPulse, true);
    assert.match(status.label, /LIVE · Sverige/);
    assert.match(status.label, /USA stängt/);
  });

  it("reports both markets open in the Stockholm afternoon overlap", () => {
    // 2026-08-10 Monday 16:00 Stockholm ≈ 10:00 New York (EDT, UTC-4)
    const now = zonedWallTimeToUtc({ year: 2026, month: 8, day: 10 }, 16, 0, "Europe/Stockholm");
    const status = resolveCombinedMarketStatus(now);
    assert.equal(status.sweden.open, true);
    assert.equal(status.us.open, true);
    assert.equal(status.bothOpen, true);
    assert.equal(status.label, "LIVE · Sverige + USA");
    assert.equal(status.showPulse, true);
  });

  it("handles DST mismatch weeks via timezone rules", () => {
    // Week of 2026-03-09: US already on EDT, Europe still CET until Mar 29.
    // 15:30 Stockholm CET = 14:30 UTC = 10:30 EDT → US open, Sweden still open until 17:30.
    const duringOverlap = zonedWallTimeToUtc(
      { year: 2026, month: 3, day: 10 },
      15,
      45,
      "Europe/Stockholm",
    );
    const overlap = resolveCombinedMarketStatus(duringOverlap);
    assert.equal(overlap.sweden.open, true);
    assert.equal(overlap.us.open, true);

    // 22:15 Stockholm during DST-mismatch week: Sweden closed, US still open until 22:00 Stockholm? 
    // US closes 16:00 EDT = 20:00 UTC = 21:00 CET. So 21:30 Stockholm → both closed.
    const afterUsClose = zonedWallTimeToUtc(
      { year: 2026, month: 3, day: 10 },
      21,
      30,
      "Europe/Stockholm",
    );
    const closed = resolveCombinedMarketStatus(afterUsClose);
    assert.equal(closed.sweden.open, false);
    assert.equal(closed.us.open, false);
    assert.equal(closed.showPulse, false);

    // Just after US open during mismatch: 15:35 Stockholm should show US live
    const usJustOpen = zonedWallTimeToUtc(
      { year: 2026, month: 3, day: 10 },
      15,
      35,
      "Europe/Stockholm",
    );
    const usLive = resolveCombinedMarketStatus(usJustOpen);
    assert.equal(usLive.us.open, true);
    // During CET, US 09:30 EDT = 14:30 UTC = 15:30 CET
    assert.equal(usLive.sweden.open, true);
  });

  it("reports weekend as both closed", () => {
    const saturday = zonedWallTimeToUtc({ year: 2026, month: 8, day: 8 }, 12, 0, "Europe/Stockholm");
    const status = resolveCombinedMarketStatus(saturday);
    assert.equal(status.sweden.open, false);
    assert.equal(status.us.open, false);
    assert.equal(status.anyOpen, false);
    assert.equal(status.showPulse, false);
    assert.match(status.label, /stängd|öppnar/i);
  });

  it("computes movable Easter holidays deterministically", () => {
    // Known Easter Sundays
    assert.deepEqual(easterSunday(2026), { year: 2026, month: 4, day: 5 });
    assert.deepEqual(easterSunday(2027), { year: 2027, month: 3, day: 28 });
    const se = swedishExchangeHolidays(2026);
    assert.equal(se.get("2026-04-03"), "Långfredagen");
    assert.equal(se.get("2026-04-06"), "Annandag påsk");
    assert.equal(se.get("2026-05-14"), "Kristi himmelsfärdsdag");
  });
});
