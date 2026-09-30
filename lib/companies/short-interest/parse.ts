import {
  FI_AGGREGATE_ODS_URL,
  FI_CURRENT_POSITIONS_ODS_URL,
  FI_SHORT_INTEREST_MAX_ROWS,
  FI_SHORT_INTEREST_PAGE_URL,
  FI_SHORT_INTEREST_PUBLISHER,
} from "@/lib/companies/short-interest/constants";
import { isIsin, isIsoDate, isLei, normalizeIssuerName } from "@/lib/companies/short-interest/identifiers";
import { readOdsContentXml, readOdsTable } from "@/lib/companies/short-interest/ods";
import type {
  FiAggregatePosition,
  FiNamedShortPosition,
  FiShortInterestRegister,
  OdsCell,
} from "@/lib/companies/short-interest/types";

const AGGREGATE_HEADERS = [
  "namn på emittent (name of the issuer)",
  "lei",
  "position i procent (position in per cent)",
  "positionsdatum senaste position (position date, latest position)",
] as const;

const NAMED_HEADERS = [
  "innehavare av positionen (position holder)",
  "namn på emittent (name of the issuer)",
  "isin",
  "position i procent (position in per cent)",
  "datum för positionen (position date)",
  "kommentar (comment)",
] as const;

function headerText(cell: OdsCell | undefined): string {
  return normalizeIssuerName(cell?.text ?? "");
}

function rowIsEmpty(row: readonly OdsCell[]): boolean {
  return row.every((cell) => cell.text === "" && cell.value === null);
}

function trailingCellsEmpty(row: readonly OdsCell[], from: number): boolean {
  return row.slice(from).every((cell) => cell.text === "" && cell.value === null);
}

function findHeader(rows: readonly OdsCell[][], expected: readonly string[]): number | null {
  let found: number | null = null;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const matches = expected.every((label, column) => headerText(row[column]) === label);
    const extra = row.slice(expected.length).some((cell) => cell.text !== "");
    if (!matches || extra) continue;
    if (found !== null) return null;
    found = index;
  }
  return found;
}

function readPercent(cell: OdsCell | undefined): number | null {
  if (!cell) return null;
  let fromValue: number | null = null;
  if (cell.valueType === "float" || cell.value !== null) {
    if (cell.valueType !== "float" || cell.value === null || !/^\d+(?:\.\d+)?$/.test(cell.value)) return null;
    fromValue = Number(cell.value);
  }
  const text = cell.text.replace(/\u00a0/g, "").replace(/\s/g, "");
  const fromText = /^\d+(?:,\d+)?$/.test(text) ? Number(text.replace(",", ".")) : null;
  if (fromValue === null && fromText === null) return null;
  if (
    fromValue !== null
    && fromText !== null
    && Math.abs(fromValue - fromText) > 0.0001
  ) {
    return null;
  }
  const percent = fromValue ?? fromText;
  if (percent === null || !Number.isFinite(percent) || percent <= 0 || percent > 100) return null;
  return percent;
}

function readDate(cell: OdsCell | undefined): string | null {
  if (!cell) return null;
  const text = cell.text.trim();
  if (!isIsoDate(text)) return null;
  if (cell.value !== null && cell.value !== text) return null;
  return text;
}

function readLabel(cell: OdsCell | undefined, maxLength: number): string | null {
  if (!cell || cell.value !== null) return null;
  const text = cell.text.trim();
  if (!text || text.length > maxLength || /[\u0000-\u001f]/.test(text)) return null;
  return text;
}

function readLei(cell: OdsCell | undefined): string | null {
  if (!cell) return null;
  const lei = cell.text.trim().toUpperCase();
  if (!isLei(lei)) return null;
  if (cell.value !== null && cell.value.toUpperCase() !== lei) return null;
  return lei;
}

function readIsin(cell: OdsCell | undefined): string | null {
  if (!cell) return null;
  const isin = cell.text.trim().toUpperCase();
  if (!isIsin(isin)) return null;
  if (cell.value !== null && cell.value.toUpperCase() !== isin) return null;
  return isin;
}

