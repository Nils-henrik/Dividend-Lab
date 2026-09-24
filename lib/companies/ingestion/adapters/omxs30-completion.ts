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
  officialEventUrl,
  uniqueDocuments,
} from "@/lib/companies/ingestion/text";

const MAX_DOCUMENTS = 20;

export const EVOLUTION_ORIGIN = "https://www.evolution.com";
export const EVOLUTION_PUBLISHER = "Evolution";
export const EVOLUTION_PRESS_RELEASE_SOURCE_URL =
  `${EVOLUTION_ORIGIN}/investors/financial-publications/press-releases`;
export const EVOLUTION_REPORTS_SOURCE_URL =
  `${EVOLUTION_ORIGIN}/investors/financial-publications/reports`;
export const EVOLUTION_CALENDAR_SOURCE_URL =
  `${EVOLUTION_ORIGIN}/investors/financial-data/financial-calendar`;

export const ADDTECH_ORIGIN = "https://www.addtech.com";
export const ADDTECH_CISION_ORIGIN = "https://news.cision.com";
export const ADDTECH_FEED_ORIGIN = "https://publish.ne.cision.com";
export const ADDTECH_PUBLISHER = "Addtech";
export const ADDTECH_CISION_IDENTIFIER = "563F27D62CDF474CAF699BBDBA94EF71";
export const ADDTECH_PRESS_FEED = "PRM,RDV";
export const ADDTECH_REPORT_FEED = "RPT,KMK";
export const ADDTECH_CISION_FEED_URL =
  `${ADDTECH_FEED_ORIGIN}/papi/NewsFeed/${ADDTECH_CISION_IDENTIFIER}?pageSize=50&pageIndex=1`;
export const ADDTECH_PRESS_RELEASE_SOURCE_URL =
  `${ADDTECH_ORIGIN}/investors-and-media/press-releases`;
export const ADDTECH_REPORTS_SOURCE_URL =
  `${ADDTECH_ORIGIN}/investors-and-media/financial-reports`;
export const ADDTECH_CALENDAR_SOURCE_URL =
  `${ADDTECH_ORIGIN}/investors-and-media/financial-calendar`;

export const NIBE_ORIGIN = "https://www.nibegroup.com";
export const NIBE_WIDGET_ORIGIN = "https://widget.datablocks.se";
export const NIBE_STORAGE_ORIGIN = "https://storage.mfn.se";
export const NIBE_PUBLISHER = "NIBE";
export const NIBE_PRESS_RELEASE_SOURCE_URL = `${NIBE_ORIGIN}/news`;
export const NIBE_INVESTORS_SOURCE_URL = `${NIBE_ORIGIN}/investors`;
export const NIBE_REPORTS_SOURCE_URL = NIBE_INVESTORS_SOURCE_URL;
export const NIBE_CALENDAR_SOURCE_URL = NIBE_INVESTORS_SOURCE_URL;
export const NIBE_ARCHIVE_WIDGET_URL =
  `${NIBE_WIDGET_ORIGIN}/api/rose/widgets/archive?token=f675d4fc-31ab-4e31-8e27-230ad87733ee&useCustomerSettings=false&lang=en`;
export const NIBE_CALENDAR_WIDGET_URL =
  `${NIBE_WIDGET_ORIGIN}/api/rose/widgets/calendar-v2?token=12a61bc4-0b86-4a56-8f09-f0980b0d6509&useCustomerSettings=false&lang=en`;

export const EQT_ORIGIN = "https://eqtgroup.com";
export const EQT_PUBLISHER = "EQT";
export const EQT_PRESS_RELEASE_SOURCE_URL = `${EQT_ORIGIN}/news`;
export const EQT_REPORTS_SOURCE_URL =
  `${EQT_ORIGIN}/shareholders/reports-and-presentations`;
export const EQT_CALENDAR_SOURCE_URL = `${EQT_ORIGIN}/shareholders/financial-calendar`;

