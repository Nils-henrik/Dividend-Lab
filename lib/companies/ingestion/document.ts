const DOCUMENT_TYPES = [
  "press_release",
  "quarterly_report",
  "half_year_report",
  "annual_report",
  "report_date",
] as const;

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const SIMPLE_HASH = /^#[a-z0-9-]+$/;

export type CompanyDocumentType = (typeof DOCUMENT_TYPES)[number];

export type CompanySourceType =
  | "press_releases"
  | "financial_reports"
  | "financial_calendar";

export const COMPANY_SOURCE_TYPES = [
  "press_releases",
  "financial_reports",
  "financial_calendar",
] as const satisfies readonly CompanySourceType[];

export type NormalizedCompanyDocument = {
  documentType: CompanyDocumentType;
  title: string;
  sourceUrl: string;
  sourcePublisher: string;
  publishedAt: string | null;
  eventAt: string | null;
  fiscalPeriod: string | null;
};

export function isCompanyDocumentType(value: string): value is CompanyDocumentType {
  return (DOCUMENT_TYPES as readonly string[]).includes(value);
}

export function isCanonicalDocumentUrl(
  value: string,
  allowedOrigins: readonly string[],
): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      allowedOrigins.includes(url.origin) &&
      url.username === "" &&
      url.password === "" &&
      url.port === "" &&
      url.search === "" &&
      (url.hash === "" || SIMPLE_HASH.test(url.hash)) &&
      value.length <= 2000
    );
  } catch {
    return false;
  }
}

export function validateNormalizedCompanyDocument(
  document: NormalizedCompanyDocument,
  allowedOrigins: readonly string[],
): boolean {
  if (!isCompanyDocumentType(document.documentType)) {
    return false;
  }

  if (
    document.title.length < 1 ||
    document.title.length > 500 ||
    document.sourcePublisher.length < 1 ||
    document.sourcePublisher.length > 160 ||
    !isCanonicalDocumentUrl(document.sourceUrl, allowedOrigins)
  ) {
    return false;
  }

  if (
    document.fiscalPeriod !== null &&
    (document.fiscalPeriod.length < 1 || document.fiscalPeriod.length > 32)
  ) {
    return false;
  }

  const publishedAtValid =
    document.publishedAt === null || ISO_TIMESTAMP.test(document.publishedAt);
  const eventAtValid =
    document.eventAt === null || ISO_TIMESTAMP.test(document.eventAt);
  if (!publishedAtValid || !eventAtValid) {
    return false;
  }

  if (document.documentType === "report_date") {
    return document.eventAt !== null && document.publishedAt === null;
  }

  return document.publishedAt !== null && document.eventAt === null;
}

const QUARTER_WORDS: Record<string, string> = {
  first: "Q1",
  second: "Q2",
  third: "Q3",
  fourth: "Q4",
};

export function explicitFiscalPeriod(title: string): string | null {
  const yearMatch = title.match(/\b(20\d{2})\b/);
  if (!yearMatch) {
    return null;
  }

  const year = yearMatch[1];
  const quarterToken = title.match(/\bQ([1-4])\b/i);
  if (quarterToken && !/\bH1\b|half-year|full year/i.test(title)) {
    return `${year} Q${quarterToken[1]}`;
  }

  for (const [word, quarter] of Object.entries(QUARTER_WORDS)) {
    if (new RegExp(`\\b${word}\\s+quarter\\b`, "i").test(title)) {
      return `${year} ${quarter}`;
    }
  }

  if (/\bH1\b|half-year/i.test(title)) {
    return `${year} H1`;
  }

  if (/annual report|full[- ]year/i.test(title)) {
    return year;
  }

  return null;
}

export function classifyReportTitle(
  title: string,
): "quarterly_report" | "half_year_report" | "annual_report" | null {
  if (!/(report|results|quarter)/i.test(title)) {
    return null;
  }

  if (/annual report|full year/i.test(title)) {
    return "annual_report";
  }

  if (/\bH1\b|half-year|interim report/i.test(title)) {
    return "half_year_report";
  }

  if (/\bQ[1-4]\b|quarter/i.test(title)) {
    return "quarterly_report";
  }

  return null;
}

export function isReportPublicationTitle(title: string): boolean {
  if (/silent period|capital markets|conference|roadshow|presentation/i.test(title)) {
    return false;
  }

  return classifyReportTitle(title) !== null || /\bresults\b/i.test(title);
}
