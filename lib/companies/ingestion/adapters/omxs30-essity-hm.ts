import {
  classifyReportTitle,
  explicitFiscalPeriod,
  isReportPublicationTitle,
  type NormalizedCompanyDocument,
} from "@/lib/companies/ingestion/document";
import {
  decodeHtmlText,
  englishDateToIso,
  isoTimestamp,
  normalizeSameOriginUrl,
  officialEventUrl,
  uniqueDocuments,
} from "@/lib/companies/ingestion/text";

const MAX_DOCUMENTS = 20;

const MONTH_ABBREVIATIONS: Record<string, string> = {
  jan: "january",
  feb: "february",
  mar: "march",
  apr: "april",
  may: "may",
  jun: "june",
  jul: "july",
  aug: "august",
  sep: "september",
  oct: "october",
  nov: "november",
  dec: "december",
};

export const ESSITY_ORIGIN = "https://www.essity.com";
export const ESSITY_PUBLISHER = "Essity";
export const ESSITY_PRESS_RELEASE_SOURCE_URL = `${ESSITY_ORIGIN}/media/press-releases/`;
export const ESSITY_REPORTS_SOURCE_URL =
  `${ESSITY_ORIGIN}/investors/financial-reports/interim-reports/`;
export const ESSITY_CALENDAR_SOURCE_URL = `${ESSITY_ORIGIN}/investors/calendar/`;

export const HM_ORIGIN = "https://hmgroup.com";
export const HM_PUBLISHER = "H&M Group";
export const HM_PRESS_RELEASE_SOURCE_URL = `${HM_ORIGIN}/media/news/`;
export const HM_REPORTS_SOURCE_URL = `${HM_ORIGIN}/investors/`;
export const HM_CALENDAR_SOURCE_URL = `${HM_ORIGIN}/investors/financial-calendar/`;

const ESSITY_PRESS_PATH = /^\/media\/press-release\/[^/?#]+\/[a-z0-9]+$/i;
const ESSITY_REPORT_PATH =
  /^\/investors\/reports\/reportdetails\/(?:interim-reports|annual-reports)\/[^/?#]+$/;
const HM_PRESS_PATH = /^\/news\/[^/?#]+\/$/;
const HM_REPORT_PATH = /^\/wp-content\/uploads\/\d{4}\/\d{2}\/[^/?#]+\.pdf$/i;

function englishDate(value: string): string | null {
  const text = decodeHtmlText(value)
    .replace(/'/g, "")
    .replace(/,/g, "")
    .match(/\d{1,2}\s+[A-Za-z]+\s+\d{2,4}|[A-Za-z]+\s+\d{1,2}\s+\d{4}/)?.[0] ?? "";
  const abbreviated = text.replace(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i,
    (month) => MONTH_ABBREVIATIONS[month.toLowerCase()] ?? month,
  );
  const shortYear = abbreviated.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{2})$/,
  );
  if (shortYear) {
    const year = Number(shortYear[3]);
    if (year < 20 || year > 39) {
      return null;
    }

    return englishDateToIso(`${shortYear[1]} ${shortYear[2]} 20${shortYear[3]}`);
  }

  return englishDateToIso(abbreviated);
}

function pressDocument(input: {
  title: string;
  sourceUrl: string | null;
  publishedAt: string | null;
  publisher: string;
}): NormalizedCompanyDocument | null {
  if (
    !input.sourceUrl ||
    !input.publishedAt ||
    input.title.length < 1 ||
    input.title.length > 500
  ) {
    return null;
  }

  return {
    documentType: "press_release",
    title: input.title,
    sourceUrl: input.sourceUrl,
    sourcePublisher: input.publisher,
    publishedAt: input.publishedAt,
    eventAt: null,
    fiscalPeriod: null,
  };
}

function reportDocument(input: {
  title: string;
  sourceUrl: string | null;
  publishedAt: string | null;
  publisher: string;
}): NormalizedCompanyDocument | null {
  const documentType = classifyReportTitle(input.title);
  if (!documentType || !input.sourceUrl || !input.publishedAt || input.title.length > 500) {
    return null;
  }

  return {
    documentType,
    title: input.title,
    sourceUrl: input.sourceUrl,
    sourcePublisher: input.publisher,
    publishedAt: input.publishedAt,
    eventAt: null,
    fiscalPeriod: explicitFiscalPeriod(input.title),
  };
}

function calendarDocument(input: {
  title: string;
  pageUrl: string;
  eventAt: string | null;
  publisher: string;
  now: Date;
}): NormalizedCompanyDocument | null {
  if (!input.eventAt || !isReportPublicationTitle(input.title)) {
    return null;
  }

  if (new Date(input.eventAt).getTime() < input.now.getTime()) {
    return null;
  }

  const sourceUrl = officialEventUrl(input.pageUrl, input.eventAt, input.title);
  if (!sourceUrl) {
    return null;
  }

  return {
    documentType: "report_date",
    title: input.title,
    sourceUrl,
    sourcePublisher: input.publisher,
    publishedAt: null,
    eventAt: input.eventAt,
    fiscalPeriod: explicitFiscalPeriod(input.title),
  };
}

export function parseEssityPressReleases(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /class="date[^"]*">([^<]+)<\/p>[\s\S]{0,500}?href="([^"]+)"[^>]*>[\s\S]{0,200}?<span>([\s\S]*?)<\/span>/gi,
  )) {
    const document = pressDocument({
      title: decodeHtmlText(match[3]),
      sourceUrl: normalizeSameOriginUrl(match[2], ESSITY_ORIGIN, ESSITY_PRESS_PATH),
      publishedAt: englishDate(match[1]),
      publisher: ESSITY_PUBLISHER,
    });
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, MAX_DOCUMENTS);
}

export function parseEssityFinancialReports(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /class="caption[^"]*">([^<]+)<\/div>[\s\S]{0,500}?href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const document = reportDocument({
      title: decodeHtmlText(match[3]),
      sourceUrl: normalizeSameOriginUrl(match[2], ESSITY_ORIGIN, ESSITY_REPORT_PATH),
      publishedAt: englishDate(match[1]),
      publisher: ESSITY_PUBLISHER,
    });
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, 12);
}

