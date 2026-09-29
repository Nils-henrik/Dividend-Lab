import type { CompanyFactDraft, CompanyOwnershipDraft } from "@/lib/companies/ingestion/facts";
import {
  classifyReportTitle,
  explicitFiscalPeriod,
  isReportPublicationTitle,
  type CompanyDocumentType,
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

export const NORDEA_ORIGIN = "https://www.nordea.com";
export const NORDEA_PUBLISHER = "Nordea";
export const NORDEA_INVESTORS_SOURCE_URL = `${NORDEA_ORIGIN}/en/investors`;
export const NORDEA_CALENDAR_SOURCE_URL = `${NORDEA_ORIGIN}/en/investors/financial-calendar`;

export const TELE2_ORIGIN = "https://www.tele2.com";
export const TELE2_PUBLISHER = "Tele2";
export const TELE2_INVESTORS_SOURCE_URL = `${TELE2_ORIGIN}/investors/`;

export const SWEDBANK_ORIGIN = "https://www.swedbank.com";
export const SWEDBANK_PUBLISHER = "Swedbank";
export const SWEDBANK_INVESTORS_SOURCE_URL = `${SWEDBANK_ORIGIN}/investor-relations.html`;
export const SWEDBANK_CALENDAR_SOURCE_URL = `${SWEDBANK_ORIGIN}/investor-relations/financial-calendar.html`;

export const INDUSTRIVARDEN_ORIGIN = "https://www.industrivarden.se";
export const INDUSTRIVARDEN_PUBLISHER = "Industrivärden";
export const INDUSTRIVARDEN_RSS_SOURCE_URL = `${INDUSTRIVARDEN_ORIGIN}/rss/`;
export const INDUSTRIVARDEN_CALENDAR_SOURCE_URL = `${INDUSTRIVARDEN_ORIGIN}/investerare/Kalender/`;

const NORDEA_PRESS_PATH = /^\/en\/press\/\d{4}-\d{2}-\d{2}\/[^/]+$/;
const TELE2_PRESS_PATH = /^\/media\/news\/\d{4}\/[^/]+\/$/;
const TELE2_REPORT_PATH = /^\/files\/.+\.pdf$/i;
const TELE2_CALENDAR_PATH = /^\/investors\/calendar\/\d{4}\/[^/]+\/$/;
const SWEDBANK_PRESS_PATH = /^\/newsroom\/press-releases\.details\.[^/]+\.html$/;
const INDUSTRIVARDEN_PRESS_PATH = /^\/media\/Pressmeddelanden\/\d{4}\/[^/]+\/$/;

const SWEDISH_MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  maj: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  okt: "10",
  nov: "11",
  dec: "12",
};

type ParsedCompanyProfile = {
  facts: CompanyFactDraft[];
  ownership: CompanyOwnershipDraft[];
};

function timestampFromDate(value: string | null) {
  return value ? isoDateOnly(value) : null;
}

function pressDocument(input: {
  title: string;
  sourceUrl: string;
  publishedAt: string;
  publisher: string;
}): NormalizedCompanyDocument | null {
  const title = decodeHtmlText(input.title).replace(/\s+/g, " ").trim();
  if (!title || title.length > 500) return null;
  return {
    documentType: "press_release",
    title,
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
  documentType: Exclude<CompanyDocumentType, "press_release" | "report_date">;
}): NormalizedCompanyDocument | null {
  const title = decodeHtmlText(input.title).replace(/\s+/g, " ").trim();
  if (!title || title.length > 500) return null;
  return {
    documentType: input.documentType,
    title,
    sourceUrl: input.sourceUrl,
    sourcePublisher: input.publisher,
    publishedAt: input.publishedAt,
    eventAt: null,
    fiscalPeriod: explicitFiscalPeriod(title) ?? swedishFiscalPeriod(title),
  };
}

function swedishReportType(title: string): "quarterly_report" | "half_year_report" | "annual_report" | null {
  const text = decodeHtmlText(title).toLowerCase();
  if (/årsredovisning|arsredovisning|bokslutsrapport/.test(text)) return "annual_report";
  if (!/delårsrapport|delarsrapport/.test(text)) return null;
  if (/30 juni|januari\s*[–-]\s*30 juni|halvår/.test(text)) return "half_year_report";
  if (/31 mars|30 september|januari\s*[–-]\s*(?:31 mars|30 september)/.test(text)) return "quarterly_report";
  return null;
}

function swedishFiscalPeriod(title: string): string | null {
  const year = title.match(/\b(20\d{2})\b/)?.[1];
  if (!year) return null;
  const type = swedishReportType(title);
  if (type === "annual_report") return year;
  if (type === "half_year_report") return `${year} H1`;
  if (type === "quarterly_report" && /31 mars/.test(title.toLowerCase())) return `${year} Q1`;
  if (type === "quarterly_report" && /30 september/.test(title.toLowerCase())) return `${year} Q3`;
  return null;
}

