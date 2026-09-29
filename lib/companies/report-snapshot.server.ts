import "server-only";

import { unstable_cache } from "next/cache";
import {
  INDUSTRIVARDEN_ORIGIN,
  INDUSTRIVARDEN_RSS_SOURCE_URL,
} from "@/lib/companies/ingestion/adapters/omxs30-crown";
import { fetchBoundedText } from "@/lib/companies/ingestion/http";
import {
  parseIndustrivardenReportSnapshot,
  parseNordeaReportSnapshot,
  parseTele2ReportSnapshot,
  selectIndustrivardenReportUrl,
  selectNordeaReportArticleUrl,
  selectTele2ReportArticleUrl,
  type ReportSnapshot,
} from "@/lib/companies/report-snapshot";

const HTML = ["text/html"] as const;
const RSS = ["application/rss+xml", "application/xml", "text/xml"] as const;

async function readText(url: string, origin: string, acceptedContentTypes: readonly string[]) {
  const result = await fetchBoundedText(url, {
    allowedOrigin: origin,
    acceptedContentTypes,
    maxBytes: 1_000_000,
    timeoutMs: 8_000,
  });
  return result.status === "ok" ? result.text : null;
}

async function loadNordeaSnapshot(): Promise<ReportSnapshot | null> {
  const listing = await readText("https://www.nordea.com/en/investors", "https://www.nordea.com", HTML);
  if (!listing) return null;
  const articleUrl = selectNordeaReportArticleUrl(listing);
  if (!articleUrl) return null;
  const article = await readText(articleUrl, "https://www.nordea.com", HTML);
  return article ? parseNordeaReportSnapshot(article, articleUrl) : null;
}

async function loadTele2Snapshot(): Promise<ReportSnapshot | null> {
  const listing = await readText("https://www.tele2.com/investors/", "https://www.tele2.com", HTML);
  if (!listing) return null;
  const articleUrl = selectTele2ReportArticleUrl(listing);
  if (!articleUrl) return null;
  const article = await readText(articleUrl, "https://www.tele2.com", HTML);
  return article ? parseTele2ReportSnapshot(article, articleUrl) : null;
}

async function loadIndustrivardenSnapshot(): Promise<ReportSnapshot | null> {
  const feed = await readText(INDUSTRIVARDEN_RSS_SOURCE_URL, INDUSTRIVARDEN_ORIGIN, RSS);
  if (!feed) return null;
  const articleUrl = selectIndustrivardenReportUrl(feed);
  if (!articleUrl) return null;
  const article = await readText(articleUrl, INDUSTRIVARDEN_ORIGIN, HTML);
  return article ? parseIndustrivardenReportSnapshot(article, articleUrl) : null;
}

async function loadUncached(slug: string): Promise<ReportSnapshot | null> {
  if (slug === "nordea") return loadNordeaSnapshot();
  if (slug === "tele2") return loadTele2Snapshot();
  if (slug === "industrivarden") return loadIndustrivardenSnapshot();
  return null;
}

export const loadCompanyReportSnapshot = unstable_cache(
  async (slug: string) => {
    try {
      return await loadUncached(slug);
    } catch {
      return null;
    }
  },
  ["company-report-snapshot-v2"],
  { revalidate: 60 * 60 * 12 },
);
