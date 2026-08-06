import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Decimal from "decimal.js-light";
import {
  calculateGav,
  calculateTargetGav,
  parseSwedishDecimal,
} from "../lib/gav/calculate.ts";
import {
  buildGavCsv,
  escapeCsvCell,
  formatMoney,
} from "../lib/gav/format.ts";
import {
  createInitialGavState,
  parsePersistedGavState,
  sanitizePersistedGavState,
} from "../lib/gav/persistence.ts";
import type { GavEvent } from "../lib/gav/types.ts";

const opening = {
  enabled: false,
  quantity: "",
  gav: "",
};

function purchase(
  id: string,
  quantity: string,
  price: string,
  fee = "0",
): GavEvent {
  return { id, type: "purchase", date: "", quantity, price, fee };
}

function sale(
  id: string,
  quantity: string,
  price = "0",
  fee = "0",
): GavEvent {
  return { id, type: "sale", date: "", quantity, price, fee };
}

function split(
  id: string,
  oldUnits: string,
  newUnits: string,
  type: "split" | "reverseSplit" = "split",
): GavEvent {
  return { id, type, date: "", oldUnits, newUnits };
}

function calculate(events: GavEvent[]) {
  return calculateGav({ opening, events });
}

function requireSummary(result: ReturnType<typeof calculateGav>) {
  assert.ok(result.summary, JSON.stringify(result.errors));
  return result.summary;
}

