import type { EditorialSeries } from "@/lib/news/autoredaktion/types";

export type PixelRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DateTypography = {
  /** Coordinates are relative to the date dynamic region. */
  x: number;
  baseline: number;
  textAnchor: "start" | "end";
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  fill: string;
};

export type StaticRegressionPolicy = {
  /** Per-channel delta at or below this value is treated as compression noise. */
  pixelChannelTolerance: number;
  /** Maximum ratio of changed pixels outside all dynamic masks. */
  maxChangedPixelRatio: number;
  /** Maximum mean absolute RGB error outside all dynamic masks. */
  maxMeanAbsoluteError: number;
};

export type SeriesImageTemplate = {
  series: EditorialSeries;
  templateVersion: string;
  referencePath: string;
  canonicalDivLabLogoSource: string;
  dynamicRegions: {
    date: PixelRegion;
    companyRow?: PixelRegion;
  };
  dateTypography: DateTypography;
  dateFormat: "day-month-year" | "day-month";
  maxCompanyLogos: number;
  staticRegression: StaticRegressionPolicy;
};

/**
 * v2 rule: the approved published cover is the template. We do not rebuild the
 * composition. Only the masked date pixels are reconstructed and repainted.
 * Coordinates are calibrated against the canonical reference after its fixed
 * 1280x720 cover resize.
 */
export const BORSSVERIGE_TEMPLATE_V2: SeriesImageTemplate = {
  series: "borssverige",
  templateVersion: "borssverige-v2-source-of-truth",
  referencePath: "public/news-demo/borssverige-2026-09-04-sectra.png",
  canonicalDivLabLogoSource:
    "public/news-demo/file_000000009cf48246883ae568fc196154.png",
  dynamicRegions: {
    date: { x: 24, y: 281, width: 585, height: 70 },
  },
  dateTypography: {
    x: 12,
    baseline: 54,
    textAnchor: "start",
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
    fontSize: 44,
    fontWeight: 800,
    letterSpacing: 0.7,
    fill: "#0755ad",
  },
  dateFormat: "day-month-year",
  maxCompanyLogos: 0,
  staticRegression: {
    pixelChannelTolerance: 2,
    maxChangedPixelRatio: 0.0001,
    maxMeanAbsoluteError: 0.05,
  },
};

/**
 * v2 rule: keep the established NORDEN / I CENTRUM composition intact. Only
 * the existing date field and the discrete lower company row may change.
 * Four companies is the normal and maximum layout because that is what the
 * canonical published reference supports without inventing a new composition.
 */
export const NORDEN_I_CENTRUM_TEMPLATE_V2: SeriesImageTemplate = {
  series: "norden-i-centrum",
  templateVersion: "norden-v2-source-of-truth",
  referencePath:
    "public/news-demo/file_000000008a308210b3b73b7b8e0ad122.png",
  canonicalDivLabLogoSource:
    "public/news-demo/file_000000009cf48246883ae568fc196154.png",
  dynamicRegions: {
    date: { x: 970, y: 46, width: 296, height: 58 },
    companyRow: { x: 40, y: 555, width: 720, height: 84 },
  },
  dateTypography: {
    x: 286,
    baseline: 44,
    textAnchor: "end",
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: 0.35,
    fill: "#ffffff",
  },
  dateFormat: "day-month",
  maxCompanyLogos: 4,
  staticRegression: {
    pixelChannelTolerance: 2,
    maxChangedPixelRatio: 0.0001,
    maxMeanAbsoluteError: 0.05,
  },
};

export function getSeriesImageTemplate(series: EditorialSeries): SeriesImageTemplate {
  return series === "borssverige"
    ? BORSSVERIGE_TEMPLATE_V2
    : NORDEN_I_CENTRUM_TEMPLATE_V2;
}
