import { decodeHtmlText } from "@/lib/companies/ingestion/text";
import { formatSvNumber } from "@/lib/companies/valuation";

export type ReportMetricScale = "unit" | "million" | "billion";

export type ReportSnapshotMetric = {
  id: string;
  label: string;
  amount: number;
  comparisonAmount: number | null;
  comparisonLabel: string | null;
  reportedChangePercent: number | null;
  scale: ReportMetricScale;
};

export type ReportSnapshot = {
  period: string;
  currency: string;
  publishedOn: string;
  sourceUrl: string;
  sourcePublisher: string;
  metrics: ReportSnapshotMetric[];
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY = /^[A-Z]{3}$/;

function tableRows(table: string): string[][] {
  return [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
      decodeHtmlText(cell[1]).replace(/\s+/g, " ").trim(),
    ),
  );
}

function parseAmount(value: string): number | null {
  const text = value.replace(/\s/g, "");
  if (!/^-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(text) && !/^-?\d+(?:\.\d+)?$/.test(text)) return null;
  const parsed = Number(text.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function sameMetric(left: ReportSnapshotMetric, right: ReportSnapshotMetric): boolean {
  return left.label === right.label
    && left.amount === right.amount
    && left.comparisonAmount === right.comparisonAmount
    && left.comparisonLabel === right.comparisonLabel
    && left.reportedChangePercent === right.reportedChangePercent
    && left.scale === right.scale;
}

/**
 * A snapshot has at most one row per metric id.
 * Matching candidates collapse to the first row. If any candidate disagrees on
 * the stored amount, comparison, reported change, scale or label, that metric
 * is omitted. Conflicting values are never mixed into one row.
 */
export function dedupeReportMetrics(metrics: readonly ReportSnapshotMetric[]): ReportSnapshotMetric[] {
  const groups = new Map<string, ReportSnapshotMetric[]>();
  for (const metric of metrics) {
    const group = groups.get(metric.id) ?? [];
    group.push(metric);
    groups.set(metric.id, group);
  }
  const unique: ReportSnapshotMetric[] = [];
  for (const group of groups.values()) {
    const first = group[0];
    if (first && group.every((metric) => sameMetric(metric, first))) unique.push(first);
  }
  return unique;
}

function finishSnapshot(input: {
  period: string;
  currency: string;
  publishedOn: string;
  sourceUrl: string;
  sourcePublisher: string;
  metrics: ReportSnapshotMetric[];
}): ReportSnapshot | null {
  const metrics = dedupeReportMetrics(input.metrics);
  if (
    !input.period
    || !CURRENCY.test(input.currency)
    || !DATE_ONLY.test(input.publishedOn)
    || !input.sourceUrl.startsWith("https://")
    || !input.sourcePublisher
    || metrics.length === 0
  ) {
    return null;
  }
  return { ...input, metrics };
}

function columnIndexes(header: string[]) {
  const quarterLabel = header.find((cell) => /^Q[1-4] 20\d{2}$/.test(cell));
  const fyLabel = header.find((cell) => /^(?:Jan-Dec|FY) 20\d{2}$/.test(cell));
  const currentLabel = quarterLabel ?? fyLabel;
  if (!currentLabel) return null;
  const [token, yearText] = currentLabel.split(" ");
  const year = Number(yearText);
  const comparisonLabel = `${token} ${year - 1}`;
  const current = header.indexOf(currentLabel);
  const comparison = header.indexOf(comparisonLabel);
  if (current < 1 || comparison < 1) return null;
  const change = header[comparison + 1] === "Chg %" ? comparison + 1 : -1;
  const period = quarterLabel ? `${yearText} ${token}` : `${yearText} FY`;
  return { current, comparison, change, period, comparisonLabel };
}

function metricFromRow(input: {
  id: string;
  label: string;
  cells: string[];
  columns: { current: number; comparison: number; change: number; comparisonLabel: string };
  scale: ReportMetricScale;
}): ReportSnapshotMetric | null {
  const amount = parseAmount(input.cells[input.columns.current] ?? "");
  if (amount === null) return null;
  const comparisonAmount = parseAmount(input.cells[input.columns.comparison] ?? "");
  const reported = input.columns.change > 0 ? parseAmount(input.cells[input.columns.change] ?? "") : null;
  return {
    id: input.id,
    label: input.label,
    amount,
    comparisonAmount,
    comparisonLabel: comparisonAmount === null ? null : input.columns.comparisonLabel,
    reportedChangePercent: reported,
    scale: input.scale,
  };
}

function statutoryIncludingTable(before: string): boolean {
  const text = before.toLowerCase();
  const including = text.lastIndexOf("including items affecting comparability");
  if (including < 0) return false;
  return including > text.lastIndexOf("excluding items affecting comparability");
}

/**
 * Nordea Q1, half-year, Q3 and year-end releases share one table shape.
 * The current period is the first Q1–Q4 column that also has the prior-year column.
 * Year-end pages lead with Q4, so the snapshot stays on that quarter. A table that
 * only has Jan-Dec or FY columns is read as FY. Later tables for another period are ignored.
 * The headline group table is kept. A following table introduced as
 * "Including items affecting comparability" is the statutory bridge and is skipped,
 * so it cannot duplicate or replace the headline row.
 */
export function parseNordeaReportSnapshot(html: string, sourceUrl: string): ReportSnapshot | null {
  if (!isNordeaReportSnapshotUrl(sourceUrl)) return null;
  const publishedOn = sourceUrl.match(/\/en\/press\/(\d{4}-\d{2}-\d{2})\//)?.[1] ?? "";
  const text = decodeHtmlText(html);
  if (!text.includes(publishedOn) && !text.includes(publishedOn.slice(8) + "-" + publishedOn.slice(5, 7) + "-" + publishedOn.slice(0, 4))) {
    const dmy = `${publishedOn.slice(8, 10)}-${publishedOn.slice(5, 7)}-${publishedOn.slice(0, 4)}`;
    if (!html.includes(publishedOn) && !html.includes(dmy)) return null;
  }
  const metrics: ReportSnapshotMetric[] = [];
  let period: string | null = null;
  const chunks = html.split(/<table\b/i);
  for (let index = 1; index < chunks.length; index += 1) {
    const before = decodeHtmlText(chunks[index - 1].slice(-2000));
    if (statutoryIncludingTable(before)) continue;
    const tableHtml = chunks[index].split(/<\/table>/i)[0] ?? "";
    const rows = tableRows(tableHtml);
    const header = rows[0] ?? [];
    const columns = columnIndexes(header);
    if (!columns) continue;
    if (period && period !== columns.period) continue;
    period = columns.period;
    const millionTable = header.some((cell) => cell === "EURm");
    for (const cells of rows.slice(1)) {
      const label = cells[0] ?? "";
      if (millionTable && label === "Operating profit") {
        const metric = metricFromRow({ id: "operating_profit", label, cells, columns, scale: "million" });
        if (metric) metrics.push(metric);
      } else if (millionTable && label === "Net profit for the period") {
        const metric = metricFromRow({ id: "net_profit", label, cells, columns, scale: "million" });
        if (metric) metrics.push(metric);
      } else if (millionTable && label === "Total income") {
        const metric = metricFromRow({ id: "total_income", label, cells, columns, scale: "million" });
        if (metric) metrics.push(metric);
      } else if (!millionTable && (label === "Diluted earnings per share (DEPS), EUR" || label === "Diluted earnings per share, EUR")) {
        const metric = metricFromRow({ id: "diluted_eps", label: "Diluted earnings per share (DEPS)", cells, columns, scale: "unit" });
        if (metric) metrics.push(metric);
      }
    }
  }
  return finishSnapshot({
    period: period ?? "",
    currency: "EUR",
    publishedOn,
    sourceUrl,
    sourcePublisher: "Nordea",
    metrics,
  });
}

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

function tele2PublishedOn(html: string): string | null {
  const match = html.match(/\b([A-Z][a-z]{2}) (\d{1,2}) (20\d{2}),\s+\d{1,2}:\d{2}/);
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  if (!month) return null;
  const day = match[2].padStart(2, "0");
  const monthNumber = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  }[month];
  if (!monthNumber) return null;
  const date = `${match[3]}-${monthNumber}-${day}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function sekMetric(input: {
  id: string;
  label: string;
  amount: number;
  comparisonAmount: number | null;
  comparisonLabel: string | null;
  scale: ReportMetricScale;
}): ReportSnapshotMetric {
  return {
    id: input.id,
    label: input.label,
    amount: input.amount,
    comparisonAmount: input.comparisonAmount,
    comparisonLabel: input.comparisonAmount === null ? null : input.comparisonLabel,
    reportedChangePercent: null,
    scale: input.scale,
  };
}

export function parseTele2ReportSnapshot(html: string, sourceUrl: string): ReportSnapshot | null {
  if (!isTele2ReportSnapshotUrl(sourceUrl)) return null;
  const text = decodeHtmlText(html).replace(/\s+/g, " ");
  const periodMatch = text.match(/\bin (Q[1-4]) (20\d{2})\b/);
  if (!periodMatch) return null;
  const quarter = periodMatch[1];
  const year = Number(periodMatch[2]);
  const comparisonLabel = text.includes(`${quarter} ${year - 1}`) ? `${quarter} ${year - 1}` : null;
  const publishedOn = tele2PublishedOn(html);
  if (!publishedOn) return null;
  const metrics: ReportSnapshotMetric[] = [];
  const revenue = text.match(/Total revenue of SEK ([0-9]+(?:\.[0-9]+)?) billion\b/);
  if (revenue) {
    metrics.push(sekMetric({
      id: "revenue",
      label: "Total revenue",
      amount: Number(revenue[1]),
      comparisonAmount: null,
      comparisonLabel: null,
      scale: "billion",
    }));
  }
  const profit = text.match(new RegExp(`Net profit from total operations of SEK ([0-9]+(?:\\.[0-9]+)?) \\(([0-9]+(?:\\.[0-9]+)?)\\) billion and earnings per share of SEK ([0-9]+(?:\\.[0-9]+)?) \\(([0-9]+(?:\\.[0-9]+)?)\\) in ${quarter} ${year}`));
  if (profit) {
    metrics.push(sekMetric({
      id: "net_profit",
      label: "Net profit from total operations",
      amount: Number(profit[1]),
      comparisonAmount: comparisonLabel ? Number(profit[2]) : null,
      comparisonLabel,
      scale: "billion",
    }));
    metrics.push(sekMetric({
      id: "eps",
      label: "Earnings per share",
      amount: Number(profit[3]),
      comparisonAmount: comparisonLabel ? Number(profit[4]) : null,
      comparisonLabel,
      scale: "unit",
    }));
  }
  const cash = text.match(new RegExp(`Equity free cash flow of SEK ([0-9]+(?:\\.[0-9]+)?) \\(([0-9]+(?:\\.[0-9]+)?)\\) billion in ${quarter} ${year}`));
  if (cash) {
    metrics.push(sekMetric({
      id: "equity_free_cash_flow",
      label: "Equity free cash flow",
      amount: Number(cash[1]),
      comparisonAmount: comparisonLabel ? Number(cash[2]) : null,
      comparisonLabel,
      scale: "billion",
    }));
  }
  return finishSnapshot({
    period: `${year} ${quarter}`,
    currency: "SEK",
    publishedOn,
    sourceUrl,
    sourcePublisher: "Tele2",
    metrics,
  });
}

const INDUSTRIVARDEN_NAV_PERIOD: Record<string, string> = {
  "31 mars": "Q1",
  "30 juni": "H1",
  "30 september": "Q3",
  "31 december": "FY",
};

export function parseIndustrivardenReportSnapshot(html: string, sourceUrl: string): ReportSnapshot | null {
  if (!isIndustrivardenReportSnapshotUrl(sourceUrl)) return null;
  const publishedOn = html.match(/<time\b[^>]*datetime="(\d{4}-\d{2}-\d{2})"/i)?.[1] ?? "";
  const text = decodeHtmlText(html).replace(/\s+/g, " ");
  const nav = text.match(/Substansvärdet den (31 mars|30 juni|30 september|31 december) (20\d{2}) var ([0-9]+(?:,[0-9]+)?) mdkr, eller ([0-9]+(?:,[0-9]+)?) kronor per aktie/);
  const periodKind = nav ? INDUSTRIVARDEN_NAV_PERIOD[nav[1]] : null;
  if (!nav || !periodKind || !publishedOn) return null;
  const amount = Number(nav[3].replace(",", "."));
  const perShare = Number(nav[4].replace(",", "."));
  if (!Number.isFinite(amount) || !Number.isFinite(perShare)) return null;
  return finishSnapshot({
    period: periodKind === "FY" ? `${nav[2]} FY` : `${nav[2]} ${periodKind}`,
    currency: "SEK",
    publishedOn,
    sourceUrl,
    sourcePublisher: "Industrivärden",
    metrics: [
      {
        id: "net_asset_value",
        label: "Substansvärde",
        amount,
        comparisonAmount: null,
        comparisonLabel: null,
        reportedChangePercent: null,
        scale: "billion",
      },
      {
        id: "net_asset_value_per_share",
        label: "Substansvärde per aktie",
        amount: perShare,
        comparisonAmount: null,
        comparisonLabel: null,
        reportedChangePercent: null,
        scale: "unit",
      },
    ],
  });
}

const REPORT_DOCUMENT_TYPES = new Set(["quarterly_report", "half_year_report", "annual_report"]);

export type ReportDocumentRef = {
  type: string;
  url: string;
  publishedAt: string | null;
};

export const REPORT_SNAPSHOT_TIMEOUT_MS = 3_000;
export const REPORT_SNAPSHOT_REVALIDATE_SECONDS = 60 * 60;

function httpsPath(url: string, origin: string, path: RegExp): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:"
      && parsed.origin === origin
      && parsed.username === ""
      && parsed.password === ""
      && parsed.port === ""
      && parsed.search === ""
      && parsed.hash === ""
      && path.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function isNordeaReportSnapshotUrl(url: string): boolean {
  return httpsPath(url, "https://www.nordea.com", /^\/en\/press\/\d{4}-\d{2}-\d{2}\/[^/]+$/);
}

export function isTele2ReportSnapshotUrl(url: string): boolean {
  return httpsPath(url, "https://www.tele2.com", /^\/investors\/reports-and-presentations\/[^/]+\/$/);
}

export function isIndustrivardenReportSnapshotUrl(url: string): boolean {
  return httpsPath(url, "https://www.industrivarden.se", /^\/media\/Pressmeddelanden\/\d{4}\/[^/]+\/$/);
}

export function reportSnapshotOrigin(slug: string): string | null {
  if (slug === "nordea") return "https://www.nordea.com";
  if (slug === "tele2") return "https://www.tele2.com";
  if (slug === "industrivarden") return "https://www.industrivarden.se";
  return null;
}

export function isReportSnapshotUrl(slug: string, url: string): boolean {
  if (slug === "nordea") return isNordeaReportSnapshotUrl(url);
  if (slug === "tele2") return isTele2ReportSnapshotUrl(url);
  if (slug === "industrivarden") return isIndustrivardenReportSnapshotUrl(url);
  return false;
}

function publishedTime(value: string | null): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
}

/**
 * The newest official report document, and only when its own URL can be parsed.
 * An older supported report is not used when a newer report exists but is not
 * a verified snapshot URL. Listing and feed URLs are never selected.
 */
export function selectLatestReportSnapshotUrl(
  slug: string,
  documents: readonly ReportDocumentRef[],
): string | null {
  const reports = documents.filter((document) => REPORT_DOCUMENT_TYPES.has(document.type));
  const newest = reports.reduce((max, document) => Math.max(max, publishedTime(document.publishedAt)), Number.NEGATIVE_INFINITY);
  if (newest === Number.NEGATIVE_INFINITY) return null;
  const latest = reports.filter((document) => publishedTime(document.publishedAt) === newest);
  return latest.find((document) => isReportSnapshotUrl(slug, document.url))?.url ?? null;
}

export type ReportSnapshotReadResult =
  | { status: "ok"; text: string }
  | { status: "transient" }
  | { status: "miss" };

export type ReportSnapshotLoad = {
  snapshot: ReportSnapshot | null;
  /** False when the source failed temporarily. That result must not be cached. */
  cacheable: boolean;
};

export function parseCompanyReportSnapshot(slug: string, html: string, sourceUrl: string): ReportSnapshot | null {
  if (slug === "nordea") return parseNordeaReportSnapshot(html, sourceUrl);
  if (slug === "tele2") return parseTele2ReportSnapshot(html, sourceUrl);
  if (slug === "industrivarden") return parseIndustrivardenReportSnapshot(html, sourceUrl);
  return null;
}

/**
 * Reads at most the one verified report URL already stored for the company.
 * No issuer listing or feed is fetched here.
 */
export async function readLatestReportSnapshot(
  slug: string,
  documents: readonly ReportDocumentRef[],
  readReport: (url: string) => Promise<ReportSnapshotReadResult>,
): Promise<ReportSnapshotLoad> {
  const url = selectLatestReportSnapshotUrl(slug, documents);
  if (!url) return { snapshot: null, cacheable: true };
  const read = await readReport(url);
  if (read.status === "transient") return { snapshot: null, cacheable: false };
  if (read.status !== "ok") return { snapshot: null, cacheable: true };
  return { snapshot: parseCompanyReportSnapshot(slug, read.text, url), cacheable: true };
}

export function formatReportMetric(metric: ReportSnapshotMetric, currency: string) {
  const scale = metric.scale === "billion" ? " md" : metric.scale === "million" ? " mn" : "";
  const digits = metric.scale === "unit" && metric.amount < 100 ? 2 : metric.scale === "unit" ? 0 : 1;
  const current = `${formatSvNumber(metric.amount, { minimumFractionDigits: metric.amount % 1 === 0 ? 0 : digits, maximumFractionDigits: digits })}${scale} ${currency}`;
  if (metric.comparisonAmount === null || !metric.comparisonLabel) return current;
  const comparison = `${formatSvNumber(metric.comparisonAmount, { minimumFractionDigits: metric.comparisonAmount % 1 === 0 ? 0 : digits, maximumFractionDigits: digits })}${scale} ${currency}`;
  return `${current} · ${metric.comparisonLabel}: ${comparison}`;
}
