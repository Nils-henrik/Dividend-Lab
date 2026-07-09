export type MarketPulseItem = {
  title: string;
  source: string;
  url: string;
  publishedAt?: string;
};

type FeedSource = {
  name: string;
  url: string;
};

const feedSources: FeedSource[] = [
  {
    name: "SVT Ekonomi",
    url: "https://www.svt.se/nyheter/ekonomi/rss.xml",
  },
  {
    name: "Sveriges Radio Ekonomi",
    url: "https://api.sr.se/api/rss/program/1646",
  },
  {
    name: "EFN",
    url: "https://efn.se/rss/infront",
  },
  {
    name: "Dagens PS",
    url: "https://www.dagensps.se/feed/",
  },
];

const REVALIDATE_SECONDS = 900;
const FETCH_TIMEOUT_MS = 8000;
const MAX_ITEMS = 5;
const MAX_PER_SOURCE = 2;
const FALLBACK_ERROR = "Nyhetsflödet kunde inte hämtas just nu.";

const RELEVANCE_KEYWORDS = [
  "börs",
  "aktie",
  "aktier",
  "ränt",
  "inflation",
  "utdel",
  "rapport",
  "marknad",
  "ekonomi",
  "olja",
  "guld",
  "valuta",
  "omx",
  "företag",
  "bank",
  "bostad",
  "krona",
  "invest",
  "portfölj",
  "konjunktur",
  "råvar",
  "finans",
  "bolag",
  "privat",
  "spar",
];

const IRRELEVANT_KEYWORDS = [
  "brott",
  "mord",
  "kollision",
  "brand ",
  "olycka",
  "fotboll",
  "ishockey",
  "melodifestival",
];

function decodeXmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, "$1")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function extractTag(block: string, tagName: string) {
  const match = block.match(
    new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"),
  );
  return match ? decodeXmlEntities(match[1]) : "";
}

function parseRssItems(xml: string, source: string): MarketPulseItem[] {
  try {
    const items: MarketPulseItem[] = [];
    const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

    for (const block of blocks) {
      const title = extractTag(block, "title");
      const url =
        extractTag(block, "link") ||
        block.match(/<link[^>]*href="([^"]+)"/i)?.[1] ||
        extractTag(block, "guid");
      const publishedAt =
        extractTag(block, "pubDate") || extractTag(block, "updated") || undefined;

      if (!title || !url) {
        continue;
      }

      items.push({
        title,
        source,
        url,
        publishedAt,
      });
    }

    return items;
  } catch {
    return [];
  }
}

function parseAtomEntries(xml: string, source: string): MarketPulseItem[] {
  try {
    const items: MarketPulseItem[] = [];
    const blocks = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];

    for (const block of blocks) {
      const title = extractTag(block, "title");
      const url =
        block.match(/<link[^>]*href="([^"]+)"/i)?.[1] || extractTag(block, "id");
      const publishedAt =
        extractTag(block, "published") || extractTag(block, "updated") || undefined;

      if (!title || !url) {
        continue;
      }

      items.push({
        title,
        source,
        url,
        publishedAt,
      });
    }

    return items;
  } catch {
    return [];
  }
}

function parseFeedXml(xml: string, source: string) {
  try {
    if (xml.includes("<feed")) {
      return parseAtomEntries(xml, source);
    }

    return parseRssItems(xml, source);
  } catch {
    return [];
  }
}

function getPublishedTimestamp(value?: string) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isRelevantTitle(title: string) {
  const normalized = title.toLowerCase();

  if (IRRELEVANT_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return false;
  }

  return RELEVANCE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function balanceSources(items: MarketPulseItem[]) {
  const sorted = [...items].sort(
    (left, right) =>
      getPublishedTimestamp(right.publishedAt) - getPublishedTimestamp(left.publishedAt),
  );

  const selected: MarketPulseItem[] = [];
  const sourceCounts = new Map<string, number>();
  const seenUrls = new Set<string>();

  function tryAdd(item: MarketPulseItem, requireRelevance: boolean) {
    if (selected.length >= MAX_ITEMS || seenUrls.has(item.url)) {
      return;
    }

    if (requireRelevance && !isRelevantTitle(item.title)) {
      return;
    }

    const count = sourceCounts.get(item.source) ?? 0;

    if (count >= MAX_PER_SOURCE) {
      return;
    }

    selected.push(item);
    seenUrls.add(item.url);
    sourceCounts.set(item.source, count + 1);
  }

  for (const item of sorted) {
    tryAdd(item, true);
  }

  if (selected.length < MAX_ITEMS) {
    for (const item of sorted) {
      tryAdd(item, false);
    }
  }

  return selected;
}

async function fetchFeed(source: FeedSource): Promise<MarketPulseItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(source.url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: controller.signal,
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return parseFeedXml(xml, source.name);
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getMarketPulseItems(): Promise<{
  items: MarketPulseItem[];
  error: string | null;
}> {
  try {
    const results = await Promise.allSettled(
      feedSources.map((source) => fetchFeed(source)),
    );

    const merged = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );

    const items = balanceSources(merged);

    if (items.length === 0) {
      return {
        items: [],
        error: FALLBACK_ERROR,
      };
    }

    return {
      items,
      error: null,
    };
  } catch {
    return {
      items: [],
      error: FALLBACK_ERROR,
    };
  }
}

export function formatMarketPulseTime(publishedAt?: string) {
  if (!publishedAt) {
    return "Okänd tid";
  }

  const date = new Date(publishedAt);

  if (Number.isNaN(date.getTime())) {
    return publishedAt;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
