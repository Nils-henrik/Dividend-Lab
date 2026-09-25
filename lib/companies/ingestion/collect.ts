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
  ADDTECH_CALENDAR_SOURCE_URL,
  ADDTECH_CISION_FEED_URL,
  ADDTECH_CISION_IDENTIFIER,
  ADDTECH_FEED_ORIGIN,
  ADDTECH_ORIGIN,
  ADDTECH_PRESS_FEED,
  ADDTECH_PRESS_RELEASE_SOURCE_URL,
  ADDTECH_REPORT_FEED,
  ADDTECH_REPORTS_SOURCE_URL,
  EQT_CALENDAR_SOURCE_URL,
  EQT_ORIGIN,
  EQT_PRESS_RELEASE_SOURCE_URL,
  EQT_REPORTS_SOURCE_URL,
  EVOLUTION_CALENDAR_SOURCE_URL,
  EVOLUTION_ORIGIN,
  EVOLUTION_PRESS_RELEASE_SOURCE_URL,
  EVOLUTION_REPORTS_SOURCE_URL,
  NIBE_ARCHIVE_WIDGET_URL,
  NIBE_CALENDAR_SOURCE_URL,
  NIBE_CALENDAR_WIDGET_URL,
  NIBE_INVESTORS_SOURCE_URL,
  NIBE_ORIGIN,
  NIBE_PRESS_RELEASE_SOURCE_URL,
  NIBE_REPORTS_SOURCE_URL,
  NIBE_WIDGET_ORIGIN,
  issuerPageEmbedsMarker,
  parseAddtechCalendar,
  parseAddtechCisionFeed,
  parseEqtCalendar,
  parseEqtFinancialReports,
  parseEqtPressReleases,
  parseEvolutionCalendar,
  parseEvolutionFinancialReports,
  parseEvolutionPressReleases,
  parseNibeCalendar,
  parseNibeFinancialReports,
  parseNibePressReleases,
} from "@/lib/companies/ingestion/adapters/omxs30-completion";
import {
  ESSITY_CALENDAR_SOURCE_URL,
  ESSITY_ORIGIN,
  ESSITY_PRESS_RELEASE_SOURCE_URL,
  ESSITY_REPORTS_SOURCE_URL,
  HM_CALENDAR_SOURCE_URL,
  HM_ORIGIN,
  HM_PRESS_RELEASE_SOURCE_URL,
  HM_REPORTS_SOURCE_URL,
  parseEssityCalendar,
  parseEssityFinancialReports,
  parseEssityPressReleases,
  parseHmCalendar,
  parseHmFinancialReports,
  parseHmPressReleases,
} from "@/lib/companies/ingestion/adapters/omxs30-essity-hm";
import {
  ALFA_LAVAL_CALENDAR_SOURCE_URL,
  ALFA_LAVAL_NEWSROOM_SOURCE_URL,
  ALFA_LAVAL_ORIGIN,
  ASSA_ABLOY_CALENDAR_SOURCE_URL,
  ASSA_ABLOY_INTERIM_REPORTS_SOURCE_URL,
  ASSA_ABLOY_ORIGIN,
  ASSA_ABLOY_PRESS_JSON_URL,
  ASSA_ABLOY_PRESS_SOURCE_URL,
  HANDELSBANKEN_IR_SOURCE_URL,
  HANDELSBANKEN_ORIGIN,
  HANDELSBANKEN_PRESS_SOURCE_URL,
  parseAlfaLavalFinancialNews,
  parseAlfaLavalReportCandidates,
  parseAlfaLavalReportPdf,
  parseAssaAbloyFinancialReports,
  parseAssaAbloyPressConfig,
  parseAssaAbloyPressReleases,
  parseHandelsbankenCalendar,
  parseHandelsbankenFinancialReports,
  type FastLaneReportCandidate,
} from "@/lib/companies/ingestion/adapters/omxs30-fast-lane";
import {
  SAAB_CALENDAR_SOURCE_URL,
  SAAB_ORIGIN,
  SAAB_PRESS_RELEASE_SOURCE_URL,
  SAAB_REPORTS_SOURCE_URL,
  SANDVIK_CALENDAR_SOURCE_URL,
  SANDVIK_ORIGIN,
  SANDVIK_PRESS_RELEASE_SOURCE_URL,
  SANDVIK_REPORTS_SOURCE_URL,
  SCA_CALENDAR_SOURCE_URL,
  SCA_ORIGIN,
  SCA_PRESS_RELEASE_SOURCE_URL,
  SCA_REPORTS_SOURCE_URL,
  parseSaabCalendar,
  parseSaabFinancialReports,
  parseSaabPressReleases,
  parseSandvikCalendar,
  parseSandvikFinancialReports,
  parseSandvikPressReleases,
  parseScaCalendar,
  parseScaFinancialReports,
  parseScaPressReleases,
} from "@/lib/companies/ingestion/adapters/omxs30-static";
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
  COMPANY_SOURCE_TYPES,
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
const JSON_FEED = ["application/json"] as const;

