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

function sameMetric(left: ReportSnapshotMetric, right: ReportSnapshotMetric) {
  return left.amount === right.amount
    && left.comparisonAmount === right.comparisonAmount
    && left.reportedChangePercent === right.reportedChangePercent
    && left.scale === right.scale;
}

function dedupeMetrics(metrics: ReportSnapshotMetric[]): ReportSnapshotMetric[] | null {
  const kept: ReportSnapshotMetric[] = [];
  for (const metric of metrics) {
    const previous = kept.find((item) => item.id === metric.id);
    if (!previous) {
      kept.push(metric);
      continue;
    }
    if (!sameMetric(previous, metric)) return null;
  }
  return kept;
}

function finishSnapshot(input: {
  period: string;
  currency: string;
  publishedOn: string;
  sourceUrl: string;
  sourcePublisher: string;
  metrics: ReportSnapshotMetric[];
}): ReportSnapshot | null {
  if (
    !input.period
    || !CURRENCY.test(input.currency)
    || !DATE_ONLY.test(input.publishedOn)
    || !input.sourceUrl.startsWith("https://")
    || !input.sourcePublisher
    || input.metrics.length === 0
  ) {
    return null;
  }
  return input;
}

function columnIndexes(header: string[]) {
  const currentLabel = header.find((cell) => /^Q[1-4] 20\d{2}$/.test(cell));
  if (!currentLabel) return null;
  const [quarter, yearText] = currentLabel.split(" ");
  const year = Number(yearText);
  const comparisonLabel = `${quarter} ${year - 1}`;
  const current = header.indexOf(currentLabel);
  const comparison = header.indexOf(comparisonLabel);
  if (current < 1 || comparison < 1) return null;
  const change = header[comparison + 1] === "Chg %" ? comparison + 1 : -1;
  return { current, comparison, change, period: `${yearText} ${quarter}`, comparisonLabel };
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

export function parseNordeaReportSnapshot(html: string, sourceUrl: string): ReportSnapshot | null {
  if (!/^https:\/\/www\.nordea\.com\/en\/press\/\d{4}-\d{2}-\d{2}\//.test(sourceUrl)) return null;
  const publishedOn = sourceUrl.match(/\/en\/press\/(\d{4}-\d{2}-\d{2})\//)?.[1] ?? "";
  const text = decodeHtmlText(html);
  if (!text.includes(publishedOn) && !text.includes(publishedOn.slice(8) + "-" + publishedOn.slice(5, 7) + "-" + publishedOn.slice(0, 4))) {
    const dmy = `${publishedOn.slice(8, 10)}-${publishedOn.slice(5, 7)}-${publishedOn.slice(0, 4)}`;
    if (!html.includes(publishedOn) && !html.includes(dmy)) return null;
  }
  const metrics: ReportSnapshotMetric[] = [];
  let period: string | null = null;
  for (const table of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
    const rows = tableRows(table[1]);
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
      } else if (!millionTable && label === "Diluted earnings per share (DEPS), EUR") {
        const metric = metricFromRow({ id: "diluted_eps", label: "Diluted earnings per share (DEPS)", cells, columns, scale: "unit" });
        if (metric) metrics.push(metric);
      }
    }
  }
  const unique = dedupeMetrics(metrics);
  if (!unique) return null;
  return finishSnapshot({
    period: period ?? "",
    currency: "EUR",
    publishedOn,
    sourceUrl,
    sourcePublisher: "Nordea",
    metrics: unique,
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
  if (!sourceUrl.startsWith("https://www.tele2.com/investors/reports-and-presentations/")) return null;
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

export function parseIndustrivardenReportSnapshot(html: string, sourceUrl: string): ReportSnapshot | null {
  if (!sourceUrl.startsWith("https://www.industrivarden.se/media/Pressmeddelanden/")) return null;
  const publishedOn = html.match(/<time\b[^>]*datetime="(\d{4}-\d{2}-\d{2})"/i)?.[1] ?? "";
  const text = decodeHtmlText(html).replace(/\s+/g, " ");
  const nav = text.match(/Substansvärdet den 30 juni (20\d{2}) var ([0-9]+(?:,[0-9]+)?) mdkr, eller ([0-9]+) kronor per aktie/);
  if (!nav || !publishedOn) return null;
  const amount = Number(nav[2].replace(",", "."));
  const perShare = Number(nav[3]);
  if (!Number.isFinite(amount) || !Number.isFinite(perShare)) return null;
  return finishSnapshot({
    period: `${nav[1]} H1`,
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

export function selectNordeaReportArticleUrl(html: string): string | null {
  const matches = [...html.matchAll(/href="(\/en\/press\/\d{4}-\d{2}-\d{2}\/[^"]*half-year-results[^"]*)"/gi)];
  const href = matches[0]?.[1];
  if (!href) return null;
  return `https://www.nordea.com${href}`;
}

export function selectTele2ReportArticleUrl(html: string): string | null {
  const href = html.match(/href="(\/investors\/reports-and-presentations\/[^"]+)"/i)?.[1];
  if (!href || href.includes("?")) return null;
  return `https://www.tele2.com${href}`;
}

export function selectIndustrivardenReportUrl(xml: string): string | null {
  const items = [...xml.matchAll(/<item\b([^>]*)>([\s\S]*?)<\/item>/gi)];
  const parsed = items.flatMap((match) => {
    const base = match[1].match(/xml:base="(https:\/\/www\.industrivarden\.se\/media\/Pressmeddelanden\/[^"]+)"/i)?.[1];
    const title = match[2].match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
    const pubDate = match[2].match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "";
    const time = new Date(pubDate).getTime();
    if (!base || !/delårsrapport|bokslutsrapport|årsredovisning/i.test(title) || !Number.isFinite(time)) return [];
    return [{ base, time }];
  }).sort((left, right) => right.time - left.time);
  return parsed[0]?.base ?? null;
}

export function formatReportMetric(metric: ReportSnapshotMetric, currency: string) {
  const scale = metric.scale === "billion" ? " md" : metric.scale === "million" ? " mn" : "";
  const digits = metric.scale === "unit" && metric.amount < 100 ? 2 : metric.scale === "unit" ? 0 : 1;
  const current = `${formatSvNumber(metric.amount, { minimumFractionDigits: metric.amount % 1 === 0 ? 0 : digits, maximumFractionDigits: digits })}${scale} ${currency}`;
  if (metric.comparisonAmount === null || !metric.comparisonLabel) return current;
  const comparison = `${formatSvNumber(metric.comparisonAmount, { minimumFractionDigits: metric.comparisonAmount % 1 === 0 ? 0 : digits, maximumFractionDigits: digits })}${scale} ${currency}`;
  return `${current} · ${metric.comparisonLabel}: ${comparison}`;
}
