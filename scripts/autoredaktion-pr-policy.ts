import { readFileSync } from "node:fs";

import {
  validateManagedPublicationPr,
  type ManagedPrSnapshot,
} from "@/lib/news/autoredaktion/pr-policy";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: tsx scripts/autoredaktion-pr-policy.ts <pr-json-file>");
  process.exit(2);
}

const snapshot = JSON.parse(readFileSync(inputPath, "utf8")) as ManagedPrSnapshot;
const result = validateManagedPublicationPr(snapshot);
if (!result.ok) {
  console.error(`AUTOREDAKTION PR POLICY FAIL: ${result.issues.join(", ")}`);
  process.exit(1);
}

console.log(
  `Autoredaktion PR policy PASS: ${result.series} ${result.date} -> ${result.expectedArticlePath}`,
);
