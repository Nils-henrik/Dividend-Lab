import {
  classifyReportTitle,
  explicitFiscalPeriod,
  type NormalizedCompanyDocument,
} from "@/lib/companies/ingestion/document";
import {
  compactDateToIso,
  decodeHtmlText,
  englishDateToIso,
  normalizeSameOriginUrl,
  officialEventUrl,
  uniqueDocuments,
} from "@/lib/companies/ingestion/text";

export const ATLAS_COPCO_REPORTS_SOURCE_URL =
  "https://www.atlascopcogroup.com/en/investors/reports-and-presentations";
export const ATLAS_COPCO_CALENDAR_SOURCE_URL =
  "https://www.atlascopcogroup.com/en/investors/calendar-and-events";
const ATLAS_COPCO_ORIGIN = "https://www.atlascopcogroup.com";
const ATLAS_COPCO_PUBLISHER = "Atlas Copco Group";
const REPORT_PDF_PATH = /^\/content\/dam\/atlas-copco\/.+\.pdf$/i;
const REPORT_TITLE = /^(?:\d{8}\s+)?(?:Quarterly Report Q[1-4] \d{4}|Annual Report \d{4})\b/i;

export function parseAtlasCopcoFinancialReports(
  html: string,
): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /cmp-download__title-link"\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const title = decodeHtmlText(match[2]);
    if (!REPORT_TITLE.test(title)) {
      continue;
    }

    const sourceUrl = normalizeSameOriginUrl(match[1], ATLAS_COPCO_ORIGIN, REPORT_PDF_PATH);
    const filename = sourceUrl ? new URL(sourceUrl).pathname.split("/").at(-1) ?? "" : "";
    const publishedAt = compactDateToIso(filename.slice(0, 8));
    const documentType = classifyReportTitle(title);
    if (!sourceUrl || !publishedAt || !documentType || /presentation/i.test(sourceUrl)) {
      continue;
    }

    documents.push({
      documentType,
      title,
      sourceUrl,
      sourcePublisher: ATLAS_COPCO_PUBLISHER,
      publishedAt,
      eventAt: null,
      fiscalPeriod: explicitFiscalPeriod(title),
    });
  }

  return uniqueDocuments(documents, 12).sort((first, second) =>
    (second.publishedAt ?? "").localeCompare(first.publishedAt ?? ""),
  );
}

export function parseAtlasCopcoCalendar(
  html: string,
  now: Date,
): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(/<div class="cmp-teaser">([\s\S]*?)<\/div>\s*<\/div>/gi)) {
    const block = match[1];
    const title = decodeHtmlText(
      block.match(/cmp-teaser__title">\s*([^<]+)/i)?.[1] ?? "",
    );
    const pretitle = decodeHtmlText(
      block.match(/cmp-teaser__pretitle">([^<]+)/i)?.[1] ?? "",
    );
    const eventAt = englishDateToIso(
      decodeHtmlText(block.match(/cmp-teaser__date">([^<]+)/i)?.[1] ?? ""),
    );
    if (
      !title ||
      !eventAt ||
      !/QUARTERLY REPORT|ANNUAL REPORT/i.test(pretitle) ||
      /silent period/i.test(title) ||
      !/\bQ[1-4]\s+\d{4}\s+report\b|annual report/i.test(title) ||
      new Date(eventAt).getTime() < now.getTime()
    ) {
      continue;
    }

    const sameOriginLink = [...block.matchAll(/href="([^"]+)"/gi)]
      .map((link) => normalizeSameOriginUrl(link[1], ATLAS_COPCO_ORIGIN, /^\/en\/investors\/.+/))
      .find((link) => link && !link.endsWith("/calendar-and-events"));
    const sourceUrl = sameOriginLink
      ?? officialEventUrl(ATLAS_COPCO_CALENDAR_SOURCE_URL, eventAt, title);
    if (!sourceUrl) {
      continue;
    }

    documents.push({
      documentType: "report_date",
      title,
      sourceUrl,
      sourcePublisher: ATLAS_COPCO_PUBLISHER,
      publishedAt: null,
      eventAt,
      fiscalPeriod: explicitFiscalPeriod(title),
    });
  }

  return uniqueDocuments(documents, 12).sort((first, second) =>
    (first.eventAt ?? "").localeCompare(second.eventAt ?? ""),
  );
}
