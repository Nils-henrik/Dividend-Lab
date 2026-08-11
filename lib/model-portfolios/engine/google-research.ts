import "server-only";

export type GoogleResearchHit = {
  title: string;
  snippet: string;
  url: string;
  publisher: string;
  sourceKind: "company_primary_candidate" | "discovery";
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

function publisherFromUrl(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./i, "");
  } catch {
    return "web_source";
  }
}

function isLikelyCompanyPrimaryCandidate(input: {
  title: string;
  snippet: string;
  url: string;
}): boolean {
  const haystack = `${input.title} ${input.snippet} ${input.url}`.toLowerCase();
  return [
    "investor relations",
    "investors",
    "press release",
    "company announcement",
    "annual report",
    "interim report",
    "quarterly report",
    "financial report",
    "financial statements",
    "/investors",
    "/press",
    "/media",
    "/reports",
  ].some((needle) => haystack.includes(needle));
}

/**
 * Optional bounded Google Programmable Search lookup. Missing credentials are
 * a normal disabled state. Google is discovery only: results are attributed to
 * their destination publisher, likely company/IR sources are ranked first, and
 * snippets are never converted into invented financial metrics.
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
  const query = `${companyName} ${symbol} ("investor relations" OR "press release" OR "annual report" OR "interim report" OR guidance OR dividend OR acquisition OR contract)`;
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
          publisher: publisherFromUrl(resultUrl),
          sourceKind: isLikelyCompanyPrimaryCandidate({
            title,
            snippet,
            url: resultUrl,
          })
            ? "company_primary_candidate"
            : "discovery",
          fetchedAt: now.toISOString(),
        };
      })
      .filter((item): item is GoogleResearchHit => Boolean(item))
      .sort((a, b) => Number(b.sourceKind === "company_primary_candidate") - Number(a.sourceKind === "company_primary_candidate"));
  } catch {
    return [];
  }
}
