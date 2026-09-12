import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

import type { NewsArticle } from "@/types/news";

import { renderSeriesImage, renderSeriesImageSafe } from "./render-series-image";
import {
  MAX_NORDEN_LOGOS,
  normalizeRequestedCompanies,
  selectNordenCompanies,
} from "./select-norden-companies";
import { calculateStaticRegionDiff, staticRegionDiffPasses } from "./static-regression";
import { getSeriesImageTemplate } from "./templates";
import {
  SERIES_IMAGE_FORMAT,
  SERIES_IMAGE_HEIGHT,
  SERIES_IMAGE_WIDTH,
  type SeriesImageRenderMetadata,
} from "./types";
import { validateGeneratedSeriesImage } from "./validate-generated-image";

function article(overrides: Partial<NewsArticle> = {}): NewsArticle {
  return {
    id: "norden-test",
    slug: "norden-test",
    title: "Volvo i centrum medan Ericsson stärker utsikterna",
    summary: "Investor följer Volvo och Ericsson under morgonen.",
    category: "market",
    source: "DivLab",
    publishedAt: "2026-09-14T08:00:00+02:00",
    url: "/news/norden-test",
    featured: false,
    seoTitle: "Norden test",
    seoDescription: "Test",
    seoKeywords: ["Norden"],
    intro: ["H&M nämns i introduktionen medan Investor följer utvecklingen."],
    sections: [
      { heading: "Volvo leder", paragraphs: ["Ericsson och Investor följer Volvo."] },
    ],
    internalLinking: {
      companies: ["Investor", "Ericsson", "Volvo", "H&M", "Nokia"],
    },
    ...overrides,
  };
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function dynamicRegions(series: "borssverige" | "norden-i-centrum") {
  const template = getSeriesImageTemplate(series);
  return [
    template.dynamicRegions.date,
    ...(template.dynamicRegions.companyRow ? [template.dynamicRegions.companyRow] : []),
  ];
}

test("Norden company selection is deterministic and editorially weighted", () => {
  const first = selectNordenCompanies(article());
  const second = selectNordenCompanies(article());
  assert.deepEqual(first, second);
  assert.equal(first.requestedCompanies[0], "Volvo");
  assert.equal(first.requestedCompanies.length, MAX_NORDEN_LOGOS);
  assert.ok(first.companiesUsed.includes("Volvo"));
});

test("company normalization dedupes and follows the four-logo reference maximum", () => {
  const result = normalizeRequestedCompanies([
    "Volvo",
    "volvo",
    "Ericsson",
    "Investor",
    "H&M",
    "Microsoft",
    "Apple",
  ]);
  assert.equal(MAX_NORDEN_LOGOS, 4);
  assert.deepEqual(result, ["Volvo", "Ericsson", "Investor", "H&M"]);
});

test("BörsSverige ignores companies and renders a valid 1280x720 PNG", async () => {
  const result = await renderSeriesImage({
    series: "borssverige",
    date: "2026-09-14",
    articleSlug: "borssverige-test",
    companies: ["Volvo", "Ericsson"],
  });
  assert.equal(result.status, "generated");
  assert.deepEqual(result.companiesUsed, []);
  assert.deepEqual(result.metadata?.requestedCompanies, []);
  assert.equal(result.width, 1280);
  assert.equal(result.height, 720);
  assert.equal(result.format, "png");
});

test("BörsSverige different-width date stays inside the date-only template", async () => {
  const result = await renderSeriesImage({
    series: "borssverige",
    date: "2026-09-30",
    articleSlug: "borssverige-wide-date",
  });
  assert.equal(result.status, "generated");
  assert.ok(result.imagePath);
  const template = getSeriesImageTemplate("borssverige");
  const diff = await calculateStaticRegionDiff(
    result.imagePath!,
    path.join(process.cwd(), template.referencePath),
    dynamicRegions("borssverige"),
    template.staticRegression,
  );
  assert.equal(staticRegionDiffPasses(diff, template.staticRegression), true);
});

test("missing Norden logo is traced and skipped without blocking the image", async () => {
  const result = await renderSeriesImage({
    series: "norden-i-centrum",
    date: "2026-09-14",
    articleSlug: "norden-missing-logo",
    companies: ["Volvo", "Nokia"],
  });
  assert.equal(result.status, "generated");
  assert.deepEqual(result.companiesUsed, ["Volvo"]);
  assert.deepEqual(result.missingCompanyLogos, ["Nokia"]);
});

test("wrong 1279x720 image fails image validation", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "divlab-image-test-"));
  try {
    const outputPath = path.join(temp, "norden-i-centrum-2026-09-14.png");
    await sharp({
      create: { width: 1279, height: 720, channels: 4, background: "#071426" },
    })
      .png()
      .toFile(outputPath);
    const template = getSeriesImageTemplate("norden-i-centrum");
    const metadata: SeriesImageRenderMetadata = {
      series: "norden-i-centrum",
      date: "2026-09-14",
      articleSlug: "wrong-size",
      templateVersion: template.templateVersion,
      requestedCompanies: [],
      companiesUsed: [],
      missingCompanyLogos: [],
      outputPath,
      publicPath: "/news/generated/norden-i-centrum-2026-09-14.png",
      width: SERIES_IMAGE_WIDTH,
      height: SERIES_IMAGE_HEIGHT,
      format: SERIES_IMAGE_FORMAT,
      canonicalDivLabLogoSource: template.canonicalDivLabLogoSource,
    };
    const validation = await validateGeneratedSeriesImage(metadata, { repoRoot: process.cwd() });
    assert.equal(validation.ok, false);
    assert.ok(validation.issues.includes("image-dimensions"));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test("declared output path without a file fails closed", async () => {
  const template = getSeriesImageTemplate("borssverige");
  const metadata: SeriesImageRenderMetadata = {
    series: "borssverige",
    date: "2026-09-14",
    articleSlug: "missing-output",
    templateVersion: template.templateVersion,
    requestedCompanies: [],
    companiesUsed: [],
    missingCompanyLogos: [],
    outputPath: path.join(os.tmpdir(), "does-not-exist", "borssverige-2026-09-14.png"),
    publicPath: "/news/generated/borssverige-2026-09-14.png",
    width: SERIES_IMAGE_WIDTH,
    height: SERIES_IMAGE_HEIGHT,
    format: SERIES_IMAGE_FORMAT,
    canonicalDivLabLogoSource: template.canonicalDivLabLogoSource,
  };
  const validation = await validateGeneratedSeriesImage(metadata);
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.includes("output-missing"));
});

