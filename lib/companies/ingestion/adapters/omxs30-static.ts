import {
  classifyReportTitle,
  explicitFiscalPeriod,
  isReportPublicationTitle,
  type NormalizedCompanyDocument,
} from "@/lib/companies/ingestion/document";
import {
  decodeHtmlText,
  englishDateToIso,
  isoDateOnly,
  isoTimestamp,
  normalizeSameOriginUrl,
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

export const SAAB_ORIGIN = "https://www.saab.com";
export const SAAB_PUBLISHER = "Saab";
export const SAAB_PRESS_RELEASE_SOURCE_URL = `${SAAB_ORIGIN}/newsroom/press-releases`;
export const SAAB_REPORTS_SOURCE_URL = `${SAAB_ORIGIN}/investors/reports-and-presentations`;
export const SAAB_CALENDAR_SOURCE_URL = `${SAAB_ORIGIN}/investors/calendar`;

export const SANDVIK_ORIGIN = "https://www.home.sandvik";
export const SANDVIK_PUBLISHER = "Sandvik";
export const SANDVIK_PRESS_RELEASE_SOURCE_URL = `${SANDVIK_ORIGIN}/en/investors/press-releases/`;
export const SANDVIK_REPORTS_SOURCE_URL = `${SANDVIK_ORIGIN}/en/investors/reports-presentations/`;
export const SANDVIK_CALENDAR_SOURCE_URL = `${SANDVIK_ORIGIN}/en/investors/calendar/`;

export const SCA_ORIGIN = "https://www.sca.com";
export const SCA_PUBLISHER = "SCA";
export const SCA_PRESS_RELEASE_SOURCE_URL = `${SCA_ORIGIN}/en/media/press-releases/`;
export const SCA_REPORTS_SOURCE_URL =
  `${SCA_ORIGIN}/en/investors/reports-and-presentations/interim-reports/`;
export const SCA_CALENDAR_SOURCE_URL = `${SCA_ORIGIN}/en/investors/ir-calendar/`;

const SAAB_PRESS_PATH = /^\/newsroom\/press-releases\/\d{4}\/[^/?#]+$/;
const SAAB_REPORT_PATH = /^\/globalassets\/.+\.pdf$/i;
const SAAB_CALENDAR_PATH = /^\/investors\/calendar\/[^/?#]+$/;
const SANDVIK_PRESS_PATH = /^\/en\/news-and-media\/news\/\d{4}\/\d{2}\/[^/?#]+\/$/;
const SANDVIK_REPORT_PATH = /^\/siteassets\/investors\/.+\.pdf$/i;
const SANDVIK_CALENDAR_PATH = /^\/en\/investors\/calendar\/\d{4}\/[^/?#]+\/$/;
const SCA_PRESS_PATH = /^\/en\/media\/press-releases\/\d{4}\/[^/?#]+\/$/;
const SCA_REPORT_PATH = /^\/siteassets\/.+\.pdf$/i;
const SCA_CALENDAR_PATH = /^\/en\/investors\/ir-calendar\/\d{4}\/[^/?#]+\/$/;

function englishDate(value: string): string | null {
  const text = decodeHtmlText(value);
  const monthFirst = text.match(/\b([A-Za-z]+)\s+(\d{1,2}),?\s+(20\d{2})\b/);
  const dayFirst = text.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})\b/);
  const monthName = monthFirst?.[1] ?? dayFirst?.[2];
  const day = monthFirst?.[2] ?? dayFirst?.[1];
  const year = monthFirst?.[3] ?? dayFirst?.[3];
  if (!monthName || !day || !year) {
    return null;
  }

  const month = MONTH_ABBREVIATIONS[monthName.toLowerCase()] ?? monthName;
  return englishDateToIso(`${month} ${day} ${year}`);
}

function europeanDate(value: string): string | null {
  const match = value.match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/);
  if (!match) {
    return null;
  }

  return isoDateOnly(`${match[3]}-${match[2]}-${match[1]}`);
}

function reportTitle(heading: string, publishedAt: string): string | null {
  const year = publishedAt.slice(0, 4);
  const title = heading.includes(year) ? heading : `${heading} ${year}`;
  if (!classifyReportTitle(title) || title.length > 500) {
    return null;
  }

  return title;
}

function reportDocument(input: {
  title: string;
  sourceUrl: string;
  publishedAt: string;
  publisher: string;
}): NormalizedCompanyDocument | null {
  const documentType = classifyReportTitle(input.title);
  if (!documentType) {
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
  sourceUrl: string;
  eventAt: string;
  publisher: string;
  now: Date;
}): NormalizedCompanyDocument | null {
  if (
    !isReportPublicationTitle(input.title) ||
    new Date(input.eventAt).getTime() < input.now.getTime()
  ) {
    return null;
  }

  return {
    documentType: "report_date",
    title: input.title,
    sourceUrl: input.sourceUrl,
    sourcePublisher: input.publisher,
    publishedAt: null,
    eventAt: input.eventAt,
    fiscalPeriod: explicitFiscalPeriod(input.title),
  };
}

export function parseSaabPressReleases(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /<a\b[^>]*href="([^"]+)"[^>]*class="[^"]*\bitem\b[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const sourceUrl = normalizeSameOriginUrl(match[1], SAAB_ORIGIN, SAAB_PRESS_PATH);
    const publishedAt = englishDate(
      match[2].match(/class="date">([\s\S]*?)<\/span>/i)?.[1] ?? "",
    );
    const title = decodeHtmlText(
      match[2].match(/class="title">([\s\S]*?)<\/span>/i)?.[1] ?? "",
    );
    if (!sourceUrl || !publishedAt || !title || title.length > 500) {
      continue;
    }

    documents.push({
      documentType: "press_release",
      title,
      sourceUrl,
      sourcePublisher: SAAB_PUBLISHER,
      publishedAt,
      eventAt: null,
      fiscalPeriod: null,
    });
  }

  return uniqueDocuments(documents, MAX_DOCUMENTS);
}

export function parseSaabFinancialReports(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const section of html.matchAll(
    /<h3 class="listed-item__heading">([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3 class="listed-item__heading">|<h2|$)/gi,
  )) {
    const heading = decodeHtmlText(section[1]);
    const englishReport = section[2].match(
      /<a\b[^>]*href="([^"]+\.pdf)"[^>]*>\s*Report \(en\)\s*<\/a>\s*<div class="date">([^<]+)/i,
    );
    if (!englishReport) {
      continue;
    }

    const sourceUrl = normalizeSameOriginUrl(englishReport[1], SAAB_ORIGIN, SAAB_REPORT_PATH);
    const publishedAt = isoDateOnly(decodeHtmlText(englishReport[2]).slice(0, 10));
    const title = sourceUrl && publishedAt ? reportTitle(heading, publishedAt) : null;
    if (!sourceUrl || !publishedAt || !title) {
      continue;
    }

    const document = reportDocument({
      title,
      sourceUrl,
      publishedAt,
      publisher: SAAB_PUBLISHER,
    });
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, 12);
}

