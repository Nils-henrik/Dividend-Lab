import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { renderSeriesImage } from "@/lib/news/images";
import {
  calculateStaticRegionDiff,
  writeStaticRegionDiffImage,
} from "@/lib/news/images/static-regression";
import {
  BORSSVERIGE_TEMPLATE_V2,
  NORDEN_I_CENTRUM_TEMPLATE_V2,
  type SeriesImageTemplate,
} from "@/lib/news/images/templates";
import { SERIES_IMAGE_HEIGHT, SERIES_IMAGE_WIDTH } from "@/lib/news/images/types";

const ROOT = process.cwd();
const REVIEW_DIR = path.join(ROOT, ".tmp", "autoredaktion-images", "review-v2");
const REFERENCES_DIR = path.join(REVIEW_DIR, "references");
const RENDERS_DIR = path.join(REVIEW_DIR, "renders");
const DIFFS_DIR = path.join(REVIEW_DIR, "diffs");

async function ensureDirectories() {
  await Promise.all([
    mkdir(REFERENCES_DIR, { recursive: true }),
    mkdir(RENDERS_DIR, { recursive: true }),
    mkdir(DIFFS_DIR, { recursive: true }),
  ]);
}

async function copyReference(source: string, targetName: string) {
  await copyFile(path.join(ROOT, source), path.join(REFERENCES_DIR, targetName));
}

async function writeResizedReference(source: string, targetName: string) {
  await sharp(path.join(ROOT, source))
    .resize(SERIES_IMAGE_WIDTH, SERIES_IMAGE_HEIGHT, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(RENDERS_DIR, targetName));
}

async function renderReview(
  targetName: string,
  input: Parameters<typeof renderSeriesImage>[0],
) {
  const result = await renderSeriesImage(input, { repoRoot: ROOT, mode: "dry-run" });
  if (result.status !== "generated" || !result.imagePath) {
    throw new Error(`${targetName}: ${result.validation.issues.join(", ")}`);
  }
  const target = path.join(RENDERS_DIR, targetName);
  await copyFile(result.imagePath, target);
  return {
    targetName,
    target,
    templateVersion: result.templateVersion,
    companiesUsed: result.companiesUsed,
    missingCompanyLogos: result.missingCompanyLogos,
  };
}

function dynamicRegions(template: SeriesImageTemplate) {
  return [
    template.dynamicRegions.date,
    ...(template.dynamicRegions.companyRow ? [template.dynamicRegions.companyRow] : []),
  ];
}

async function writeDiff(
  targetName: string,
  renderPath: string,
  template: SeriesImageTemplate,
) {
  const referencePath = path.join(ROOT, template.referencePath);
  const target = path.join(DIFFS_DIR, targetName);
  await writeStaticRegionDiffImage(
    renderPath,
    referencePath,
    dynamicRegions(template),
    target,
  );
  return calculateStaticRegionDiff(
    renderPath,
    referencePath,
    dynamicRegions(template),
    template.staticRegression,
  );
}

async function main() {
  await ensureDirectories();
  await copyReference(BORSSVERIGE_TEMPLATE_V2.referencePath, "borssverige-reference.png");
  await copyReference(NORDEN_I_CENTRUM_TEMPLATE_V2.referencePath, "norden-reference.png");

  // Nearby published editions are review evidence for the established dynamic
  // zones. They are copied only into the CI artifact and are never templates or
  // production outputs themselves.
  await Promise.all([
    copyReference(
      "public/news-demo/borssverige-2026-09-01.png",
      "borssverige-reference-2026-09-01.png",
    ),
    copyReference(
      "public/news-demo/norden-i-centrum-2026-09-03.png",
      "norden-reference-2026-09-03.png",
    ),
    copyReference(
      "public/news-demo/norden-i-centrum-2026-09-02.png",
      "norden-reference-2026-09-02.png",
    ),
    copyReference(
      "public/news-demo/norden-i-centrum-2026-09-01.png",
      "norden-reference-2026-09-01.png",
    ),
  ]);

  // Canonical reference reproduction at the fixed social-image dimensions.
  await writeResizedReference(
    NORDEN_I_CENTRUM_TEMPLATE_V2.referencePath,
    "norden-canonical-reference-reproduction.png",
  );

  const results = [];
  const bs04 = await renderReview("borssverige-date-04.png", {
    series: "borssverige",
    date: "2026-09-04",
    articleSlug: "visual-v2-borssverige-04",
    companies: ["Volvo", "Ericsson"],
  });
  const bs14 = await renderReview("borssverige-date-14.png", {
    series: "borssverige",
    date: "2026-09-14",
    articleSlug: "visual-v2-borssverige-14",
    companies: ["Volvo", "Ericsson"],
  });
  const bs30 = await renderReview("borssverige-date-30.png", {
    series: "borssverige",
    date: "2026-09-30",
    articleSlug: "visual-v2-borssverige-30",
  });
  results.push(bs04, bs14, bs30);

  const approved = ["Volvo", "Ericsson", "Investor", "H&M"];
  for (let count = 1; count <= 4; count += 1) {
    results.push(
      await renderReview(`norden-${count}-logo${count === 1 ? "" : "s"}.png`, {
        series: "norden-i-centrum",
        date: `2026-09-${String(13 + count).padStart(2, "0")}`,
        articleSlug: `visual-v2-norden-${count}`,
        companies: approved.slice(0, count),
      }),
    );
  }

  const nordenMax = await renderReview("norden-max-logos.png", {
    series: "norden-i-centrum",
    date: "2026-09-18",
    articleSlug: "visual-v2-norden-max",
    companies: [...approved, "Microsoft"],
  });
  const nordenNoLogos = await renderReview("norden-no-logos.png", {
    series: "norden-i-centrum",
    date: "2026-09-19",
    articleSlug: "visual-v2-norden-none",
    companies: [],
  });
  const nordenMissing = await renderReview("norden-missing-logo.png", {
    series: "norden-i-centrum",
    date: "2026-09-20",
    articleSlug: "visual-v2-norden-missing",
    companies: ["Volvo", "Nokia", "Ericsson"],
  });
  results.push(nordenMax, nordenNoLogos, nordenMissing);

  const borsDiff = await writeDiff(
    "borssverige-static-region-diff.png",
    bs14.target,
    BORSSVERIGE_TEMPLATE_V2,
  );
  const nordenFour = results.find((result) => result.targetName === "norden-4-logos.png");
  if (!nordenFour) throw new Error("missing-norden-four-logo-review-render");
  const nordenDiff = await writeDiff(
    "norden-static-region-diff.png",
    nordenFour.target,
    NORDEN_I_CENTRUM_TEMPLATE_V2,
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        reviewDir: path.relative(ROOT, REVIEW_DIR),
        staticRegression: {
          borssverige: borsDiff,
          norden: nordenDiff,
        },
        results: results.map((result) => ({
          targetName: result.targetName,
          templateVersion: result.templateVersion,
          companiesUsed: result.companiesUsed,
          missingCompanyLogos: result.missingCompanyLogos,
        })),
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
