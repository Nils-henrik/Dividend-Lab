import sharp from "sharp";

import type { PixelRegion, StaticRegressionPolicy } from "./templates";
import { SERIES_IMAGE_HEIGHT, SERIES_IMAGE_WIDTH } from "./types";

export type StaticRegionDiff = {
  staticPixelCount: number;
  changedPixelCount: number;
  changedPixelRatio: number;
  meanAbsoluteError: number;
  maxChannelDelta: number;
};

function insideRegion(x: number, y: number, region: PixelRegion): boolean {
  return (
    x >= region.x &&
    x < region.x + region.width &&
    y >= region.y &&
    y < region.y + region.height
  );
}

function isDynamicPixel(x: number, y: number, regions: readonly PixelRegion[]): boolean {
  return regions.some((region) => insideRegion(x, y, region));
}

async function generatedPixels(file: string) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (
    info.width !== SERIES_IMAGE_WIDTH ||
    info.height !== SERIES_IMAGE_HEIGHT ||
    info.channels !== 4
  ) {
    throw new Error("static-regression-generated-dimensions");
  }
  return data;
}

async function referencePixels(file: string) {
  const { data, info } = await sharp(file)
    .resize(SERIES_IMAGE_WIDTH, SERIES_IMAGE_HEIGHT, {
      fit: "cover",
      position: "centre",
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 4) throw new Error("static-regression-reference-channels");
  return data;
}

export async function calculateStaticRegionDiff(
  generatedFile: string,
  referenceFile: string,
  dynamicRegions: readonly PixelRegion[],
  policy: StaticRegressionPolicy,
): Promise<StaticRegionDiff> {
  const [generated, reference] = await Promise.all([
    generatedPixels(generatedFile),
    referencePixels(referenceFile),
  ]);

  let staticPixelCount = 0;
  let changedPixelCount = 0;
  let absoluteErrorSum = 0;
  let maxChannelDelta = 0;

  for (let y = 0; y < SERIES_IMAGE_HEIGHT; y += 1) {
    for (let x = 0; x < SERIES_IMAGE_WIDTH; x += 1) {
      if (isDynamicPixel(x, y, dynamicRegions)) continue;
      staticPixelCount += 1;
      const index = (y * SERIES_IMAGE_WIDTH + x) * 4;
      let pixelChanged = false;
      for (let channel = 0; channel < 3; channel += 1) {
        const delta = Math.abs(generated[index + channel] - reference[index + channel]);
        absoluteErrorSum += delta;
        maxChannelDelta = Math.max(maxChannelDelta, delta);
        if (delta > policy.pixelChannelTolerance) pixelChanged = true;
      }
      if (pixelChanged) changedPixelCount += 1;
    }
  }

  return {
    staticPixelCount,
    changedPixelCount,
    changedPixelRatio: staticPixelCount === 0 ? 0 : changedPixelCount / staticPixelCount,
    meanAbsoluteError:
      staticPixelCount === 0 ? 0 : absoluteErrorSum / (staticPixelCount * 3),
    maxChannelDelta,
  };
}

export function staticRegionDiffPasses(
  diff: StaticRegionDiff,
  policy: StaticRegressionPolicy,
): boolean {
  return (
    diff.changedPixelRatio <= policy.maxChangedPixelRatio &&
    diff.meanAbsoluteError <= policy.maxMeanAbsoluteError
  );
}

/**
 * Review-only heatmap. Dynamic masks are grey because changes there are
 * expected; static pixels stay black unless they differ, in which case the
 * strongest RGB delta is shown in red. This file is never a production asset.
 */
export async function writeStaticRegionDiffImage(
  generatedFile: string,
  referenceFile: string,
  dynamicRegions: readonly PixelRegion[],
  targetFile: string,
) {
  const [generated, reference] = await Promise.all([
    generatedPixels(generatedFile),
    referencePixels(referenceFile),
  ]);
  const output = Buffer.alloc(SERIES_IMAGE_WIDTH * SERIES_IMAGE_HEIGHT * 4);

  for (let y = 0; y < SERIES_IMAGE_HEIGHT; y += 1) {
    for (let x = 0; x < SERIES_IMAGE_WIDTH; x += 1) {
      const index = (y * SERIES_IMAGE_WIDTH + x) * 4;
      if (isDynamicPixel(x, y, dynamicRegions)) {
        output[index] = 72;
        output[index + 1] = 72;
        output[index + 2] = 72;
        output[index + 3] = 255;
        continue;
      }
      const delta = Math.max(
        Math.abs(generated[index] - reference[index]),
        Math.abs(generated[index + 1] - reference[index + 1]),
        Math.abs(generated[index + 2] - reference[index + 2]),
      );
      output[index] = delta;
      output[index + 1] = 0;
      output[index + 2] = 0;
      output[index + 3] = 255;
    }
  }

  await sharp(output, {
    raw: { width: SERIES_IMAGE_WIDTH, height: SERIES_IMAGE_HEIGHT, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(targetFile);
}