const EVOLUTION_PRESS_PATH =
  /^\/investors\/financial-publications\/press-releases\/[^/?#]+$/;
const ADDTECH_CISION_PATH = /^\/addtech\/r\/[^/?#]+$/;
const NIBE_NEWS_PATH = /^\/news\/[^/?#]+$/;
const NIBE_PDF_PATH = /^\/[0-9a-f-]{36}\/[^/?#]+\.pdf$/i;
const EQT_NEWS_PATH = /^\/news\/[a-z0-9-]+$/;
const EQT_EVENT_PATH = /^\/shareholders\/financial-calendar\/[a-z0-9-]+$/;

const EQT_REPORT_EVENT_TYPES = new Set(["interim_reports", "annual_reports"]);

function slashDate(value: string): string | null {
  const match = value.match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/);
  if (!match) {
    return null;
  }

  return isoDateOnly(`${match[3]}-${match[2]}-${match[1]}`);
}

function abbreviatedEnglishDate(value: string): string | null {
  const match = decodeHtmlText(value).match(/^(\d{1,2})\s+([A-Za-z]+)\s+'(\d{2})$/);
  if (!match) {
    return englishDateToIso(decodeHtmlText(value));
  }

  const year = Number(match[3]) <= 39 ? `20${match[3]}` : null;
  if (!year) {
    return null;
  }

  return englishDateToIso(`${match[1]} ${match[2]} ${year}`);
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

function unescapeEmbeddedJson(html: string): string {
  return html.replace(/\\"/g, "\"").replace(/\\\//g, "/");
}

export function issuerPageEmbedsMarker(html: string, marker: string): boolean {
  return marker.length > 0 && html.includes(marker);
}

export function parseEvolutionPressReleases(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /class="date-stamp">(\d{2}\/\d{2}\/20\d{2})[^<]*<\/p>[\s\S]{0,2500}?href="([^"]+)"[\s\S]{0,800}?<strong>([\s\S]*?)<\/strong>/gi,
  )) {
    const publishedAt = slashDate(match[1]);
    const sourceUrl = normalizeSameOriginUrl(match[2], EVOLUTION_ORIGIN, EVOLUTION_PRESS_PATH);
    const title = decodeHtmlText(match[3]);
    if (!publishedAt || !sourceUrl || !title || title.length > 500) {
      continue;
    }

    documents.push({
      documentType: "press_release",
      title,
      sourceUrl,
      sourcePublisher: EVOLUTION_PUBLISHER,
      publishedAt,
      eventAt: null,
      fiscalPeriod: null,
    });
  }

  return uniqueDocuments(documents, MAX_DOCUMENTS);
}

export function parseEvolutionFinancialReports(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const block = match[1];
    const heading = decodeHtmlText(block.match(/<strong>([\s\S]*?)<\/strong>/i)?.[1] ?? "");
    const publishedAt = slashDate(block.match(/class="date-stamp">([^<]+)/i)?.[1] ?? "");
    const sourceUrl = normalizeSameOriginUrl(
      block.match(/href="(\/investors\/financial-publications\/press-releases\/[^"]+)"/i)?.[1] ?? "",
      EVOLUTION_ORIGIN,
      EVOLUTION_PRESS_PATH,
    );
    if (!heading || !publishedAt || !sourceUrl) {
      continue;
    }

    const document = reportDocument({
      title: heading.includes(publishedAt.slice(0, 4)) ? heading : `${heading} ${publishedAt.slice(0, 4)}`,
      sourceUrl,
      publishedAt,
      publisher: EVOLUTION_PUBLISHER,
    });
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, 12);
}

