import {
  ATLAS_COPCO_CALENDAR_SOURCE_URL,
  ATLAS_COPCO_REPORTS_SOURCE_URL,
  parseAtlasCopcoCalendar,
  parseAtlasCopcoFinancialReports,
} from "@/lib/companies/ingestion/adapters/atlas-copco-financials";
import { ATLAS_COPCO_ORIGIN, ATLAS_COPCO_PRESS_RELEASE_SOURCE_URL } from "@/lib/companies/ingestion/adapters/atlas-copco";
import {
  ASTRAZENECA_CALENDAR_SOURCE_URL,
  ASTRAZENECA_ORIGIN,
  ASTRAZENECA_PRESS_RELEASE_SOURCE_URL,
  ASTRAZENECA_REPORTS_SOURCE_URL,
  ASTRAZENECA_SITEMAP_URL,
  parseAstraZenecaCalendar,
  parseAstraZenecaPressRelease,
  parseAstraZenecaPressSitemap,
  parseAstraZenecaReports,
} from "@/lib/companies/ingestion/adapters/astrazeneca";
import {
  ERICSSON_CALENDAR_SOURCE_URL,
  ERICSSON_ORIGIN,
  ERICSSON_PRESS_RELEASE_SOURCE_URL,
  ERICSSON_REPORTS_SOURCE_URL,
  parseEricssonOfficialHtml,
} from "@/lib/companies/ingestion/adapters/ericsson";
import {
  INVESTOR_CALENDAR_SOURCE_URL,
  INVESTOR_ORIGIN,
  INVESTOR_PRESS_RELEASE_SOURCE_URL,
  INVESTOR_REPORTS_SOURCE_URL,
  investorPageEmbedsAlertIr,
  latestInvestorReportYearUrl,
  parseInvestorFinancialReports,
  parseInvestorIngestionPressReleases,
} from "@/lib/companies/ingestion/adapters/investor";
import {
  VOLVO_CALENDAR_SOURCE_URL,
  VOLVO_MAX_HTML_BYTES,
  VOLVO_ORIGIN,
  VOLVO_PRESS_RELEASE_SOURCE_URL,
  VOLVO_REPORTS_SOURCE_URL,
  parseVolvoCalendar,
  parseVolvoPressReleases,
  parseVolvoReportCandidates,
  parseVolvoReportDetail,
} from "@/lib/companies/ingestion/adapters/volvo";
import {
  validateNormalizedCompanyDocument,
  type CompanySourceType,
  type NormalizedCompanyDocument,
} from "@/lib/companies/ingestion/document";
import { JOB_DEADLINE_EXCEEDED } from "@/lib/companies/ingestion/deadline";
import {
  fetchOfficialText,
  INGESTION_MAX_HTML_BYTES,
  INGESTION_MAX_SITEMAP_BYTES,
  pauseBetweenRequests,
  type SourceFetchContext,
} from "@/lib/companies/ingestion/fetch-source";
import {
  isSupportedCompanyIngestionSlug,
  type SupportedCompanyIngestionSlug,
} from "@/lib/companies/ingestion/queue";
import { loadAtlasCopcoPressReleaseDocuments } from "@/lib/companies/ingestion/workers/atlas-copco";

const HTML = ["text/html"] as const;
const XML = ["application/xml", "text/xml"] as const;

export type CollectedCompanySource =
  | { status: "ok"; documents: NormalizedCompanyDocument[] }
  | { status: "error"; reason: string };

const EXPECTED_SOURCE_URLS: Record<
  SupportedCompanyIngestionSlug,
  Record<CompanySourceType, string>
