import { parseInvestorPressReleases } from "@/lib/companies/investor-official";
import {
  classifyReportTitle,
  explicitFiscalPeriod,
  type NormalizedCompanyDocument,
} from "@/lib/companies/ingestion/document";
import {
  decodeHtmlText,
  isoDateOnly,
  isoTimestamp,
  normalizeSameOriginUrl,
  uniqueDocuments,
} from "@/lib/companies/ingestion/text";

export const INVESTOR_ORIGIN = "https://www.investorab.com";
export const INVESTOR_PUBLISHER = "Investor AB";
export const INVESTOR_PRESS_RELEASE_SOURCE_URL =
  `${INVESTOR_ORIGIN}/investors-media/press-releases`;
export const INVESTOR_REPORTS_SOURCE_URL =
  `${INVESTOR_ORIGIN}/investors-media/reports-presentations/`;
export const INVESTOR_CALENDAR_SOURCE_URL =
  `${INVESTOR_ORIGIN}/investors-media/events-calendar`;

const REPORT_PDF_PATH = /^\/media\/[^?#]+\.pdf$/i;
const YEAR_PATH = /^\/investors-media\/reports-presentations\/20\d{2}$/;

export function investorPageEmbedsAlertIr(html: string): boolean {
  return /<iframe\b[^>]*src="https:\/\/[^"]*alertir\.com\//i.test(html);
}

export function parseInvestorIngestionPressReleases(
  html: string,
): NormalizedCompanyDocument[] {
  return uniqueDocuments(
    parseInvestorPressReleases(html).flatMap((item) => {
      const sourceUrl = normalizeSameOriginUrl(
        item.url,
        INVESTOR_ORIGIN,
        /^\/(?:investors-media|media|press)\//,
      );
      const publishedAt = item.date ? isoDateOnly(item.date) : null;
      if (!sourceUrl || !publishedAt || !item.title || item.title.length > 500) {
        return [];
      }

      return [{
        documentType: "press_release" as const,
        title: item.title,
        sourceUrl,
        sourcePublisher: INVESTOR_PUBLISHER,
        publishedAt,
        eventAt: null,
        fiscalPeriod: null,
      }];
    }),
    20,
  );
}

export function latestInvestorReportYearUrl(html: string): string | null {
  const years = [...html.matchAll(/href="([^"]*reports-presentations\/(20\d{2}))"/gi)]
    .map((match) => ({
      url: normalizeSameOriginUrl(match[1], INVESTOR_ORIGIN, YEAR_PATH),
      year: Number(match[2]),
    }))
    .filter((item): item is { url: string; year: number } => item.url !== null)
    .sort((first, second) => second.year - first.year);

  return years[0]?.url ?? null;
}

export function parseInvestorFinancialReports(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(/<li class="link-lists__list-item">([\s\S]*?)<\/li>/gi)) {
    const block = match[1];
    const href = block.match(/href="([^"]+\.pdf[^"]*)"/i)?.[1];
    const title = decodeHtmlText(
      block.match(/link-lists__link__text">([\s\S]*?)<\//i)?.[1] ?? "",
    );
    const explicitDate = block.match(/datetime="([^"]+)"/i)?.[1] ?? "";
    const publishedAt = isoTimestamp(explicitDate) ?? isoDateOnly(explicitDate.slice(0, 10));
    const documentType = classifyReportTitle(title);
    const sourceUrl = href
      ? normalizeSameOriginUrl(href, INVESTOR_ORIGIN, REPORT_PDF_PATH)
      : null;
    if (!sourceUrl || !publishedAt || !documentType || /presentation/i.test(title)) {
      continue;
    }

    documents.push({
      documentType,
      title,
      sourceUrl,
      sourcePublisher: INVESTOR_PUBLISHER,
      publishedAt,
      eventAt: null,
      fiscalPeriod: explicitFiscalPeriod(title),
    });
  }

  return uniqueDocuments(documents, 12);
}
