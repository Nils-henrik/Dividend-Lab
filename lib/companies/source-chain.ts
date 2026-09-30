import { getPilotCompanies } from "@/lib/companies/catalog";
import {
  ADDTECH_CISION_FEED_URL,
  ADDTECH_PUBLISHER,
  NIBE_ARCHIVE_WIDGET_URL,
  NIBE_PUBLISHER,
} from "@/lib/companies/ingestion/adapters/omxs30-completion";
import { INSIDER_LINK } from "@/lib/companies/insiders";
import {
  NIBE_MFN_FEED_ID,
  NIBE_MFN_LEI,
  NIBE_MFN_PROVIDER,
  nibeMfnFeedUrl,
} from "@/lib/companies/mfn-feed";
import {
  companyOfficialCoverage,
  type OfficialCategoryCoverage,
} from "@/lib/companies/official-coverage";
import {
  FI_AGGREGATE_ODS_URL,
  FI_CURRENT_POSITIONS_ODS_URL,
} from "@/lib/companies/short-interest/constants";
import {
  DIVIDEND_HISTORY_LICENSE_BLOCKER,
  EODHD_NORDIC_DISPLAY_BLOCKER,
  EUROCLEAR_OWNERSHIP_BLOCKER,
  EUROCLEAR_REGISTER_URL,
  FI_INSIDER_SEARCH_BLOCKER,
  FI_INSIDER_SEARCH_URL,
  NASDAQ_DISCLOSURE_BLOCKER,
  NASDAQ_DIVIDEND_NOTICE_BLOCKER,
  NASDAQ_EQUITY_API_BLOCKER,
  NASDAQ_NORDIC_EQUITY_API_PAGE,
  SOURCE_POLICY_VERIFIED_ON,
  VALUATION_LICENSE_BLOCKER,
  nasdaqCnsCompanyId,
  nasdaqCompanyNewsQueryUrl,
} from "@/lib/companies/source-policy";
import type { CompanyProfile } from "@/lib/companies/types";

/**
 * Explicit source chain for critical company-data domains.
 * Each domain has primary, backup 1 and backup 2. A slot is functioning only
 * when this repository already has an explicit machine-readable path.
 * A source link, a second URL on the same shell, or a paid provider is not a backup.
 * Paths are taken from stored symbols, LEI codes and adapter URLs. They are not
 * built from the company display name.
 */

export const CRITICAL_SOURCE_DOMAINS = [
  "price",
  "valuation",
  "dividend",
  "reports",
  "press",
  "calendar",
  "ownership",
  "insider",
] as const;

export type CriticalSourceDomain = (typeof CRITICAL_SOURCE_DOMAINS)[number];

export const SOURCE_ROLES = ["primary", "backup1", "backup2"] as const;

export type SourceRole = (typeof SOURCE_ROLES)[number];

export type SourceSlotStatus =
  | "functioning"
  | "source_link_only"
  | "blocked"
  | "licensing_blocked"
  | "gap";

export type SourceSlot = {
  role: SourceRole;
  status: SourceSlotStatus;
  providerId: string | null;
  endpoint: string | null;
  host: string | null;
  shell: string | null;
  /** Stored identifier that selects the row. Never a display name. */
  binding: string | null;
  presentationLabel: string | null;
  /**
   * Policy slots store the audit date. Live reads still put as-of on the accepted result.
   * A null value is not a verification time.
   */
  verifiedAsOf: string | null;
  blocker: string | null;
};

export type DomainSourceChain = {
  domain: CriticalSourceDomain;
  slots: readonly [SourceSlot, SourceSlot, SourceSlot];
  activeProviderId: string | null;
  activeEndpoint: string | null;
};

export type CompanySourceChain = {
  slug: string;
  domains: Record<CriticalSourceDomain, DomainSourceChain>;
};

export const YAHOO_CHART_PROVIDER = "yahoo_chart";
export const YAHOO_SUMMARY_PROVIDER = "yahoo_quote_summary";
export const YAHOO_DIVIDEND_PROVIDER = "yahoo_chart_dividends";
export const FI_AGGREGATE_PROVIDER = "fi_short_interest_aggregate";

