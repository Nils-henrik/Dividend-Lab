import type { OfficialItem } from "@/lib/companies/investor-official";
import {
  NIBE_MFN_FEED_ID,
  NIBE_MFN_LEI,
  NIBE_MFN_PROVIDER,
  readNibeMfnFeed,
  type MfnDisclosure,
  type MfnReadResult,
} from "@/lib/companies/mfn-feed";
import type {
  CompanyDataStatus,
  CompanyOfficialData,
  CompanyOfficialSection,
} from "@/lib/companies/official-data";
import {
  companySourceChain,
  resolveSourceFailover,
  type FailoverResolution,
  type SourceReadResult,
  type SourceSlot,
} from "@/lib/companies/source-chain";
import type { CompanyProfile } from "@/lib/companies/types";

/**
 * Stored official sections that mean the primary disclosure read did not
 * produce items. source_link_only and blocked stay as they are.
 */
const PRIMARY_BACKUP_STATUSES = new Set<CompanyDataStatus>([
  "temporarily_unavailable",
  "schema_unavailable",
  "available_empty",
]);

export function officialSectionNeedsMfnBackup(status: CompanyDataStatus): boolean {
  return PRIMARY_BACKUP_STATUSES.has(status);
}

/** Same URL with a different title or date is a contradiction. Disjoint items are not merged. */
export function officialItemsConflict(
  left: readonly OfficialItem[],
  right: readonly OfficialItem[],
): boolean {
  const rightByUrl = new Map(right.map((item) => [item.url, item]));
  return left.some((item) => {
    const other = rightByUrl.get(item.url);
    if (!other) return false;
    return other.title !== item.title || other.date !== item.date;
  });
}

function toOfficialItem(item: MfnDisclosure): OfficialItem {
  return {
    title: item.title,
    date: item.publishedAt.slice(0, 10),
    url: item.sourceUrl,
  };
}

function domainRead(
  feed: MfnReadResult,
  domain: "press" | "reports",
): SourceReadResult<OfficialItem[]> {
  if (feed.status === "missing") return { status: "missing", reason: feed.reason };
  if (feed.status === "unavailable") return { status: "unavailable", reason: feed.reason };
  const selected = feed.value.filter((item) => item.kind === (domain === "reports" ? "report" : "press"));
  if (selected.length === 0) return { status: "missing", reason: "no_disclosures" };
  const asOf = selected.map((item) => item.publishedAt).sort().at(-1);
  if (!asOf) return { status: "missing", reason: "no_disclosures" };
  return {
    status: "ok",
    value: selected
      .map(toOfficialItem)
      .sort((first, second) => (second.date ?? "").localeCompare(first.date ?? "")),
    asOf,
  };
}

function readStoredPrimary(
  section: CompanyOfficialSection<OfficialItem>,
): SourceReadResult<OfficialItem[]> {
  if (section.status === "available_with_items") {
    const dated = section.items
      .map((item) => item.date)
      .filter((date): date is string => Boolean(date))
      .sort();
    return {
      status: "ok",
      value: section.items,
      asOf: section.asOf ?? dated.at(-1) ?? "1970-01-01",
    };
  }
  if (section.status === "available_empty") return { status: "missing", reason: "available_empty" };
  return { status: "unavailable", reason: section.status };
}

function failClosed(section: CompanyOfficialSection<OfficialItem>): CompanyOfficialSection<OfficialItem> {
  return {
    status: "temporarily_unavailable",
    items: [],
    sourceUrl: section.sourceUrl,
    sourcePublisher: section.sourcePublisher,
    asOf: null,
  };
}

function applyResolution(
  section: CompanyOfficialSection<OfficialItem>,
  resolution: FailoverResolution<OfficialItem[]>,
  slots: readonly SourceSlot[],
): CompanyOfficialSection<OfficialItem> {
  if (resolution.status === "conflict") return failClosed(section);
  if (resolution.status !== "ok" || resolution.role === "primary") return section;
  const publisher = slots.find((slot) => slot.role === resolution.role)?.presentationLabel ?? null;
  if (!publisher) return failClosed(section);
  return {
    status: "available_with_items",
    items: [...resolution.value],
    sourceUrl: resolution.endpoint,
    sourcePublisher: publisher,
    asOf: resolution.asOf,
  };
}

/**
 * Read-only NIBE press/report failover for the company official-data loader.
 * The stored primary section is kept when it already has items.
 * MFN is requested only when press or reports are missing or unavailable,
 * and the feed is fetched at most once for that load.
 */
export async function withNibeOfficialDisclosureFallback(input: {
  company: CompanyProfile;
  official: CompanyOfficialData;
  fetchImpl?: typeof fetch;
  crossCheck?: boolean;
}): Promise<CompanyOfficialData> {
  if (input.company.slug !== "nibe" || input.company.fiLei !== NIBE_MFN_LEI) {
    return input.official;
  }
  const pressNeeds = officialSectionNeedsMfnBackup(input.official.pressReleases.status);
  const reportsNeeds = officialSectionNeedsMfnBackup(input.official.reports.status);
  if (!pressNeeds && !reportsNeeds && !input.crossCheck) return input.official;

  const chain = companySourceChain(input.company);
  const feedRequest: { current: Promise<MfnReadResult> | null } = { current: null };
  const readFeed = () => {
    feedRequest.current ??= readNibeMfnFeed({
      lei: input.company.fiLei ?? "",
      feedId: NIBE_MFN_FEED_ID,
      domain: "press",
      fetchImpl: input.fetchImpl,
    });
    return feedRequest.current;
  };

  const resolveDomain = async (
    domain: "press" | "reports",
    section: CompanyOfficialSection<OfficialItem>,
    slots: readonly SourceSlot[],
  ) => {
    const needsBackup = officialSectionNeedsMfnBackup(section.status);
    if (!needsBackup && !input.crossCheck) return section;
    const resolution = await resolveSourceFailover<OfficialItem[]>({
      slots,
      crossCheck: input.crossCheck === true,
      valuesAgree: (left, right) => !officialItemsConflict(left, right),
      read: async (slot) => {
        if (slot.providerId === NIBE_MFN_PROVIDER) return domainRead(await readFeed(), domain);
        if (slot.role === "primary") return readStoredPrimary(section);
        return { status: "unavailable", reason: "no_reader" };
      },
    });
    return applyResolution(section, resolution, slots);
  };

  let pressReleases = await resolveDomain("press", input.official.pressReleases, chain.domains.press.slots);
  let reports = await resolveDomain("reports", input.official.reports, chain.domains.reports.slots);

  if (feedRequest.current) {
    const feed = await feedRequest.current;
    const guard = (
      section: CompanyOfficialSection<OfficialItem>,
      domain: "press" | "reports",
      replaced: boolean,
    ) => {
      if (replaced || section.status !== "available_with_items" || feed.status !== "ok") return section;
      const backup = domainRead(feed, domain);
      if (backup.status !== "ok" || !officialItemsConflict(section.items, backup.value)) return section;
      return failClosed(section);
    };
    pressReleases = guard(pressReleases, "press", pressReleases !== input.official.pressReleases);
    reports = guard(reports, "reports", reports !== input.official.reports);
  }

  return {
    ...input.official,
    pressReleases,
    reports,
  };
}