export function parseSaabCalendar(
  html: string,
  now: Date,
): NormalizedCompanyDocument[] {
  const upcomingStart = html.indexOf('class="upcoming');
  if (upcomingStart < 0) {
    return [];
  }

  const upcoming = html.slice(upcomingStart);
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of upcoming.matchAll(
    /class="date">([\s\S]*?)<\/div>[\s\S]{0,1200}?href="([^"]+)"[\s\S]{0,400}?<h4>([\s\S]*?)<\/h4>/gi,
  )) {
    const title = decodeHtmlText(match[3]);
    const eventAt = englishDate(match[1]);
    const sourceUrl = normalizeSameOriginUrl(match[2], SAAB_ORIGIN, SAAB_CALENDAR_PATH);
    if (!title || !eventAt || !sourceUrl) {
      continue;
    }

    const document = calendarDocument({
      title,
      sourceUrl,
      eventAt,
      publisher: SAAB_PUBLISHER,
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

export function parseSandvikPressReleases(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const block = match[1];
    const anchor = block.match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!anchor || !/press release/i.test(anchor[2])) {
      continue;
    }

    const sourceUrl = normalizeSameOriginUrl(anchor[1], SANDVIK_ORIGIN, SANDVIK_PRESS_PATH);
    const publishedAt = englishDate(anchor[2]);
    const title = decodeHtmlText(
      anchor[2].match(/<p class="text-lg[^"]*">([\s\S]*?)<\/p>/i)?.[1] ?? "",
    );
    if (!sourceUrl || !publishedAt || !title || title.length > 500) {
      continue;
    }

    documents.push({
      documentType: "press_release",
      title,
      sourceUrl,
      sourcePublisher: SANDVIK_PUBLISHER,
      publishedAt,
      eventAt: null,
      fiscalPeriod: null,
    });
  }

  return uniqueDocuments(documents, MAX_DOCUMENTS);
}

export function parseSandvikFinancialReports(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2\b|$)/gi)) {
    const block = `${match[1]}${match[2]}`;
    const heading = decodeHtmlText(match[1]);
    const publishedAt = [...block.matchAll(/<p>([\s\S]*?)<\/p>/gi)]
      .map((item) => englishDate(item[1]))
      .find((value) => value !== null) ?? null;
    const pdf = [...block.matchAll(/href="\s*([^"]+\.pdf)"/gi)]
      .map((item) => item[1].replace(/\s+/g, ""))
      .find((href) => !/presentation/i.test(href.split("/").at(-1) ?? href));
    const sourceUrl = pdf
      ? normalizeSameOriginUrl(pdf, SANDVIK_ORIGIN, SANDVIK_REPORT_PATH)
      : null;
    const title = sourceUrl && publishedAt ? reportTitle(heading, publishedAt) : null;
    if (!sourceUrl || !publishedAt || !title) {
      continue;
    }

    const document = reportDocument({
      title,
      sourceUrl,
      publishedAt,
      publisher: SANDVIK_PUBLISHER,
    });
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, 12);
}