export const PRICE_BACKUP_BLOCKER =
  "Ingen oberoende maskinläsbar reserv. Betalda källor ingår inte. query2.finance.yahoo.com är samma skal som query1.finance.yahoo.com och räknas inte.";

export const VALUATION_BACKUP_BLOCKER =
  "Utfärdarnas rapportsidor är inte en enhetlig maskinläsbar värderingsögonblicksbild. Ingen reserv är verifierad.";

export const DIVIDEND_BACKUP_BLOCKER =
  "Officiell utdelning är ett separat faktum och blandas inte in i utdelningshistoriken. Ingen oberoende historikreserv är verifierad.";

export const SAME_SHELL_BACKUP_BLOCKER =
  "Ytterligare adress på samma skal räknas inte som oberoende reserv.";

export const NO_SECOND_SOURCE_BLOCKER =
  "Ingen annan oberoende maskinläsbar källa är verifierad för domänen.";

export const NO_THIRD_SOURCE_BLOCKER =
  "Ingen tredje oberoende maskinläsbar källa är verifierad för domänen.";

const STOCKHOLM_SYMBOL = /^[A-Z0-9-]+\.ST$/;

const CHART_ORIGIN = "https://query1.finance.yahoo.com/v8/finance/chart";
const SUMMARY_ORIGIN = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";

const SUMMARY_MODULES = "summaryDetail,defaultKeyStatistics,financialData,price";
const STATEMENT_MODULES = "incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory";

type PayloadOverride = {
  providerId: string;
  endpoint: string;
  presentationLabel: string;
};

const PRESS_PAYLOAD: Partial<Record<string, PayloadOverride>> = {
  addtech: {
    providerId: "addtech_cision_feed",
    endpoint: ADDTECH_CISION_FEED_URL,
    presentationLabel: ADDTECH_PUBLISHER,
  },
};

const REPORT_PAYLOAD: Partial<Record<string, PayloadOverride>> = {
  addtech: {
    providerId: "addtech_cision_feed",
    endpoint: ADDTECH_CISION_FEED_URL,
    presentationLabel: ADDTECH_PUBLISHER,
  },
  nibe: {
    providerId: "nibe_datablocks_archive",
    endpoint: NIBE_ARCHIVE_WIDGET_URL,
    presentationLabel: NIBE_PUBLISHER,
  },
};

export function sourceShell(hostname: string): string {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (host === "finance.yahoo.com" || host.endsWith(".finance.yahoo.com")) return "finance.yahoo.com";
  if (host === "fi.se" || host.endsWith(".fi.se")) return "fi.se";
  if (host === "cision.com" || host.endsWith(".cision.com")) return "cision.com";
  return host;
}