> = {
  investor: {
    press_releases: INVESTOR_PRESS_RELEASE_SOURCE_URL,
    financial_reports: INVESTOR_REPORTS_SOURCE_URL,
    financial_calendar: INVESTOR_CALENDAR_SOURCE_URL,
  },
  volvo: {
    press_releases: VOLVO_PRESS_RELEASE_SOURCE_URL,
    financial_reports: VOLVO_REPORTS_SOURCE_URL,
    financial_calendar: VOLVO_CALENDAR_SOURCE_URL,
  },
  ericsson: {
    press_releases: ERICSSON_PRESS_RELEASE_SOURCE_URL,
    financial_reports: ERICSSON_REPORTS_SOURCE_URL,
    financial_calendar: ERICSSON_CALENDAR_SOURCE_URL,
  },
  "atlas-copco": {
    press_releases: ATLAS_COPCO_PRESS_RELEASE_SOURCE_URL,
    financial_reports: ATLAS_COPCO_REPORTS_SOURCE_URL,
    financial_calendar: ATLAS_COPCO_CALENDAR_SOURCE_URL,
  },
  astrazeneca: {
    press_releases: ASTRAZENECA_PRESS_RELEASE_SOURCE_URL,
    financial_reports: ASTRAZENECA_REPORTS_SOURCE_URL,
    financial_calendar: ASTRAZENECA_CALENDAR_SOURCE_URL,
  },
};

const ALLOWED_ORIGINS: Record<SupportedCompanyIngestionSlug, readonly string[]> = {
  investor: [INVESTOR_ORIGIN],
  volvo: [VOLVO_ORIGIN],
  ericsson: [ERICSSON_ORIGIN],
  "atlas-copco": [ATLAS_COPCO_ORIGIN],
  astrazeneca: [ASTRAZENECA_ORIGIN],
};

function fetchFailure(prefix: string, reason: string): CollectedCompanySource {
  if (reason === JOB_DEADLINE_EXCEEDED) {
    return { status: "error", reason: JOB_DEADLINE_EXCEEDED };
  }

  return { status: "error", reason: `${prefix}_${reason}` };
}

async function pauseOrStop(
  context: SourceFetchContext,
): Promise<CollectedCompanySource | null> {
  if ((await pauseBetweenRequests(context)) === JOB_DEADLINE_EXCEEDED) {
    return { status: "error", reason: JOB_DEADLINE_EXCEEDED };
  }

  return null;
}

function acceptDocuments(
  documents: readonly NormalizedCompanyDocument[],
  allowedOrigins: readonly string[],
): CollectedCompanySource {
  const valid = documents.filter((document) =>
    validateNormalizedCompanyDocument(document, allowedOrigins),
  );
  if (valid.length === 0) {
    return { status: "error", reason: "no_valid_documents" };
  }

  return { status: "ok", documents: valid };
}

async function fetchHtml(
  url: string,
  origin: string,
  context: SourceFetchContext,
  options?: { allowSearch?: boolean; maxBytes?: number },
) {
  return fetchOfficialText(url, context, {
    allowedOrigin: origin,
    acceptedContentTypes: HTML,
    maxBytes: options?.maxBytes ?? INGESTION_MAX_HTML_BYTES,
    allowSearch: options?.allowSearch,
  });
}

export function expectedCompanySourceUrl(
  slug: SupportedCompanyIngestionSlug,
  sourceType: CompanySourceType,
): string {
  return EXPECTED_SOURCE_URLS[slug][sourceType];
}

export function companyDocumentOrigins(
  slug: SupportedCompanyIngestionSlug,
): readonly string[] {
  return ALLOWED_ORIGINS[slug];
}

export async function collectCompanySource(
  slug: string,
  source: { sourceType: CompanySourceType; sourceUrl: string },
  context: SourceFetchContext,
): Promise<CollectedCompanySource> {
  if (!isSupportedCompanyIngestionSlug(slug)) {
    return { status: "error", reason: "unsupported_company" };
  }

  if (source.sourceUrl !== expectedCompanySourceUrl(slug, source.sourceType)) {
    return { status: "error", reason: "unexpected_source_url" };
  }

  const origins = companyDocumentOrigins(slug);
  switch (slug) {
    case "investor":
      return collectInvestor(source.sourceType, context, origins);
    case "volvo":
      return collectVolvo(source.sourceType, context, origins);
    case "ericsson":
      return collectEricsson(source.sourceType, source.sourceUrl, context);
    case "atlas-copco":
      return collectAtlasCopco(source.sourceType, context, origins);
    case "astrazeneca":
      return collectAstraZeneca(source.sourceType, context, origins);
    default:
      return { status: "error", reason: "unsupported_company" };
  }
}

