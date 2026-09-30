import "server-only";

import type { CompanyProfile } from "@/lib/companies/types";
import {
  matchShortInterest,
  parseAggregatePositions,
  parseNamedPositions,
  parseOdsRows,
  readZipEntry,
  type CompanyShortInterest,
  type ShortInterestRegister,
} from "@/lib/companies/short-interest";

const AGGREGATE_URL = "https://www.fi.se/BlankningsRegister/GetBlankningsregisterAggregat";
const CURRENT_URL = "https://www.fi.se/BlankningsRegister/GetAktuellFile";
const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8_000;
const SUCCESS_TTL_MS = 60 * 60 * 1000;
const FAILURE_TTL_MS = 10 * 60 * 1000;

type CacheEntry = {
  at: number;
  register: ShortInterestRegister | null;
};

let cache: CacheEntry | null = null;
let pending: Promise<ShortInterestRegister | null> | null = null;

async function fetchBounded(url: string): Promise<Uint8Array | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "DivLabBot/1.0" },
      cache: "no-store",
    });
    if (!response.ok || !response.body) return null;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const buffer = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return buffer;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function rowsFromOds(buffer: Uint8Array) {
  const entry = readZipEntry(buffer, "content.xml");
  if (!entry) return null;
  let xml = "";
  try {
    xml = new TextDecoder("utf-8", { fatal: true }).decode(entry);
  } catch {
    return null;
  }
  const rows = parseOdsRows(xml);
  return rows.length > 0 ? rows : null;
}

async function loadRegister(): Promise<ShortInterestRegister | null> {
  const now = Date.now();
  if (cache && now - cache.at < (cache.register ? SUCCESS_TTL_MS : FAILURE_TTL_MS)) {
    return cache.register;
  }
  if (pending) return pending;
  pending = (async () => {
    const [aggregateFile, currentFile] = await Promise.all([
      fetchBounded(AGGREGATE_URL),
      fetchBounded(CURRENT_URL),
    ]);
    if (!aggregateFile || !currentFile) {
      cache = { at: Date.now(), register: null };
      return null;
    }
    const aggregateRows = rowsFromOds(aggregateFile);
    const namedRows = rowsFromOds(currentFile);
    if (!aggregateRows || !namedRows) {
      cache = { at: Date.now(), register: null };
      return null;
    }
    const aggregates = parseAggregatePositions(aggregateRows);
    const named = parseNamedPositions(namedRows);
    if (aggregates.length === 0 || named.length === 0) {
      cache = { at: Date.now(), register: null };
      return null;
    }
    const register = { aggregates, named, fetchedAt: new Date().toISOString() };
    cache = { at: Date.now(), register };
    return register;
  })().finally(() => {
    pending = null;
  });
  return pending;
}

export async function loadCompanyShortInterest(
  company: Pick<CompanyProfile, "fiLei" | "fiIssuerName">,
): Promise<CompanyShortInterest> {
  if (!company.fiLei) {
    return matchShortInterest({ lei: null, issuerName: null, register: null });
  }
  const register = await loadRegister();
  return matchShortInterest({
    lei: company.fiLei,
    issuerName: company.fiIssuerName,
    register,
  });
}
