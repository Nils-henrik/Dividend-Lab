import {
  classifyReportTitle,
  explicitFiscalPeriod,
  type NormalizedCompanyDocument,
} from "@/lib/companies/ingestion/document";
import {
  decodeHtmlText,
  englishDateToIso,
  isoDateOnly,
  isoTimestamp,
  normalizeSameOriginUrl,
  officialEventUrl,
  uniqueDocuments,
} from "@/lib/companies/ingestion/text";

export const ASTRAZENECA_ORIGIN = "https://www.astrazeneca.com";
export const ASTRAZENECA_PUBLISHER = "AstraZeneca";
export const ASTRAZENECA_PRESS_RELEASE_SOURCE_URL =
  `${ASTRAZENECA_ORIGIN}/media-centre/press-releases.html`;
export const ASTRAZENECA_SITEMAP_URL = `${ASTRAZENECA_ORIGIN}/azcomsitemap.xml`;
export const ASTRAZENECA_REPORTS_SOURCE_URL =
  `${ASTRAZENECA_ORIGIN}/investor-relations/results-and-presentations.html`;
export const ASTRAZENECA_CALENDAR_SOURCE_URL =
  `${ASTRAZENECA_ORIGIN}/investor-relations/events.html`;
export const ASTRAZENECA_MAX_PRESS_RELEASES = 20;

const PRESS_PATH = /^\/media-centre\/press-releases\/\d{4}\/[^/?#]+\.html$/;
const REPORT_PDF_PATH = /^\/content\/dam\/az\/PDF\/.+\.pdf$/i;
const LOC_PATTERN =
  /<loc>\s*([^<]+?)\s*<\/loc>\s*<lastmod>\s*([^<]+?)\s*<\/lastmod>/gi;

export type AstraZenecaPressCandidate = {
  sourceUrl: string;
  sourceModifiedAt: string | null;
};

export function parseAstraZenecaPressSitemap(
  xml: string,
): { status: "ok"; candidates: AstraZenecaPressCandidate[] } | { status: "invalid" } {
  if (!/<urlset(?:\s|>)/i.test(xml)) {
    return { status: "invalid" };
  }

  const candidates = new Map<string, AstraZenecaPressCandidate>();
  for (const match of xml.matchAll(LOC_PATTERN)) {
    const rawUrl = match[1].trim();
    if (rawUrl.includes("/content/astraz")) {
      continue;
    }

    const sourceUrl = normalizeSameOriginUrl(rawUrl, ASTRAZENECA_ORIGIN, PRESS_PATH);
    if (!sourceUrl) {
      continue;
    }

    const candidate = {
      sourceUrl,
      sourceModifiedAt: isoTimestamp(match[2].trim()),
    };
    const existing = candidates.get(sourceUrl);
    if (
      !existing ||
      (candidate.sourceModifiedAt ?? "") > (existing.sourceModifiedAt ?? "")
    ) {
      candidates.set(sourceUrl, candidate);
    }
  }

  return {
    status: "ok",
    candidates: [...candidates.values()]
      .sort((first, second) =>
        (second.sourceModifiedAt ?? "").localeCompare(first.sourceModifiedAt ?? ""),
      )
      .slice(0, ASTRAZENECA_MAX_PRESS_RELEASES),
  };
}

export function parseAstraZenecaPressRelease(
  html: string,
  sourceUrl: string,
): NormalizedCompanyDocument | null {
  const normalizedSourceUrl = normalizeSameOriginUrl(
    sourceUrl,
    ASTRAZENECA_ORIGIN,
    PRESS_PATH,
  );
  const publishedAt = isoDateOnly(
    html.match(/itemprop="datePublished"\s+content="([^"]+)"/i)?.[1] ?? "",
  );
  const title = decodeHtmlText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  if (!normalizedSourceUrl || !publishedAt || !title || title.length > 500) {
    return null;
  }

  return {
    documentType: "press_release",
    title,
    sourceUrl: normalizedSourceUrl,
    sourcePublisher: ASTRAZENECA_PUBLISHER,
    publishedAt,
    eventAt: null,
    fiscalPeriod: null,
  };
}

export function parseAstraZenecaReports(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(/<h3>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3>|$)/gi)) {
    const title = decodeHtmlText(match[1]);
    const section = match[2];
    const documentType = classifyReportTitle(title);
    const publishedAt = englishDateToIso(
      decodeHtmlText(section.match(/class="footnote">([^<]+)/i)?.[1] ?? ""),
    );
    if (!documentType || !publishedAt || !/results/i.test(title)) {
      continue;
    }

    const announcement = [...section.matchAll(
      /<a\b[^>]*href="([^"]+\.pdf)"[^>]*>[\s\S]*?download-tile__header">([^<]*)</gi,
    )].find((item) => /announcement/i.test(item[2]) && !/presentation|appendix/i.test(item[2]));
    const sourceUrl = announcement
      ? normalizeSameOriginUrl(announcement[1], ASTRAZENECA_ORIGIN, REPORT_PDF_PATH)
      : null;
    if (!sourceUrl) {
      continue;
    }

    documents.push({
      documentType,
      title,
      sourceUrl,
      sourcePublisher: ASTRAZENECA_PUBLISHER,
      publishedAt,
      eventAt: null,
      fiscalPeriod: explicitFiscalPeriod(title),
    });
  }

  return uniqueDocuments(documents, 8);
}

export function parseAstraZenecaCalendar(
  html: string,
  now: Date,
): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /<time class="event-card__date" datetime="([^"]+)"[\s\S]*?<span>([^<]+)<\/span>/gi,
  )) {
    const title = decodeHtmlText(match[2]);
    const eventAt = isoDateOnly(match[1]);
    if (
      !eventAt ||
      !title ||
      title.includes("{{") ||
      !/\bresults\b/i.test(title) ||
      new Date(eventAt).getTime() < now.getTime()
    ) {
      continue;
    }

    const sourceUrl = officialEventUrl(ASTRAZENECA_CALENDAR_SOURCE_URL, eventAt, title);
    if (!sourceUrl) {
      continue;
    }

    documents.push({
      documentType: "report_date",
      title,
      sourceUrl,
      sourcePublisher: ASTRAZENECA_PUBLISHER,
      publishedAt: null,
      eventAt,
      fiscalPeriod: explicitFiscalPeriod(title),
    });
  }

  return uniqueDocuments(documents, 8).sort((first, second) =>
    (first.eventAt ?? "").localeCompare(second.eventAt ?? ""),
  );
}