export type CollectedCompanySource =
  | { status: "ok"; documents: NormalizedCompanyDocument[] }
  | { status: "error"; reason: string };

type DocumentSourceType = (typeof COMPANY_SOURCE_TYPES)[number];

const EXPECTED_SOURCE_URLS: Record<
  SupportedCompanyIngestionSlug,
  Record<DocumentSourceType, string>
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
  saab: {
    press_releases: SAAB_PRESS_RELEASE_SOURCE_URL,
    financial_reports: SAAB_REPORTS_SOURCE_URL,
    financial_calendar: SAAB_CALENDAR_SOURCE_URL,
  },
  sandvik: {
    press_releases: SANDVIK_PRESS_RELEASE_SOURCE_URL,
    financial_reports: SANDVIK_REPORTS_SOURCE_URL,
    financial_calendar: SANDVIK_CALENDAR_SOURCE_URL,
  },
  sca: {
    press_releases: SCA_PRESS_RELEASE_SOURCE_URL,
    financial_reports: SCA_REPORTS_SOURCE_URL,
    financial_calendar: SCA_CALENDAR_SOURCE_URL,
  },
  addtech: {
    press_releases: ADDTECH_PRESS_RELEASE_SOURCE_URL,
    financial_reports: ADDTECH_REPORTS_SOURCE_URL,
    financial_calendar: ADDTECH_CALENDAR_SOURCE_URL,
  },
  eqt: {
    press_releases: EQT_PRESS_RELEASE_SOURCE_URL,
    financial_reports: EQT_REPORTS_SOURCE_URL,
    financial_calendar: EQT_CALENDAR_SOURCE_URL,
  },
  evolution: {
    press_releases: EVOLUTION_PRESS_RELEASE_SOURCE_URL,
    financial_reports: EVOLUTION_REPORTS_SOURCE_URL,
    financial_calendar: EVOLUTION_CALENDAR_SOURCE_URL,
  },
  nibe: {
    press_releases: NIBE_PRESS_RELEASE_SOURCE_URL,
    financial_reports: NIBE_REPORTS_SOURCE_URL,
    financial_calendar: NIBE_CALENDAR_SOURCE_URL,
  },
  essity: {
    press_releases: ESSITY_PRESS_RELEASE_SOURCE_URL,
    financial_reports: ESSITY_REPORTS_SOURCE_URL,
    financial_calendar: ESSITY_CALENDAR_SOURCE_URL,
  },
  hm: {
    press_releases: HM_PRESS_RELEASE_SOURCE_URL,
    financial_reports: HM_REPORTS_SOURCE_URL,
    financial_calendar: HM_CALENDAR_SOURCE_URL,
  },
  "alfa-laval": {
    press_releases: ALFA_LAVAL_NEWSROOM_SOURCE_URL,
    financial_reports: ALFA_LAVAL_NEWSROOM_SOURCE_URL,
    financial_calendar: ALFA_LAVAL_CALENDAR_SOURCE_URL,
  },
  "assa-abloy": {
    press_releases: ASSA_ABLOY_PRESS_SOURCE_URL,
    financial_reports: ASSA_ABLOY_INTERIM_REPORTS_SOURCE_URL,
    financial_calendar: ASSA_ABLOY_CALENDAR_SOURCE_URL,
  },
  handelsbanken: {
    press_releases: HANDELSBANKEN_PRESS_SOURCE_URL,
    financial_reports: HANDELSBANKEN_IR_SOURCE_URL,
    financial_calendar: HANDELSBANKEN_IR_SOURCE_URL,
  },
};

