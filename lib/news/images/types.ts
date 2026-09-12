import type { EditorialSeries } from "@/lib/news/autoredaktion/types";

export const SERIES_IMAGE_WIDTH = 1280 as const;
export const SERIES_IMAGE_HEIGHT = 720 as const;
export const SERIES_IMAGE_FORMAT = "png" as const;

export type SeriesImageInput = {
  series: EditorialSeries;
  /** Stockholm calendar date in YYYY-MM-DD form. */
  date: string;
  articleSlug: string;
  /** Canonical company names. Ignored by BörsSverige. */
  companies?: readonly string[];
};

export type SeriesImageRenderMetadata = {
  series: EditorialSeries;
  date: string;
  articleSlug: string;
  templateVersion: string;
  requestedCompanies: string[];
  companiesUsed: string[];
  missingCompanyLogos: string[];
  outputPath: string;
  publicPath: string;
  width: typeof SERIES_IMAGE_WIDTH;
  height: typeof SERIES_IMAGE_HEIGHT;
  format: typeof SERIES_IMAGE_FORMAT;
  canonicalDivLabLogoSource: string;
};

export type SeriesImageValidation = {
  ok: boolean;
  issues: string[];
};

export type SeriesImageResult = {
  imagePath: string | null;
  socialImagePath: string | null;
  publicPath: string | null;
  companiesUsed: string[];
  missingCompanyLogos: string[];
  width: typeof SERIES_IMAGE_WIDTH;
  height: typeof SERIES_IMAGE_HEIGHT;
  format: typeof SERIES_IMAGE_FORMAT;
  templateVersion: string;
  status: "generated" | "fallback" | "failed";
  validation: SeriesImageValidation;
  metadata: SeriesImageRenderMetadata | null;
};
