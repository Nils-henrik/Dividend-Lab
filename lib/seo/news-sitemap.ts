import type { NewsArticle } from "@/types/news";
import { absoluteUrl } from "@/lib/seo/site";

const GOOGLE_NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;

export type GoogleNewsSitemapEntry = {
  url: string;
  publicationDate: string;
  title: string;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildGoogleNewsSitemapEntries(
  articles: NewsArticle[],
  now = new Date(),
): GoogleNewsSitemapEntry[] {
  const latestAllowed = now.getTime();
  const earliestAllowed = latestAllowed - GOOGLE_NEWS_WINDOW_MS;

  return articles
    .flatMap((article) => {
      if (!article.slug) {
        return [];
      }

      const publishedAt = new Date(article.publishedAt);
      const publishedMs = publishedAt.getTime();

      if (
        Number.isNaN(publishedMs) ||
        publishedMs > latestAllowed ||
        publishedMs < earliestAllowed
      ) {
        return [];
      }

      return [
        {
          url: absoluteUrl(`/news/${article.slug}`),
          publicationDate: article.publishedAt,
          title: article.title,
        },
      ];
    })
    .sort(
      (a, b) =>
        new Date(b.publicationDate).getTime() -
        new Date(a.publicationDate).getTime(),
    );
}

export function renderGoogleNewsSitemap(entries: GoogleNewsSitemapEntry[]) {
  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <news:news>
      <news:publication>
        <news:name>DivLab</news:name>
        <news:language>sv</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(entry.publicationDate)}</news:publication_date>
      <news:title>${escapeXml(entry.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>\n`;
}
