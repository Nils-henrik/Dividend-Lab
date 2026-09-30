import { crc32, inflateRawSync } from "node:zlib";

import { FI_ODS_CONTENT_XML_MAX_BYTES } from "@/lib/companies/short-interest/constants";
import type { OdsCell } from "@/lib/companies/short-interest/types";

const LOCAL_FILE_HEADER = 0x04034b50;
const CENTRAL_DIRECTORY = 0x02014b50;
const CONTENT_XML = "content.xml";
const MAX_COLUMN_REPEAT = 32;

function decodeXml(value: string): string | null {
  if (/&(?!(?:#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);)/.test(value)) return null;
  let invalid = false;
  const decoded = value.replace(
    /&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g,
    (entity, body: string) => {
      if (body === "amp") return "&";
      if (body === "lt") return "<";
      if (body === "gt") return ">";
      if (body === "quot") return "\"";
      if (body === "apos") return "'";
      const codePoint = body.startsWith("#x")
        ? Number.parseInt(body.slice(2), 16)
        : Number.parseInt(body.slice(1), 10);
      if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
        invalid = true;
        return entity;
      }
      return String.fromCodePoint(codePoint);
    },
  );
  if (invalid) return null;
  return decoded;
}

function paragraphText(inner: string): string | null {
  let invalid = false;
  const withSpaces = inner.replace(/<text:(?:s|tab|line-break)\b([^>]*)\/>/g, (_match, attrs: string) => {
    const countMatch = /\btext:c="(\d+)"/.exec(attrs);
    const count = countMatch ? Number(countMatch[1]) : 1;
    if (!Number.isInteger(count) || count < 1 || count > 40) {
      invalid = true;
      return " ";
    }
    return " ".repeat(count);
  });
  if (invalid) return null;
  const stripped = withSpaces.replace(/<[^>]+>/g, "");
  return decodeXml(stripped);
}

function cellText(inner: string): string | null {
  const withoutForeign = inner
    .replace(/<draw:frame\b[\s\S]*?<\/draw:frame>/g, "")
    .replace(/<office:annotation\b[\s\S]*?<\/office:annotation>/g, "");
  const paragraphs: string[] = [];
  const pattern = /<text:p\b[^>]*>([\s\S]*?)<\/text:p>/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(withoutForeign))) {
    const text = paragraphText(match[1] ?? "");
    if (text === null) return null;
    paragraphs.push(text);
  }
  return paragraphs.join(" ").replace(/\s+/g, " ").trim();
}

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(`\\b${name}="([^"]*)"`).exec(tag);
  if (!match?.[1]) return null;
  return decodeXml(match[1]);
}

function readOpenTag(
  xml: string,
  start: number,
): { tag: string; end: number; selfClosing: boolean } | null {
  let quote: "'" | "\"" | null = null;
  for (let index = start + 1; index < xml.length; index += 1) {
    const character = xml[index];
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === "\"" || character === "'") {
      quote = character;
      continue;
    }
    if (character === ">") {
      return {
        tag: xml.slice(start, index + 1),
        end: index + 1,
        selfClosing: xml[index - 1] === "/",
      };
    }
  }
  return null;
}

function readCells(inner: string): OdsCell[] | null {
  const cells: OdsCell[] = [];
  let index = 0;
  while (index < inner.length) {
    const nextCell = inner.indexOf("<table:table-cell", index);
    const nextCovered = inner.indexOf("<table:covered-table-cell", index);
    const starts = [nextCell, nextCovered].filter((value) => value >= 0);
    if (starts.length === 0) break;
    const start = Math.min(...starts);
    const open = readOpenTag(inner, start);
    if (!open) return null;
    const covered = inner.startsWith("<table:covered-table-cell", start);
    const closeName = covered ? "</table:covered-table-cell>" : "</table:table-cell>";
    let cellInner = "";
    let nextIndex = open.end;
    if (!open.selfClosing) {
      const close = inner.indexOf(closeName, open.end);
      if (close === -1) return null;
      cellInner = inner.slice(open.end, close);
      nextIndex = close + closeName.length;
    }
    const repeated = attribute(open.tag, "table:number-columns-repeated");
    const repeat = repeated === null ? 1 : Number(repeated);
    if (!Number.isInteger(repeat) || repeat < 1) return null;
    const text = covered ? "" : cellText(cellInner);
    if (text === null) return null;
    const value = covered ? null : attribute(open.tag, "office:value");
    const valueType = covered ? null : attribute(open.tag, "office:value-type");
    if (repeat > MAX_COLUMN_REPEAT) {
      if (text || value) return null;
      break;
    }
    for (let copy = 0; copy < repeat; copy += 1) {
      cells.push({ text, value, valueType });
    }
    index = nextIndex;
  }
  return cells;
}

export function readOdsTable(xml: string): OdsCell[][] | null {
  const rows: OdsCell[][] = [];
  let index = 0;
  while (index < xml.length) {
    const start = xml.indexOf("<table:table-row", index);
    if (start === -1) break;
    const open = readOpenTag(xml, start);
    if (!open) return null;
    if (open.selfClosing) {
      index = open.end;
      continue;
    }
    const close = xml.indexOf("</table:table-row>", open.end);
    if (close === -1) return null;
    const cells = readCells(xml.slice(open.end, close));
    if (!cells) return null;
    rows.push(cells);
    index = close + "</table:table-row>".length;
  }
  return rows.length > 0 ? rows : null;
}

export function readOdsContentXml(bytes: Uint8Array): string | null {
  if (bytes.byteLength < 30) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  while (offset + 30 <= bytes.byteLength) {
    const signature = view.getUint32(offset, true);
    if (signature === CENTRAL_DIRECTORY) return null;
    if (signature !== LOCAL_FILE_HEADER) return null;
    const flags = view.getUint16(offset + 6, true);
    const method = view.getUint16(offset + 8, true);
    const checksum = view.getUint32(offset + 14, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    if ((flags & 0x1) !== 0 || (flags & 0x8) !== 0) return null;
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (nameLength < 1 || dataEnd > bytes.byteLength) return null;
    let name: string;
    try {
      name = new TextDecoder("utf-8", { fatal: true }).decode(
        bytes.subarray(nameStart, nameStart + nameLength),
      );
    } catch {
      return null;
    }
    if (name === CONTENT_XML) {
      if (
        uncompressedSize < 1
        || uncompressedSize > FI_ODS_CONTENT_XML_MAX_BYTES
        || (method !== 0 && method !== 8)
      ) {
        return null;
      }
      const compressed = bytes.subarray(dataStart, dataEnd);
      let inflated: Uint8Array;
      try {
        inflated = method === 0 ? compressed : inflateRawSync(compressed);
      } catch {
        return null;
      }
      if (inflated.byteLength !== uncompressedSize) return null;
      if ((crc32(inflated) >>> 0) !== checksum) return null;
      try {
        const text = new TextDecoder("utf-8", { fatal: true }).decode(inflated);
        return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
      } catch {
        return null;
      }
    }
    offset = dataEnd;
  }
  return null;
}