export function parseEssityCalendar(
  html: string,
  now: Date,
): NormalizedCompanyDocument[] {
  const upcoming = html.split(/Past events/i)[0] ?? "";
  const documents: NormalizedCompanyDocument[] = [];
  let year: string | null = null;
  const tokens = upcoming.matchAll(
    /<h3><span[^>]*>\s*(20\d{2})\s*<\/span><\/h3>|<time class="date">[\s\S]{0,400}?<h3[^>]*>\s*(\d{1,2})\s*<\/h3>[\s\S]{0,200}?month[^>]*>\s*([A-Za-z]+)\s*<\/p>[\s\S]{0,500}?<span>([\s\S]*?)<\/span>/gi,
  );
  for (const match of tokens) {
    if (match[1]) {
      year = match[1];
      continue;
    }

    const month = MONTH_ABBREVIATIONS[match[3].toLowerCase()] ?? match[3];
    const document = calendarDocument({
      title: decodeHtmlText(match[4]),
      pageUrl: ESSITY_CALENDAR_SOURCE_URL,
      eventAt: year ? englishDateToIso(`${match[2]} ${month} ${year}`) : null,
      publisher: ESSITY_PUBLISHER,
      now,
    });
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, 12).sort((first, second) =>
    (first.eventAt ?? "").localeCompare(second.eventAt ?? ""),
  );
}

export function parseHmPressReleases(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /datetime="([^"]+)"[\s\S]{0,800}?href="(https:\/\/hmgroup\.com\/news\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const document = pressDocument({
      title: decodeHtmlText(match[3]),
      sourceUrl: normalizeSameOriginUrl(match[2], HM_ORIGIN, HM_PRESS_PATH),
      publishedAt: isoTimestamp(match[1]),
      publisher: HM_PUBLISHER,
    });
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, MAX_DOCUMENTS);
}

export function parseHmFinancialReports(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /<p>\s*(\d{1,2}\s+[A-Za-z]+\s+20\d{2})\s*<br\s*\/?>\s*<a\b[^>]*href="([^"]+\.pdf)"[^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const document = reportDocument({
      title: decodeHtmlText(match[3]),
      sourceUrl: normalizeSameOriginUrl(match[2], HM_ORIGIN, HM_REPORT_PATH),
      publishedAt: englishDate(match[1]),
      publisher: HM_PUBLISHER,
    });
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, 12);
}

export function parseHmCalendar(
  html: string,
  now: Date,
): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /hm-events__date">\s*([^<]+?)\s*<\/div>[\s\S]{0,200}?hm-events__title">\s*([^<]+?)\s*<\/div>/gi,
  )) {
    const document = calendarDocument({
      title: decodeHtmlText(match[2]),
      pageUrl: HM_CALENDAR_SOURCE_URL,
      eventAt: englishDate(match[1]),
      publisher: HM_PUBLISHER,
      now,
    });
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, 12).sort((first, second) =>
    (first.eventAt ?? "").localeCompare(second.eventAt ?? ""),
  );
}
