import type { EditorialSeries } from "@/lib/news/autoredaktion/types";

export type SeriesImageTemplate = {
  series: EditorialSeries;
  templateVersion: string;
  referencePath: string;
  canonicalDivLabLogoSource: string;
  seriesName: string;
  /** Opaque clean foreground area that replaces baked headline/date text. */
  textPanel: { x: number; y: number; width: number; height: number };
  /** Norden-only clean foreground area that replaces baked company marks. */
  logoPanel?: { x: number; y: number; width: number; height: number };
  safeArea: { x: number; y: number; width: number; height: number };
};

/**
 * Visual source of truth: the approved 4 Sep 2026 cover.
 * The original upper-left DivLab lockup remains untouched from the reference.
 * The foreground text area is fully replaced before fresh text is rendered, so
 * a previous date is never painted over with another date.
 */
export const BORSSVERIGE_TEMPLATE_V1: SeriesImageTemplate = {
  series: "borssverige",
  templateVersion: "borssverige-v1",
  referencePath: "public/news-demo/borssverige-2026-09-04-sectra.png",
  canonicalDivLabLogoSource:
    "public/news-demo/file_000000009cf48246883ae568fc196154.png",
  seriesName: "BÖRSSVERIGE",
  textPanel: { x: 72, y: 318, width: 650, height: 300 },
  safeArea: { x: 64, y: 54, width: 1152, height: 612 },
};

/**
 * Visual source of truth: the approved 4 Sep 2026 Norden cover, checked against
 * the 3 Sep social-cover variant. The text and company foreground areas are
 * rebuilt as deterministic panels while the approved photographic/background
 * treatment and canonical DivLab lockup remain the fixed base.
 */
export const NORDEN_I_CENTRUM_TEMPLATE_V1: SeriesImageTemplate = {
  series: "norden-i-centrum",
  templateVersion: "norden-v1",
  referencePath:
    "public/news-demo/file_000000008a308210b3b73b7b8e0ad122.png",
  canonicalDivLabLogoSource:
    "public/news-demo/file_000000009cf48246883ae568fc196154.png",
  seriesName: "NORDEN I CENTRUM",
  textPanel: { x: 72, y: 318, width: 630, height: 300 },
  logoPanel: { x: 742, y: 178, width: 466, height: 440 },
  safeArea: { x: 64, y: 54, width: 1152, height: 612 },
};

export function getSeriesImageTemplate(series: EditorialSeries): SeriesImageTemplate {
  return series === "borssverige"
    ? BORSSVERIGE_TEMPLATE_V1
    : NORDEN_I_CENTRUM_TEMPLATE_V1;
}