async function collectInvestor(
  sourceType: CompanySourceType,
  context: SourceFetchContext,
  origins: readonly string[],
): Promise<CollectedCompanySource> {
  if (sourceType === "financial_reports") {
    const landing = await fetchHtml(INVESTOR_REPORTS_SOURCE_URL, INVESTOR_ORIGIN, context);
    if (landing.status === "error") {
      return fetchFailure("listing", landing.reason);
    }

    const yearUrl = latestInvestorReportYearUrl(landing.text);
    if (!yearUrl) {
      return { status: "error", reason: "no_valid_documents" };
    }

    const paused = await pauseOrStop(context);
    if (paused) {
      return paused;
    }
    const yearPage = await fetchHtml(yearUrl, INVESTOR_ORIGIN, context);
    if (yearPage.status === "error") {
      return fetchFailure("detail", yearPage.reason);
    }

    return acceptDocuments(parseInvestorFinancialReports(yearPage.text), origins);
  }

  const pageUrl = sourceType === "press_releases"
    ? INVESTOR_PRESS_RELEASE_SOURCE_URL
    : INVESTOR_CALENDAR_SOURCE_URL;
  const page = await fetchHtml(pageUrl, INVESTOR_ORIGIN, context);
  if (page.status === "error") {
    return fetchFailure("listing", page.reason);
  }

  if (sourceType === "press_releases") {
    const documents = parseInvestorIngestionPressReleases(page.text);
    if (documents.length === 0 && investorPageEmbedsAlertIr(page.text)) {
      return { status: "error", reason: "alertir_embed_not_automated" };
    }

    return acceptDocuments(documents, origins);
  }

  if (investorPageEmbedsAlertIr(page.text)) {
    return { status: "error", reason: "alertir_embed_not_automated" };
  }

  return { status: "error", reason: "no_valid_documents" };
}

async function collectVolvo(
  sourceType: CompanySourceType,
  context: SourceFetchContext,
  origins: readonly string[],
): Promise<CollectedCompanySource> {
  if (sourceType === "press_releases") {
    const page = await fetchHtml(VOLVO_PRESS_RELEASE_SOURCE_URL, VOLVO_ORIGIN, context, {
      maxBytes: VOLVO_MAX_HTML_BYTES,
    });
    if (page.status === "error") {
      return fetchFailure("listing", page.reason);
    }

    return acceptDocuments(parseVolvoPressReleases(page.text), origins);
  }

  if (sourceType === "financial_calendar") {
    const page = await fetchHtml(VOLVO_CALENDAR_SOURCE_URL, VOLVO_ORIGIN, context, {
      maxBytes: VOLVO_MAX_HTML_BYTES,
    });
    if (page.status === "error") {
      return fetchFailure("listing", page.reason);
    }

    return acceptDocuments(parseVolvoCalendar(page.text, context.now), origins);
  }

  const page = await fetchHtml(VOLVO_REPORTS_SOURCE_URL, VOLVO_ORIGIN, context, {
    maxBytes: VOLVO_MAX_HTML_BYTES,
  });
  if (page.status === "error") {
    return fetchFailure("listing", page.reason);
  }

  const documents: NormalizedCompanyDocument[] = [];
  for (const candidate of parseVolvoReportCandidates(page.text)) {
    const paused = await pauseOrStop(context);
    if (paused) {
      return paused;
    }
    const detail = await fetchHtml(candidate.detailUrl, VOLVO_ORIGIN, context, {
      maxBytes: VOLVO_MAX_HTML_BYTES,
    });
    if (detail.status === "error") {
      return fetchFailure("detail", detail.reason);
    }

    const document = parseVolvoReportDetail(detail.text, candidate.detailUrl, candidate.title);
    if (document) {
      documents.push(document);
    }
  }

  return acceptDocuments(documents, origins);
}

