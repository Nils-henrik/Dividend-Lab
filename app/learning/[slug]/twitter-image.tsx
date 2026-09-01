import { ImageResponse } from "next/og";
import { getLearningArticle } from "@/data/learning-articles";
import { getCanonicalUrl } from "@/lib/seo/canonical";

export const alt = "DivLab utbildning";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function TwitterImage({ params }: Props) {
  const { slug } = await params;
  const article = getLearningArticle(slug);
  const title = article?.title ?? "DivLab utbildning";
  const coverImage = article?.coverImage
    ? article.coverImage.startsWith("http")
      ? article.coverImage
      : getCanonicalUrl(article.coverImage)
    : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07111f",
          color: "white",
          overflow: "hidden",
        }}
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={article?.coverImageAlt ?? title}
            width={size.width}
            height={size.height}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ padding: "72px", fontSize: 58, fontWeight: 700, textAlign: "center" }}>
            {title}
          </div>
        )}
      </div>
    ),
    size,
  );
}