test("article/image Stockholm date mismatch fails", async () => {
  const result = await renderSeriesImage(
    {
      series: "borssverige",
      date: "2026-09-14",
      articleSlug: "date-mismatch",
    },
    { publishedAt: "2026-09-15T08:20:00+02:00" },
  );
  assert.equal(result.status, "failed");
  assert.ok(result.validation.issues.includes("image-date-mismatch"));
});

test("renderer exception returns safe failed result with no path", async () => {
  const result = await renderSeriesImageSafe(
    {
      series: "norden-i-centrum",
      date: "2026-09-14",
      articleSlug: "renderer-exception",
      companies: ["Volvo"],
    },
    { throwBeforeRender: true },
  );
  assert.equal(result.status, "failed");
  assert.equal(result.imagePath, null);
  assert.equal(result.publicPath, null);
});

test("rerun is deterministic and reuses the canonical output path", async () => {
  const input = {
    series: "borssverige" as const,
    date: "2026-09-14",
    articleSlug: "rerun-test",
  };
  const first = await renderSeriesImage(input);
  assert.equal(first.status, "generated");
  assert.ok(first.imagePath);
  const firstBytes = await readFile(first.imagePath!);

  const second = await renderSeriesImage(input);
  assert.equal(second.status, "generated");
  assert.equal(second.imagePath, first.imagePath);
  const secondBytes = await readFile(second.imagePath!);
  assert.equal(sha256(firstBytes), sha256(secondBytes));
});

test("Norden four-logo output follows the reference row maximum", async () => {
  await mkdir(path.join(process.cwd(), ".tmp", "autoredaktion-images"), { recursive: true });
  const result = await renderSeriesImage({
    series: "norden-i-centrum",
    date: "2026-09-18",
    articleSlug: "four-logo-layout",
    companies: ["Volvo", "Ericsson", "Investor", "H&M", "Microsoft"],
  });
  assert.equal(result.status, "generated");
  assert.equal(result.companiesUsed.length, 4);
  assert.equal(result.width, SERIES_IMAGE_WIDTH);
  assert.equal(result.height, SERIES_IMAGE_HEIGHT);
});

test("masked regression rejects a changed static block outside the dynamic zones", async () => {
  const rendered = await renderSeriesImage({
    series: "borssverige",
    date: "2026-09-14",
    articleSlug: "static-regression-negative",
  });
  assert.equal(rendered.status, "generated");
  assert.ok(rendered.imagePath && rendered.metadata);

  const temp = await mkdtemp(path.join(os.tmpdir(), "divlab-static-regression-"));
  try {
    const outputPath = path.join(temp, "borssverige-2026-09-14.png");
    await copyFile(rendered.imagePath!, outputPath);
    const input = await sharp(outputPath).ensureAlpha().raw().toBuffer();
    // 32x32 = 1024 static pixels, deliberately well above the documented
    // 0.01% changed-pixel tolerance. The block is far outside the date mask.
    for (let y = 480; y < 512; y += 1) {
      for (let x = 980; x < 1012; x += 1) {
        const pixel = (y * SERIES_IMAGE_WIDTH + x) * 4;
        input[pixel] = input[pixel] === 255 ? 0 : 255;
      }
    }
    await sharp(input, {
      raw: { width: SERIES_IMAGE_WIDTH, height: SERIES_IMAGE_HEIGHT, channels: 4 },
    })
      .png()
      .toFile(`${outputPath}.tmp.png`);
    await rm(outputPath, { force: true });
    await copyFile(`${outputPath}.tmp.png`, outputPath);

    const metadata = { ...rendered.metadata!, outputPath };
    const validation = await validateGeneratedSeriesImage(metadata, { repoRoot: process.cwd() });
    assert.equal(validation.ok, false);
    assert.ok(validation.issues.some((issue) => issue.startsWith("static-region-regression:")));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
