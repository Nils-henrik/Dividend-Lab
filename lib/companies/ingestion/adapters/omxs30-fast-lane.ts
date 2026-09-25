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

const MAX_PRESS = 20;
const MAX_REPORTS = 8;

export const ALFA_LAVAL_ORIGIN = "https://www.alfalaval.com";
export const ALFA_LAVAL_PUBLISHER = "Alfa Laval";
export const ALFA_LAVAL_NEWSROOM_SOURCE_URL = `${ALFA_LAVAL_ORIGIN}/media/newsroom/`;

export const ASSA_ABLOY_ORIGIN = "https://www.assaabloy.com";
export const ASSA_ABLOY_PUBLISHER = "ASSA ABLOY";
export const ASSA_ABLOY_PRESS_SOURCE_URL =
  `${ASSA_ABLOY_ORIGIN}/group/en/news-media/press-releases`;
export const ASSA_ABLOY_PRESS_JSON_URL =
  `${ASSA_ABLOY_ORIGIN}/rest/api/v1/press-releases.en.json`;
export const ASSA_ABLOY_PRESS_DETAIL_PREFIX =
  `${ASSA_ABLOY_ORIGIN}/group/en/news-media/press-releases/id`;
export const ASSA_ABLOY_INTERIM_REPORTS_SOURCE_URL =
  `${ASSA_ABLOY_ORIGIN}/group/en/investors/reports-presentations/interim-reports`;

export const HANDELSBANKEN_ORIGIN = "https://www.handelsbanken.com";
export const HANDELSBANKEN_PUBLISHER = "Handelsbanken";
export const HANDELSBANKEN_IR_SOURCE_URL =
  `${HANDELSBANKEN_ORIGIN}/en/investor-relations`;
export const HANDELSBANKEN_PRESS_SOURCE_URL =
  `${HANDELSBANKEN_ORIGIN}/en/press-and-news/press-releases`;
export const ALFA_LAVAL_CALENDAR_SOURCE_URL = `${ALFA_LAVAL_ORIGIN}/investors/`;
export const ASSA_ABLOY_CALENDAR_SOURCE_URL =
  `${ASSA_ABLOY_ORIGIN}/group/en/investors/events-calendar`;

const ALFA_NEWS_PATH = /^\/media\/news\/investors\/\d{4}\/[^/]+\/$/;
const ALFA_PDF_PATH = /^\/contentassets\/[^/]+\/[^/]+\.pdf$/i;
const ASSA_PRESS_PATH = /^\/group\/en\/news-media\/press-releases\/id\.[a-f0-9]+$/;
const ASSA_PDF_PATH = /^\/group\/en\/documents\/investors\/interim-reports\/\d{4}\/.+\.pdf$/i;
const HANDELSBANKEN_DOCUMENT_PATH = /^\/tron\/xgpu\/info\/contents\/v1\/document\/\d+-\d+$/;

const MONTHS: Record<string, string> = {
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

export type FastLaneReportCandidate = {
  detailUrl: string;
  title: string;
  publishedAt: string;
};

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

  const month = MONTHS[monthName.toLowerCase()] ?? monthName;
  return englishDateToIso(`${month} ${day} ${year}`);
}