describe("GAV calculation engine", () => {
  it("calculates a weighted average without fees", () => {
    const summary = requireSummary(
      calculate([
        purchase("one", "10", "100"),
        purchase("two", "20", "50"),
      ]),
    );

    assert.equal(summary.quantity.toString(), "30");
    assert.equal(summary.totalCostBasis.toString(), "2000");
    assert.equal(
      summary.gav?.toDecimalPlaces(12).toString(),
      "66.666666666667",
    );
  });

  it("includes purchase fees in cost basis", () => {
    const summary = requireSummary(
      calculate([
        purchase("one", "10", "100", "9"),
        purchase("two", "20", "50", "19"),
      ]),
    );

    assert.equal(summary.quantity.toString(), "30");
    assert.equal(summary.totalCostBasis.toString(), "2028");
    assert.equal(summary.gav?.toFixed(2), "67.60");
  });

  it("removes cost basis proportionally in a partial sale", () => {
    const result = calculateGav({
      opening: { enabled: true, quantity: "30", gav: "67,60" },
      events: [sale("sale", "12", "80")],
    });
    const summary = requireSummary(result);

    assert.equal(result.steps[0].disposedCostBasis?.toFixed(2), "811.20");
    assert.equal(summary.quantity.toString(), "18");
    assert.equal(summary.totalCostBasis.toFixed(2), "1216.80");
    assert.equal(summary.gav?.toFixed(2), "67.60");
  });

  it("deducts a sale fee from realized result", () => {
    const result = calculateGav({
      opening: { enabled: true, quantity: "30", gav: "67,60" },
      events: [sale("sale", "5", "80", "9")],
    });

    assert.equal(result.steps[0].netSaleProceeds?.toString(), "391");
    assert.equal(result.steps[0].disposedCostBasis?.toString(), "338");
    assert.equal(result.steps[0].realizedResult?.toString(), "53");
    assert.equal(requireSummary(result).realizedResult.toString(), "53");
  });

  it("applies an ordinary split without changing total cost basis", () => {
    const result = calculateGav({
      opening: { enabled: true, quantity: "30", gav: "67,60" },
      events: [split("split", "1", "2")],
    });
    const summary = requireSummary(result);

    assert.equal(summary.quantity.toString(), "60");
    assert.equal(summary.totalCostBasis.toString(), "2028");
    assert.equal(summary.gav?.toFixed(2), "33.80");
  });

  it("applies a reverse split without changing total cost basis", () => {
    const result = calculateGav({
      opening: { enabled: true, quantity: "30", gav: "67,60" },
      events: [split("reverse", "5", "1", "reverseSplit")],
    });
    const summary = requireSummary(result);

    assert.equal(summary.quantity.toString(), "6");
    assert.equal(summary.totalCostBasis.toString(), "2028");
    assert.equal(summary.gav?.toFixed(2), "338.00");
  });

  it("sets quantity and cost basis exactly to zero after a complete sale", () => {
    const result = calculateGav({
      opening: { enabled: true, quantity: "5", gav: "10" },
      events: [sale("all", "5", "12", "1")],
    });
    const summary = requireSummary(result);

    assert.equal(summary.quantity.toString(), "0");
    assert.equal(summary.totalCostBasis.toString(), "0");
    assert.equal(summary.gav, null);
    assert.equal(summary.realizedResult.toString(), "9");
  });

  it("omits every market metric after the complete holding is sold", () => {
    const result = calculateGav({
      opening: { enabled: true, quantity: "5", gav: "10" },
      events: [sale("all-with-market-inputs", "5", "12", "1")],
      currentPrice: "15",
      estimatedSaleFee: "9",
    });
    const summary = requireSummary(result);

    assert.equal(summary.quantity.toString(), "0");
    assert.equal(summary.totalCostBasis.toString(), "0");
    assert.equal(summary.gav, null);
    assert.equal(summary.realizedResult.toString(), "9");
    assert.equal(summary.marketValue, null);
    assert.equal(summary.unrealizedResult, null);
    assert.equal(summary.unrealizedPercent, null);
    assert.equal(summary.breakEvenPrice, null);
    assert.doesNotMatch(
      JSON.stringify(summary),
      /NaN|Infinity|"-0"/,
    );
  });

  it("calculates market comparison while a holding remains", () => {
    const result = calculateGav({
      opening: { enabled: true, quantity: "10", gav: "10" },
      events: [],
      currentPrice: "12",
      estimatedSaleFee: "5",
    });
    const summary = requireSummary(result);

    assert.equal(summary.quantity.toString(), "10");
    assert.equal(summary.marketValue?.toString(), "120");
    assert.equal(summary.unrealizedResult?.toString(), "15");
    assert.equal(summary.unrealizedPercent?.toString(), "15");
    assert.equal(summary.breakEvenPrice?.toString(), "10.5");
  });

  it("rejects a sale larger than the holding at that point", () => {
    const result = calculate([purchase("buy", "2", "10"), sale("sell", "3", "12")]);

    assert.equal(result.isValid, false);
    assert.equal(
      result.errors.sell.quantity,
      "Du kan inte sälja fler än du äger vid den här tidpunkten.",
    );
    assert.equal(result.summary, null);
  });

  it("rejects zero or negative quantities, fees and split values", () => {
    const invalidPurchase = calculate([
      purchase("zero", "0", "10"),
      purchase("fee", "1", "10", "-1"),
    ]);
    assert.equal(
      invalidPurchase.errors.zero.quantity,
      "Ange ett antal större än noll.",
    );
    assert.equal(
      invalidPurchase.errors.fee.fee,
      "Courtage kan inte vara negativt.",
    );

    const invalidSplit = calculateGav({
      opening: { enabled: true, quantity: "10", gav: "10" },
      events: [split("bad-split", "0", "-2")],
    });
    assert.equal(
      invalidSplit.errors["bad-split"].oldUnits,
      "Båda splitvärdena måste vara större än noll.",
    );
    assert.equal(
      invalidSplit.errors["bad-split"].newUnits,
      "Båda splitvärdena måste vara större än noll.",
    );
  });

  it("supports fractional fund units", () => {
    const summary = requireSummary(
      calculate([
        purchase("one", "1,25", "10"),
        purchase("two", "0,75", "20"),
      ]),
    );

    assert.equal(summary.quantity.toString(), "2");
    assert.equal(summary.totalCostBasis.toString(), "27.5");
    assert.equal(summary.gav?.toString(), "13.75");
  });

  it("uses the manually specified event order", () => {
    const result = calculate([
      purchase("first-buy", "10", "100"),
      sale("sale", "5", "150"),
      purchase("later-buy", "10", "50"),
    ]);
    const summary = requireSummary(result);

    assert.equal(summary.realizedResult.toString(), "250");
    assert.equal(summary.quantity.toString(), "15");
    assert.equal(
      summary.gav?.toDecimalPlaces(12).toString(),
      "66.666666666667",
    );
    assert.deepEqual(
      result.steps.map((step) => step.eventId),
      ["first-buy", "sale", "later-buy"],
    );
  });

  it("retains full internal precision instead of feeding rounded GAV back", () => {
    const result = calculate([
      purchase("one", "1", "100"),
      purchase("two", "2", "50"),
      sale("three", "1", "80"),
    ]);

    const gavBeforeSale = result.steps[1].gav;
    const gavAfterSale = requireSummary(result).gav;
    assert.ok(gavBeforeSale);
    assert.ok(gavAfterSale);
    assert.equal(gavAfterSale.minus(gavBeforeSale).abs().lt("1e-35"), true);
    assert.notEqual(gavAfterSale.toString(), "66.67");
  });
});