function englishReportType(title: string): "quarterly_report" | "half_year_report" | "annual_report" | null {
  if (/year-end report|annual report|full[- ]year/i.test(title)) return "annual_report";
  if (/\bquarter\b|\bQ[1-4]\b|nine-month/i.test(title)) return "quarterly_report";
  if (/\bH1\b|half-year|first half/i.test(title)) return "half_year_report";
  if (/interim report/i.test(title)) return "half_year_report";
  return classifyReportTitle(title);
}

export function parseNordeaInvestorNews(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  const pattern = /<h3\b[^>]*>([\s\S]*?)<\/h3>\s*<time\b[^>]*datetime="(\d{2})-(\d{2})-(\d{4})"[\s\S]*?<a\b[^>]*href="(\/en\/press\/[^"]+)"/gi;
  for (const match of html.matchAll(pattern)) {
    const publishedAt = timestampFromDate(`${match[4]}-${match[3]}-${match[2]}`);
    const sourceUrl = normalizeSameOriginUrl(match[5], NORDEA_ORIGIN, NORDEA_PRESS_PATH);
    const title = decodeHtmlText(match[1]).replace(/\s+/g, " ").trim();
    if (!publishedAt || !sourceUrl || !title) continue;
    const reportType = englishReportType(title);
    const document = reportType
      ? reportDocument({ title, sourceUrl, publishedAt, publisher: NORDEA_PUBLISHER, documentType: reportType })
      : pressDocument({ title, sourceUrl, publishedAt, publisher: NORDEA_PUBLISHER });
    if (document) documents.push(document);
  }
  return uniqueDocuments(documents, MAX_DOCUMENTS);
}

export function parseNordeaPressReleases(html: string) {
  return parseNordeaInvestorNews(html).filter((document) => document.documentType === "press_release");
}

export function parseNordeaFinancialReports(html: string) {
  return parseNordeaInvestorNews(html).filter((document) => document.documentType !== "press_release");
}

export function nordeaDividendArticleUrl(html: string): string | null {
  const reports = parseNordeaFinancialReports(html);
  const match = reports.find((document) => /dividend/i.test(document.title)) ?? reports[0];
  return match?.sourceUrl ?? null;
}