function pressDocument(input: {
  title: string;
  sourceUrl: string;
  publishedAt: string;
  publisher: string;
}): NormalizedCompanyDocument | null {
  if (!input.title || input.title.length > 500) {
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
  sourceUrl: string;
  publishedAt: string;
  publisher: string;
}): NormalizedCompanyDocument | null {
  const documentType = classifyReportTitle(input.title);
  if (!documentType || input.title.length > 500) {
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

function decodeContentAttribute(value: string): string | null {
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export function parseAlfaLavalFinancialNews(html: string): NormalizedCompanyDocument[] {
  const block = html.match(
    /news-room-financial-news-block-content">([\s\S]*?)<\/div>\s*<\/div>/i,
  )?.[1] ?? "";
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of block.matchAll(
    /<a\b[^>]*class="[^"]*news-room-single-financial-news[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const sourceUrl = normalizeSameOriginUrl(match[1], ALFA_LAVAL_ORIGIN, ALFA_NEWS_PATH);
    const publishedAt = englishDate(match[2]);
    const title = decodeHtmlText(
      match[2].match(/financial-news-block-title[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "",
    );
    const document = sourceUrl && publishedAt
      ? pressDocument({
        title,
        sourceUrl,
        publishedAt,
        publisher: ALFA_LAVAL_PUBLISHER,
      })
      : null;
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, MAX_PRESS);
}

export function parseAlfaLavalReportCandidates(html: string): FastLaneReportCandidate[] {
  return parseAlfaLavalFinancialNews(html).flatMap((document) => {
    if (!classifyReportTitle(document.title) || !document.publishedAt) {
      return [];
    }

    return [{
      detailUrl: document.sourceUrl,
      title: document.title,
      publishedAt: document.publishedAt,
    }];
  }).slice(0, 4);
}

export function parseAlfaLavalReportPdf(
  html: string,
  candidate: FastLaneReportCandidate,
): NormalizedCompanyDocument | null {
  const pdf = [...html.matchAll(/<a\b([^>]*href="([^"]+\.pdf)"[^>]*)>([\s\S]*?)<\/a>/gi)]
    .find((match) => /press release as pdf|interim report/i.test(`${match[1]} ${decodeHtmlText(match[3])}`)
      && !/presentation/i.test(match[2]));
  const sourceUrl = pdf
    ? normalizeSameOriginUrl(pdf[2], ALFA_LAVAL_ORIGIN, ALFA_PDF_PATH)
    : null;
  if (!sourceUrl) {
    return null;
  }

  return reportDocument({
    title: candidate.title,
    sourceUrl,
    publishedAt: candidate.publishedAt,
    publisher: ALFA_LAVAL_PUBLISHER,
  });
}

export function parseAssaAbloyPressConfig(html: string): boolean {
  for (const match of html.matchAll(/content="([A-Za-z0-9+/=]{40,})"/g)) {
    const decoded = decodeContentAttribute(match[1]);
    if (!decoded) {
      continue;
    }

    try {
      const config = JSON.parse(decoded) as { url?: unknown; detailedPageUrl?: unknown };
      if (
        config.url === "/rest/api/v1/press-releases.en.json" &&
        config.detailedPageUrl === ASSA_ABLOY_PRESS_DETAIL_PREFIX
      ) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

export function parseAssaAbloyPressReleases(jsonText: string): NormalizedCompanyDocument[] {
  let items: unknown;
  try {
    items = (JSON.parse(jsonText) as { items?: unknown }).items;
  } catch {
    return [];
  }

  if (!Array.isArray(items)) {
    return [];
  }

  const documents: NormalizedCompanyDocument[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as { id?: unknown; title?: unknown; publishDate?: unknown };
    if (typeof record.id !== "string" || !/^[a-f0-9]+$/.test(record.id)) {
      continue;
    }

    const sourceUrl = normalizeSameOriginUrl(
      `${ASSA_ABLOY_PRESS_DETAIL_PREFIX}.${record.id}`,
      ASSA_ABLOY_ORIGIN,
      ASSA_PRESS_PATH,
    );
    const publishedAt = typeof record.publishDate === "string"
      ? isoTimestamp(record.publishDate)
      : null;
    const title = typeof record.title === "string" ? decodeHtmlText(record.title) : "";
    const document = sourceUrl && publishedAt
      ? pressDocument({
        title,
        sourceUrl,
        publishedAt,
        publisher: ASSA_ABLOY_PUBLISHER,
      })
      : null;
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, MAX_PRESS);
}

type AssaPdf = { title: string; sourceUrl: string; quarter: string; year: string };

function assaPdfs(html: string): AssaPdf[] {
  const pdfs: AssaPdf[] = [];
  for (const match of html.matchAll(/content="([A-Za-z0-9+/=]{40,})"/g)) {
    const decoded = decodeContentAttribute(match[1]);
    if (!decoded?.includes(".pdf")) {
      continue;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(decoded);
    } catch {
      continue;
    }

    const links = (payload as { columns?: Array<{ assetsAndLinks?: Array<{ links?: unknown[] }> }> })
      .columns
      ?.flatMap((column) => column.assetsAndLinks ?? [])
      .flatMap((group) => group.links ?? []) ?? [];
    for (const link of links) {
      if (!link || typeof link !== "object") {
        continue;
      }

      const record = link as { title?: unknown; url?: unknown; fileFormat?: unknown };
      if (record.fileFormat !== "pdf" || typeof record.url !== "string" || typeof record.title !== "string") {
        continue;
      }

      const quarter = record.title.match(/\bQ([1-4])\b/i)?.[1];
      const year = record.title.match(/\b(20\d{2})\b/)?.[1];
      const sourceUrl = normalizeSameOriginUrl(record.url, ASSA_ABLOY_ORIGIN, ASSA_PDF_PATH);
      if (!quarter || !year || !sourceUrl || /presentation/i.test(record.title)) {
        continue;
      }

      pdfs.push({
        title: decodeHtmlText(record.title),
        sourceUrl,
        quarter,
        year,
      });
    }
  }

  return pdfs;
}

export function parseAssaAbloyFinancialReports(
  html: string,
  pressJson: string,
): NormalizedCompanyDocument[] {
  const dated = new Map<string, string>();
  let pressItems: unknown[] = [];
  try {
    const parsed = JSON.parse(pressJson) as { items?: unknown };
    if (Array.isArray(parsed.items)) {
      pressItems = parsed.items;
    }
  } catch {
    pressItems = [];
  }
  for (const item of pressItems) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as { title?: unknown; publishDate?: unknown };
    if (typeof record.title !== "string" || typeof record.publishDate !== "string") {
      continue;
    }
    if (!/quarterly report/i.test(record.title)) {
      continue;
    }
    const quarter = record.title.match(/\bQ([1-4])\b/i)?.[1];
    const year = record.title.match(/\b(20\d{2})\b/)?.[1];
    const publishedAt = isoTimestamp(record.publishDate);
    if (!quarter || !year || !publishedAt) {
      continue;
    }
    const key = `${year}-Q${quarter}`;
    if (!dated.has(key)) {
      dated.set(key, publishedAt);
    }
  }

  const documents: NormalizedCompanyDocument[] = [];
  for (const pdf of assaPdfs(html)) {
    const publishedAt = dated.get(`${pdf.year}-Q${pdf.quarter}`);
    if (!publishedAt) {
      continue;
    }

    const document = reportDocument({
      title: pdf.title.includes(pdf.year) ? pdf.title : `${pdf.title} ${pdf.year}`,
      sourceUrl: pdf.sourceUrl,
      publishedAt,
      publisher: ASSA_ABLOY_PUBLISHER,
    });
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, MAX_REPORTS);
}

function handelsbankenPairs(html: string): Array<{ year: string; date: string; event: string }> {
  const pairs: Array<{ year: string; date: string; event: string }> = [];
  for (const section of html.matchAll(/<h3\b[^>]*>\s*(20\d{2})\s*<\/h3>([\s\S]*?)(?=<h3\b|$)/gi)) {
    const fields = [...section[2].matchAll(
      /shb-cms-table-list__item-data-block[\s\S]{0,700}?<div>\s*([^<]+?)\s*<\/div>/gi,
    )].map((match) => decodeHtmlText(match[1]));
    for (let index = 0; index + 1 < fields.length; index += 2) {
      pairs.push({ year: section[1], date: fields[index] ?? "", event: fields[index + 1] ?? "" });
    }
  }

  return pairs;
}

export function parseHandelsbankenCalendar(
  html: string,
  now: Date,
): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const pair of handelsbankenPairs(html)) {
    if (!/^\d{1,2}\s+[A-Za-z]+$/.test(pair.date) || !isReportPublicationTitle(pair.event)) {
      continue;
    }

    const eventAt = englishDate(`${pair.date} ${pair.year}`);
    const title = /\b20\d{2}\b/.test(pair.event) ? pair.event : `${pair.event} ${pair.year}`;
    const sourceUrl = eventAt ? officialEventUrl(HANDELSBANKEN_IR_SOURCE_URL, eventAt, title) : null;
    if (!eventAt || !sourceUrl || new Date(eventAt).getTime() < now.getTime()) {
      continue;
    }

    documents.push({
      documentType: "report_date",
      title,
      sourceUrl,
      sourcePublisher: HANDELSBANKEN_PUBLISHER,
      publishedAt: null,
      eventAt,
      fiscalPeriod: explicitFiscalPeriod(title),
    });
  }

  return uniqueDocuments(documents, 12).sort((first, second) =>
    (first.eventAt ?? "").localeCompare(second.eventAt ?? ""),
  );
}

export function parseHandelsbankenFinancialReports(html: string): NormalizedCompanyDocument[] {
  const download = html.match(
    /TwoLineHeading-module__lineOne[^>]*>([^<]+)[\s\S]{0,400}?TwoLineHeading-module__lineTwo[^>]*>([^<]+)[\s\S]{0,1200}?href="(\/tron\/xgpu\/info\/contents\/v1\/document\/[^"]+)"/i,
  );
  const lineOne = decodeHtmlText(download?.[1] ?? "");
  const lineTwo = decodeHtmlText(download?.[2] ?? "");
  const href = download?.[3] ?? "";
  const sourceUrl = normalizeSameOriginUrl(href, HANDELSBANKEN_ORIGIN, HANDELSBANKEN_DOCUMENT_PATH);
  const title = `${lineOne} ${lineTwo}`.replace(/\s+/g, " ").trim();
  const dated = handelsbankenPairs(html).find((pair) =>
    /^\d{1,2}\s+[A-Za-z]+$/.test(pair.date) &&
    title.toLowerCase().includes(pair.event.toLowerCase()) &&
    isReportPublicationTitle(pair.event),
  );
  const publishedAt = dated ? englishDate(`${dated.date} ${dated.year}`) : null;
  if (!sourceUrl || !publishedAt) {
    return [];
  }

  const document = reportDocument({
    title,
    sourceUrl,
    publishedAt,
    publisher: HANDELSBANKEN_PUBLISHER,
  });
  return document ? [document] : [];
}
