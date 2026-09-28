import type { CompanyFactDraft, CompanyOwnershipDraft } from "@/lib/companies/ingestion/facts";
import { decodeHtmlText, englishDateToIso } from "@/lib/companies/ingestion/text";

export type ParsedCompanyProfile = {
  facts: CompanyFactDraft[];
  ownership: CompanyOwnershipDraft[];
};

const NAME_TOKEN = /[A-ZÅÄÖÉÜ][\p{L}'’-]+/u;
const PERSON_NAME = new RegExp(`${NAME_TOKEN.source}(?:\\s+${NAME_TOKEN.source}){1,3}`, "u");
const CREDENTIAL_TOKEN = /^(?:msc|bsc|phd|mba|meng|beng|eng|llb|llm|cfa|md)$/iu;
const ROLE_TOKEN = /^(?:ab|and|board|business|ceo|cfo|chief|company|coo|enablement|executive|group|management|meet|more|of|officer|our|president|read|subscribe|team|the)$/iu;
const CEO_TITLES = [
  /President,\s+Chief Executive Officer/giu,
  /President and Chief Executive Officer/giu,
  /President and CEO/giu,
  /Group CEO/giu,
];

function dateOnly(value: string): string | null {
  const iso = englishDateToIso(value.replace(/,/g, ""));
  return iso ? iso.slice(0, 10) : null;
}

function parsePercent(value: string): number | null {
  const cleaned = decodeHtmlText(value).replace("%", "").replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null;
  return parsed;
}

function tableRows(html: string): string[][] {
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      decodeHtmlText(cell[1].replace(/<!--[\s\S]*?-->/g, " ")),
    ),
  );
}

function displayName(value: string): string | null {
  const name = decodeHtmlText(value).replace(/[*,]+$/g, "").trim();
  if (!PERSON_NAME.test(name) || name.length > 80) return null;
  const exact = name.match(PERSON_NAME)?.[0];
  if (!exact || exact !== name) return null;
  if (name.split(/\s+/).some((token) => CREDENTIAL_TOKEN.test(token))) return null;
  if (name === name.toLocaleUpperCase("sv-SE")) {
    return name
      .toLocaleLowerCase("sv-SE")
      .replace(/(^|[\s-])(\p{L})/gu, (_match, separator: string, letter: string) =>
        `${separator}${letter.toLocaleUpperCase("sv-SE")}`,
      );
  }
  return name;
}

function ceoFact(
  name: string | null,
  asOf: string | null,
  sourceUrl: string,
  sourcePublisher: string,
): CompanyFactDraft[] {
  if (!name) return [];
  return [{
    factType: "ceo",
    valueText: name,
    valueNumeric: null,
    unit: null,
    asOf,
    sourceUrl,
    sourcePublisher,
  }];
}

function ownershipFacts(
  owners: Array<{ ownerName: string; capitalPct: number; votesPct: number | null; asOf: string | null }>,
  sourceUrl: string,
  sourcePublisher: string,
): CompanyOwnershipDraft[] {
  return owners
    .filter((owner) => owner.asOf && owner.ownerName.length > 0)
    .slice(0, 10)
    .map((owner) => ({
      ownerName: owner.ownerName,
      capitalPct: owner.capitalPct,
      votesPct: owner.votesPct,
      asOf: owner.asOf,
      sourceUrl,
      sourcePublisher,
    }));
}

function dividendFacts(
  dividend: { perShare: number; currency: string; year: number | null; asOf: string | null } | null,
  sourceUrl: string,
  sourcePublisher: string,
): CompanyFactDraft[] {
  if (!dividend || !/^[A-Z]{3}$/.test(dividend.currency)) return [];
  const facts: CompanyFactDraft[] = [{
    factType: "dividend_per_share",
    valueText: null,
    valueNumeric: dividend.perShare,
    unit: dividend.currency,
    asOf: dividend.asOf,
    sourceUrl,
    sourcePublisher,
  }, {
    factType: "dividend_currency",
    valueText: dividend.currency,
    valueNumeric: null,
    unit: null,
    asOf: dividend.asOf,
    sourceUrl,
    sourcePublisher,
  }];
  if (dividend.year) {
    facts.push({
      factType: "dividend_year",
      valueText: null,
      valueNumeric: dividend.year,
      unit: null,
      asOf: dividend.asOf,
      sourceUrl,
      sourcePublisher,
    });
  }
  return facts;
}

function personBeforeTitle(window: string): string | null {
  const rest = window
    .replace(/,\s*born\s+in\s+(?:19|20)\d{2},\s*has\s+been\s*$/iu, "")
    .replace(/\s+\((?:19|20)\d{2}\)\s+(?:MSc|BSc|PhD|MBA|MEng|Eng)\.?(?:\s+Eng\.?)?\s*$/iu, "")
    .replace(/\s+took\s+office\s+as\s*$/iu, "")
    .trimEnd();
  const match = rest.match(new RegExp(`(${NAME_TOKEN.source})\\s+(${NAME_TOKEN.source})\\s*$`, "u"));
  if (!match) return null;
  if ([match[1], match[2]].some((token) => ROLE_TOKEN.test(token) || CREDENTIAL_TOKEN.test(token))) {
    return null;
  }
  return displayName(`${match[1]} ${match[2]}`);
}

