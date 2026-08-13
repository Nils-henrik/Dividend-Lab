import assert from "node:assert/strict";
import test from "node:test";
import { formatUniqueReaderLabel } from "../lib/content-readers/types";

test("formats Swedish unique reader labels", () => {
  assert.equal(formatUniqueReaderLabel(0), "0 unika läsare");
  assert.equal(formatUniqueReaderLabel(1), "1 unik läsare");
  assert.equal(formatUniqueReaderLabel(2), "2 unika läsare");
  assert.equal(formatUniqueReaderLabel(-1), "0 unika läsare");
});