export function parseNordeaDecidedDividend(
  html: string,
  sourceUrl: string,
  sourcePublisher: string,
): ParsedCompanyProfile | null {
  const text = decodeHtmlText(html).replace(/\s+/g, " ");
  const amount = text.match(/decided to distribute a(?: mid-year)? dividend for (20\d{2}) amounting to ([A-Z]{3}) ([0-9]+(?:\.[0-9]+)?) per share/i);
  if (!amount || !normalizeSameOriginUrl(sourceUrl, NORDEA_ORIGIN, NORDEA_PRESS_PATH)) return null;
  const perShare = Number(amount[3]);
  const year = Number(amount[1]);
  if (!Number.isFinite(perShare) || perShare <= 0 || perShare >= 100_000) return null;
  const record = text.match(/dividend record date is confirmed for (\d{1,2} [A-Za-z]+ 20\d{2})/i);
  const recordDate = record ? englishDateToIso(record[1])?.slice(0, 10) ?? null : null;
  const published = sourceUrl.match(/\/en\/press\/(\d{4}-\d{2}-\d{2})\//)?.[1] ?? null;
  const asOf = published && isoDateOnly(published) ? published : null;
  const facts: CompanyFactDraft[] = [
    {
      factType: "dividend_per_share",
      valueText: null,
      valueNumeric: perShare,
      unit: amount[2],
      asOf,
      sourceUrl,
      sourcePublisher,
    },
    {
      factType: "dividend_currency",
      valueText: amount[2],
      valueNumeric: null,
      unit: null,
      asOf,
      sourceUrl,
      sourcePublisher,
    },
    {
      factType: "dividend_year",
      valueText: null,
      valueNumeric: year,
      unit: null,
      asOf,
      sourceUrl,
      sourcePublisher,
    },
    {
      factType: "dividend_kind",
      valueText: "decided",
      valueNumeric: null,
      unit: null,
      asOf,
      sourceUrl,
      sourcePublisher,
    },
  ];
  if (recordDate) {
    facts.push({
      factType: "dividend_record_date",
      valueText: recordDate,
      valueNumeric: null,
      unit: null,
      asOf,
      sourceUrl,
      sourcePublisher,
    });
  }
  return { facts, ownership: [] };
}

function gmtTimestamp(value: string): string | null {
  const cleaned = value.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const parsed = new Date(cleaned);
  if (!Number.isFinite(parsed.getTime())) return null;
  return isoTimestamp(parsed.toISOString());
}

type Tele2Card = {
  type: string;
  title: string;
  publishedAt: string;
  href: string | null;
  pdf: string | null;
};

function tele2Cards(html: string): Tele2Card[] {
  const marks = [...html.matchAll(/data-date="([^"]+)"/g)];
  return marks.flatMap((mark, index) => {
    const start = mark.index ?? 0;
    const end = marks[index + 1]?.index ?? start + 1800;
    const before = html.slice(Math.max(0, start - 4000), start);
    const after = html.slice(start, end);
    const publishedAt = gmtTimestamp(mark[1]);
    const typeMatches = [...before.matchAll(/<span class="type">([\s\S]*?)<\/span>/gi)];
    const type = decodeHtmlText(typeMatches.at(-1)?.[1] ?? "").trim();
    const title = decodeHtmlText(after.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? "").replace(/\s+/g, " ").trim();
    const href = [...before.matchAll(/<a\b[^>]*class="[^"]*blurb--large-image[^"]*"[^>]*href="([^"]+)"/gi)].at(-1)?.[1]
      ?? [...before.matchAll(/href="([^"]+)"[^>]*class="[^"]*blurb--large-image/gi)].at(-1)?.[1]
      ?? null;
    const pdf = after.match(/href="(\/files\/[^"]+\.pdf)"/i)?.[1] ?? null;
    if (!publishedAt || !type || !title) return [];
    return [{ type, title, publishedAt, href, pdf }];
  });
}

export function parseTele2InvestorCards(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const card of tele2Cards(html)) {
    if (/^press release$/i.test(card.type) && card.href) {
      const sourceUrl = normalizeSameOriginUrl(card.href, TELE2_ORIGIN, TELE2_PRESS_PATH);
      const document = sourceUrl
        ? pressDocument({ title: card.title, sourceUrl, publishedAt: card.publishedAt, publisher: TELE2_PUBLISHER })
        : null;
      if (document) documents.push(document);
      continue;
    }
    if (/interim report|annual report|year-end report/i.test(card.type)) {
      const reportType = englishReportType(card.title);
      const pdfUrl = card.pdf ? normalizeSameOriginUrl(card.pdf, TELE2_ORIGIN, TELE2_REPORT_PATH) : null;
      const articleUrl = card.href ? normalizeSameOriginUrl(card.href, TELE2_ORIGIN, /^\/investors\/reports-and-presentations\/[^/]+\/$/) : null;
      const sourceUrl = pdfUrl ?? articleUrl;
      if (!reportType || !sourceUrl) continue;
      const document = reportDocument({
        title: card.title,
        sourceUrl,
        publishedAt: card.publishedAt,
        publisher: TELE2_PUBLISHER,
        documentType: reportType,
      });
      if (document) documents.push(document);
      continue;
    }
    if (/^calendar$/i.test(card.type) && card.href) {
      const sourceUrl = normalizeSameOriginUrl(card.href, TELE2_ORIGIN, TELE2_CALENDAR_PATH);
      const title = decodeHtmlText(card.title).replace(/\s+/g, " ").trim();
      if (!sourceUrl || !title) continue;
      documents.push({
        documentType: "report_date",
        title,
        sourceUrl,
        sourcePublisher: TELE2_PUBLISHER,
        publishedAt: null,
        eventAt: card.publishedAt,
        fiscalPeriod: explicitFiscalPeriod(title),
      });
    }
  }
  return uniqueDocuments(documents, MAX_DOCUMENTS);
}

export function parseTele2PressReleases(html: string) {
  return parseTele2InvestorCards(html).filter((document) => document.documentType === "press_release");
}

export function parseTele2FinancialReports(html: string) {
  return parseTele2InvestorCards(html).filter((document) =>
    document.documentType === "quarterly_report"
    || document.documentType === "half_year_report"
    || document.documentType === "annual_report",
  );
}

export function parseTele2Calendar(html: string) {
  return parseTele2InvestorCards(html).filter((document) => document.documentType === "report_date");
}

export function parseTele2Ceo(html: string, sourceUrl: string, sourcePublisher: string): ParsedCompanyProfile | null {
  const names = [...html.matchAll(/<span class="quote-with-reference__name">([^<]+)<\/span>\s*<span class="quote-with-reference__title">President and Group CEO<\/span>/gi)]
    .map((match) => decodeHtmlText(match[1]).replace(/\s+/g, " ").trim());
  const unique = [...new Set(names)];
  if (unique.length !== 1 || unique[0].split(/\s+/).length < 2 || unique[0].length > 80) return null;
  return {
    facts: [{
      factType: "ceo",
      valueText: unique[0],
      valueNumeric: null,
      unit: null,
      asOf: null,
      sourceUrl,
      sourcePublisher,
    }],
    ownership: [],
  };
}