async function collectEricsson(
  sourceType: CompanySourceType,
  sourceUrl: string,
  context: SourceFetchContext,
): Promise<CollectedCompanySource> {
  const page = await fetchHtml(sourceUrl, ERICSSON_ORIGIN, context, {
    allowSearch: sourceType === "press_releases",
  });
  if (page.status === "error") {
    return fetchFailure("listing", page.reason);
  }

  const parsed = parseEricssonOfficialHtml(page.text);
  return { status: "error", reason: parsed.reason };
}

async function collectAtlasCopco(
  sourceType: CompanySourceType,
  context: SourceFetchContext,
  origins: readonly string[],
): Promise<CollectedCompanySource> {
  if (sourceType === "press_releases") {
    const loaded = await loadAtlasCopcoPressReleaseDocuments(context);
    if (loaded.status === "error") {
      return loaded;
    }

    return acceptDocuments(
      loaded.documents.map((document) => ({
        documentType: document.documentType,
        title: document.title,
        sourceUrl: document.sourceUrl,
        sourcePublisher: document.sourcePublisher,
        publishedAt: document.publishedAt,
        eventAt: null,
        fiscalPeriod: null,
      })),
      origins,
    );
  }

  const pageUrl = sourceType === "financial_reports"
    ? ATLAS_COPCO_REPORTS_SOURCE_URL
    : ATLAS_COPCO_CALENDAR_SOURCE_URL;
  const page = await fetchHtml(pageUrl, ATLAS_COPCO_ORIGIN, context);
  if (page.status === "error") {
    return fetchFailure("listing", page.reason);
  }

  const documents = sourceType === "financial_reports"
    ? parseAtlasCopcoFinancialReports(page.text)
    : parseAtlasCopcoCalendar(page.text, context.now);
  return acceptDocuments(documents, origins);
}

async function collectAstraZeneca(
  sourceType: CompanySourceType,
  context: SourceFetchContext,
  origins: readonly string[],
): Promise<CollectedCompanySource> {
  if (sourceType === "financial_reports") {
    const page = await fetchHtml(ASTRAZENECA_REPORTS_SOURCE_URL, ASTRAZENECA_ORIGIN, context);
    if (page.status === "error") {
      return fetchFailure("listing", page.reason);
    }

    return acceptDocuments(parseAstraZenecaReports(page.text), origins);
  }

  if (sourceType === "financial_calendar") {
    const page = await fetchHtml(ASTRAZENECA_CALENDAR_SOURCE_URL, ASTRAZENECA_ORIGIN, context);
    if (page.status === "error") {
      return fetchFailure("listing", page.reason);
    }

    return acceptDocuments(parseAstraZenecaCalendar(page.text, context.now), origins);
  }

  const sitemap = await fetchOfficialText(ASTRAZENECA_SITEMAP_URL, context, {
    allowedOrigin: ASTRAZENECA_ORIGIN,
    acceptedContentTypes: XML,
    maxBytes: INGESTION_MAX_SITEMAP_BYTES,
  });
  if (sitemap.status === "error") {
    return fetchFailure("sitemap", sitemap.reason);
  }

  const discovered = parseAstraZenecaPressSitemap(sitemap.text);
  if (discovered.status === "invalid" || discovered.candidates.length === 0) {
    return { status: "error", reason: "sitemap_invalid" };
  }

  const documents: NormalizedCompanyDocument[] = [];
  for (const candidate of discovered.candidates) {
    if (candidate.sourceUrl.includes("/content/astraz")) {
      return { status: "error", reason: "robots_disallowed_listing" };
    }

    const paused = await pauseOrStop(context);
    if (paused) {
      return paused;
    }
    const detail = await fetchHtml(candidate.sourceUrl, ASTRAZENECA_ORIGIN, context);
    if (detail.status === "error") {
      return fetchFailure("detail", detail.reason);
    }

    const document = parseAstraZenecaPressRelease(detail.text, candidate.sourceUrl);
    if (document) {
      documents.push(document);
    }
  }

  return acceptDocuments(documents, origins);
}