const ALLOWED_ORIGINS: Record<SupportedCompanyIngestionSlug, readonly string[]> = {
  investor: [INVESTOR_ORIGIN],
  volvo: [VOLVO_ORIGIN],
  ericsson: [ERICSSON_ORIGIN],
  "atlas-copco": [ATLAS_COPCO_ORIGIN],
  astrazeneca: [ASTRAZENECA_ORIGIN],
  saab: [SAAB_ORIGIN],
  sandvik: [SANDVIK_ORIGIN],
  sca: [SCA_ORIGIN],
  addtech: [ADDTECH_ORIGIN, "https://news.cision.com"],
  eqt: [EQT_ORIGIN],
  evolution: [EVOLUTION_ORIGIN],
  nibe: [NIBE_ORIGIN, "https://storage.mfn.se"],
  essity: [ESSITY_ORIGIN],
  hm: [HM_ORIGIN],
  "alfa-laval": [ALFA_LAVAL_ORIGIN],
  "assa-abloy": [ASSA_ABLOY_ORIGIN],
  handelsbanken: [HANDELSBANKEN_ORIGIN],
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

async function fetchJson(
  url: string,
  origin: string,
  context: SourceFetchContext,
) {
  return fetchOfficialText(url, context, {
    allowedOrigin: origin,
    acceptedContentTypes: JSON_FEED,
    maxBytes: INGESTION_MAX_HTML_BYTES,
  });
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
  sourceType: DocumentSourceType,
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

  if (!(COMPANY_SOURCE_TYPES as readonly string[]).includes(source.sourceType)) {
    return { status: "error", reason: "unsupported_source_type" };
  }

  if (source.sourceUrl !== expectedCompanySourceUrl(slug, source.sourceType as DocumentSourceType)) {
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
    case "saab":
      return collectStaticPage(
        source.sourceType,
        SAAB_ORIGIN,
        {
          press_releases: SAAB_PRESS_RELEASE_SOURCE_URL,
          financial_reports: SAAB_REPORTS_SOURCE_URL,
          financial_calendar: SAAB_CALENDAR_SOURCE_URL,
        },
        {
          press_releases: parseSaabPressReleases,
          financial_reports: parseSaabFinancialReports,
          financial_calendar: (html) => parseSaabCalendar(html, context.now),
        },
        context,
        origins,
      );
    case "sandvik":
      return collectStaticPage(
        source.sourceType,
        SANDVIK_ORIGIN,
        {
          press_releases: SANDVIK_PRESS_RELEASE_SOURCE_URL,
          financial_reports: SANDVIK_REPORTS_SOURCE_URL,
          financial_calendar: SANDVIK_CALENDAR_SOURCE_URL,
        },
        {
          press_releases: parseSandvikPressReleases,
          financial_reports: parseSandvikFinancialReports,
          financial_calendar: (html) => parseSandvikCalendar(html, context.now),
        },
        context,
        origins,
      );
    case "addtech":
      return collectAddtech(source.sourceType, context, origins);
    case "eqt":
      return collectEqt(source.sourceType, context, origins);
    case "evolution":
      return collectStaticPage(
        source.sourceType,
        EVOLUTION_ORIGIN,
        {
          press_releases: EVOLUTION_PRESS_RELEASE_SOURCE_URL,
          financial_reports: EVOLUTION_REPORTS_SOURCE_URL,
          financial_calendar: EVOLUTION_CALENDAR_SOURCE_URL,
        },
        {
          press_releases: parseEvolutionPressReleases,
          financial_reports: parseEvolutionFinancialReports,
          financial_calendar: (html) => parseEvolutionCalendar(html, context.now),
        },
        context,
        origins,
      );
    case "nibe":
      return collectNibe(source.sourceType, context, origins);
    case "essity":
      return collectStaticPage(
        source.sourceType,
        ESSITY_ORIGIN,
        {
          press_releases: ESSITY_PRESS_RELEASE_SOURCE_URL,
          financial_reports: ESSITY_REPORTS_SOURCE_URL,
          financial_calendar: ESSITY_CALENDAR_SOURCE_URL,
        },
        {
          press_releases: parseEssityPressReleases,
          financial_reports: parseEssityFinancialReports,
          financial_calendar: (html) => parseEssityCalendar(html, context.now),
        },
        context,
        origins,
      );
    case "hm":
      return collectStaticPage(
        source.sourceType,
        HM_ORIGIN,
        {
          press_releases: HM_PRESS_RELEASE_SOURCE_URL,
          financial_reports: HM_REPORTS_SOURCE_URL,
          financial_calendar: HM_CALENDAR_SOURCE_URL,
        },
        {
          press_releases: parseHmPressReleases,
          financial_reports: parseHmFinancialReports,
          financial_calendar: (html) => parseHmCalendar(html, context.now),
        },
        context,
        origins,
      );
    case "alfa-laval":
      return collectAlfaLaval(source.sourceType, context, origins);
    case "assa-abloy":
      return collectAssaAbloy(source.sourceType, context, origins);
    case "handelsbanken":
      return collectHandelsbanken(source.sourceType, context, origins);
    case "sca":
      return collectStaticPage(
        source.sourceType,
        SCA_ORIGIN,
        {
          press_releases: SCA_PRESS_RELEASE_SOURCE_URL,
          financial_reports: SCA_REPORTS_SOURCE_URL,
          financial_calendar: SCA_CALENDAR_SOURCE_URL,
        },
        {
          press_releases: parseScaPressReleases,
          financial_reports: parseScaFinancialReports,
          financial_calendar: (html) => parseScaCalendar(html, context.now),
        },
        context,
        origins,
      );
    default:
      return { status: "error", reason: "unsupported_company" };
  }
}

async function collectStaticPage(
  sourceType: CompanySourceType,
  origin: string,
  urls: Record<DocumentSourceType, string>,
  parsers: Record<DocumentSourceType, (html: string) => NormalizedCompanyDocument[]>,
  context: SourceFetchContext,
  origins: readonly string[],
): Promise<CollectedCompanySource> {
  if (!(COMPANY_SOURCE_TYPES as readonly string[]).includes(sourceType)) {
    return { status: "error", reason: "unsupported_source_type" };
  }
  const documentType = sourceType as DocumentSourceType;
  const page = await fetchHtml(urls[documentType], origin, context);
  if (page.status === "error") {
    return fetchFailure("listing", page.reason);
  }

  return acceptDocuments(parsers[documentType](page.text), origins);
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

async function collectAddtech(
  sourceType: CompanySourceType,
  context: SourceFetchContext,
  origins: readonly string[],
): Promise<CollectedCompanySource> {
  if (sourceType === "financial_calendar") {
    const page = await fetchHtml(ADDTECH_CALENDAR_SOURCE_URL, ADDTECH_ORIGIN, context);
    if (page.status === "error") {
      return fetchFailure("listing", page.reason);
    }

    return acceptDocuments(parseAddtechCalendar(page.text, context.now), origins);
  }

  const pageUrl = sourceType === "press_releases"
    ? ADDTECH_PRESS_RELEASE_SOURCE_URL
    : ADDTECH_REPORTS_SOURCE_URL;
  const feedMarker = sourceType === "press_releases" ? ADDTECH_PRESS_FEED : ADDTECH_REPORT_FEED;
  const page = await fetchHtml(pageUrl, ADDTECH_ORIGIN, context);
  if (page.status === "error") {
    return fetchFailure("listing", page.reason);
  }

  if (
    !issuerPageEmbedsMarker(page.text, `data-identifier="${ADDTECH_CISION_IDENTIFIER}"`) ||
    !issuerPageEmbedsMarker(page.text, `data-feed-to-show="${feedMarker}"`)
  ) {
    return { status: "error", reason: "delegated_source_not_verified" };
  }

  const paused = await pauseOrStop(context);
  if (paused) {
    return paused;
  }
  const feed = await fetchOfficialText(ADDTECH_CISION_FEED_URL, context, {
    allowedOrigin: ADDTECH_FEED_ORIGIN,
    acceptedContentTypes: JSON_FEED,
    maxBytes: INGESTION_MAX_HTML_BYTES,
    allowSearch: true,
  });
  if (feed.status === "error") {
    return fetchFailure("feed", feed.reason);
  }

  const documents = parseAddtechCisionFeed(
    feed.text,
    sourceType === "press_releases" ? "PRM" : "RPT",
  );
  return acceptDocuments(documents, origins);
}

async function collectEqt(
  sourceType: CompanySourceType,
  context: SourceFetchContext,
  origins: readonly string[],
): Promise<CollectedCompanySource> {
  const pageUrl = sourceType === "press_releases"
    ? EQT_PRESS_RELEASE_SOURCE_URL
    : sourceType === "financial_reports"
      ? EQT_REPORTS_SOURCE_URL
      : EQT_CALENDAR_SOURCE_URL;
  const page = await fetchHtml(pageUrl, EQT_ORIGIN, context);
  if (page.status === "error") {
    return fetchFailure("listing", page.reason);
  }

  const documents = sourceType === "press_releases"
    ? parseEqtPressReleases(page.text)
    : sourceType === "financial_reports"
      ? parseEqtFinancialReports(page.text)
      : parseEqtCalendar(page.text, context.now);
  return acceptDocuments(documents, origins);
}

async function collectNibe(
  sourceType: CompanySourceType,
  context: SourceFetchContext,
  origins: readonly string[],
): Promise<CollectedCompanySource> {
  if (sourceType === "press_releases") {
    const page = await fetchHtml(NIBE_PRESS_RELEASE_SOURCE_URL, NIBE_ORIGIN, context);
    if (page.status === "error") {
      return fetchFailure("listing", page.reason);
    }

    return acceptDocuments(parseNibePressReleases(page.text), origins);
  }

  const widgetUrl = sourceType === "financial_reports"
    ? NIBE_ARCHIVE_WIDGET_URL
    : NIBE_CALENDAR_WIDGET_URL;
  const page = await fetchHtml(NIBE_INVESTORS_SOURCE_URL, NIBE_ORIGIN, context);
  if (page.status === "error") {
    return fetchFailure("listing", page.reason);
  }

  if (!issuerPageEmbedsMarker(page.text, widgetUrl)) {
    return { status: "error", reason: "delegated_source_not_verified" };
  }

  const paused = await pauseOrStop(context);
  if (paused) {
    return paused;
  }
  const widget = await fetchHtml(widgetUrl, NIBE_WIDGET_ORIGIN, context, { allowSearch: true });
  if (widget.status === "error") {
    return fetchFailure("widget", widget.reason);
  }

  const documents = sourceType === "financial_reports"
    ? parseNibeFinancialReports(widget.text)
    : parseNibeCalendar(widget.text, context.now);
  return acceptDocuments(documents, origins);
}

async function collectDetailReports(
  candidates: readonly FastLaneReportCandidate[],
  origin: string,
  parseDetail: (html: string, candidate: FastLaneReportCandidate) => NormalizedCompanyDocument | null,
  context: SourceFetchContext,
  origins: readonly string[],
): Promise<CollectedCompanySource> {
  const documents: NormalizedCompanyDocument[] = [];
  for (const candidate of candidates) {
    const paused = await pauseOrStop(context);
    if (paused) {
      return paused;
    }
    const detail = await fetchHtml(candidate.detailUrl, origin, context);
    if (detail.status === "error") {
      return fetchFailure("detail", detail.reason);
    }

    const document = parseDetail(detail.text, candidate);
    if (document) {
      documents.push(document);
    }
  }

  return acceptDocuments(documents, origins);
}

async function collectAlfaLaval(
  sourceType: CompanySourceType,
  context: SourceFetchContext,
  origins: readonly string[],
): Promise<CollectedCompanySource> {
  if (sourceType === "financial_calendar") {
    return { status: "error", reason: "source_not_automated" };
  }

  const page = await fetchHtml(ALFA_LAVAL_NEWSROOM_SOURCE_URL, ALFA_LAVAL_ORIGIN, context);
  if (page.status === "error") {
    return fetchFailure("listing", page.reason);
  }

  if (sourceType === "press_releases") {
    return acceptDocuments(parseAlfaLavalFinancialNews(page.text), origins);
  }

  return collectDetailReports(
    parseAlfaLavalReportCandidates(page.text),
    ALFA_LAVAL_ORIGIN,
    parseAlfaLavalReportPdf,
    context,
    origins,
  );
}

async function collectAssaAbloy(
  sourceType: CompanySourceType,
  context: SourceFetchContext,
  origins: readonly string[],
): Promise<CollectedCompanySource> {
  if (sourceType === "financial_calendar") {
    return { status: "error", reason: "source_not_automated" };
  }

  if (sourceType === "press_releases") {
    const page = await fetchHtml(ASSA_ABLOY_PRESS_SOURCE_URL, ASSA_ABLOY_ORIGIN, context);
    if (page.status === "error") {
      return fetchFailure("listing", page.reason);
    }
    if (!parseAssaAbloyPressConfig(page.text)) {
      return { status: "error", reason: "press_endpoint_not_verified" };
    }

    const paused = await pauseOrStop(context);
    if (paused) {
      return paused;
    }
    const json = await fetchJson(ASSA_ABLOY_PRESS_JSON_URL, ASSA_ABLOY_ORIGIN, context);
    if (json.status === "error") {
      return fetchFailure("listing", json.reason);
    }

    return acceptDocuments(parseAssaAbloyPressReleases(json.text), origins);
  }

  const page = await fetchHtml(ASSA_ABLOY_INTERIM_REPORTS_SOURCE_URL, ASSA_ABLOY_ORIGIN, context);
  if (page.status === "error") {
    return fetchFailure("listing", page.reason);
  }

  const paused = await pauseOrStop(context);
  if (paused) {
    return paused;
  }
  const json = await fetchJson(ASSA_ABLOY_PRESS_JSON_URL, ASSA_ABLOY_ORIGIN, context);
  if (json.status === "error") {
    return fetchFailure("dates", json.reason);
  }

  return acceptDocuments(parseAssaAbloyFinancialReports(page.text, json.text), origins);
}

async function collectHandelsbanken(
  sourceType: CompanySourceType,
  context: SourceFetchContext,
  origins: readonly string[],
): Promise<CollectedCompanySource> {
  if (sourceType === "press_releases") {
    return { status: "error", reason: "source_not_automated" };
  }

  const page = await fetchHtml(HANDELSBANKEN_IR_SOURCE_URL, HANDELSBANKEN_ORIGIN, context);
  if (page.status === "error") {
    return fetchFailure("listing", page.reason);
  }

  const documents = sourceType === "financial_reports"
    ? parseHandelsbankenFinancialReports(page.text)
    : parseHandelsbankenCalendar(page.text, context.now);
  return acceptDocuments(documents, origins);
}
