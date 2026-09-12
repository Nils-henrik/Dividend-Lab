import { runAutoredaktionDryRun } from "@/lib/news/autoredaktion/dry-run";

const report = runAutoredaktionDryRun();

for (const result of report.cases) {
  const mark = result.ok ? "PASS" : "FAIL";
  console.log(`${mark} ${result.id} ${result.name}: ${result.actual}`);
}

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  process.exitCode = 1;
}