export function finiteOrMissing(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

export function numbersMateriallyDisagree(left: number, right: number, tolerance = 0.005): boolean {
  if (!Number.isFinite(left) || !Number.isFinite(right)) return true;
  const scale = Math.max(Math.abs(left), Math.abs(right), 1);
  return Math.abs(left - right) / scale > tolerance;
}

export function yahooChartEndpoint(symbol: string): string {
  const url = new URL(`${CHART_ORIGIN}/${encodeURIComponent(symbol)}`);
  url.searchParams.set("range", "18mo");
  url.searchParams.set("interval", "1d");
  url.searchParams.set("events", "div,splits");
  url.searchParams.set("includeAdjustedClose", "true");
  return url.toString();
}

export function yahooSummaryEndpoint(symbol: string): string {
  const url = new URL(`${SUMMARY_ORIGIN}/${encodeURIComponent(symbol)}`);
  url.searchParams.set("modules", `${SUMMARY_MODULES},${STATEMENT_MODULES}`);
  url.searchParams.set("formatted", "false");
  return url.toString();
}

export function yahooDividendEndpoint(symbol: string): string {
  const url = new URL(`${CHART_ORIGIN}/${encodeURIComponent(symbol)}`);
  url.searchParams.set("range", "10y");
  url.searchParams.set("interval", "1mo");
  url.searchParams.set("events", "div");
  return url.toString();
}

function hostOf(endpoint: string | null): string | null {
  if (!endpoint) return null;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return null;
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function gapSlot(role: SourceRole, blocker: string): SourceSlot {
  return {
    role,
    status: "gap",
    providerId: null,
    endpoint: null,
    host: null,
    shell: null,
    binding: null,
    presentationLabel: null,
    verifiedAsOf: null,
    blocker,
  };
}

function filledSlot(input: {
  role: SourceRole;
  status: Exclude<SourceSlotStatus, "gap">;
  providerId: string;
  endpoint: string | null;
  binding: string | null;
  presentationLabel: string;
  blocker: string | null;
  verifiedAsOf?: string | null;
}): SourceSlot {
  const host = hostOf(input.endpoint);
  return {
    role: input.role,
    status: input.status,
    providerId: input.providerId,
    endpoint: input.endpoint,
    host,
    shell: host ? sourceShell(host) : null,
    binding: input.binding,
    presentationLabel: input.presentationLabel,
    verifiedAsOf: input.verifiedAsOf ?? null,
    blocker: input.blocker,
  };
}

function licensingSlot(
  role: SourceRole,
  providerId: string,
  endpoint: string | null,
  binding: string | null,
  presentationLabel: string,
  blocker: string,
): SourceSlot {
  return filledSlot({
    role,
    status: "licensing_blocked",
    providerId,
    endpoint,
    binding,
    presentationLabel,
    blocker,
    verifiedAsOf: SOURCE_POLICY_VERIFIED_ON,
  });
}

function marketSymbolSlot(
  role: SourceRole,
  symbol: string,
  providerId: string,
  endpoint: string,
  missingBlocker: string,
): SourceSlot {
  if (!STOCKHOLM_SYMBOL.test(symbol)) {
    return gapSlot(role, missingBlocker);
  }
  return filledSlot({
    role,
    status: "functioning",
    providerId,
    endpoint,
    binding: `symbol:${symbol}`,
    presentationLabel: "Fördröjd marknadsdata",
    blocker: null,
  });
}

export function dividendSlotsForSymbol(
  symbol: string,
  slug: string | null = null,
): readonly [SourceSlot, SourceSlot, SourceSlot] {
  const resolvedSlug = slug
    ?? getPilotCompanies().find((company) => company.marketDataSymbol === symbol)?.slug
    ?? null;
  const companyId = resolvedSlug ? nasdaqCnsCompanyId(resolvedSlug) : null;
  return [
    marketSymbolSlot(
      "primary",
      symbol,
      YAHOO_DIVIDEND_PROVIDER,
      yahooDividendEndpoint(symbol),
      "Saknar verifierad marknadsdatasymbol på Nasdaq Stockholm.",
    ),
    licensingSlot(
      "backup1",
      "eodhd_nordic_display",
      null,
      resolvedSlug ? `slug:${resolvedSlug}` : symbol ? `symbol:${symbol}` : null,
      "EODHD",
      DIVIDEND_HISTORY_LICENSE_BLOCKER,
    ),
    licensingSlot(
      "backup2",
      "nasdaq_cns_company_news",
      companyId ? nasdaqCompanyNewsQueryUrl(companyId) : null,
      companyId ? `cns:${companyId}` : null,
      "Nasdaq",
      NASDAQ_DIVIDEND_NOTICE_BLOCKER,
    ),
  ];
}

function coverageSlot(
  role: SourceRole,
  coverage: OfficialCategoryCoverage | null,
  providerId: string,
  binding: string,
  override?: PayloadOverride,
): SourceSlot {
  if (!coverage) return gapSlot(role, "Saknar täckningsrad.");
  if (coverage.mode === "blocked") {
    return filledSlot({
      role,
      status: "blocked",
      providerId,
      endpoint: coverage.href,
      binding,
      presentationLabel: "Officiell källa",
      blocker: coverage.blocker,
    });
  }
  if (coverage.mode !== "automated") {
    return filledSlot({
      role,
      status: "source_link_only",
      providerId,
      endpoint: coverage.href,
      binding,
      presentationLabel: "Officiell källa",
      blocker: coverage.blocker ?? "Källänken är inte en fungerande reserv.",
    });
  }
  return filledSlot({
    role,
    status: "functioning",
    providerId: override?.providerId ?? providerId,
    endpoint: override?.endpoint ?? coverage.href,
    binding,
    presentationLabel: override?.presentationLabel ?? "Officiell källa",
    blocker: null,
  });
}

function domainChain(
  domain: CriticalSourceDomain,
  slots: readonly [SourceSlot, SourceSlot, SourceSlot],
): DomainSourceChain {
  const active = slots.find((slot) => slot.status === "functioning") ?? null;
  return {
    domain,
    slots,
    activeProviderId: active?.providerId ?? null,
    activeEndpoint: active?.endpoint ?? null,
  };
}

function insiderChain(company: CompanyProfile): DomainSourceChain {
  const lei = company.fiLei?.trim() || null;
  const primary = lei
    ? filledSlot({
      role: "primary",
      status: "functioning",
      providerId: FI_AGGREGATE_PROVIDER,
      endpoint: FI_AGGREGATE_ODS_URL,
      binding: `lei:${lei}`,
      presentationLabel: "Finansinspektionen",
      blocker: null,
    })
    : gapSlot("primary", "Saknar verifierad LEI. Registret matchas inte på visningsnamn.");
  return domainChain("insider", [
    primary,
    filledSlot({
      role: "backup1",
      status: "source_link_only",
      providerId: "fi_insider_search",
      endpoint: FI_INSIDER_SEARCH_URL,
      binding: lei ? `lei:${lei}` : null,
      presentationLabel: "Finansinspektionen",
      blocker: `${FI_INSIDER_SEARCH_BLOCKER} ${SAME_SHELL_BACKUP_BLOCKER} ${FI_CURRENT_POSITIONS_ODS_URL} ligger på fi.se tillsammans med den aggregerade filen.`,
      verifiedAsOf: SOURCE_POLICY_VERIFIED_ON,
    }),
    filledSlot({
      role: "backup2",
      status: "source_link_only",
      providerId: "fi_insider_register",
      endpoint: INSIDER_LINK.url,
      binding: lei ? `lei:${lei}` : null,
      presentationLabel: INSIDER_LINK.publisher,
      blocker: `${INSIDER_LINK.reason} ${SAME_SHELL_BACKUP_BLOCKER}`,
      verifiedAsOf: SOURCE_POLICY_VERIFIED_ON,
    }),
  ]);
}

function nasdaqDisclosureSlot(company: CompanyProfile, role: SourceRole): SourceSlot {
  const companyId = nasdaqCnsCompanyId(company.slug);
  const endpoint = companyId ? nasdaqCompanyNewsQueryUrl(companyId) : null;
  if (!companyId || !endpoint) {
    return gapSlot(role, "Saknar verifierat Nasdaq-emittent-id. Visningsnamn används inte.");
  }
  return licensingSlot(
    role,
    "nasdaq_cns_company_news",
    endpoint,
    `cns:${companyId}`,
    "Nasdaq",
    NASDAQ_DISCLOSURE_BLOCKER,
  );
}

function nibeMfnSlot(company: CompanyProfile, role: SourceRole): SourceSlot | null {
  if (company.slug !== "nibe" || company.fiLei !== NIBE_MFN_LEI) return null;
  return filledSlot({
    role,
    status: "functioning",
    providerId: NIBE_MFN_PROVIDER,
    endpoint: nibeMfnFeedUrl(),
    binding: `lei:${NIBE_MFN_LEI}`,
    presentationLabel: "MFN",
    blocker: null,
    verifiedAsOf: SOURCE_POLICY_VERIFIED_ON,
  });
}

function disclosureBackups(
  company: CompanyProfile,
  primary: SourceSlot,
  allowMfn: boolean,
): readonly [SourceSlot, SourceSlot] {
  const mfn = allowMfn ? nibeMfnSlot(company, "backup1") : null;
  if (mfn && mfn.shell && mfn.shell !== primary.shell && mfn.endpoint?.includes(NIBE_MFN_FEED_ID)) {
    return [mfn, nasdaqDisclosureSlot(company, "backup2")];
  }
  return [
    nasdaqDisclosureSlot(company, "backup1"),
    gapSlot("backup2", NO_THIRD_SOURCE_BLOCKER),
  ];
}

export function companySourceChain(company: CompanyProfile): CompanySourceChain {
  const symbol = company.marketDataSymbol;
  const price = domainChain("price", [
    marketSymbolSlot(
      "primary",
      symbol,
      YAHOO_CHART_PROVIDER,
      yahooChartEndpoint(symbol),
      "Saknar verifierad marknadsdatasymbol på Nasdaq Stockholm.",
    ),
    licensingSlot(
      "backup1",
      "eodhd_nordic_display",
      null,
      `symbol:${symbol}`,
      "EODHD",
      `${EODHD_NORDIC_DISPLAY_BLOCKER} ${PRICE_BACKUP_BLOCKER}`,
    ),
    licensingSlot(
      "backup2",
      "nasdaq_nordic_equity_web_api",
      NASDAQ_NORDIC_EQUITY_API_PAGE,
      `symbol:${symbol}`,
      "Nasdaq",
      NASDAQ_EQUITY_API_BLOCKER,
    ),
  ]);
  const valuation = domainChain("valuation", [
    marketSymbolSlot(
      "primary",
      symbol,
      YAHOO_SUMMARY_PROVIDER,
      yahooSummaryEndpoint(symbol),
      "Saknar verifierad marknadsdatasymbol på Nasdaq Stockholm.",
    ),
    licensingSlot(
      "backup1",
      "eodhd_nordic_display",
      null,
      `symbol:${symbol}`,
      "EODHD",
      `${VALUATION_LICENSE_BLOCKER} ${VALUATION_BACKUP_BLOCKER}`,
    ),
    licensingSlot(
      "backup2",
      "nasdaq_nordic_equity_web_api",
      NASDAQ_NORDIC_EQUITY_API_PAGE,
      `symbol:${symbol}`,
      "Nasdaq",
      NASDAQ_EQUITY_API_BLOCKER,
    ),
  ]);
  const dividend = domainChain("dividend", dividendSlotsForSymbol(symbol, company.slug));
  const reportsPrimary = coverageSlot(
    "primary",
    companyOfficialCoverage(company.slug)?.reports ?? null,
    "issuer_reports",
    `slug:${company.slug}`,
    REPORT_PAYLOAD[company.slug],
  );
  const pressPrimary = coverageSlot(
    "primary",
    companyOfficialCoverage(company.slug)?.press ?? null,
    "issuer_press",
    `slug:${company.slug}`,
    PRESS_PAYLOAD[company.slug],
  );
  const calendarPrimary = coverageSlot(
    "primary",
    companyOfficialCoverage(company.slug)?.calendar ?? null,
    "issuer_calendar",
    `slug:${company.slug}`,
  );
  const [reportsBackup1, reportsBackup2] = disclosureBackups(company, reportsPrimary, true);
  const [pressBackup1, pressBackup2] = disclosureBackups(company, pressPrimary, true);
  const [calendarBackup1, calendarBackup2] = disclosureBackups(company, calendarPrimary, false);
  const ownershipPrimary = coverageSlot(
    "primary",
    companyOfficialCoverage(company.slug)?.ownership ?? null,
    "issuer_ownership",
    `slug:${company.slug}`,
  );
  return {
    slug: company.slug,
    domains: {
      price,
      valuation,
      dividend,
      reports: domainChain("reports", [reportsPrimary, reportsBackup1, reportsBackup2]),
      press: domainChain("press", [pressPrimary, pressBackup1, pressBackup2]),
      calendar: domainChain("calendar", [calendarPrimary, calendarBackup1, calendarBackup2]),
      ownership: domainChain("ownership", [
        ownershipPrimary,
        licensingSlot(
          "backup1",
          "euroclear_sweden_register",
          EUROCLEAR_REGISTER_URL,
          company.fiLei ? `lei:${company.fiLei}` : null,
          "Euroclear Sweden",
          EUROCLEAR_OWNERSHIP_BLOCKER,
        ),
        gapSlot("backup2", NO_THIRD_SOURCE_BLOCKER),
      ]),
      insider: insiderChain(company),
    },
  };
}

export function auditCatalogSourceChains(
  companies: readonly CompanyProfile[] = getPilotCompanies(),
): CompanySourceChain[] {
  return companies.map(companySourceChain);
}

export type SourceReadResult<T> =
  | { status: "ok"; value: T; asOf: string }
  | { status: "missing"; reason?: string }
  | { status: "unavailable"; reason: string };

export type SourceObservation = {
  role: SourceRole;
  providerId: string | null;
  endpoint: string | null;
  outcome: "ok" | "missing" | "unavailable" | "skipped";
  reason: string | null;
  asOf: string | null;
};

export type SourceUse = {
  status: "ok" | "missing" | "unavailable" | "conflict";
  providerId: string | null;
  role: SourceRole | null;
  endpoint: string | null;
  asOf: string | null;
};

export type FailoverResolution<T> =
  | {
    status: "ok";
    value: T;
    providerId: string;
    role: SourceRole;
    endpoint: string;
    asOf: string;
    observations: readonly SourceObservation[];
  }
  | {
    status: "conflict" | "unavailable" | "missing";
    reason: string;
    observations: readonly SourceObservation[];
  };

function assertSlotOrder(slots: readonly SourceSlot[]) {
  if (slots.length !== SOURCE_ROLES.length) {
    throw new Error("source_chain_must_have_three_slots");
  }
  for (let index = 0; index < SOURCE_ROLES.length; index += 1) {
    if (slots[index]?.role !== SOURCE_ROLES[index]) {
      throw new Error("source_chain_role_order");
    }
  }
}

/**
 * Reads functioning slots in order. The accepted value is the earliest success.
 * Later successes are compared and never merged. Disagreement fails closed.
 * Gaps, source links and blocked slots are not requested.
 */
export async function resolveSourceFailover<T>(input: {
  slots: readonly SourceSlot[];
  read: (slot: SourceSlot) => Promise<SourceReadResult<T>>;
  valuesAgree: (left: T, right: T) => boolean;
  rejectValue?: (value: T) => string | null;
  crossCheck?: boolean;
}): Promise<FailoverResolution<T>> {
  assertSlotOrder(input.slots);
  const observations: SourceObservation[] = [];
  const successes: Array<{ slot: SourceSlot; value: T; asOf: string }> = [];
  const crossCheck = input.crossCheck !== false;

  for (const slot of input.slots) {
    if (slot.status !== "functioning" || !slot.providerId || !slot.endpoint) {
      observations.push({
        role: slot.role,
        providerId: slot.providerId,
        endpoint: slot.endpoint,
        outcome: "skipped",
        reason: slot.blocker,
        asOf: null,
      });
      continue;
    }
    const reading = await input.read(slot);
    if (reading.status === "ok") {
      const rejected = input.rejectValue?.(reading.value) ?? null;
      if (rejected) {
        observations.push({
          role: slot.role,
          providerId: slot.providerId,
          endpoint: slot.endpoint,
          outcome: "missing",
          reason: rejected,
          asOf: null,
        });
        continue;
      }
      observations.push({
        role: slot.role,
        providerId: slot.providerId,
        endpoint: slot.endpoint,
        outcome: "ok",
        reason: null,
        asOf: reading.asOf,
      });
      successes.push({ slot, value: reading.value, asOf: reading.asOf });
      if (!crossCheck) break;
      continue;
    }
    observations.push({
      role: slot.role,
      providerId: slot.providerId,
      endpoint: slot.endpoint,
      outcome: reading.status === "missing" ? "missing" : "unavailable",
      reason: reading.reason ?? null,
      asOf: null,
    });
  }

  if (successes.length >= 2) {
    const first = successes[0];
    if (first && successes.slice(1).some((item) => !input.valuesAgree(first.value, item.value))) {
      return { status: "conflict", reason: "sources_disagree", observations };
    }
  }
  const chosen = successes[0];
  if (!chosen?.slot.providerId || !chosen.slot.endpoint) {
    const missingOnly = observations.some((item) => item.outcome === "missing")
      && observations.every((item) => item.outcome === "missing" || item.outcome === "skipped");
    return {
      status: missingOnly ? "missing" : "unavailable",
      reason: missingOnly ? "missing" : "no_accepted_source",
      observations,
    };
  }
  return {
    status: "ok",
    value: chosen.value,
    providerId: chosen.slot.providerId,
    role: chosen.slot.role,
    endpoint: chosen.slot.endpoint,
    asOf: chosen.asOf,
    observations,
  };
}

export function sourceUseFromResolution<T>(resolution: FailoverResolution<T>): SourceUse {
  if (resolution.status !== "ok") {
    return {
      status: resolution.status,
      providerId: null,
      role: null,
      endpoint: null,
      asOf: null,
    };
  }
  return {
    status: "ok",
    providerId: resolution.providerId,
    role: resolution.role,
    endpoint: resolution.endpoint,
    asOf: resolution.asOf,
  };
}

/** Existing paid-dividend fetch revalidates after one day. A stale cache is not reused. */
export const EXISTING_DIVIDEND_CACHE_MAX_AGE_MS = 86_400_000;

export function cachedReadingWithinPolicy<T>(input: {
  cachedAt: string;
  now: string;
  maxAgeMs: number;
  value: T;
  providerId: string;
  endpoint: string;
  sourceAsOf: string;
}):
  | {
    status: "ok";
    value: T;
    providerId: string;
    endpoint: string;
    asOf: string;
    cachedAt: string;
  }
  | { status: "unavailable"; reason: "stale_cache" } {
  const cachedAt = Date.parse(input.cachedAt);
  const now = Date.parse(input.now);
  if (!Number.isFinite(cachedAt) || !Number.isFinite(now) || now - cachedAt > input.maxAgeMs) {
    return { status: "unavailable", reason: "stale_cache" };
  }
  return {
    status: "ok",
    value: input.value,
    providerId: input.providerId,
    endpoint: input.endpoint,
    asOf: input.sourceAsOf,
    cachedAt: input.cachedAt,
  };
}

function slotCell(slot: SourceSlot): string {
  if (slot.status === "gap") return "GAP";
  return `${slot.status} ${slot.providerId} ${slot.endpoint ?? "—"}`;
}

export function formatSourceRedundancyMatrix(
  companies: readonly CompanyProfile[] = getPilotCompanies(),
): string {
  const chains = auditCatalogSourceChains(companies);
  const lines = [
    `Policy decisions were verified on ${SOURCE_POLICY_VERIFIED_ON}.`,
    "As-of on a row is the active functioning slot's stored verification time. A dash means this matrix did not live-fetch that slot.",
    "licensing_blocked is a commercial or terms barrier. It is not a functioning backup and it is not fetched.",
    "",
  ];
  for (const domain of CRITICAL_SOURCE_DOMAINS) {
    lines.push(`### ${domain}`);
    lines.push("");
    lines.push("| Bolag | Primär | Reserv 1 | Reserv 2 | Aktiv källa | As-of | Blocker |");
    lines.push("| --- | --- | --- | --- | --- | --- | --- |");
    const blockerGroups = new Map<string, string[]>();
    for (const chain of chains) {
      const item = chain.domains[domain];
      const [primary, backup1, backup2] = item.slots;
      const verified = item.slots.find((entry) => entry.status === "functioning")?.verifiedAsOf ?? "—";
      const blocker = [primary, backup1, backup2]
        .filter((entry) => entry.blocker)
        .map((entry) => `${entry.role}: ${entry.blocker}`)
        .join(" · ") || "—";
      lines.push(
        `| ${chain.slug} | ${slotCell(primary)} | ${slotCell(backup1)} | ${slotCell(backup2)} | ${item.activeProviderId ?? "—"} | ${verified} | ${blocker} |`,
      );
      for (const entry of [primary, backup1, backup2]) {
        if (!entry.blocker) continue;
        const key = `${entry.role}: ${entry.blocker}`;
        const slugs = blockerGroups.get(key) ?? [];
        slugs.push(chain.slug);
        blockerGroups.set(key, slugs);
      }
    }
    lines.push("");
    lines.push("Blocker:");
    for (const [blocker, slugs] of blockerGroups) {
      lines.push(`- ${slugs.join(", ")} — ${blocker}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
