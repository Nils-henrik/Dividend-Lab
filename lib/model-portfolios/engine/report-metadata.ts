import "server-only";

/**
 * Deterministic report-period and evidence-kind helpers for official Nordic
 * disclosures. Never invent a quarter/year when the title/document is ambiguous.
 */

export type ReportPeriod = "Q1" | "Q2" | "Q3" | "Q4" | "H1" | "H2" | "FY";

export type OfficialDocumentType =
  | "interim_report"
  | "quarterly_report"
  | "half_year_report"
  | "annual_report"
  | "year_end_report"
  | "company_release";

export type PrimaryEvidenceKind = "company_report" | "company_release" | "regulatory_filing";

export type ParsedReportMetadata = {
  reportPeriod: ReportPeriod | null;
  reportYear: number | null;
  documentType: OfficialDocumentType;
  looksLikeReportDocument: boolean;
};

const REPORT_CATEGORY =
  /(?:half\s*year\s*financial\s*report|interim\s*report|quarterly\s*(?:financial\s*)?report|annual\s*(?:financial\s*)?report|year[-\s]?end\s*report|financial\s*statement|delårsrapport|kvartalsrapport|halvårsrapport|årsredovisning|årsrapport|bokslutskommunik[eé])/iu;

const REGULATORY_CATEGORY =
  /(?:inside\s*information|major\s*shareholder|flagging|disclosure\s*of\s*managers|regulatory\s*filing|prospekt|prospectus)/iu;

export function parseReportMetadata(input: {
  title: string;
  category?: string | null;
  fileName?: string | null;
}): ParsedReportMetadata {
  // Period/year must come from title/category text — filenames like q2.pdf are not explicit.
  const periodHaystack = [input.title, input.category ?? ""].join("\n");
  const typeHaystack = [input.title, input.category ?? "", input.fileName ?? ""].join("\n");
  const looksLikeReportDocument = REPORT_CATEGORY.test(typeHaystack);
  const documentType = classifyDocumentType(typeHaystack, looksLikeReportDocument);
  return {
    reportPeriod: extractReportPeriod(periodHaystack),
    reportYear: extractReportYear(periodHaystack),
    documentType,
    looksLikeReportDocument,
  };
}

export function classifyPrimaryEvidenceKind(input: {
  title: string;
  category?: string | null;
  documentRetrieved: boolean;
  looksLikeReportDocument: boolean;
}): PrimaryEvidenceKind {
  const category = input.category ?? "";
  if (REGULATORY_CATEGORY.test(`${input.title}\n${category}`) && !input.looksLikeReportDocument) {
    return "regulatory_filing";
  }
  // A report headline alone is never enough for company_report — the document
  // must have been retrieved and bounded text extracted.
  if (input.documentRetrieved && input.looksLikeReportDocument) {
    return "company_report";
  }
  return "company_release";
}

function classifyDocumentType(haystack: string, looksLikeReport: boolean): OfficialDocumentType {
  if (/bokslutskommunik[eé]|year[-\s]?end/iu.test(haystack)) return "year_end_report";
  if (/årsredovisning|årsrapport|annual\s*(?:financial\s*)?report/iu.test(haystack)) {
    return "annual_report";
  }
  if (/half\s*year|halvår|h\s*[12]\b|january\s*[-–]\s*june|juli\s*[-–]\s*december|july\s*[-–]\s*december/iu.test(haystack)) {
    return "half_year_report";
  }
  if (/q\s*[1-4]\b|kvartal|quarterly/iu.test(haystack)) return "quarterly_report";
  if (/interim|delårsrapport/iu.test(haystack)) return "interim_report";
  return looksLikeReport ? "interim_report" : "company_release";
}

export function extractReportPeriod(text: string): ReportPeriod | null {
  const normalized = text.replace(/\s+/g, " ");

  // Explicit quarter markers win over half-year when both appear.
  const quarter = normalized.match(/\bQ\s*([1-4])\b/i)?.[1]
    ?? normalized.match(/\b(?:kvartal(?:et)?|quarter)\s*([1-4])\b/i)?.[1]
    ?? quarterFromOrdinal(normalized);
  if (quarter === "1") return "Q1";
  if (quarter === "2") return "Q2";
  if (quarter === "3") return "Q3";
  if (quarter === "4") return "Q4";

  if (/\bH\s*1\b/i.test(normalized) || /january\s*[-–]\s*june/i.test(normalized) || /januari\s*[-–]\s*juni/i.test(normalized)) {
    return "H1";
  }
  if (/\bH\s*2\b/i.test(normalized) || /july\s*[-–]\s*december/i.test(normalized) || /juli\s*[-–]\s*december/i.test(normalized)) {
    return "H2";
  }
  if (/half\s*year/i.test(normalized) || /halvår/i.test(normalized)) {
    // Ambiguous half without H1/H2 or month span — do not invent.
    return null;
  }
  if (
    /\bFY\b/i.test(normalized)
    || /full\s*year/i.test(normalized)
    || /årsredovisning|årsrapport|bokslutskommunik[eé]|year[-\s]?end|annual\s*(?:financial\s*)?report/i.test(normalized)
  ) {
    return "FY";
  }
  return null;
}

export function extractReportYear(text: string): number | null {
  const years = [...text.matchAll(/\b(20\d{2})\b/g)].map((match) => Number(match[1]));
  const unique = [...new Set(years.filter((year) => year >= 2000 && year <= 2100))];
  // Ambiguous multi-year titles must not invent a single report year.
  if (unique.length !== 1) return null;
  return unique[0]!;
}

function quarterFromOrdinal(text: string): string | null {
  if (/first\s+quarter|första\s+kvartalet/i.test(text)) return "1";
  if (/second\s+quarter|andra\s+kvartalet/i.test(text)) return "2";
  if (/third\s+quarter|tredje\s+kvartalet/i.test(text)) return "3";
  if (/fourth\s+quarter|fjärde\s+kvartalet/i.test(text)) return "4";
  return null;
}
