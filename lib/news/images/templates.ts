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

export type CompanyRowTypography = {
  /** First label x coordinate relative to the company-row dynamic region. */
  x: number;
  /** Top coordinate for the trimmed wordmark image, relative to the row. */
  top: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  fill: string;
  gapBeforeSeparator: number;
  gapAfterSeparator: number;
  separatorTop: number;
  separatorBottom: number;
  separatorColor: string;
  separatorOpacity: number;
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
  companyRowTypography?: CompanyRowTypography;
  dateFormat: "day-month-year" | "day-month";
  maxCompanyLogos: number;
  staticRegression: StaticRegressionPolicy;
};

/**
 * v2 rule: the approved published 1 Sep cover is the static master. We do not
 * rebuild the composition. Only the masked date pixels are reconstructed and
 * repainted. The generic subtitle remains baked into the approved master:
 * "De viktigaste nyheterna om svenska börsbolag inför dagen."
 *
 * Calibration against the approved source-of-truth at 1280x720:
 * - visible date glyph bbox uses the established x36 start and y339 baseline
 * - Lato 58/800 with 0.6 tracking matches the published date treatment closely
 * - measured dominant blue is approximately rgb(0, 68, 151)
 */
export const BORSSVERIGE_TEMPLATE_V2: SeriesImageTemplate = {
  series: "borssverige",
  templateVersion: "borssverige-v2-2026-09-01-generic-master",
  referencePath: "public/news-demo/borssverige-2026-09-01.png",
  canonicalDivLabLogoSource:
    "public/news-demo/file_000000009cf48246883ae568fc196154.png",
  dynamicRegions: {
    date: { x: 24, y: 281, width: 585, height: 70 },
  },
  dateTypography: {
    x: 12,
    baseline: 58,
    textAnchor: "start",
    fontFamily: "Lato, Arial, Helvetica, sans-serif",
    fontSize: 58,
    fontWeight: 800,
    letterSpacing: 0.6,
    fill: "#004497",
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
 *
 * Published 1, 2 and 4 Sep covers establish the company-row grammar: white,
 * bold typographic wordmarks separated by thin vertical rules. The 3 Sep cover
 * adds editorial imagery above that row but retains the same wordmark grammar.
 * Four companies is therefore the normal and maximum reference-driven layout.
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
    x: 292,
    baseline: 43,
    textAnchor: "end",
    fontFamily: "Lato, Arial, Helvetica, sans-serif",
    fontSize: 40,
    fontWeight: 800,
    letterSpacing: 0.35,
    fill: "#ffffff",
  },
  companyRowTypography: {
    x: 10,
    top: 31,
    fontFamily: "Lato, Arial, Helvetica, sans-serif",
    fontSize: 31,
    fontWeight: 800,
    letterSpacing: 0,
    fill: "#ffffff",
    gapBeforeSeparator: 30,
    gapAfterSeparator: 27,
    separatorTop: 15,
    separatorBottom: 68,
    separatorColor: "#ffffff",
    separatorOpacity: 0.35,
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