export function parseAggregateSheet(xml: string): FiAggregatePosition[] | null {
  const rows = readOdsTable(xml);
  if (!rows) return null;
  const headerIndex = findHeader(rows, AGGREGATE_HEADERS);
  if (headerIndex === null) return null;
  const aggregates: FiAggregatePosition[] = [];
  const seenLei = new Set<string>();
  const seenNames = new Set<string>();
  for (const row of rows.slice(headerIndex + 1)) {
    if (rowIsEmpty(row)) continue;
    if (aggregates.length >= FI_SHORT_INTEREST_MAX_ROWS) return null;
    const issuerName = readLabel(row[0], 200);
    const lei = readLei(row[1]);
    const percent = readPercent(row[2]);
    const positionDate = readDate(row[3]);
    if (!issuerName || !lei || percent === null || !positionDate || !trailingCellsEmpty(row, 4)) {
      return null;
    }
    const nameKey = normalizeIssuerName(issuerName);
    if (seenLei.has(lei) || seenNames.has(nameKey)) return null;
    seenLei.add(lei);
    seenNames.add(nameKey);
    aggregates.push({ issuerName, lei, percent, positionDate });
  }
  return aggregates;
}

export function parseNamedPositionSheet(xml: string): FiNamedShortPosition[] | null {
  const rows = readOdsTable(xml);
  if (!rows) return null;
  const headerIndex = findHeader(rows, NAMED_HEADERS);
  if (headerIndex === null) return null;
  const positions: FiNamedShortPosition[] = [];
  const seen = new Set<string>();
  for (const row of rows.slice(headerIndex + 1)) {
    if (rowIsEmpty(row)) continue;
    if (positions.length >= FI_SHORT_INTEREST_MAX_ROWS) return null;
    const holder = readLabel(row[0], 200);
    const issuerName = readLabel(row[1], 200);
    const isin = readIsin(row[2]);
    const percent = readPercent(row[3]);
    const positionDate = readDate(row[4]);
    const commentCell = row[5];
    const commentIsEmpty = Boolean(commentCell && commentCell.text === "" && commentCell.value === null);
    const comment = !commentCell || commentIsEmpty ? null : readLabel(commentCell, 500);
    const commentInvalid = Boolean(commentCell) && !commentIsEmpty && comment === null;
    if (
      !holder
      || !issuerName
      || !isin
      || percent === null
      || !positionDate
      || !commentCell
      || commentInvalid
      || !trailingCellsEmpty(row, 6)
    ) {
      return null;
    }
    const key = [
      normalizeIssuerName(holder),
      normalizeIssuerName(issuerName),
      isin,
      positionDate,
      percent.toString(),
    ].join("\u001f");
    if (seen.has(key)) return null;
    seen.add(key);
    positions.push({
      holder,
      issuerName,
      isin,
      percent,
      positionDate,
      comment,
    });
  }
  return positions;
}

export function parseFiShortInterestOds(input: {
  aggregate: Uint8Array;
  currentPositions: Uint8Array;
  fetchedAt?: string | null;
}): FiShortInterestRegister | null {
  const aggregateXml = readOdsContentXml(input.aggregate);
  const positionsXml = readOdsContentXml(input.currentPositions);
  if (!aggregateXml || !positionsXml) return null;
  const aggregates = parseAggregateSheet(aggregateXml);
  const namedPositions = parseNamedPositionSheet(positionsXml);
  if (!aggregates || !namedPositions) return null;
  return {
    aggregates,
    namedPositions,
    source: {
      publisher: FI_SHORT_INTEREST_PUBLISHER,
      pageUrl: FI_SHORT_INTEREST_PAGE_URL,
      aggregateUrl: FI_AGGREGATE_ODS_URL,
      currentPositionsUrl: FI_CURRENT_POSITIONS_ODS_URL,
      fetchedAt: input.fetchedAt ?? null,
    },
  };
}