export function parseEvolutionCalendar(
  html: string,
  now: Date,
): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /<p class="h4"><strong>([^<]+)<\/strong><\/p><span class="text-text-font-2">([^<]+)<\/span>/gi,
  )) {
    const eventAt = abbreviatedEnglishDate(match[1]);
    const title = decodeHtmlText(match[2]);
    const sourceUrl = eventAt
      ? officialEventUrl(EVOLUTION_CALENDAR_SOURCE_URL, eventAt, title)
      : null;
    if (!eventAt || !title || !sourceUrl) {
      continue;
    }

    const document = calendarDocument({
      title,
      sourceUrl,
      eventAt,
      publisher: EVOLUTION_PUBLISHER,
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

export function parseAddtechCisionFeed(
  payload: string,
  informationType: "PRM" | "RPT",
): NormalizedCompanyDocument[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return [];
  }

  if (!parsed || typeof parsed !== "object" || !("Releases" in parsed)) {
    return [];
  }

  const releases = parsed.Releases;
  if (!Array.isArray(releases)) {
    return [];
  }

  const documents: NormalizedCompanyDocument[] = [];
  for (const release of releases) {
    if (!release || typeof release !== "object") {
      continue;
    }

    const record = release as Record<string, unknown>;
    if (record.InformationType !== informationType || typeof record.Title !== "string") {
      continue;
    }

    const publishedAt = typeof record.PublishDate === "string"
      ? isoTimestamp(record.PublishDate)
      : null;
    const sourceUrl = typeof record.CisionWireUrl === "string"
      ? normalizeSameOriginUrl(record.CisionWireUrl, ADDTECH_CISION_ORIGIN, ADDTECH_CISION_PATH)
      : null;
    const title = decodeHtmlText(record.Title);
    if (!publishedAt || !sourceUrl || !title || title.length > 500) {
      continue;
    }

    if (informationType === "PRM") {
      documents.push({
        documentType: "press_release",
        title,
        sourceUrl,
        sourcePublisher: ADDTECH_PUBLISHER,
        publishedAt,
        eventAt: null,
        fiscalPeriod: null,
      });
      continue;
    }

    const document = reportDocument({
      title,
      sourceUrl,
      publishedAt,
      publisher: ADDTECH_PUBLISHER,
    });
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, informationType === "PRM" ? MAX_DOCUMENTS : 12);
}

export function parseAddtechCalendar(
  html: string,
  now: Date,
): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /<p><strong>(\d{2}\/\d{2}\/20\d{2})(?:&nbsp;|\s)*<\/strong>(?:&nbsp;|\s)*<br>\s*([^<]+)<\/p>/gi,
  )) {
    const eventAt = slashDate(match[1]);
    const title = decodeHtmlText(match[2]);
    const sourceUrl = eventAt
      ? officialEventUrl(ADDTECH_CALENDAR_SOURCE_URL, eventAt, title)
      : null;
    if (!eventAt || !title || !sourceUrl) {
      continue;
    }

    const document = calendarDocument({
      title,
      sourceUrl,
      eventAt,
      publisher: ADDTECH_PUBLISHER,
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

export function parseNibePressReleases(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /<time\b[^>]*dateTime="([^"]+)"[^>]*>[\s\S]{0,200}?<h2 class="press-release-item-title">\s*<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const publishedAt = isoTimestamp(match[1]);
    const sourceUrl = normalizeSameOriginUrl(match[2], NIBE_ORIGIN, NIBE_NEWS_PATH);
    const title = decodeHtmlText(match[3]);
    if (!publishedAt || !sourceUrl || !title || title.length > 500) {
      continue;
    }

    documents.push({
      documentType: "press_release",
      title,
      sourceUrl,
      sourcePublisher: NIBE_PUBLISHER,
      publishedAt,
      eventAt: null,
      fiscalPeriod: null,
    });
  }

  return uniqueDocuments(documents, MAX_DOCUMENTS);
}

export function parseNibeFinancialReports(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /mfn-archive-event-title">([^<]+)<\/div>\s*<div class="mfn-archive-event-date">(\d{4}-\d{2}-\d{2})<\/div>[\s\S]{0,900}?mfn-archive-item-type-report-pdf mfn-archive-item-lang-en">[\s\S]{0,500}?href="([^"]+\.pdf)"/gi,
  )) {
    const publishedAt = isoDateOnly(match[2]);
    const heading = decodeHtmlText(match[1]);
    const sourceUrl = normalizeSameOriginUrl(match[3], NIBE_STORAGE_ORIGIN, NIBE_PDF_PATH);
    const title = publishedAt && heading.includes(publishedAt.slice(0, 4))
      ? heading
      : `${heading} ${publishedAt?.slice(0, 4) ?? ""}`.trim();
    if (!publishedAt || !sourceUrl || !title) {
      continue;
    }

    const document = reportDocument({
      title,
      sourceUrl,
      publishedAt,
      publisher: NIBE_PUBLISHER,
    });
    if (document) {
      documents.push(document);
    }
  }

  return uniqueDocuments(documents, 12);
}

