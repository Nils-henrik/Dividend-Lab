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
    name: "Dagens industri",
    url: "https://www.di.se/rss",
  },
];

const REVALIDATE_SECONDS = 900;

function decodeXmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function extractTag(block: string, tagName: string) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? decodeXmlEntities(match[1]) : "";
}

function parseRssItems(xml: string, source: string): MarketPulseItem[] {
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
}

function parseAtomEntries(xml: string, source: string): MarketPulseItem[] {
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
}

function parseFeedXml(xml: string, source: string) {
  if (xml.includes("<feed")) {
    return parseAtomEntries(xml, source);
  }

  return parseRssItems(xml, source);
}

function getPublishedTimestamp(value?: string) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

async function fetchFeed(source: FeedSource) {
  const response = await fetch(source.url, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: {
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Feed request failed for ${source.name}`);
  }

  const xml = await response.text();
  return parseFeedXml(xml, source.name);
}

export async function getMarketPulseItems(): Promise<{
  items: MarketPulseItem[];
  error: string | null;
}> {
  const results = await Promise.allSettled(
    feedSources.map((source) => fetchFeed(source)),
  );

  const items = results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort(
      (left, right) =>
        getPublishedTimestamp(right.publishedAt) -
        getPublishedTimestamp(left.publishedAt),
    )
    .slice(0, 5);

  if (items.length === 0) {
    return {
      items: [],
      error: "Nyhetsflödet kunde inte hämtas just nu.",
    };
  }

  return {
    items,
    error: null,
  };
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