function namedCeo(text: string): { name: string; asOf: string | null } | null {
  for (const title of CEO_TITLES) {
    for (const match of text.matchAll(title)) {
      const index = match.index ?? 0;
      const name = personBeforeTitle(text.slice(Math.max(0, index - 120), index));
      if (!name) continue;
      const nearby = text.slice(index, index + 180);
      const asOf = dateOnly(nearby.match(/since\s+(\d{1,2}\s+[A-Za-z]+\s+20\d{2})/i)?.[1] ?? "")
        ?? dateOnly(nearby.match(/\bon\s+([A-Za-z]+\s+\d{1,2},?\s+20\d{2})/i)?.[1] ?? "");
      return { name, asOf };
    }
  }
  return null;
}

export function parseNamedCeo(html: string): string | null {
  return namedCeo(decodeHtmlText(html))?.name ?? null;
}

export function profileFromCeo(
  html: string,
  sourceUrl: string,
  sourcePublisher: string,
  asOf: string | null = null,
): ParsedCompanyProfile | null {
  const parsed = namedCeo(decodeHtmlText(html));
  const facts = ceoFact(parsed?.name ?? null, asOf ?? parsed?.asOf ?? null, sourceUrl, sourcePublisher);
  return facts.length ? { facts, ownership: [] } : null;
}

export function parseAddtechOwnership(
  html: string,
  sourceUrl: string,
  sourcePublisher: string,
): ParsedCompanyProfile | null {
  const asOf = decodeHtmlText(html).match(/shareholders\s+(20\d{2}-\d{2}-\d{2})/i)?.[1] ?? null;
  if (!asOf) return null;
  const owners = tableRows(html).flatMap((cells) => {
    if (cells.length < 5 || /^owner$/i.test(cells[0])) return [];
    const capitalPct = parsePercent(cells[3]);
    if (capitalPct === null || cells[0].length < 2) return [];
    return [{
      ownerName: cells[0],
      capitalPct,
      votesPct: parsePercent(cells[4]),
      asOf,
    }];
  });
  const ownership = ownershipFacts(owners, sourceUrl, sourcePublisher);
  return ownership.length ? { facts: [], ownership } : null;
}

export function parseHmOwnership(
  html: string,
  sourceUrl: string,
  sourcePublisher: string,
): ParsedCompanyProfile | null {
  const asOf = dateOnly(decodeHtmlText(html).match(/as at\s+(\d{1,2}\s+[A-Za-z]+\s+20\d{2})/i)?.[1] ?? "");
  if (!asOf) return null;
  const owners = tableRows(html).flatMap((cells) => {
    if (cells.length < 4 || /^name$/i.test(cells[0])) return [];
    const capitalPct = parsePercent(cells[2]);
    if (capitalPct === null || cells[0].length < 2) return [];
    return [{
      ownerName: cells[0].replace(/\*+$/g, "").trim(),
      capitalPct,
      votesPct: parsePercent(cells[3]),
      asOf,
    }];
  });
  const ownership = ownershipFacts(owners, sourceUrl, sourcePublisher);
  return ownership.length ? { facts: [], ownership } : null;
}

export function parseHmDividend(
  html: string,
  sourceUrl: string,
  sourcePublisher: string,
): ParsedCompanyProfile | null {
  const text = decodeHtmlText(html);
  const amount = text.match(/SEK\s+(\d+\.\d{1,2})\s+per share/i);
  const recordDate = text.match(/record date[\s\S]{0,180}?(\d{1,2}\s+[A-Za-z]+\s+(20\d{2}))/i);
  const asOf = dateOnly(recordDate?.[1] ?? "");
  const year = Number(recordDate?.[2]);
  if (!amount || !asOf || !Number.isInteger(year)) return null;
  const perShare = Number(amount[1]);
  if (!(perShare > 0)) return null;
  const facts = dividendFacts({
    perShare,
    currency: "SEK",
    year,
    asOf,
  }, sourceUrl, sourcePublisher);
  return facts.length ? { facts, ownership: [] } : null;
}

export function parseEvolutionOwnership(
  html: string,
  sourceUrl: string,
  sourcePublisher: string,
): ParsedCompanyProfile | null {
  const owners = tableRows(html).flatMap((cells) => {
    if (cells.length < 5 || /^owner$/i.test(cells[0])) return [];
    const capitalPct = parsePercent(cells[2]);
    const asOf = cells[4].match(/^(20\d{2}-\d{2}-\d{2})$/)?.[1] ?? null;
    if (capitalPct === null || !asOf || cells[0].length < 2) return [];
    return [{
      ownerName: cells[0],
      capitalPct,
      votesPct: parsePercent(cells[3]),
      asOf,
    }];
  });
  const ownership = ownershipFacts(owners, sourceUrl, sourcePublisher);
  return ownership.length ? { facts: [], ownership } : null;
}

export function parseAtlasOwnership(
  html: string,
  sourceUrl: string,
  sourcePublisher: string,
): ParsedCompanyProfile | null {
  const asOf = dateOnly(decodeHtmlText(html).match(/([A-Za-z]+\s+\d{1,2},?\s+20\d{2})/)?.[1] ?? "");
  if (!asOf) return null;
  const owners = tableRows(html).flatMap((cells) => {
    if (cells.length < 6) return [];
    const capitalPct = parsePercent(cells[5]);
    if (capitalPct === null || cells[0].length < 2 || /\d{4}/.test(cells[0])) return [];
    return [{
      ownerName: cells[0],
      capitalPct,
      votesPct: parsePercent(cells[4]),
      asOf,
    }];
  });
  const ownership = ownershipFacts(owners, sourceUrl, sourcePublisher);
  return ownership.length ? { facts: [], ownership } : null;
}