export function parseNibeCalendar(
  html: string,
  now: Date,
): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of html.matchAll(
    /<td class="datetimes">(\d{4}-\d{2}-\d{2})<\/td>\s*<td class="title">([^<]+)<\/td>/gi,
  )) {
    const eventAt = isoDateOnly(match[1]);
    const title = decodeHtmlText(match[2]);
    const sourceUrl = eventAt
      ? officialEventUrl(NIBE_CALENDAR_SOURCE_URL, eventAt, title)
      : null;
    if (!eventAt || !title || !sourceUrl) {
      continue;
    }

    const document = calendarDocument({
      title,
      sourceUrl,
      eventAt,
      publisher: NIBE_PUBLISHER,
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

export function parseEqtPressReleases(html: string): NormalizedCompanyDocument[] {
  const text = unescapeEmbeddedJson(html);
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of text.matchAll(
    /https:\/\/eqtgroup\.com(\/news\/[a-z0-9-]+)"\},"title":"([^"]+)"[\s\S]{0,900}?"publishedDate":"([^"]+)"/g,
  )) {
    const sourceUrl = normalizeSameOriginUrl(match[1], EQT_ORIGIN, EQT_NEWS_PATH);
    const title = decodeHtmlText(match[2]);
    const publishedAt = isoTimestamp(match[3]);
    if (!sourceUrl || !title || title.length > 500 || !publishedAt) {
      continue;
    }

    documents.push({
      documentType: "press_release",
      title,
      sourceUrl,
      sourcePublisher: EQT_PUBLISHER,
      publishedAt,
      eventAt: null,
      fiscalPeriod: null,
    });
  }

  return uniqueDocuments(documents, MAX_DOCUMENTS);
}

export function parseEqtFinancialReports(html: string): NormalizedCompanyDocument[] {
  const text = unescapeEmbeddedJson(html);
  const documents: NormalizedCompanyDocument[] = [];
  for (const block of text.matchAll(/"date":"(20\d{2}-\d{2}-\d{2})"[\s\S]{0,2500}?"items":\[([\s\S]*?)\]/g)) {
    const publishedAt = isoDateOnly(block[1]);
    if (!publishedAt) {
      continue;
    }

    for (const item of block[2].matchAll(/"title":"([^"]+)"/g)) {
      const title = decodeHtmlText(item[1]);
      if (/presentation|webcast/i.test(title)) {
        continue;
      }

      const sourceUrl = officialEventUrl(EQT_REPORTS_SOURCE_URL, publishedAt, title);
      if (!sourceUrl) {
        continue;
      }

      const document = reportDocument({
        title,
        sourceUrl,
        publishedAt,
        publisher: EQT_PUBLISHER,
      });
      if (document) {
        documents.push(document);
      }
    }
  }

  return uniqueDocuments(documents, 12);
}

export function parseEqtCalendar(
  html: string,
  now: Date,
): NormalizedCompanyDocument[] {
  const text = unescapeEmbeddedJson(html);
  const documents: NormalizedCompanyDocument[] = [];
  for (const match of text.matchAll(
    /"eventType":"(interim_reports|annual_reports)"[\s\S]{0,1600}?"publishedDate":"(?:\$D)?([^"]+)"[\s\S]{0,500}?"current":"([a-z0-9-]+)"[\s\S]{0,160}?"title":"([^"]+)"/g,
  )) {
    if (!EQT_REPORT_EVENT_TYPES.has(match[1])) {
      continue;
    }

    const eventAt = isoTimestamp(match[2]);
    const sourceUrl = normalizeSameOriginUrl(
      `/shareholders/financial-calendar/${match[3]}`,
      EQT_ORIGIN,
      EQT_EVENT_PATH,
    );
    const title = decodeHtmlText(match[4]);
    if (!eventAt || !sourceUrl || !title || /silent period/i.test(title)) {
      continue;
    }

    const document = /quarterly announcement|interim report|annual report|year-end report|half-year report/i.test(title)
      ? {
          documentType: "report_date" as const,
          title,
          sourceUrl,
          sourcePublisher: EQT_PUBLISHER,
          publishedAt: null,
          eventAt,
          fiscalPeriod: explicitFiscalPeriod(title),
        }
      : calendarDocument({
          title,
          sourceUrl,
          eventAt,
          publisher: EQT_PUBLISHER,
          now,
        });
    if (!document || new Date(document.eventAt ?? 0).getTime() < now.getTime()) {
      continue;
    }

    documents.push(document);
  }

  return uniqueDocuments(documents, 12).sort((first, second) =>
    (first.eventAt ?? "").localeCompare(second.eventAt ?? ""),
  );
}
