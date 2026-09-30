import { inflateRawSync } from "node:zlib";

export type AggregateShortPosition = {
  issuerName: string;
  lei: string;
  percent: number;
  positionDate: string;
};

export type NamedShortPosition = {
  holder: string;
  issuerName: string;
  isin: string;
  percent: number;
  positionDate: string;
};

export type ShortInterestRegister = {
  aggregates: AggregateShortPosition[];
  named: NamedShortPosition[];
  fetchedAt: string;
};

export type ShortInterestStatus = "available" | "missing" | "unavailable" | "unmatched";

export type CompanyShortInterest = {
  status: ShortInterestStatus;
  aggregate: AggregateShortPosition | null;
  named: NamedShortPosition[];
  fetchedAt: string | null;
  sourceUrl: string;
  sourceLabel: string;
};

export const SHORT_INTEREST_SOURCE_URL = "https://www.fi.se/sv/vara-register/blankningsregistret/";
export const SHORT_INTEREST_SOURCE_LABEL = "Källa: Finansinspektionen";
export const SHORT_INTEREST_MISSING_COPY = "Ingen uppgift i FI:s aktuella blankningsregister.";

const LEI = /^[A-Z0-9]{18,20}$/;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const ISIN = /^[A-Z]{2}[A-Z0-9]{10}$/;

export function readZipEntry(buffer: Uint8Array, entryName: string): Uint8Array | null {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let offset = 0;
  while (offset + 30 <= buffer.length) {
    if (view.getUint32(offset, true) !== 0x04034b50) return null;
    const flags = view.getUint16(offset + 6, true);
    const method = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    if (dataStart > buffer.length || (flags & 0x8) !== 0 || dataStart + compressedSize > buffer.length) {
      return null;
    }
    const name = new TextDecoder().decode(buffer.subarray(nameStart, nameStart + nameLength));
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    if (name === entryName) {
      if (method === 0) return compressed;
      if (method === 8) return inflateRawSync(compressed);
      return null;
    }
    offset = dataStart + compressedSize;
  }
  return null;
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

export function parseOdsRows(xml: string): string[][] {
  const rows: string[][] = [];
  for (const row of xml.matchAll(/<table:table-row\b[\s\S]*?<\/table:table-row>/g)) {
    const cells: string[] = [];
    for (const cell of row[0].matchAll(/<table:table-cell\b[\s\S]*?(?:\/>|<\/table:table-cell>)/g)) {
      const repeated = Number(cell[0].match(/table:number-columns-repeated="(\d+)"/)?.[1] ?? "1");
      if (!Number.isFinite(repeated) || repeated > 20) continue;
      const officeValue = cell[0].match(/office:value="([^"]+)"/)?.[1];
      const texts = [...cell[0].matchAll(/<text:p\b[^>]*>([\s\S]*?)<\/text:p>/g)]
        .map((part) => decodeXml(part[1].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim())
        .filter(Boolean);
      const value = officeValue ?? texts.join(" ");
      for (let index = 0; index < repeated; index += 1) cells.push(value);
    }
    if (cells.some((cell) => cell !== "")) rows.push(cells);
  }
  return rows;
}

function percent(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
}

export function parseAggregatePositions(rows: readonly (readonly string[])[]): AggregateShortPosition[] {
  const positions: AggregateShortPosition[] = [];
  for (const row of rows) {
    const issuerName = row[0]?.trim() ?? "";
    const lei = row[1]?.trim() ?? "";
    const share = percent(row[2] ?? "");
    const positionDate = row[3]?.trim() ?? "";
    if (!issuerName || !LEI.test(lei) || share === null || !ISO_DAY.test(positionDate)) continue;
    positions.push({ issuerName, lei, percent: share, positionDate });
  }
  return positions;
}

export function parseNamedPositions(rows: readonly (readonly string[])[]): NamedShortPosition[] {
  const positions: NamedShortPosition[] = [];
  for (const row of rows) {
    const holder = row[0]?.trim() ?? "";
    const issuerName = row[1]?.trim() ?? "";
    const isin = row[2]?.trim() ?? "";
    const share = percent(row[3] ?? "");
    const positionDate = row[4]?.trim() ?? "";
    if (!holder || !issuerName || !ISIN.test(isin) || share === null || share <= 0 || !ISO_DAY.test(positionDate)) {
      continue;
    }
    positions.push({ holder, issuerName, isin, percent: share, positionDate });
  }
  return positions;
}

export function emptyShortInterest(status: Extract<ShortInterestStatus, "unavailable" | "unmatched">): CompanyShortInterest {
  return {
    status,
    aggregate: null,
    named: [],
    fetchedAt: null,
    sourceUrl: SHORT_INTEREST_SOURCE_URL,
    sourceLabel: SHORT_INTEREST_SOURCE_LABEL,
  };
}

export function matchShortInterest(input: {
  lei: string | null | undefined;
  issuerName: string | null | undefined;
  register: ShortInterestRegister | null;
}): CompanyShortInterest {
  const lei = input.lei?.trim() ?? "";
  if (!LEI.test(lei)) return emptyShortInterest("unmatched");
  if (!input.register) return emptyShortInterest("unavailable");
  const aggregate = input.register.aggregates.find((row) => row.lei === lei) ?? null;
  const issuerName = input.issuerName?.trim() ?? "";
  const named = issuerName
    ? input.register.named
      .filter((row) => row.issuerName === issuerName)
      .sort((left, right) => right.percent - left.percent || right.positionDate.localeCompare(left.positionDate))
      .slice(0, 8)
    : [];
  return {
    status: aggregate ? "available" : "missing",
    aggregate,
    named: aggregate ? named : [],
    fetchedAt: input.register.fetchedAt,
    sourceUrl: SHORT_INTEREST_SOURCE_URL,
    sourceLabel: SHORT_INTEREST_SOURCE_LABEL,
  };
}

export function formatShortPercent(value: number) {
  return `${new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} %`;
}
