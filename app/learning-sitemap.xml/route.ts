import { learningArticles } from "@/data/learning";
import { absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function absoluteAssetUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  return value.startsWith("http") ? value : absoluteUrl(value);
}

function latestLearningDate(): string | undefined {
  return learningArticles
    .map((article) => article.updatedAt ?? article.publishedAt)
    .filter((value): value is string => Boolean(value?.trim()))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
}

export function GET() {
  const hubLastModified = latestLearningDate();

  const urls = [
    {
      loc: absoluteUrl("/learning"),
      lastmod: hubLastModified,
      image: undefined,
    },
    ...learningArticles.map((article) => ({
      loc: absoluteUrl(`/learning/${article.slug}`),
      lastmod: article.updatedAt ?? article.publishedAt,
      image: absoluteAssetUrl(article.coverImage),
    })),
  ];

  const body = urls
    .map(
      ({ loc, lastmod, image }) => `  <url>\n    <loc>${escapeXml(loc)}</loc>${
        lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ""
      }${
        image
          ? `\n    <image:image>\n      <image:loc>${escapeXml(image)}</image:loc>\n    </image:image>`
          : ""
      }\n  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
