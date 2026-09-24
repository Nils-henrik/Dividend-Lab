import {
  classifyReportTitle,
  explicitFiscalPeriod,
  isReportPublicationTitle,
  type NormalizedCompanyDocument,
} from "@/lib/companies/ingestion/document";
import {
  decodeHtmlText,
  isoDateOnly,
  isoTimestamp,
  normalizeSameOriginUrl,
  uniqueDocuments,
} from "@/lib/companies/ingestion/text";

export const VOLVO_ORIGIN = "https://www.volvogroup.com";
export const VOLVO_PUBLISHER = "Volvo Group";
export const VOLVO_PRESS_RELEASE_SOURCE_URL = `${VOLVO_ORIGIN}/en/news-and-media.html`;
export const VOLVO_REPORTS_SOURCE_URL = `${VOLVO_ORIGIN}/en/investors/reports-and-presentations.html`;
export const VOLVO_CALENDAR_SOURCE_URL = `${VOLVO_ORIGIN}/en/investors/financial-calendar.html`;
export const VOLVO_MAX_HTML_BYTES = 1_000_000;
export const VOLVO_MAX_PRESS_RELEASES = 20;
export const VOLVO_MAX_REPORT_DETAILS = 6;

const NEWS_PATH = /^\/en\/news-and-media\/news\/\d{4}\/[a-z]{3}\/[^/?#]+$/;
const EVENT_PATH = /^\/en\/news-and-media\/events\/\d{4}\/[a-z]{3}\/[^/?#]+$/;
const REPORT_PDF_PATH =
  /^\/content\/dam\/volvo-group\/.*(?:interim-reports|annual-report).*\.pdf$/i;

function volvoPdfIsPresentation(url: string): boolean {
  const filename = new URL(url).pathname.split("/").at(-1) ?? "";
  return /presentation/i.test(filename);
}

function pressDocument(block: string): NormalizedCompanyDocument | null {
  const caption = decodeHtmlText(
    block.match(/articlelist__headerCaption">([\s\S]*?)<\//i)?.[1] ?? "",
  );
  if (caption.toLowerCase() !== "press release") {
    return null;
  }

  const publishedAt = isoDateOnly(
    decodeHtmlText(
      block.match(/articlelist__headerTimeDate">([\s\S]*?)<\//i)?.[1] ?? "",
    ),
  );
  const anchor = block.match(
    /articlelist__headerTitle">[\s\S]*?<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
  );
  if (!anchor || !publishedAt) {
    return null;
  }

  const sourceUrl = normalizeSameOriginUrl(anchor[1], VOLVO_ORIGIN, NEWS_PATH);
  const title = decodeHtmlText(anchor[2]);
  if (!sourceUrl || !title || title.length > 500) {
    return null;
  }

  return {
    documentType: "press_release",
    title,
    sourceUrl,
    sourcePublisher: VOLVO_PUBLISHER,
    publishedAt,
    eventAt: null,
    fiscalPeriod: null,
  };
}

export function parseVolvoPressReleases(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(/articlelist__item[\s\S]*?(?=articlelist__item|$)/gi)) {
    const document = pressDocument(match[0]);
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, VOLVO_MAX_PRESS_RELEASES);
}

export function parseVolvoCalendar(
  html: string,
  now: Date,
): NormalizedCompanyDocument[] {
  const upcomingStart = html.indexOf("eventlist--upcoming");
  if (upcomingStart < 0) {
    return [];
  }

  const pastStart = html.indexOf("eventlist--past", upcomingStart);
  const upcoming = html.slice(
    upcomingStart,
    pastStart > upcomingStart ? pastStart : undefined,
  );
  const documents: NormalizedCompanyDocument[] = [];

  for (const match of upcoming.matchAll(/<li class="eventlist__item">([\s\S]*?)<\/li>/gi)) {
    const block = match[1];
    const eventAt = isoTimestamp(
      block.match(/datetime="([^"]+)"/i)?.[1] ?? "",
    );
    const title = decodeHtmlText(
      block.match(/eventlist__titleLink">([\s\S]*?)<\//i)?.[1] ?? "",
    );
    const href = block.match(/href="([^"]+)"/i)?.[1] ?? "";
    const sourceUrl = normalizeSameOriginUrl(href, VOLVO_ORIGIN, EVENT_PATH);
    if (!eventAt || !title || !sourceUrl || !isReportPublicationTitle(title)) {
      continue;
    }

    if (new Date(eventAt).getTime() < now.getTime()) {
      continue;
    }

    documents.push({
      documentType: "report_date",
      title,
      sourceUrl,
      sourcePublisher: VOLVO_PUBLISHER,
      publishedAt: null,
      eventAt,
      fiscalPeriod: explicitFiscalPeriod(title),
    });
  }

  return uniqueDocuments(
    documents.sort((first, second) => first.eventAt!.localeCompare(second.eventAt!)),
    VOLVO_MAX_PRESS_RELEASES,
  );
}

export type VolvoReportCandidate = {
  title: string;
  detailUrl: string;
};

export function parseVolvoReportCandidates(html: string): VolvoReportCandidate[] {
  const candidates: VolvoReportCandidate[] = [];
  for (const match of html.matchAll(/data-nc-params-Teaser='([\s\S]*?)'/gi)) {
    let parsed: { analyticsData?: { title?: unknown }; CTAURL?: unknown };
    try {
      parsed = JSON.parse(match[1]) as typeof parsed;
    } catch {
      continue;
    }

    const title = typeof parsed.analyticsData?.title === "string"
      ? decodeHtmlText(parsed.analyticsData.title)
      : "";
    const detailUrl = typeof parsed.CTAURL === "string"
      ? normalizeSameOriginUrl(parsed.CTAURL, VOLVO_ORIGIN, EVENT_PATH)
      : null;
    if (!title || !detailUrl || !classifyReportTitle(title)) {
      continue;
    }

    candidates.push({ title, detailUrl });
    if (candidates.length >= VOLVO_MAX_REPORT_DETAILS) {
      break;
    }
  }

  return candidates;
}

export function parseVolvoReportDetail(
  html: string,
  detailUrl: string,
  title: string,
): NormalizedCompanyDocument | null {
  const documentType = classifyReportTitle(title);
  const publishedAt = isoTimestamp(
    html.match(/"startDate":\s*"([^"]+)"/i)?.[1] ?? "",
  );
  if (!documentType || !publishedAt) {
    return null;
  }

  const pdfs = [...html.matchAll(/href="([^"]+\.pdf[^"]*)"/gi)].map((match) =>
    normalizeSameOriginUrl(match[1], VOLVO_ORIGIN, REPORT_PDF_PATH),
  );
  const reportPdf = pdfs.find(
    (url) => url && !volvoPdfIsPresentation(url),
  );
  const sourceUrl = reportPdf ?? normalizeSameOriginUrl(detailUrl, VOLVO_ORIGIN, EVENT_PATH);
  if (!sourceUrl) {
    return null;
  }

  return {
    documentType,
    title,
    sourceUrl,
    sourcePublisher: VOLVO_PUBLISHER,
    publishedAt,
    eventAt: null,
    fiscalPeriod: explicitFiscalPeriod(title),
  };
}