describe("target GAV calculation", () => {
  it("calculates target GAV without a fee", () => {
    const result = calculateTargetGav({
      currentQuantity: "100",
      currentGav: "120",
      purchasePrice: "80",
      purchaseFee: "0",
      targetGav: "100",
      allowFractional: true,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.exactQuantity?.toString(), "100");
    assert.equal(result.resultingGav?.toString(), "100");
  });

  it("rounds whole units upward and recalculates the actual GAV", () => {
    const result = calculateTargetGav({
      currentQuantity: "100",
      currentGav: "120",
      purchasePrice: "80",
      purchaseFee: "19",
      targetGav: "100",
      allowFractional: false,
    });

    assert.equal(result.exactQuantity?.toString(), "100.95");
    assert.equal(result.quantityToBuy?.toString(), "101");
    assert.equal(
      result.resultingGav?.toDecimalPlaces(10).toString(),
      "99.9950248756",
    );
  });

  it("supports averaging up", () => {
    const result = calculateTargetGav({
      currentQuantity: "100",
      currentGav: "80",
      purchasePrice: "120",
      purchaseFee: "0",
      targetGav: "100",
      allowFractional: true,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.quantityToBuy?.toString(), "100");
    assert.equal(result.resultingGav?.toString(), "100");
  });

  it("rejects a zero denominator and targets outside the interval", () => {
    const equalPurchasePrice = calculateTargetGav({
      currentQuantity: "10",
      currentGav: "120",
      purchasePrice: "100",
      purchaseFee: "0",
      targetGav: "100",
      allowFractional: false,
    });
    const outside = calculateTargetGav({
      currentQuantity: "10",
      currentGav: "120",
      purchasePrice: "80",
      purchaseFee: "0",
      targetGav: "130",
      allowFractional: false,
    });

    assert.equal(equalPurchasePrice.isValid, false);
    assert.match(equalPurchasePrice.errors.targetGav, /måste ligga mellan/);
    assert.equal(outside.isValid, false);
    assert.match(outside.errors.targetGav, /måste ligga mellan/);
  });
});

describe("Swedish number handling and safe output", () => {
  it("accepts decimal comma, decimal point and Swedish grouping spaces", () => {
    assert.equal(parseSwedishDecimal("1234,56")?.toString(), "1234.56");
    assert.equal(parseSwedishDecimal("1234.56")?.toString(), "1234.56");
    assert.equal(parseSwedishDecimal("1 234,56")?.toString(), "1234.56");
    assert.equal(parseSwedishDecimal("1\u00a0234,56")?.toString(), "1234.56");
    assert.equal(parseSwedishDecimal("1\u202f234,56")?.toString(), "1234.56");
  });

  it("rejects malformed mixed separators", () => {
    assert.equal(parseSwedishDecimal("1.234,56"), null);
    assert.equal(parseSwedishDecimal("12 34,56"), null);
    assert.equal(parseSwedishDecimal("1,2,3"), null);
  });

  it("never formats negative zero, NaN or Infinity", () => {
    assert.equal(formatMoney(new Decimal("-0.0001")), "0,00 kr");
    const result = calculateTargetGav({
      currentQuantity: "10",
      currentGav: "100",
      purchasePrice: "100",
      purchaseFee: "0",
      targetGav: "100",
      allowFractional: false,
    });
    assert.equal(result.isValid, false);
    assert.equal(
      JSON.stringify(result),
      JSON.stringify(result).replace(/NaN|Infinity|-0(?=[,}\]])/g, ""),
    );
  });
});

describe("local persistence and CSV safety", () => {
  it("recovers from corrupted or old persisted data", () => {
    assert.equal(parsePersistedGavState("{broken"), null);
    assert.equal(
      sanitizePersistedGavState({ ...createInitialGavState(), version: 0 }),
      null,
    );
    assert.equal(
      sanitizePersistedGavState({
        ...createInitialGavState(),
        events: [
          createInitialGavState().events[0],
          createInitialGavState().events[0],
        ],
      }),
      null,
    );
    assert.ok(
      parsePersistedGavState(JSON.stringify(createInitialGavState())),
    );
  });

  it("escapes CSV cells and neutralizes spreadsheet formulas", () => {
    assert.equal(escapeCsvCell('Namn "A"'), '"Namn ""A"""');
    assert.equal(escapeCsvCell("=1+1", true), "\"'=1+1\"");
    assert.equal(escapeCsvCell("+SUM(A1)", true), "\"'+SUM(A1)\"");
    assert.equal(escapeCsvCell("-SUM(A1)", true), "\"'-SUM(A1)\"");
    assert.equal(escapeCsvCell("@CMD", true), "\"'@CMD\"");
  });

  it("exports UTF-8 BOM, Swedish headings, transactions and final summary", () => {
    const events = [
      purchase("one", "10", "100", "9"),
      purchase("two", "20", "50", "19"),
    ];
    const calculation = calculate(events);
    const csv = buildGavCsv({
      securityName: "=FORMEL",
      events,
      calculation,
    });

    assert.equal(csv.charCodeAt(0), 0xfeff);
    assert.match(csv, /Omkostnadsbelopp efter \(SEK\)/);
    assert.match(csv, /Slutresultat/);
    assert.match(csv, /"'=FORMEL"/);
    assert.equal(csv.split("\r\n").filter((line) => /"Köp"/.test(line)).length, 2);
  });
});
