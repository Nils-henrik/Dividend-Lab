import { getNewsArticlesWithSlug } from "@/lib/news/get-articles";
import {
  buildGoogleNewsSitemapEntries,
  renderGoogleNewsSitemap,
} from "@/lib/seo/news-sitemap";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  const entries = buildGoogleNewsSitemapEntries(getNewsArticlesWithSlug());
  const xml = renderGoogleNewsSitemap(entries);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