export function parseSwedbankInvestorNews(html: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  const pattern = /<div class="timestamp">(\d{4}-\d{2}-\d{2})[^<]*<\/div>[\s\S]*?<a class="general-link" href="([^"]+)">([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const publishedAt = timestampFromDate(match[1]);
    const sourceUrl = normalizeSameOriginUrl(match[2], SWEDBANK_ORIGIN, SWEDBANK_PRESS_PATH);
    const title = decodeHtmlText(match[3]).replace(/\s+/g, " ").trim();
    if (!publishedAt || !sourceUrl || !title) continue;
    const reportType = isReportPublicationTitle(title) ? englishReportType(title) : null;
    const document = reportType
      ? reportDocument({ title, sourceUrl, publishedAt, publisher: SWEDBANK_PUBLISHER, documentType: reportType })
      : pressDocument({ title, sourceUrl, publishedAt, publisher: SWEDBANK_PUBLISHER });
    if (document) documents.push(document);
  }
  return uniqueDocuments(documents, MAX_DOCUMENTS);
}

export function parseSwedbankPressReleases(html: string) {
  return parseSwedbankInvestorNews(html).filter((document) => document.documentType === "press_release");
}

export function parseSwedbankFinancialReports(html: string) {
  return parseSwedbankInvestorNews(html).filter((document) => document.documentType !== "press_release");
}

type RssItem = {
  title: string;
  sourceUrl: string;
  publishedAt: string;
};

function industrivardenRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  for (const match of xml.matchAll(/<item\b([^>]*)>([\s\S]*?)<\/item>/gi)) {
    const base = match[1].match(/xml:base="([^"]+)"/i)?.[1] ?? "";
    const title = decodeHtmlText(match[2].match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim();
    const pubDate = match[2].match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() ?? "";
    const parsed = new Date(pubDate);
    const publishedAt = Number.isFinite(parsed.getTime()) ? isoTimestamp(parsed.toISOString()) : null;
    const sourceUrl = normalizeSameOriginUrl(base, INDUSTRIVARDEN_ORIGIN, INDUSTRIVARDEN_PRESS_PATH);
    if (!title || !publishedAt || !sourceUrl) continue;
    items.push({ title, sourceUrl, publishedAt });
  }
  return items.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function parseIndustrivardenRss(xml: string): NormalizedCompanyDocument[] {
  const documents: NormalizedCompanyDocument[] = [];
  for (const item of industrivardenRssItems(xml)) {
    const swedish = swedishReportType(item.title);
    const document = swedish
      ? reportDocument({
        title: item.title,
        sourceUrl: item.sourceUrl,
        publishedAt: item.publishedAt,
        publisher: INDUSTRIVARDEN_PUBLISHER,
        documentType: swedish,
      })
      : pressDocument({
        title: item.title,
        sourceUrl: item.sourceUrl,
        publishedAt: item.publishedAt,
        publisher: INDUSTRIVARDEN_PUBLISHER,
      });
    if (document) documents.push(document);
  }
  return uniqueDocuments(documents, MAX_DOCUMENTS);
}

export function parseIndustrivardenPressReleases(xml: string) {
  return parseIndustrivardenRss(xml).filter((document) => document.documentType === "press_release");
}

export function parseIndustrivardenFinancialReports(xml: string) {
  return parseIndustrivardenRss(xml).filter((document) => document.documentType !== "press_release");
}

export function parseIndustrivardenCalendar(html: string, pageUrl = INDUSTRIVARDEN_CALENDAR_SOURCE_URL): NormalizedCompanyDocument[] {
  const list = html.slice(html.indexOf("c-calendarevent-list"));
  const documents: NormalizedCompanyDocument[] = [];
  const pattern = /date-number">(\d{1,2})<\/span>\s*<span class="c-calendarevent-teaser-item__date-month">([a-zåäö]{3})<\/span>[\s\S]*?__heading">([^<]+)/gi;
  for (const match of list.matchAll(pattern)) {
    const title = decodeHtmlText(match[3]).replace(/\s+/g, " ").trim();
    const years = [...title.matchAll(/\b(20\d{2})\b/g)].map((year) => year[1]);
    const month = SWEDISH_MONTHS[match[2].toLowerCase()];
    if (!month || years.length !== 1 || !title) continue;
    const day = match[1].padStart(2, "0");
    const eventAt = timestampFromDate(`${years[0]}-${month}-${day}`);
    if (!eventAt) continue;
    const sourceUrl = officialEventUrl(pageUrl, eventAt, title);
    if (!sourceUrl) continue;
    documents.push({
      documentType: "report_date",
      title,
      sourceUrl,
      sourcePublisher: INDUSTRIVARDEN_PUBLISHER,
      publishedAt: null,
      eventAt,
      fiscalPeriod: null,
    });
  }
  return uniqueDocuments(documents, MAX_DOCUMENTS);
}
