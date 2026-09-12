import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { renderSeriesImage } from "@/lib/news/images";
import {
  BORSSVERIGE_TEMPLATE_V1,
  NORDEN_I_CENTRUM_TEMPLATE_V1,
} from "@/lib/news/images/templates";

const ROOT = process.cwd();
const REVIEW_DIR = path.join(ROOT, ".tmp", "autoredaktion-images", "review");

async function copyReference(source: string, targetName: string) {
  await copyFile(path.join(ROOT, source), path.join(REVIEW_DIR, targetName));
}

async function renderReview(
  targetName: string,
  input: Parameters<typeof renderSeriesImage>[0],
) {
  const result = await renderSeriesImage(input, { repoRoot: ROOT, mode: "dry-run" });
  if (result.status !== "generated" || !result.imagePath) {
    throw new Error(`${targetName}: ${result.validation.issues.join(", ")}`);
  }
  await copyFile(result.imagePath, path.join(REVIEW_DIR, targetName));
  return {
    targetName,
    templateVersion: result.templateVersion,
    companiesUsed: result.companiesUsed,
    missingCompanyLogos: result.missingCompanyLogos,
  };
}

async function main() {
  await mkdir(REVIEW_DIR, { recursive: true });
  await copyReference(BORSSVERIGE_TEMPLATE_V1.referencePath, "borssverige-reference-2026-09-04.png");
  await copyReference(NORDEN_I_CENTRUM_TEMPLATE_V1.referencePath, "norden-reference-2026-09-04.png");

  const results = [];
  results.push(
    await renderReview("borssverige-render-2026-09-14.png", {
      series: "borssverige",
      date: "2026-09-14",
      articleSlug: "visual-dry-run-borssverige",
      companies: ["Volvo", "Ericsson"],
    }),
  );

  const approved = ["Volvo", "Ericsson", "Investor", "H&M", "Microsoft"];
  for (let count = 1; count <= 5; count += 1) {
    const day = 13 + count;
    results.push(
      await renderReview(`norden-layout-${count}-logos.png`, {
        series: "norden-i-centrum",
        date: `2026-09-${String(day).padStart(2, "0")}`,
        articleSlug: `visual-dry-run-norden-${count}`,
        companies: approved.slice(0, count),
      }),
    );
  }

  results.push(
    await renderReview("norden-missing-logo.png", {
      series: "norden-i-centrum",
      date: "2026-09-19",
      articleSlug: "visual-dry-run-norden-missing",
      companies: ["Volvo", "Nokia"],
    }),
  );
  results.push(
    await renderReview("norden-no-logos.png", {
      series: "norden-i-centrum",
      date: "2026-09-20",
      articleSlug: "visual-dry-run-norden-none",
      companies: [],
    }),
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        reviewDir: path.relative(ROOT, REVIEW_DIR),
        files: [
          "borssverige-reference-2026-09-04.png",
          "borssverige-render-2026-09-14.png",
          "norden-reference-2026-09-04.png",
          "norden-layout-1-logos.png",
          "norden-layout-2-logos.png",
          "norden-layout-3-logos.png",
          "norden-layout-4-logos.png",
          "norden-layout-5-logos.png",
          "norden-missing-logo.png",
          "norden-no-logos.png",
        ],
        results,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