export function parseSandvikCalendar(
  html: string,
  now: Date,
): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(/<li class="relative">([\s\S]*?)<\/li>/gi)) {
    const block = match[1];
    const title = decodeHtmlText(block.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
    const eventAt = isoTimestamp(block.match(/datetime="([^"]+)"/i)?.[1] ?? "");
    const sourceUrl = normalizeSameOriginUrl(
      block.match(/data-link="([^"]+)"/i)?.[1] ?? "",
      SANDVIK_ORIGIN,
      SANDVIK_CALENDAR_PATH,
    );
    if (!title || !eventAt || !sourceUrl) {
      continue;
    }

    const document = calendarDocument({
      title,
      sourceUrl,
      eventAt,
      publisher: SANDVIK_PUBLISHER,
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

export function parseScaPressReleases(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /dateTime=['"]([^'"]+)['"][\s\S]{0,400}?<h2\b[^>]*>\s*<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const publishedAt = isoTimestamp(match[1]);
    const sourceUrl = normalizeSameOriginUrl(match[2], SCA_ORIGIN, SCA_PRESS_PATH);
    const title = decodeHtmlText(match[3]);
    if (!publishedAt || !sourceUrl || !title || title.length > 500) {
      continue;
    }

    documents.push({
      documentType: "press_release",
      title,
      sourceUrl,
      sourcePublisher: SCA_PUBLISHER,
      publishedAt,
      eventAt: null,
      fiscalPeriod: null,
    });
  }

  return uniqueDocuments(documents, MAX_DOCUMENTS);
}

export function parseScaFinancialReports(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /<h2\b[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2\b|$)/gi,
  )) {
    const heading = decodeHtmlText(match[1]);
    const block = match[2];
    const publishedAt = europeanDate(
      block.match(/dateTime=['"]([^'"]+)['"]/i)?.[1] ?? "",
    );
    const pdf = [...block.matchAll(/<a\b[^>]*href="([^"]+\.pdf)"[^>]*>([\s\S]*?)<\/a>/gi)]
      .find((item) => /interim report|quarterly report|annual report/i.test(decodeHtmlText(item[2]))
        && !/presentation/i.test(item[1]));
    const sourceUrl = pdf
      ? normalizeSameOriginUrl(pdf[1], SCA_ORIGIN, SCA_REPORT_PATH)
      : null;
    const title = sourceUrl && publishedAt ? reportTitle(heading, publishedAt) : null;
    if (!sourceUrl || !publishedAt || !title) {
      continue;
    }

    const document = reportDocument({
      title,
      sourceUrl,
      publishedAt,
      publisher: SCA_PUBLISHER,
    });
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, 12);
}

export function parseScaCalendar(
  html: string,
  now: Date,
): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /dateTime=['"]([^'"]+)['"][\s\S]{0,400}?<h3>\s*<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const eventAt = isoTimestamp(match[1]);
    const sourceUrl = normalizeSameOriginUrl(match[2], SCA_ORIGIN, SCA_CALENDAR_PATH);
    const title = decodeHtmlText(match[3]);
    if (!eventAt || !sourceUrl || !title) {
      continue;
    }

    const document = calendarDocument({
      title,
      sourceUrl,
      eventAt,
      publisher: SCA_PUBLISHER,
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
