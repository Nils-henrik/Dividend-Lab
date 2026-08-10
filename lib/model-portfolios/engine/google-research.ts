import "server-only";

export type GoogleResearchHit = {
  title: string;
  snippet: string;
  url: string;
  publisher: "Google Custom Search";
  fetchedAt: string;
};

type GoogleSearchResponse = {
  items?: Array<{
    title?: unknown;
    snippet?: unknown;
    link?: unknown;
  }>;
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function httpsUrl(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Optional bounded Google Programmable Search lookup. Missing credentials are
 * a normal disabled state. Search snippets are discovery evidence only: they
 * are never converted into invented financial metrics.
 */
export async function searchGoogleCompanyResearch(input: {
  companyName: string;
  symbol: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<GoogleResearchHit[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY?.trim();
  const cx = process.env.GOOGLE_CSE_CX?.trim();
  if (!apiKey || !cx) return [];

  const companyName = input.companyName.trim();
  const symbol = input.symbol.trim();
  if (!companyName || !symbol) return [];

  const fetchImpl = input.fetchImpl ?? fetch;
  const now = input.now ?? new Date();
  const query = `${companyName} ${symbol} investor relations earnings revenue valuation annual report`;
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", query);
  url.searchParams.set("num", "3");
  url.searchParams.set("safe", "active");

  try {
    const response = await fetchImpl(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 14_400 },
    });
    if (!response.ok) return [];
    const body = (await response.json()) as GoogleSearchResponse;
    return (body.items ?? [])
      .map((item): GoogleResearchHit | null => {
        const title = text(item.title);
        const snippet = text(item.snippet);
        const resultUrl = httpsUrl(item.link);
        if (!title || !snippet || !resultUrl) return null;
        return {
          title: title.slice(0, 200),
          snippet: snippet.slice(0, 1_400),
          url: resultUrl,
          publisher: "Google Custom Search",
          fetchedAt: now.toISOString(),
        };
      })
      .filter((item): item is GoogleResearchHit => Boolean(item));
  } catch {
    return [];
  }
}
