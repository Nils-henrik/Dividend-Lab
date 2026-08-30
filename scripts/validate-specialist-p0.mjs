import { spawnSync } from "node:child_process";

const commands = [
  [
    "npx",
    [
      "tsx",
      "--test",
      "tests/analysis-seb-fact-book-projection.test.ts",
      "tests/analysis-seb-fact-book-real-text-layer.test.ts",
      "tests/analysis-seb-release-real-shape.test.ts",
      "tests/analysis-seb-multisource-readiness.test.ts",
      "tests/divlab-bank-analysis.test.ts",
      "tests/divlab-bank-capital.test.ts",
      "tests/divlab-bank-funding.test.ts",
      "tests/divlab-bank-research.test.ts",
      "tests/analysis-investor-release-integration.test.ts",
      "tests/analysis-financial-specialist-shorthand.test.ts",
      "tests/analysis-specialist-readiness-canary-contract.test.ts",
      "tests/analysis-specialist-readiness-safety.test.ts",
      "tests/analysis-engine-dispatch.test.ts",
    ],
  ],
  ["npm", ["run", "lint"]],
  ["npm", ["run", "typecheck"]],
  ["npm", ["test"]],
  ["npm", ["run", "test:seo"]],
  ["npm", ["run", "test:divbrain"]],
  ["npm", ["run", "test:cursor-bridge"]],
  ["npm", ["run", "build"]],
];

for (const [command, args] of commands) {
  console.log(`\n[Specialist P0 validation] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
