import type { OfficialItem } from "@/lib/companies/investor-official";

export type ViewableCompanyDocument = {
  type:
    | "press_release"
    | "quarterly_report"
    | "half_year_report"
    | "annual_report"
    | "report_date";
  title: string;
  url: string;
  publishedAt: string | null;
  eventAt: string | null;
};

const REPORT_TYPES = new Set([
  "quarterly_report",
  "half_year_report",
  "annual_report",
]);

const SOURCE_PUBLISHERS: Record<string, string> = {
  investor: "Investor AB",
  volvo: "Volvo Group",
  ericsson: "Ericsson",
  "atlas-copco": "Atlas Copco Group",
  astrazeneca: "AstraZeneca",
};

function day(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
}

function toItem(document: ViewableCompanyDocument, date: string | null): OfficialItem {
  return {
    title: document.title,
    date,
    url: document.url,
  };
}

export function classifyCompanyDocuments(
  documents: readonly ViewableCompanyDocument[],
  now = new Date(),
): {
  pressReleases: OfficialItem[];
  reports: OfficialItem[];
  events: OfficialItem[];
} {
  const pressReleases = documents
    .filter((document) => document.type === "press_release")
    .map((document) => toItem(document, day(document.publishedAt)))
    .sort((first, second) => (second.date ?? "").localeCompare(first.date ?? ""));
  const reports = documents
    .filter((document) => REPORT_TYPES.has(document.type))
    .map((document) => toItem(document, day(document.publishedAt)))
    .sort((first, second) => (second.date ?? "").localeCompare(first.date ?? ""));
  const events = documents
    .filter((document) => {
      if (document.type !== "report_date" || !document.eventAt) {
        return false;
      }

      return new Date(document.eventAt).getTime() >= now.getTime();
    })
    .map((document) => toItem(document, day(document.eventAt)))
    .sort((first, second) => (first.date ?? "").localeCompare(second.date ?? ""));

  return { pressReleases, reports, events };
}

export function companySourceDisclaimer(company: {
  slug: string;
  name: string;
}): string {
  const publisher = SOURCE_PUBLISHERS[company.slug] ?? company.name;
  return `Kursdata från Yahoo Finance och TradingView kan vara fördröjd. Officiella pressmeddelanden, rapporter och kalenderdatum hämtas från ${publisher}. Informationen utgör inte investeringsrådgivning.`;
}
